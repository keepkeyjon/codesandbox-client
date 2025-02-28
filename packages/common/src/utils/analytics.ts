import VERSION from '../version';
import _debug from '../utils/debug';

import hash from './hash';

const debug = _debug('cs:analytics');

const global = (typeof window !== 'undefined' ? window : {}) as any;

export const DNT =
  typeof window !== 'undefined' &&
  Boolean(
    global.doNotTrack === '1' ||
      global.navigator.doNotTrack === '1' ||
      global.navigator.msDoNotTrack === '1'
  );

let sentryInitialized = false;

function getSentry() {
  return import(/* webpackChunkName: 'sentry' */ '@sentry/browser');
}
export async function initializeSentry(dsn: string) {
  if (!DNT) {
    sentryInitialized = true;
    const Sentry = await getSentry();

    return Sentry.init({
      dsn,
      release: VERSION,
      ignoreErrors: [
        'Custom Object', // Called for errors coming from sandbox (https://sentry.io/organizations/codesandbox/issues/965255074/?project=155188&query=is%3Aunresolved&statsPeriod=14d)
        'TypeScript Server Error', // Called from the TSC server
        /^Canceled$/, // Used by VSCode to stop currently running actions
      ],
      /**
       * Don't send messages from the sandbox, so don't send from eg.
       * new.codesandbox.io or new.csb.app
       */
      blacklistUrls: [/.*\.codesandbox\.io/, /.*\.csb\.app/],
    });
  }

  return Promise.resolve();
}

export async function logError(err: Error) {
  if (sentryInitialized) {
    const Sentry = await getSentry();
    Sentry.captureException(err);
  }

  if (window.console && console.error) console.error(err);
}

export async function identify(key: string, value: string) {
  try {
    if (!DNT) {
      if (typeof global.amplitude !== 'undefined') {
        const identity = new global.amplitude.Identify();
        identity.set(key, value);
        global.amplitude.identify(identity);
        debug('[Amplitude] Identifying', key, value);
      }

      if (sentryInitialized) {
        const Sentry = await getSentry();

        Sentry.configureScope(scope => {
          scope.setExtra(key, value);
        });
      }
    }
  } catch (e) {
    /* */
  }
}

if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    identify('[Amplitude] Version', VERSION);
  }, 5000);
}

export async function setUserId(userId: string) {
  try {
    if (!DNT) {
      if (typeof global.amplitude !== 'undefined') {
        const hashedId = hash(userId);
        debug('[Amplitude] Setting User ID', hashedId);
        identify('userId', hashedId);

        global.amplitude.getInstance().setUserId(hashedId);
      }

      if (sentryInitialized) {
        const Sentry = await getSentry();
        Sentry.configureScope(scope => {
          scope.setUser({ id: userId });
        });
      }
    }
  } catch (e) {
    /* */
  }
}

export async function resetUserId() {
  try {
    if (!DNT) {
      if (typeof global.amplitude !== 'undefined') {
        debug('[Amplitude] Resetting User ID');
        identify('userId', null);

        if (global.amplitude.getInstance().options.userId) {
          global.amplitude.getInstance().setUserId(null);
          global.amplitude.getInstance().regenerateDeviceId();
        }
      }

      if (sentryInitialized) {
        const Sentry = await getSentry();
        Sentry.configureScope(scope => {
          scope.setUser({ id: undefined });
        });
      }
    }
  } catch (e) {
    /* */
  }
}

const isAllowedEvent = (eventName, secondArg) => {
  try {
    if (eventName === 'VSCode - workbenchActionExecuted') {
      if (secondArg.id.startsWith('cursor')) {
        return false;
      }
      if (secondArg.id === 'deleteLeft') {
        return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
};

// After 30min no event we mark a session
const NEW_SESSION_TIME = 1000 * 60 * 30;

const getLastTimeEventSent = () => {
  const lastTime = localStorage.getItem('csb-last-event-sent');

  if (lastTime === null) {
    return 0;
  }

  return +lastTime;
};

const markLastTimeEventSent = () => {
  localStorage.setItem('csb-last-event-sent', Date.now().toString());
};

export default function track(eventName, secondArg: Object = {}) {
  try {
    if (!DNT && isAllowedEvent(eventName, secondArg)) {
      const data = {
        ...secondArg,
        version: VERSION,
        path: location.pathname + location.search,
      };
      try {
        if (global.ga) {
          global.ga('send', data);
        }
      } catch (e) {
        /* */
      }
      try {
        if (typeof global.amplitude !== 'undefined') {
          const currentTime = Date.now();
          if (currentTime - getLastTimeEventSent() > NEW_SESSION_TIME) {
            // We send a separate New Session event if people have been inactive for a while
            global.amplitude.logEvent('New Session');
          }
          markLastTimeEventSent();

          debug('[Amplitude] Tracking', eventName, data);
          global.amplitude.logEvent(eventName, data);
        }
      } catch (e) {
        /* */
      }
    }
  } catch (e) {
    /* empty */
  }
}

import { inject, hooksObserver } from 'app/componentConnectors';
import React from 'react';

import { DeploymentIntegration } from 'app/components/DeploymentIntegration';
import NetlifyLogo from 'app/components/NetlifyLogo';

import { DeployButtonContainer } from '../../elements';

type Props = {
  isOpen: boolean;
  toggle: () => void;
  store: any;
  signals: any;
};

export const DeployButton = inject('store', 'signals')(
  hooksObserver(
    ({
      isOpen,
      toggle,
      signals: {
        deployment: { deployWithNetlify },
      },
      store: {
        deployment: { building, deploying },
      },
    }: Props) => (
      <DeployButtonContainer>
        <DeploymentIntegration
          beta
          color="#FFFFFF"
          deploy={deployWithNetlify}
          Icon={NetlifyLogo}
          light
          loading={deploying || building}
          name="netlify"
          open={isOpen}
          toggle={toggle}
        >
          Deploy your sandbox site on{' '}
          <a
            href="https://netlify.com"
            rel="noreferrer noopener"
            target="_blank"
          >
            <span>Netlify</span>
          </a>
        </DeploymentIntegration>
      </DeployButtonContainer>
    )
  )
);

import React from 'react';
import Tooltip from '@codesandbox/common/lib/components/Tooltip';

import { StyledUnlisted, StyledPrivate, Icon } from './elements';

function PrivacyStatus({ privacy, asIcon = null }) {
  const PRIVACY_MESSAGES = {
    0: {
      title: 'Public',
      tooltip: 'Everyone can see the sandbox',
      icon: null,
    },
    1: {
      title: 'Unlisted',
      tooltip: 'Only users with the url can see the sandbox',
      icon: <StyledUnlisted />,
    },
    2: {
      title: 'Private',
      tooltip: 'Only you can see the sandbox',
      icon: <StyledPrivate />,
    },
  };

  if (asIcon) {
    return (
      <Tooltip content={PRIVACY_MESSAGES[privacy].tooltip}>
        {PRIVACY_MESSAGES[privacy].icon}
      </Tooltip>
    );
  }

  return (
    <Tooltip content={PRIVACY_MESSAGES[privacy].tooltip}>
      {PRIVACY_MESSAGES[privacy].title}
      <Icon />
    </Tooltip>
  );
}

export default PrivacyStatus;

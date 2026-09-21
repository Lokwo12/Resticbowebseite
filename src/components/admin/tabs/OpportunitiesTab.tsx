import React from 'react';
import { OpportunitiesManager } from '../OpportunitiesManager';

export function OpportunitiesTab(props: any) {
  const { activeTab, projectId, accessToken, userRole, userName, onUpdate } = props;
  
  if (activeTab !== 'opportunities') return null;

  return (
    <OpportunitiesManager
      accessToken={accessToken}
      projectId={projectId}
      userRole={userRole}
      userName={userName}
      onUpdate={onUpdate}
    />
  );
}


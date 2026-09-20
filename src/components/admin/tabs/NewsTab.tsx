import React from 'react';
import { NewsManager } from '../NewsManager';

export function NewsTab(props: any) {
  const { activeTab, projectId, accessToken, userRole, userName, onUpdate } = props;
  
  if (activeTab !== 'news') return null;

  return (
    <NewsManager
      accessToken={accessToken}
      projectId={projectId}
      userRole={userRole}
      userName={userName}
      onUpdate={onUpdate}
    />
  );
}


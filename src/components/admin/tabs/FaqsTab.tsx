import React from 'react';
import { FAQManager } from '../FAQManager';

export function FaqsTab(props: any) {
  const { activeTab, projectId, accessToken, userRole, userName, onUpdate } = props;
  
  if (activeTab && activeTab !== 'faqs') return null;

  return (
    <FAQManager
      accessToken={accessToken}
      projectId={projectId}
      userRole={userRole}
      userName={userName}
      onUpdate={onUpdate}
    />
  );
}


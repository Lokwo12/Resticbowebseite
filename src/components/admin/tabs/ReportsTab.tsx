import React from 'react';
import { ImpactReportsManager } from '../ImpactReportsManager';

export function ReportsTab(props: any) {
  const { 
    activeTab, 
    siteSettings,
    loadData,
    accessToken, 
    userRole 
  } = props;
  
  if (activeTab !== 'reports') return null;

  return (
    <ImpactReportsManager
      initialData={siteSettings?.impactReports}
      onUpdate={loadData}
      accessToken={accessToken}
      userRole={userRole}
    />
  );
}

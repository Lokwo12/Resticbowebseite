import React from 'react';
import { ImpactDashboardManager } from '../ImpactDashboardManager';

export function ImpactStatsTab(props: any) {
  const { 
    impactStats,
    loadData,
    accessToken,
    userRole,
    activeTab
  } = props;
  
  if (activeTab !== 'impact') return null;

  return (
    <ImpactDashboardManager
      impactStats={impactStats}
      onUpdate={loadData}
      accessToken={accessToken}
      userRole={userRole}
    />
  );
}

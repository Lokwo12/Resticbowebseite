import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function GoogleAnalytics() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const measurementId = settings?.analytics?.gaMeasurementId;

  if (!measurementId) return null;

  return (
    <Helmet>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </script>
    </Helmet>
  );
}

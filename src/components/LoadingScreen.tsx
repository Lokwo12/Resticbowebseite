import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
const defaultLogo = '/logo.png';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [siteName, setSiteName] = useState('Resti Kiryandongo');
  const [tagline, setTagline] = useState('Community Based Organization');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.settings?.general) {
            const fetchedLogo = data.settings.general.logoUrl;
            if (fetchedLogo && !fetchedLogo.includes('figma:asset')) {
              setLogoUrl(fetchedLogo);
            }
            if (data.settings.general.siteName) {
              setSiteName(data.settings.general.siteName);
            }
            if (data.settings.general.tagline) {
              setTagline(data.settings.general.tagline);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching loading screen settings:', error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Logo with pulse animation */}
        <div className="animate-pulse">
          <img src={logoUrl} alt={`${siteName} Logo`} className="h-24 w-24 rounded-full object-cover shadow-md border border-emerald-500/20 mx-auto mb-4" />
        </div>

        {/* Organization name */}
        <div className="space-y-2">
          <h1 className="text-3xl text-emerald-700 animate-[fadeIn_0.5s_ease-out]">
            {siteName}
          </h1>
          <p className="text-gray-600 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
            {tagline}
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Loading... {progress}%</p>
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-500 animate-[fadeIn_0.5s_ease-out_0.4s_both]">
          Empowering Communities Through Action
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export function DebugInfo() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-2xl"
        >
          🐛 Show Debug Info
        </Button>
      </div>
    );
  }

  return (
    <DebugInfoPanel 
      onMinimize={() => setIsMinimized(true)} 
      onClose={() => setIsClosed(true)}
    />
  );
}

function DebugInfoPanel({ onMinimize, onClose }: { onMinimize: () => void; onClose: () => void }) {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch site settings
      console.log('🔍 DEBUG: Fetching site settings...');
      const settingsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      console.log('🔍 DEBUG: Settings response status:', settingsResponse.status);
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log('🔍 DEBUG: Settings data:', settingsData);
        setSiteSettings(settingsData);
      } else {
        throw new Error(`Settings API returned ${settingsResponse.status}`);
      }

      // Fetch programs
      console.log('🔍 DEBUG: Fetching programs...');
      const programsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/programs`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      console.log('🔍 DEBUG: Programs response status:', programsResponse.status);
      
      if (programsResponse.ok) {
        const programsData = await programsResponse.json();
        console.log('🔍 DEBUG: Programs data:', programsData);
        setPrograms(programsData.programs || []);
      } else {
        throw new Error(`Programs API returned ${programsResponse.status}`);
      }

      // Fetch volunteer opportunities
      console.log('🔍 DEBUG: Fetching volunteer opportunities...');
      const opportunitiesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      console.log('🔍 DEBUG: Opportunities response status:', opportunitiesResponse.status);
      
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json();
        console.log('🔍 DEBUG: Opportunities data:', opportunitiesData);
        setOpportunities(opportunitiesData.opportunities || []);
      } else {
        console.warn('🔍 DEBUG: Opportunities API returned', opportunitiesResponse.status);
      }
    } catch (err: any) {
      console.error('🔍 DEBUG: Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="p-4 bg-white shadow-2xl border-2 border-emerald-500">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg">🐛 Debug Info</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={fetchAllData} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button size="sm" variant="outline" onClick={onMinimize}>
                Minimize
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              ❌ {error}
            </div>
          )}

          {/* About Settings */}
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">About Section:</h4>
            {siteSettings?.settings?.about ? (
              <div className="text-sm space-y-1">
                <div>✅ Title: {siteSettings.settings.about.title ? '✓' : '✗'}</div>
                <div>✅ Intro: {siteSettings.settings.about.intro ? '✓' : '✗'}</div>
                <div>✅ Mission: {siteSettings.settings.about.mission ? '✓' : '✗'}</div>
                <div>✅ Vision: {siteSettings.settings.about.vision ? '✓' : '✗'}</div>
                <div>✅ Values: {siteSettings.settings.about.values?.length || 0} items</div>
                <div>✅ Story: {siteSettings.settings.about.story?.length || 0} paragraphs</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">⚠️ No about settings found</div>
            )}
          </div>

          {/* Programs Section Settings */}
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">Programs Section Settings:</h4>
            {siteSettings?.settings?.sections?.programs ? (
              <div className="text-sm space-y-1">
                <div>✅ Title: {siteSettings.settings.sections.programs.title}</div>
                <div>✅ Description: {siteSettings.settings.sections.programs.description ? '✓' : '✗'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">⚠️ No section settings found</div>
            )}
          </div>

          {/* Programs List */}
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">Programs List:</h4>
            {programs.length > 0 ? (
              <div className="text-sm">
                ✅ {programs.length} programs found
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {programs.map((prog, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 p-2 rounded">
                      • {prog.value?.title || prog.title || 'Untitled'}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">⚠️ No programs found</div>
            )}
          </div>

          {/* Volunteer Opportunities List */}
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2">Volunteer Opportunities:</h4>
            {opportunities.length > 0 ? (
              <div className="text-sm">
                ✅ {opportunities.length} opportunities found
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {opportunities.map((opp, idx) => (
                    <div key={idx} className="text-xs bg-gray-100 p-2 rounded">
                      • {opp.value?.title || opp.title || 'Untitled'} ({opp.value?.category || opp.category || 'No category'})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">⚠️ No volunteer opportunities found</div>
            )}
          </div>

          {/* Raw Data */}
          <details className="border-t pt-3">
            <summary className="font-semibold cursor-pointer text-sm">View Raw Data</summary>
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
              <pre>{JSON.stringify({ siteSettings, programs, opportunities }, null, 2)}</pre>
            </div>
          </details>
        </div>
      </Card>
    </div>
  );
}

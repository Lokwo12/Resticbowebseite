import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Save, RefreshCw, Plus, Trash2, Upload } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SiteSettingsTabProps {
  settings: any;
  onUpdate: () => void;
}

export function SiteSettingsTab({ settings: initialSettings, onUpdate }: SiteSettingsTabProps) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/upload-image`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` }, body: formDataObj }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      setSettings((prev: any) => ({ ...prev, general: { ...prev.general, logoUrl: data.url } }));
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({ settings }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast.success('Site settings saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/site-settings/initialize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      toast.success('Default settings initialized!');
      onUpdate();
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast.error('Failed to initialize settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings || Object.keys(settings).length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <h3 className="text-xl text-gray-900 mb-4">No Site Settings Found</h3>
          <p className="text-gray-600 mb-6">
            Initialize default site settings to get started with customizing your website.
          </p>
          <Button onClick={handleInitialize} disabled={saving}>
            <RefreshCw size={18} className="mr-2" />
            Initialize Default Settings
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-gray-900">Site Settings</h2>
          <p className="text-gray-600">Customize every aspect of your website</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={18} className="mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="header">Header & Banner</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="about">About Section</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="donation">Donation & Payments</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="legal">Legal Pages</TabsTrigger>
          <TabsTrigger value="sections">Section Headers</TabsTrigger>
        </TabsList>

        {/* ===== HEADER & ANNOUNCEMENT BAR ===== */}
        <TabsContent value="header">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Header & Announcement Bar</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showAnnouncement"
                  checked={settings.header?.showAnnouncement !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, showAnnouncement: e.target.checked } })
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="showAnnouncement" className="text-sm text-gray-700">Show announcement bar at the top of the page</label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Announcement Text</label>
                <input
                  type="text"
                  value={settings.header?.announcementText || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, announcementText: e.target.value } })
                  }
                  placeholder="We are looking for volunteers in Kiryandongo"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Announcement Button Link (section ID)</label>
                <select
                  value={settings.header?.announcementLink || 'contact'}
                  onChange={(e) =>
                    setSettings({ ...settings, header: { ...settings.header, announcementLink: e.target.value } })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {['home','about','programs','impact','volunteer','contact','donate'].map(id => (
                    <option key={id} value={id}>{id.charAt(0).toUpperCase() + id.slice(1)}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Which page section the "Apply now" button scrolls to.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.general?.siteName || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={settings.general?.tagline || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, tagline: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  value={settings.general?.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Organization Logo</label>
                {/* Preview */}
                {settings.general?.logoUrl && (
                  <div className="mb-3 p-3 border rounded-lg bg-gray-50 flex items-center gap-4">
                    <img
                      src={settings.general.logoUrl}
                      alt="Logo preview"
                      className="h-14 w-auto max-w-[140px] object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-gray-500">Current logo</span>
                  </div>
                )}
                {/* Upload button */}
                <div className="flex gap-2 mb-2">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium ${logoUploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                    <Upload size={15} />
                    {logoUploading ? 'Uploading…' : 'Upload logo image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
                {/* Manual URL fallback */}
                <input
                  type="text"
                  value={settings.general?.logoUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, logoUrl: e.target.value },
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a file or paste a URL. Click Save after changing.</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Primary Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.general?.primaryColor || '#10b981'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, primaryColor: e.target.value },
                      })
                    }
                    className="w-20 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={settings.general?.primaryColor || '#10b981'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Badge Text</label>
                <input
                  type="text"
                  value={settings.hero?.badgeText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Main Title</label>
                <input
                  type="text"
                  value={settings.hero?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={settings.hero?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, subtitle: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primary Button Text</label>
                  <input
                    type="text"
                    value={settings.hero?.primaryButtonText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, primaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Secondary Button Text</label>
                  <input
                    type="text"
                    value={settings.hero?.secondaryButtonText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hero: { ...settings.hero, secondaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Hero Image URL</label>
                <input
                  type="text"
                  value={settings.hero?.imageUrl || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, imageUrl: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Hero Background Images (One URL per line)</label>
                <textarea
                  value={settings.hero?.backgroundImages?.join('\n') || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, backgroundImages: e.target.value.split('\n').filter(Boolean) },
                    })
                  }
                  rows={5}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These images will rotate in the background carousel. If empty, default images will be used.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Statistics</label>
                {settings.hero?.stats?.map((stat: any, index: number) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => {
                        const newStats = [...(settings.hero?.stats || [])];
                        newStats[index] = { ...newStats[index], value: e.target.value };
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, stats: newStats },
                        });
                      }}
                      placeholder="Value (e.g., 500+)"
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => {
                        const newStats = [...(settings.hero?.stats || [])];
                        newStats[index] = { ...newStats[index], label: e.target.value };
                        setSettings({
                          ...settings,
                          hero: { ...settings.hero, stats: newStats },
                        });
                      }}
                      placeholder="Label"
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">About Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.about?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Introduction</label>
                <textarea
                  value={settings.about?.intro || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, intro: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mission Statement</label>
                <textarea
                  value={settings.about?.mission || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, mission: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Vision Statement</label>
                <textarea
                  value={settings.about?.vision || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, vision: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Story Paragraphs</label>
                {settings.about?.story?.map((paragraph: string, index: number) => (
                  <textarea
                    key={index}
                    value={paragraph}
                    onChange={(e) => {
                      const newStory = [...(settings.about?.story || [])];
                      newStory[index] = e.target.value;
                      setSettings({
                        ...settings,
                        about: { ...settings.about, story: newStory },
                      });
                    }}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                  />
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Contact Section */}
        <TabsContent value="contact">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Section Title</label>
                <input
                  type="text"
                  value={settings.contact?.title || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={settings.contact?.subtitle || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, subtitle: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={settings.contact?.address || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.contact?.email || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={settings.contact?.phone || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phone: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">WhatsApp Number (international format, e.g. +256700000000)</label>
                <input
                  type="tel"
                  value={settings.contact?.whatsappNumber || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, whatsappNumber: e.target.value },
                    })
                  }
                  placeholder="+256700000000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for the WhatsApp quick-connect button on the Contact section.</p>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Social Links</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            facebook: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Facebook URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            twitter: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Twitter URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="url"
                    value={settings.contact?.socialLinks?.instagram || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        contact: {
                          ...settings.contact,
                          socialLinks: {
                            ...settings.contact?.socialLinks,
                            instagram: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Instagram URL"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Branch Locations */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Branch Locations</h4>
                    <p className="text-xs text-gray-500">Add branch names, addresses and Google Maps embed links</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const locations = [...(settings.contact?.locations || [])];
                      locations.push({ name: 'New Branch', address: '', mapUrl: '' });
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, locations }
                      });
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Add Branch
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(settings.contact?.locations || []).map((loc: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gray-50 relative group">
                      <button 
                        onClick={() => {
                          const locations = settings.contact.locations.filter((_: any, i: number) => i !== idx);
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, locations }
                          });
                        }}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={loc.name}
                            onChange={(e) => {
                              const locations = [...settings.contact.locations];
                              locations[idx] = { ...locations[idx], name: e.target.value };
                              setSettings({ ...settings, contact: { ...settings.contact, locations } });
                            }}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Address</label>
                          <input
                            type="text"
                            value={loc.address}
                            onChange={(e) => {
                              const locations = [...settings.contact.locations];
                              locations[idx] = { ...locations[idx], address: e.target.value };
                              setSettings({ ...settings, contact: { ...settings.contact, locations } });
                            }}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-600 mb-1">Google Maps Embed URL</label>
                        <input
                          type="text"
                          value={loc.mapUrl}
                          onChange={(e) => {
                            const locations = [...settings.contact.locations];
                            locations[idx] = { ...locations[idx], mapUrl: e.target.value };
                            setSettings({ ...settings, contact: { ...settings.contact, locations } });
                          }}
                          placeholder="https://www.google.com/maps/embed?..."
                          className="w-full px-3 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">To get this: Google Maps → Share → Embed a map → copy 'src' value from iframe.</p>
                      </div>
                    </div>
                  ))}
                  {(settings.contact?.locations || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-gray-400 text-sm">
                      No branch locations added.
                    </div>
                  )}
                </div>
              </div>
              {/* Working Hours */}
              <div className="pt-6 border-t mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">Office Hours</label>
                <input
                  type="text"
                  value={settings.contact?.workingHours || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, workingHours: e.target.value },
                    })
                  }
                  placeholder="Monday - Friday: 8:00 AM - 5:00 PM"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Department Contacts */}
              <div className="pt-6 border-t mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Direct Contacts / Departments</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const departments = [...(settings.contact?.departments || [])];
                      departments.push({ name: '', email: '' });
                      setSettings({
                        ...settings,
                        contact: { ...settings.contact, departments }
                      });
                    }}
                  >
                    <Plus size={14} className="mr-1" /> Add Department
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(settings.contact?.departments || []).map((dept: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start group">
                      <input
                        type="text"
                        value={dept.name}
                        onChange={(e) => {
                          const departments = [...settings.contact.departments];
                          departments[idx] = { ...departments[idx], name: e.target.value };
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        placeholder="Department Name"
                        className="flex-1 px-3 py-1.5 text-sm border rounded-md"
                      />
                      <input
                        type="email"
                        value={dept.email}
                        onChange={(e) => {
                          const departments = [...settings.contact.departments];
                          departments[idx] = { ...departments[idx], email: e.target.value };
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-1.5 text-sm border rounded-md"
                      />
                      <button 
                        onClick={() => {
                          const departments = settings.contact.departments.filter((_: any, i: number) => i !== idx);
                          setSettings({ ...settings, contact: { ...settings.contact, departments } });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Footer Section */}
        <TabsContent value="footer">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Footer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Footer Description</label>
                <textarea
                  value={settings.footer?.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, description: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={settings.footer?.copyrightText || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, copyrightText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Bottom Tagline</label>
                <input
                  type="text"
                  value={settings.footer?.taglineBottom || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      footer: { ...settings.footer, taglineBottom: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Made with ❤️ for our community"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Legal Pages */}
        <TabsContent value="legal">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Legal Pages</h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter the content for your organization's legal pages. You can use simple text or HTML tags if needed.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Privacy Policy</label>
                <textarea
                  value={settings.legal?.privacyPolicy || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, privacyPolicy: e.target.value },
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Privacy Policy here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Terms of Service</label>
                <textarea
                  value={settings.legal?.termsOfService || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, termsOfService: e.target.value },
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Terms of Service here..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">Refund Policy</label>
                <textarea
                  value={settings.legal?.refundPolicy || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      legal: { ...settings.legal, refundPolicy: e.target.value },
                    })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your Refund Policy here..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Section Headers */}
        <TabsContent value="sections">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-6">Section Headers & Descriptions</h3>
            <p className="text-sm text-gray-600 mb-6">
              Customize the title and description for each major section of your website.
            </p>
            <div className="space-y-6">
              {/* Programs Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Programs Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.programs?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            programs: { ...settings.sections?.programs, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.programs?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            programs: { ...settings.sections?.programs, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* News Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">News Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.news?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            news: { ...settings.sections?.news, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.news?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            news: { ...settings.sections?.news, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Gallery Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.gallery?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            gallery: { ...settings.sections?.gallery, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.gallery?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            gallery: { ...settings.sections?.gallery, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Stories Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Stories Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.stories?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            stories: { ...settings.sections?.stories, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.stories?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            stories: { ...settings.sections?.stories, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Team Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.team?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            team: { ...settings.sections?.team, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.team?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            team: { ...settings.sections?.team, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Events Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Events Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.events?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            events: { ...settings.sections?.events, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.events?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            events: { ...settings.sections?.events, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Partners Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Partners Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.partners?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.partners?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            partners: { ...settings.sections?.partners, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">FAQ Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.faq?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            faq: { ...settings.sections?.faq, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.faq?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            faq: { ...settings.sections?.faq, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Resources Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.resources?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.resources?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Volunteer Opportunities Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Volunteer Opportunities Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.opportunities?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.opportunities?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Dashboard Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Dashboard Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.impact?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.impact?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ===== DONATION & PAYMENTS ===== */}
        <TabsContent value="donation">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Donation & Payment Details</h3>
            <p className="text-sm text-gray-500 mb-6">These values appear on the Donation page and are fully editable here.</p>
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">MTN Mobile Money</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Merchant Number</label>
                  <input
                    type="text"
                    value={settings.donation?.merchantMTN || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, donation: { ...settings.donation, merchantMTN: e.target.value } })
                    }
                    placeholder="0772 000 000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Airtel Money</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Merchant Number</label>
                  <input
                    type="text"
                    value={settings.donation?.merchantAirtel || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, donation: { ...settings.donation, merchantAirtel: e.target.value } })
                    }
                    placeholder="0701 000 000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Bank Transfer Details</h4>
                <div className="space-y-3">
                  {[
                    { key: 'bankName', label: 'Bank Name', placeholder: 'Stanbic Bank Uganda' },
                    { key: 'accountName', label: 'Account Name', placeholder: 'Resti Kiryandongo CBO' },
                    { key: 'accountNumber', label: 'Account Number', placeholder: '9030012345678' },
                    { key: 'branch', label: 'Branch', placeholder: 'Kiryandongo Branch' },
                    { key: 'swiftCode', label: 'SWIFT / BIC Code', placeholder: 'SBICUGKX' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={(settings.donation as any)?.[key] || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, donation: { ...settings.donation, [key]: e.target.value } })
                        }
                        placeholder={placeholder}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save size={20} className="mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}

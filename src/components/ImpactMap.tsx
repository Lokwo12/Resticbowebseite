import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on category
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); display: flex; align-items: center; justify-content: center;">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
      <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid ${color}; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);"></div>
    `,
    iconSize: [24, 34],
    iconAnchor: [12, 34],
    popupAnchor: [0, -34],
  });
};

const icons = {
  education: createCustomIcon('#059669'), // Emerald
  health: createCustomIcon('#2563eb'),    // Blue
  wash: createCustomIcon('#0891b2'),      // Cyan
  livelihood: createCustomIcon('#d97706'), // Amber
};

interface ProjectLocation {
  id: string;
  name: string;
  category: 'education' | 'health' | 'wash' | 'livelihood';
  coordinates: [number, number]; // [lat, lng]
  description: string;
  impact: string;
}

const KIRYANDONGO_CENTER: [number, number] = [1.8696, 32.0722];

const PROJECT_LOCATIONS: ProjectLocation[] = [
  {
    id: '1',
    name: 'Kigumba Healthcare Initiative',
    category: 'health',
    coordinates: [1.8156, 32.0084],
    description: 'A mobile clinic serving remote households with maternal care and vaccinations.',
    impact: '1,200+ patients treated monthly',
  },
  {
    id: '2',
    name: 'Bweyale Primary School Support',
    category: 'education',
    coordinates: [1.8894, 32.1009],
    description: 'Providing scholastic materials, solar lighting, and teacher training to improve literacy.',
    impact: '850 students supported',
  },
  {
    id: '3',
    name: 'Mutunda Clean Water Hub',
    category: 'wash',
    coordinates: [1.9421, 32.0456],
    description: 'A newly constructed solar-powered borehole providing safe drinking water.',
    impact: 'Serves 400 households',
  },
  {
    id: '4',
    name: 'Kiryandongo Refugee Settlement Agri-Project',
    category: 'livelihood',
    coordinates: [1.8820, 32.0522],
    description: 'Training women and youth in climate-smart agriculture and micro-savings.',
    impact: '200 farmers trained',
  },
  {
    id: '5',
    name: 'Karuma Youth Training Center',
    category: 'education',
    coordinates: [2.2355, 32.2458],
    description: 'Vocational training hub equipping youth with carpentry and tailoring skills.',
    impact: '150 graduates annually',
  }
];

// Helper component to fix map sizing issues
const MapSizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
};

export interface ImpactMapProps { onMarkerClick?: (location: any) => void; }
export function ImpactMap({ onMarkerClick }: ImpactMapProps = {}) {
  const [isClient, setIsClient] = useState(false);
  const [locations, setLocations] = useState<ProjectLocation[]>(PROJECT_LOCATIONS);

  useEffect(() => {
    setIsClient(true);
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/map-locations`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (data.locations && Array.isArray(data.locations)) {
        // Filter out malformed locations
        const validLocations = data.locations.filter((loc: any) => 
          loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2 &&
          !isNaN(loc.coordinates[0]) && !isNaN(loc.coordinates[1])
        );
        if (validLocations.length > 0) {
          setLocations(validLocations);
        }
      }
    } catch (error) {
      console.error('Error fetching map locations:', error);
    }
  };

  if (!isClient) return null; // Avoid SSR issues with Leaflet

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <MapPin size={16} />
            Our Footprint
          </div>
          <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4 font-bold font-heading tracking-tight">
            Impact Across Kiryandongo
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our interactive map to see exactly where we are working to create sustainable change across the district.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white p-4 rounded-3xl shadow-premium-soft border border-slate-100"
        >
          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4 px-2">
            {[
              { label: 'Education', color: 'bg-emerald-600' },
              { label: 'Healthcare', color: 'bg-blue-600' },
              { label: 'WASH', color: 'bg-cyan-600' },
              { label: 'Livelihoods', color: 'bg-amber-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                {item.label}
              </div>
            ))}
          </div>

          {/* Map Container */}
          <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-100 relative z-0">
            <MapContainer 
              center={KIRYANDONGO_CENTER} 
              zoom={10} 
              scrollWheelZoom={false} // Prevent trapping scroll
              className="h-full w-full"
            >
              <MapSizer />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Clean, premium look
              />
              
              {locations.map((project) => {
                const markerIcon = icons[project.category as keyof typeof icons] || icons['health'];
                return (
                  <Marker 
                    key={project.id} 
                    position={project.coordinates}
                    icon={markerIcon}
                  >
                  <Popup className="custom-popup rounded-xl">
                    <div className="p-1">
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                        project.category === 'education' ? 'text-emerald-600' :
                        project.category === 'health' ? 'text-blue-600' :
                        project.category === 'wash' ? 'text-cyan-600' : 'text-amber-600'
                      }`}>
                        {project.category}
                      </div>
                      <h3 className="text-base font-bold font-heading tracking-tight text-gray-900 mb-2 leading-tight">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold py-1.5 px-3 rounded-lg inline-block">
                        {project.impact}
                      </div>
                    </div>
                  </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Navigation size={12} /> Use two fingers to pan the map on mobile.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

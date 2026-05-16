import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users as UsersIcon, ArrowRight } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  category: string;
  capacity?: number;
  registered?: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const FALLBACK_EVENTS = [
  { id: 'evt1', title: 'Community Health Fair', description: 'Free health screenings and vaccinations for all community members.', date: new Date(Date.now() + 30*86400000).toISOString(), time: '9:00 AM - 4:00 PM', location: 'Kiryandongo Community Centre', category: 'healthcare', capacity: 200, registered: 45, status: 'upcoming' },
  { id: 'evt2', title: 'Youth Skills Workshop', description: 'Vocational training in carpentry, tailoring, and computer skills.', date: new Date(Date.now() + 45*86400000).toISOString(), time: '10:00 AM - 2:00 PM', location: 'Resti Training Centre', category: 'education', capacity: 50, registered: 32, status: 'upcoming' },
  { id: 'evt3', title: 'Annual Fundraising Gala', description: 'Join us for an evening of celebration and community fundraising.', date: new Date(Date.now() + 60*86400000).toISOString(), time: '6:00 PM - 10:00 PM', location: 'Kiryandongo District Hall', category: 'fundraising', capacity: 300, registered: 120, status: 'upcoming' },
];
export function Events() {
  const [events, setEvents] = useState<Event[]>(FALLBACK_EVENTS as any);
  const [loading, setLoading] = useState(false);
  const [sectionSettings, setSectionSettings] = useState({ title: 'Events Calendar', description: 'Join us at our upcoming events and activities. Together, we can create positive change.' });

  useEffect(() => {
    fetchEvents();
    fetchSettings();
  }, []);

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
        if (data.settings?.sections?.events) {
          setSectionSettings(data.settings.sections.events);
        }
      }
    } catch (err) {
      console.error('Error fetching section settings:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/events`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing');
  const pastEvents = events.filter(e => e.status === 'completed');

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-2/5 h-56 relative overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="text-white" size={64} />
            </div>
          )}
          {event.status === 'ongoing' && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-red-500 text-white animate-pulse">Live Now</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:w-3/5">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary">{event.category}</Badge>
            <span className="text-sm text-gray-500">
              {event.status === 'completed' ? 'Past Event' : 'Upcoming'}
            </span>
          </div>

          <h3 className="text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
            {event.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{event.time}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{event.location}</span>
            </div>

            {event.capacity && event.registered !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UsersIcon size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{event.registered} / {event.capacity} registered</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {event.status !== 'completed' && (
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span>Learn More</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <section id="events" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No upcoming events scheduled. Check back soon!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastEvents.length > 0 ? (
              <div className="space-y-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No past events to display.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="mb-4">Stay Updated</h3>
          <p className="mb-6 text-emerald-50 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive notifications about upcoming events, 
            programs, and community activities.
          </p>
          <button
            onClick={() => document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </section>
  );
}

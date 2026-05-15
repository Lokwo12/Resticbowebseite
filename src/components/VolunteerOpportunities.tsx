import { useState, useEffect } from 'react';
import { Heart, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  timeCommitment: string;
  location: string;
  category: string;
  openPositions: number;
  benefits: string[];
}

export function VolunteerOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    availability: '',
    experience: '',
    opportunityId: ''
  });
  const [sectionSettings, setSectionSettings] = useState({ title: 'Volunteer Opportunities', description: 'Make a difference by volunteering with us. Explore available positions and find the perfect fit for your skills.' });

  useEffect(() => {
    fetchOpportunities();
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
        if (data.settings?.sections?.opportunities) {
          setSectionSettings(data.settings.sections.opportunities);
        }
      }
    } catch (err) {
      console.error('Error fetching volunteer opportunities section settings:', err);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/opportunities`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } else {
        console.error('Failed to fetch opportunities, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormData({ ...formData, opportunityId: opportunity.id });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2a4be611/volunteer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            opportunity: selectedOpportunity?.title
          }),
        }
      );

      if (response.ok) {
        toast.success('Application submitted! We\'ll contact you soon.');
        setShowForm(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          availability: '',
          experience: '',
          opportunityId: ''
        });
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const categories = ['all', ...Array.from(new Set(opportunities.map(o => o.category)))];
  const filteredOpportunities = selectedCategory === 'all' 
    ? opportunities 
    : opportunities.filter(o => o.category === selectedCategory);

  if (loading) {
    return (
      <section id="volunteer" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="volunteer" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-emerald-600" size={32} />
            <h2 className="text-emerald-600">{sectionSettings.title}</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {sectionSettings.description}
          </p>
        </div>

        {/* Why Volunteer Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="text-emerald-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Make Impact</h4>
            <p className="text-sm text-gray-600">
              Directly contribute to positive change in people's lives
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="text-blue-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Build Community</h4>
            <p className="text-sm text-gray-600">
              Connect with like-minded people who care about giving back
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-purple-600" size={24} />
            </div>
            <h4 className="text-gray-900 mb-2">Gain Experience</h4>
            <p className="text-sm text-gray-600">
              Develop new skills and gain valuable hands-on experience
            </p>
          </Card>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Opportunities Grid */}
        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 mb-2">{opportunity.title}</h3>
                    <Badge variant="secondary">{opportunity.category}</Badge>
                  </div>
                  {opportunity.openPositions > 0 && (
                    <Badge className="bg-emerald-600 text-white">
                      {opportunity.openPositions} {opportunity.openPositions === 1 ? 'Position' : 'Positions'}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {opportunity.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{opportunity.timeCommitment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{opportunity.location}</span>
                  </div>
                </div>

                {/* Requirements */}
                {opportunity.requirements.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm text-gray-900 mb-2">Requirements:</h5>
                    <ul className="space-y-1">
                      {opportunity.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {opportunity.benefits.length > 0 && (
                  <div className="mb-4 bg-emerald-50 p-3 rounded-lg">
                    <h5 className="text-sm text-emerald-900 mb-2">Benefits:</h5>
                    <ul className="space-y-1">
                      {opportunity.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-emerald-800">
                          • {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleApply(opportunity)}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Apply Now
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-gray-400" size={32} />
            </div>
            <h3 className="text-gray-900 mb-2">No Opportunities Available</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {selectedCategory === 'all' 
                ? 'No volunteer opportunities have been added yet. Check back soon or contact us to learn about upcoming opportunities!'
                : `No opportunities in the "${selectedCategory}" category currently. Try selecting "All" to see other opportunities.`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                View All Opportunities
              </button>
            )}
          </div>
        )}

        {/* Application Form Modal */}
        {showForm && selectedOpportunity && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-gray-900">Apply for {selectedOpportunity.title}</h3>
                    <p className="text-sm text-gray-600">Fill out the form below to submit your application</p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Availability *</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      placeholder="When are you available to volunteer?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Relevant Experience (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="Tell us about any relevant skills or experience..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Submit Application
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

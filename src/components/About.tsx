import { Heart, Users, Target, Award } from 'lucide-react';

export function About() {
  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'We approach every initiative with empathy and understanding for community needs.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Working together with local leaders and residents to create lasting change.'
    },
    {
      icon: Target,
      title: 'Impact',
      description: 'Focused on measurable outcomes that improve quality of life.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering high-quality programs and services.'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-5xl text-gray-900 mb-6">
            About Resti Kiryandongo CBO
          </h2>
          <p className="text-lg text-gray-600">
            Founded with a mission to empower and uplift communities in Kiryandongo District, we are a community-based organization dedicated to creating sustainable positive change through collaborative action and locally-driven solutions.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl">
            <h3 className="text-2xl text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-700">
              To empower communities in Kiryandongo through sustainable development programs in education, healthcare, and economic empowerment, fostering self-reliance and improved quality of life for all.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
            <h3 className="text-2xl text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-700">
              A thriving, self-sustaining community where every individual has access to quality education, healthcare, and opportunities for economic prosperity.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h3 className="text-2xl text-gray-900 text-center mb-10">Our Core Values</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="text-emerald-600" size={24} />
                </div>
                <h4 className="text-lg text-gray-900 mb-2">{value.title}</h4>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="bg-gray-50 p-8 lg:p-12 rounded-2xl">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl text-gray-900 mb-6">Our Story</h3>
            <p className="text-gray-700 mb-4">
              Resti Kiryandongo CBO was born from a shared vision among community members who recognized the need for organized, sustainable development initiatives in our district. What started as small-scale educational support has grown into a comprehensive community development organization.
            </p>
            <p className="text-gray-700">
              Today, we work closely with local government, international partners, and most importantly, the communities we serve, to identify needs, develop solutions, and implement programs that create lasting positive change. Our grassroots approach ensures that every initiative is community-driven and culturally appropriate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

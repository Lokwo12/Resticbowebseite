import { ArrowRight } from 'lucide-react';

export function Hero() {
  const scrollToDonate = () => {
    const element = document.getElementById('donate');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm">
              Making a Difference in Kiryandongo
            </div>
            <h1 className="text-4xl lg:text-6xl text-gray-900">
              Empowering Communities Through Action
            </h1>
            <p className="text-xl text-gray-600">
              Resti Kiryandongo CBO is dedicated to improving lives through education, healthcare, and community development initiatives in Kiryandongo District, Uganda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToDonate}
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                Donate Now
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('about');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-3xl text-emerald-600">500+</div>
                <div className="text-sm text-gray-600">Families Supported</div>
              </div>
              <div>
                <div className="text-3xl text-emerald-600">10+</div>
                <div className="text-sm text-gray-600">Active Programs</div>
              </div>
              <div>
                <div className="text-3xl text-emerald-600">50+</div>
                <div className="text-sm text-gray-600">Volunteers</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1606471015285-85fa1288aa4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwZW1wb3dlcm1lbnR8ZW58MXx8fHwxNzYyNDU3NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Community empowerment"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg hidden lg:block">
              <div className="text-3xl">🤝</div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Community Impact</div>
                <div className="text-emerald-600">Growing Daily</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

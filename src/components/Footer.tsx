import { Heart, Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import logo from 'figma:asset/2b36c5cb8ddf5552ba2d3e612fd68401a7bb193e.png';

export function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <img src={logo} alt="Resti Kiryandongo CBO Logo" className="h-20 w-auto mb-2" />
              <h3 className="text-white mb-1">Resti Kiryandongo</h3>
              <p className="text-sm text-gray-400 mb-3">Community Based Organization</p>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering communities through education, healthcare, and sustainable development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => scrollToSection('home')} className="hover:text-emerald-400 transition-colors">Home</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-emerald-400 transition-colors">About Us</button></li>
              <li><button onClick={() => scrollToSection('programs')} className="hover:text-emerald-400 transition-colors">Programs</button></li>
              <li><button onClick={() => scrollToSection('team')} className="hover:text-emerald-400 transition-colors">Our Team</button></li>
              <li><button onClick={() => scrollToSection('impact')} className="hover:text-emerald-400 transition-colors">Impact Stories</button></li>
              <li><button onClick={() => scrollToSection('events')} className="hover:text-emerald-400 transition-colors">Events</button></li>
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="mb-4">Get Involved</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => scrollToSection('volunteer')} className="hover:text-emerald-400 transition-colors">Volunteer</button></li>
              <li><button onClick={() => scrollToSection('donate')} className="hover:text-emerald-400 transition-colors">Donate</button></li>
              <li><button onClick={() => scrollToSection('partners')} className="hover:text-emerald-400 transition-colors">Become a Partner</button></li>
              <li><button onClick={() => scrollToSection('newsletter')} className="hover:text-emerald-400 transition-colors">Newsletter</button></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => scrollToSection('gallery')} className="hover:text-emerald-400 transition-colors">Gallery</button></li>
              <li><button onClick={() => scrollToSection('news')} className="hover:text-emerald-400 transition-colors">News</button></li>
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-emerald-400 transition-colors">FAQ</button></li>
              <li><button onClick={() => scrollToSection('resources')} className="hover:text-emerald-400 transition-colors">Downloads</button></li>
              <li><button onClick={() => scrollToSection('impact-dashboard')} className="hover:text-emerald-400 transition-colors">Impact Dashboard</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Kiryandongo District, Uganda</li>
              <li>
                <a href="mailto:info@restikirya.org" className="hover:text-emerald-400 transition-colors">
                  info@restikirya.org
                </a>
              </li>
              <li>+256 XXX XXX XXX</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="mailto:info@restikirya.org"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Resti Kiryandongo CBO. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            Made with <Heart size={16} className="text-red-500" /> for our community
          </p>
        </div>
      </div>
    </footer>
  );
}

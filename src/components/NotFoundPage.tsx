import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, Heart, Mail, ArrowLeft, Search } from 'lucide-react';
import { Button } from './ui/button';
import { SEO } from './SEO';

export function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found | RESTI CBO"
        description="The requested page could not be found. Explore RESTI CBO's programs, news, and community initiatives in Kiryandongo."
      />
      <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-stone-50/60">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
            <Search className="w-3.5 h-3.5" />
            <span>Error 404 • Resource Not Located</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight">
              Page Not Found
            </h1>
            <p className="text-base sm:text-lg text-stone-600 max-w-lg mx-auto leading-relaxed">
              We couldn't find the page you were looking for. It may have been moved, renamed, or is temporarily unavailable.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-xl shadow-sm">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <Home className="w-4 h-4" />
                Return to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link to="/programs" className="flex items-center gap-2 font-semibold text-stone-700">
                <Compass className="w-4 h-4" />
                Explore Programs
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-xl">
              <Link to="/donate" className="flex items-center gap-2 font-semibold">
                <Heart className="w-4 h-4 text-emerald-600" />
                Support Our Mission
              </Link>
            </Button>
          </div>

          {/* Helpful Navigation Links */}
          <div className="pt-8 border-t border-stone-200/80">
            <p className="text-xs uppercase font-bold tracking-wider text-stone-500 mb-4">
              Popular Destinations
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-emerald-700">
              <Link to="/about" className="hover:underline hover:text-emerald-800">About RESTI</Link>
              <span className="text-stone-300">•</span>
              <Link to="/stories" className="hover:underline hover:text-emerald-800">Impact Stories</Link>
              <span className="text-stone-300">•</span>
              <Link to="/news" className="hover:underline hover:text-emerald-800">Latest Updates</Link>
              <span className="text-stone-300">•</span>
              <Link to="/events" className="hover:underline hover:text-emerald-800">Upcoming Events</Link>
              <span className="text-stone-300">•</span>
              <Link to="/contact" className="hover:underline hover:text-emerald-800">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

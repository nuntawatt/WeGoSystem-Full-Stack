// Landing page (Hero) with Professional Sophisticated Style
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Users, Clock, ArrowRight, Compass, ChevronLeft, ChevronRight } from "lucide-react";

const heroSlides = [
  {
    url: "https://i.pinimg.com/1200x/db/35/85/db35859ede481fbe8bf0f6399e07d9a6.jpg",  
    alt: "Students collaborating in modern workspace"
  },
  {
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80",
    alt: "Group study session at university"
  },
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80",
    alt: "Professional meeting room discussion"
  },
  {
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80",
    alt: "Creative team brainstorming"
  }
];

export default function Home() {
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!loading && user) {
    return <Navigate to="/explore" replace />;
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
      <section className="relative h-[70vh] md:h-[85vh] min-h-[500px] md:min-h-[600px] overflow-hidden">
        {/* Background Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.url}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
          </div>
        ))}

        {/* Slide Navigation */}
        <button
          onClick={prevSlide}
          className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl mx-auto md:mx-0 text-center md:text-left">
              {/* Main Heading - Elegant Serif */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight text-white mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Discover Your
                <span className="block font-semibold italic">Find Friends</span>
              </h1>

              {/* Subheading */}
              <p className="text-base md:text-lg lg:text-xl text-white/70 leading-relaxed mb-10 max-w-xl font-light text-center md:text-left mx-auto md:mx-0">
                Connect with like-minded individuals. Schedule sessions. 
                Collaborate in real-time. All in one elegant platform.
              </p>

              {/* CTA Buttons - Refined Style */}
              <div className="flex flex-col sm:flex-row gap-4 items-center md:items-start">
                <Link
                  to="/auth/signup"
                  className="group inline-flex items-center justify-center w-full sm:w-auto gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-white text-slate-900 font-medium rounded-sm transition-all duration-300 hover:bg-slate-100 hover:shadow-lg"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  to="/explore"
                  className="group inline-flex items-center justify-center w-full sm:w-auto gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-transparent text-white font-medium border border-white/30 rounded-sm transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:text-white dark:hover:text-white"
                >
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300 group-hover:rotate-12" />
                  Explore Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview - Muted Sophisticated Colors */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Popular Categories
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Find study groups that match your academic interests and goals
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-teal-800/10 text-teal-800 dark:bg-teal-400/20 dark:text-teal-300 border border-teal-800/20 dark:border-teal-400/30">
              Thesis Research
            </span>
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-slate-600/10 text-slate-600 dark:bg-slate-400/20 dark:text-slate-300 border border-slate-600/20 dark:border-slate-400/30">
              Coffee & Code
            </span>
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-amber-700/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-700/20 dark:border-amber-400/30">
              Business Strategy
            </span>
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-indigo-700/10 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-700/20 dark:border-indigo-400/30">
              Language Exchange
            </span>
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-rose-700/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-700/20 dark:border-rose-400/30">
              Design Workshop
            </span>
            <span className="px-5 py-2.5 rounded-full text-sm font-medium bg-emerald-700/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-700/20 dark:border-emerald-400/30">
              Exam Preparation
            </span>
          </div>
        </div>
      </section>

      {/* Features Section - Clean & Professional */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-slate-800 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Why Choose <span className="italic">WeGo</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to connect, explore, and grow together in one refined platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-teal-700 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Find Your People
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Connect with individuals who share your academic interests and professional aspirations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Smart Scheduling
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Effortlessly coordinate sessions with intelligent scheduling that works for everyone.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Real-time Collaboration
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Engage with your group members through seamless real-time chat and coordination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Subtle & Professional */}
      <section className="py-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Secure</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Protected Platform</p>
            </div>
            <div>
              <p className="text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Fast</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Instant Connection</p>
            </div>
            <div>
              <p className="text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Curated</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Quality Community</p>
            </div>
            <div>
              <p className="text-3xl font-light text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Growing</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expanding Network</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

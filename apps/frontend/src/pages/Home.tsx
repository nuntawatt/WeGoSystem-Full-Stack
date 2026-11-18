import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  Users, 
  Clock, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Calendar, 
  MessageSquare,
  CheckCircle2,
  CalendarCheck,
  Send,
  Radio,
  FileText
} from "lucide-react";

const categories = [
  { name: "Thesis & Research", count: "14 rooms", tag: "Academic" },
  { name: "Coffee & Code", count: "28 rooms", tag: "Tech" },
  { name: "Business Strategy", count: "16 rooms", tag: "Career" },
  { name: "Language Exchange", count: "22 rooms", tag: "Social" },
  { name: "Design & UX", count: "18 rooms", tag: "Creative" },
  { name: "Exam Preparation", count: "34 rooms", tag: "Study" },
];

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!loading && user) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <div className="bg-[#FFFFFF] text-[#202124] min-h-screen selection:bg-[#EAF5D5] selection:text-[#147D70]">
      {/* Hero Section — Minimalist Modern Product Showcase */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 border-b border-[#E8EBE9]">
        {/* Subtle Decorative Ambient Background */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#147D70]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#D9F36A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-app relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Bold Typography & Actions */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF5D5] border border-[#D9F36A] text-xs font-bold text-[#147D70]">
                <span className="w-2 h-2 rounded-full bg-[#147D70] animate-pulse" />
                <span>Next-Gen Campus & Community Network</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#202124] leading-[1.12]">
                Build your <br />
                <span className="text-[#147D70]">community</span> today.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#5F6664] leading-relaxed max-w-lg font-normal">
                WegoSystem connects students and creators to coordinate study sessions, synchronize group availability, and collaborate in real-time rooms without friction.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/auth/signup"
                  className="px-7 py-3.5 rounded-xl bg-[#202124] hover:bg-[#147D70] text-white text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-xl border border-[#E8EBE9] hover:border-[#147D70] bg-[#F3F5F4]/60 hover:bg-[#F3F5F4] text-[#202124] text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-[#147D70]" />
                  <span>Explore Rooms</span>
                </Link>
              </div>

              {/* Trust Markers */}
              <div className="pt-6 border-t border-[#E8EBE9] flex items-center gap-6 text-xs text-[#858B89]">
                <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                  <CheckCircle2 className="w-4 h-4 text-[#147D70]" /> Free for students
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                  <CheckCircle2 className="w-4 h-4 text-[#147D70]" /> Live socket rooms
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#202124]">
                  <CheckCircle2 className="w-4 h-4 text-[#147D70]" /> Verified network
                </span>
              </div>
            </div>

            {/* Right Column: Premium High-Detail Product UI Preview */}
            <div className="lg:col-span-6 relative flex items-center justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-lg">
                
                {/* Background Organic Vector Shapes & Contour Lines */}
                <div className="absolute -inset-4 sm:-inset-6 pointer-events-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 540 460" fill="none">
                    {/* Deep Teal Smooth Wave */}
                    <path
                      d="M260 80 C360 40, 500 100, 520 220 C540 340, 430 430, 310 420 C190 410, 160 300, 180 200 C200 120, 210 100, 260 80 Z"
                      fill="#147D70"
                      opacity="0.12"
                    />

                    {/* Terracotta/Peach Accent Curve */}
                    <path
                      d="M30 320 C10 260, 80 220, 140 240 C200 260, 210 350, 160 390 C110 430, 40 370, 30 320 Z"
                      fill="#E89A7A"
                      opacity="0.2"
                    />

                    {/* Subtle Contour Topography Lines */}
                    <g opacity="0.4">
                      <path d="M400 60 Q460 100, 480 170" stroke="#147D70" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M420 75 Q475 115, 495 185" stroke="#147D70" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M440 90 Q490 130, 510 200" stroke="#147D70" strokeWidth="1.5" strokeDasharray="3 3" />
                    </g>
                  </svg>
                </div>

                {/* Floating Badge 1 (Top-Right): Audio Study Room Live */}
                <div className="absolute -top-3.5 right-2 sm:-right-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-[#E8EBE9] shadow-lg flex items-center gap-2.5 text-xs font-bold text-[#202124] animate-bounce-slight">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#147D70] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#147D70]"></span>
                  </span>
                  <span>Voice Study • 4 Peers Live</span>
                  <div className="flex gap-0.5 items-end h-3 ml-0.5">
                    <span className="w-1 bg-[#D9F36A] rounded-full h-2 animate-pulse" />
                    <span className="w-1 bg-[#147D70] rounded-full h-3" />
                    <span className="w-1 bg-[#D9F36A] rounded-full h-1.5 animate-pulse" />
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom-Left): Schedule Match */}
                <div className="absolute -bottom-4 left-2 sm:-left-4 z-30 bg-[#202124] text-white rounded-2xl px-4 py-2.5 shadow-xl border border-[#202124] flex items-center gap-2.5 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#D9F36A] flex-shrink-0" />
                  <span>Timetable Matched • Wed 14:00</span>
                </div>

                {/* Main Product Preview Card */}
                <div className="relative z-20 bg-white rounded-3xl border border-[#E8EBE9] shadow-2xl p-6 sm:p-7 space-y-5">
                  
                  {/* Window Bar Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E8EBE9]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80" />
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80" />
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]/80" />
                    </div>

                    <div className="bg-[#F3F5F4] px-4 py-1 rounded-full text-[11px] font-mono text-[#858B89] border border-[#E8EBE9]">
                      wego.app/room/algorithms-study
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5D5] text-[#11665C] border border-[#D9F36A] text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#11665C]" />
                      Online
                    </div>
                  </div>

                  {/* Room Overview Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#147D70] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-[#D9F36A]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-[#202124] tracking-tight">
                          CS50 • Algorithms & Graph Theory
                        </h4>
                        <p className="text-xs text-[#858B89]">
                          Midterm Revision & Problem Solving
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-[#F3F5F4] text-[#202124] border border-[#E8EBE9] text-[11px] font-bold whitespace-nowrap">
                      Academic
                    </span>
                  </div>

                  {/* Feature 1: Timetable Synchronizer Widget */}
                  <div className="p-4 rounded-2xl bg-[#F9FAF9] border border-[#E8EBE9] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#147D70]" />
                        Schedule Synchronizer
                      </span>
                      <span className="text-[10px] font-bold text-[#147D70] bg-[#EAF5D5] border border-[#D9F36A]/60 px-2 py-0.5 rounded-full">
                        94% Overlap
                      </span>
                    </div>

                    {/* 7-Day Matrix Row */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                        const isMatch = idx === 2 || idx === 4; // Wed & Fri
                        return (
                          <div
                            key={idx}
                            className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                              isMatch
                                ? 'bg-[#147D70] text-white shadow-xs'
                                : 'bg-white border border-[#E8EBE9] text-[#858B89]'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-medium opacity-80">{day}</span>
                            <span className="block text-xs mt-0.5 font-bold">
                              {isMatch ? '✓' : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feature 2: Real-Time Room Chat Preview */}
                  <div className="space-y-2 pt-1">
                    {/* Peer message */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#202124] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        AL
                      </div>
                      <div className="bg-[#F3F5F4] border border-[#E8EBE9] rounded-2xl rounded-tl-xs px-3.5 py-2 max-w-[85%] text-xs text-[#202124] leading-relaxed">
                        Reserved Study Lab 304 for our group! Ready for graph reviews? 🚀
                      </div>
                    </div>

                    {/* User reply */}
                    <div className="flex items-start justify-end gap-2.5">
                      <div className="bg-[#147D70] text-white rounded-2xl rounded-tr-xs px-3.5 py-2 max-w-[85%] text-xs leading-relaxed shadow-xs">
                        Confirmed! Uploaded DFS/BFS cheat sheets to the room 👍
                      </div>
                    </div>
                  </div>

                  {/* Room Footer Action */}
                  <div className="pt-3 border-t border-[#E8EBE9] flex items-center justify-between">
                    {/* Participant Avatars */}
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-[#147D70] text-white border-2 border-white flex items-center justify-center text-[10px] font-bold">
                          JD
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#D9F36A] text-[#202124] border-2 border-white flex items-center justify-center text-[10px] font-bold">
                          SK
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#202124] text-white border-2 border-white flex items-center justify-center text-[10px] font-bold">
                          TW
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#858B89] ml-3">
                        +5 members active
                      </span>
                    </div>

                    <Link
                      to="/explore"
                      className="px-3.5 py-1.5 rounded-xl bg-[#202124] hover:bg-[#147D70] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Activity Categories */}
      <section className="py-16 sm:py-20 bg-[#F3F5F4]/60">
        <div className="container-app space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#147D70] bg-[#EAF5D5] px-2.5 py-1 rounded-full">
                Active Categories
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight mt-2">
                Explore What Peers Are Working On
              </h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#147D70] hover:text-[#11665C] transition-colors"
            >
              <span>View all activities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((c, i) => (
              <Link
                key={i}
                to={`/explore?category=${encodeURIComponent(c.name)}`}
                className="card p-6 hover:border-[#147D70] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#147D70] bg-[#EAF5D5] px-2.5 py-0.5 rounded-full">
                      {c.tag}
                    </span>
                    <span className="text-xs font-semibold text-[#858B89] group-hover:text-[#202124] transition-colors">
                      {c.count}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202124] group-hover:text-[#147D70] transition-colors">
                    {c.name}
                  </h3>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E8EBE9] flex items-center justify-between text-xs font-medium text-[#858B89]">
                  <span>Join discussion & schedule</span>
                  <ArrowRight className="w-4 h-4 text-[#147D70] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-white border-t border-[#E8EBE9]">
        <div className="container-app space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#147D70] bg-[#EAF5D5] px-3 py-1 rounded-full">
              Why WegoSystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
              Engineered for Seamless Collaboration
            </h2>
            <p className="text-sm text-[#5F6664]">
              Three core tools combined into one lightweight, real-time platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8 space-y-4 hover:border-[#147D70] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5D5] flex items-center justify-center text-[#147D70]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#202124]">
                Curated Community Rooms
              </h3>
              <p className="text-xs sm:text-sm text-[#5F6664] leading-relaxed">
                Join verified activity groups designed specifically for academic research, programming projects, and extracurricular meetups.
              </p>
            </div>

            <div className="card p-8 space-y-4 hover:border-[#147D70] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5D5] flex items-center justify-center text-[#147D70]">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#202124]">
                Interactive Timetable Sync
              </h3>
              <p className="text-xs sm:text-sm text-[#5F6664] leading-relaxed">
                Eliminate scheduling friction with our interactive availability matrix. Instantly pinpoint overlapping free hours across all group participants.
              </p>
            </div>

            <div className="card p-8 space-y-4 hover:border-[#147D70] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5D5] flex items-center justify-center text-[#147D70]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#202124]">
                Real-Time Messaging
              </h3>
              <p className="text-xs sm:text-sm text-[#5F6664] leading-relaxed">
                Coordinate on the fly with live group chatrooms and direct peer conversations powered by web sockets, with profile previews and safety reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="py-16 bg-[#F3F5F4] border-t border-[#E8EBE9]">
        <div className="container-app">
          <div className="rounded-3xl bg-[#202124] text-white p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9F36A]">
                Ready to find your circle?
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Start Connecting with WegoSystem Today
              </h2>
              <p className="text-xs sm:text-sm text-[#BAC2BF] max-w-md mx-auto">
                Join our growing network of students, researchers, and creators. Set up your profile in under two minutes.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/auth/signup"
                  className="px-6 py-3 rounded-xl bg-[#D9F36A] hover:bg-[#c8e25d] text-[#202124] text-xs font-bold transition-all shadow-sm"
                >
                  Create Your Free Account
                </Link>
                <Link
                  to="/explore"
                  className="px-6 py-3 rounded-xl border border-white/20 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Explore First
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 bg-white border-t border-[#E8EBE9] text-center text-xs text-[#858B89]">
        <p>All rights reserved • WegoSystem 2026</p>
      </footer>
    </div>
  );
}

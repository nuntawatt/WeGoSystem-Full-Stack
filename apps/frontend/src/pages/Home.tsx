// Landing page (Hero) with CTAs
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  
  // Redirect authenticated users to explore page
  if (!loading && user) {
    return <Navigate to="/explore" replace />;
  }
  return (
    <section className="relative overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/20 to-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-3xl" />

      <div className="container-app py-16 md:py-24 text-white">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm backdrop-blur">
              🎉 เจอเพื่อนไปทำกิจกรรมได้ง่ายขึ้น • จัดกลุ่ม • นัดเวลา • แชต
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              ไปคนเดียวไม่ต้องเหงา <br />
              <span className="brand-gradient">
                เพราะเราจะหาคนไปด้วย
              </span>
            </h1>

            <p className="text-white/80">
              หาเพื่อนร่วมกิจกรรม, จัดกลุ่ม, นัดเวลา, คุยกันในแชต — ครบจบในที่เดียว
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold shadow-lg shadow-amber-500/10
                           bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition"
              >
                Get Started
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold
                           border border-white/15 bg-white/5 hover:bg-white/10
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition"
              >
                Explore
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2 text-sm text-white/70">
              <span>👥 500+ ผู้ใช้</span>
              <span>🗓️ 100 กิจกรรม</span>
              <span>⭐ 4.8/5 ความพึงพอใจ</span>
            </div>
          </div>

          <div className="relative md:order-last order-first">
            <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 shadow-xl transition hover:scale-[1.01]">
              <img
                src="https://i.pinimg.com/1200x/54/57/24/545724f929914db48a3d1964f983f755.jpg"
                alt="Friends doing activities together"
                className="h-auto w-full rounded-xl object-cover aspect-[16/10] ring-1 ring-white/10"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

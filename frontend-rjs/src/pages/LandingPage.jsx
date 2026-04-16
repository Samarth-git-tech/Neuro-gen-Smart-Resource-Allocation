import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-emerald-50/50">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold font-nunito mb-8 border border-emerald-200 animate-fade-in animate-slide-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Live: Active in 8+ Cities across India</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold font-nunito text-gray-900 tracking-tight leading-tight mb-6 max-w-4xl animate-fade-in animate-slide-up" style={{ animationDelay: "100ms" }}>
            AI-Powered <span className="text-emerald-600">Disaster Relief</span> & Community Support
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl animate-fade-in animate-slide-up" style={{ animationDelay: "200ms" }}>
            Digi-Sahaay uses Gemini AI to instantly analyze community needs, categorize emergencies, and auto-assign the best volunteers based on location, skills, and availability.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Link to="/register" className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold font-nunito text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5">
              Get Started
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-xl font-bold font-nunito text-lg hover:border-gray-300 hover:bg-gray-50 transition">
              Sign In
            </Link>
          </div>
        </div>
        
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      {/* "How It Works" Section */}
      <div className="max-w-[1200px] mx-auto px-6 py-20 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-emerald-600 mb-3 uppercase tracking-widest font-nunito animate-slide-up">Flow Clarity</h2>
          <h3 className="text-3xl md:text-5xl font-extrabold font-nunito text-gray-800 animate-slide-up">How the System Works</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 mt-8 lg:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Community Input', icon: '📢', desc: 'Anyone can report an emergency or need via text. The raw text is ingested into the system.', delay: '0ms' },
            { step: '2', title: 'Gemini AI Analysis', icon: '🤖', desc: 'AI extracts the problem, determines category, sets priority (High/Med/Low), and identifies required skills.', delay: '100ms', isAI: true },
            { step: '3', title: 'Task Generation', icon: '📋', desc: 'A formal task is generated with auto-deadlines (e.g. High Priority = Due in 2 hrs).', delay: '200ms' },
            { step: '4', title: 'Smart Assignment', icon: '🎯', desc: 'Assignment Engine filters by location, skills, workload cap (max 2 active), and assigns the best volunteer.', delay: '0ms', isAI: true },
            { step: '5', title: 'Volunteer Execution', icon: '🏃', desc: 'Volunteers accept/reject tasks. On reject, the system logs rejection memory and auto-reassigns to the next best match.', delay: '100ms' },
            { step: '6', title: 'Analytics & Feedback', icon: '📈', desc: 'Successful completions feed a success score back into the system, and improve global tracking metrics.', delay: '200ms' },
          ].map((s) => (
            <div key={s.step} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group animate-fade-in animate-slide-up" style={{ animationDelay: s.delay }}>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{s.icon}</div>
              <h4 className="text-xl font-extrabold font-nunito text-gray-800 mb-2 flex flex-wrap gap-2 items-center">
                {s.title}
                {s.isAI && <span className="bg-indigo-100 px-2 py-0.5 rounded-full text-[10px] text-indigo-700 uppercase tracking-widest">AI / System</span>}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              
              {/* Overlay number */}
              <div className="absolute right-6 top-6 text-7xl font-extrabold text-gray-50/50 select-none z-0">
                {s.step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { ROLES, CATEGORIES, CITIES, capitalize } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setRole: setContextRole, isAuthenticated } = useAuth();

  // Already logged in — skip registration entirely
  if (isAuthenticated && !loading) return <Navigate to="/dashboard" replace />;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    city: "prayagraj",
    groupName: "",
    category: "health",
    skills: "",
    availability: "Available"
  });

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleNext = () => {
    if (!role) {
      setError("Please select a role to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Step 2: Get Firebase ID token
      const token = await userCredential.user.getIdToken();

      // Step 3: Send user data to backend with Authorization header
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: role.toLowerCase(),
          skills: formData.skills,
          availability: formData.availability,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Registration failed");
      }

      // Persist name separately for Navbar display
      localStorage.setItem("userName", formData.name);

      // Update role in AuthContext + localStorage atomically
      setContextRole(role);

      // Replace history so back-button doesn't return to the register form
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(err.message || "Registration failed");
      import("firebase/auth").then(({ signOut }) => signOut(auth)).catch(console.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-100 flex items-start justify-center p-6 md:p-10 animate-fade-in">
      {error && <Toast message={error} type="error" />}

      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-10 w-full transition-all ${step === 2 && role === "admin" ? "max-w-[720px]" : "max-w-[560px]"}`}>
        
        <span className="inline-block bg-green-100 text-green-800 text-xs font-bold font-nunito px-3 py-1 rounded-full mb-3">
          Step {step} of 2
        </span>
        
        {step === 1 && (
          <div className="slide-up">
            <h2 className="text-2xl font-extrabold text-gray-800 font-nunito mb-1">Choose your Role</h2>
            <p className="text-gray-600 text-sm mb-7">How will you participate in Digi-Sahaay?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {Object.entries(ROLES).map(([id, r]) => (
                <div 
                  key={id}
                  onClick={() => setRole(id)}
                  className={`flex flex-col items-center gap-2 p-5 border-2 rounded-xl cursor-pointer transition-all text-center
                    ${role === id 
                      ? "border-green-700 bg-green-50 shadow-[0_0_0_3px_rgba(46,125,82,0.15)]" 
                      : "border-gray-200 bg-white hover:border-green-500 hover:bg-green-50/50 hover:-translate-y-1 hover:shadow-sm"
                    }`}
                >
                  <div className="text-3xl">{r.icon}</div>
                  <div className="font-nunito text-[15px] font-extrabold text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-600 leading-tight">{r.desc}</div>
                  <span className={`text-[11px] font-bold font-nunito px-2.5 py-0.5 rounded-full mt-1 ${r.badgeClass}`}>
                    {r.badge}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-green-700 text-white py-3 rounded-lg text-[15px] font-bold font-nunito hover:bg-green-600 transition"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="slide-up">
            <h2 className="text-2xl font-extrabold text-gray-800 font-nunito mb-1">Complete your Profile</h2>
            <p className="text-gray-600 text-sm mb-6">You are registering as a <strong>{capitalize(role)}</strong>.</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Full Name</label>
                  <input type="text" required value={formData.name} onChange={handleChange('name')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Mobile Number</label>
                  <input type="tel" required value={formData.mobile} onChange={handleChange('mobile')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" placeholder="+91" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Email Address</label>
                  <input type="email" required value={formData.email} onChange={handleChange('email')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Password</label>
                  <input type="password" required value={formData.password} onChange={handleChange('password')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" minLength={6} />
                </div>
              </div>

              {role === "admin" && (
                <div className="p-5 border-2 border-gray-200 rounded-lg bg-gray-50 mt-2">
                  <h3 className="text-[15px] font-extrabold font-nunito mb-4 text-green-800 flex items-center gap-2">
                    🛡️ Admin Setup
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-800 font-nunito">NGO / Group Name</label>
                      <input type="text" required value={formData.groupName} onChange={handleChange('groupName')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-800 font-nunito">Primary Focus</label>
                      <select required value={formData.category} onChange={handleChange('category')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none bg-white">
                        {CATEGORIES.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {["volunteer", "helper"].includes(role) && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Your Skills (comma separated)</label>
                  <input type="text" placeholder="e.g. driving, cooking, medical" required value={formData.skills} onChange={handleChange('skills')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-800 font-nunito">Operating City</label>
                <select required value={formData.city} onChange={handleChange('city')} className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none bg-white">
                  {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="flex items-start gap-2 mt-4 text-sm text-gray-600">
                <input type="checkbox" required className="mt-1" />
                <span>I agree to the Terms of Service and Privacy Policy.</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-[15px] font-bold font-nunito hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-green-700 text-white py-3 rounded-lg text-[15px] font-bold font-nunito hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onLogin: () => void;
}

export function Register({ onRegisterSuccess, onLogin }: RegisterProps) {
  const { registerWithEmail } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handle = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrorMessage(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!form.email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await registerWithEmail(form.email.trim(), form.password, form.fullName.trim());
      if (res.success) {
        setRegisteredEmail(form.email.trim());
      } else {
        setErrorMessage(res.error || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-8 relative transition-colors duration-200">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Toggle Light / Dark theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md p-6 sm:p-8 transition-colors duration-200">
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-[#0B5CE5] rounded-full flex items-center justify-center mb-2 shadow-md shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold text-sm">SecureVault Guard</span>
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium text-center">
            SHA-256 Hash Check &amp; Firebase Cloud Protected
          </span>
        </div>

        <h1 className="text-center text-gray-900 dark:text-white font-bold text-xl mb-1 tracking-tight">Create Account</h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-xs mb-4">
          Sign up to initialize your SHA-256 verified &amp; Firebase Cloud credential vault
        </p>

        {/* First-Time FormSubmit Activation Notice */}
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 text-xs space-y-1.5 shadow-2xs transition-colors">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>First-Time Email Activation Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            When you register and log in for the first time, you will receive an email from <span className="font-semibold underline">FormSubmit</span> to activate your inbox:
          </p>
          <ul className="text-[11px] space-y-1 pl-4 list-disc text-amber-900/90 dark:text-amber-200/90">
            <li>
              Simply click <strong>&quot;Activate Form&quot;</strong> in the email (check your <strong>Spam / Junk folder</strong> if needed).
            </li>
            <li>
              Once clicked, it <strong>activates immediately</strong> with zero extra steps.
            </li>
            <li>
              Then return to the app and click <strong>&quot;Resend OTP&quot;</strong> to get your verification code.
            </li>
            <li>
              This only happens <strong>once</strong>; from your next login onwards, OTPs arrive directly as usual!
            </li>
          </ul>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-medium animate-in fade-in-0 duration-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handle("fullName")}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={form.email}
                onChange={handle("email")}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={handle("password")}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-mono transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handle("confirmPassword")}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-mono transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B5CE5] hover:bg-blue-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-5">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="text-[#0B5CE5] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Post-Registration Activation Guidance Modal */}
      {registeredEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-7 max-w-md w-full space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Account Created Successfully!</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                  {registeredEmail}
                </p>
              </div>
            </div>

            {/* Step-by-step First Time Activation Instructions */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 space-y-2.5 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Next Step: One-Time Email Activation</span>
              </div>
              <ol className="space-y-2 text-[11px] list-decimal pl-4 leading-relaxed text-blue-900/90 dark:text-blue-200/90">
                <li>
                  Click <strong>&quot;Proceed to Sign In&quot;</strong> and log in with your email and password.
                </li>
                <li>
                  Check your email inbox (and <strong>Spam/Junk</strong>) for a message from <strong>FormSubmit</strong>.
                </li>
                <li>
                  Click <strong>&quot;Activate Form&quot;</strong> in that email. It activates immediately with no extra steps.
                </li>
                <li>
                  Click <strong>&quot;Resend OTP&quot;</strong> on the verification screen to get your 6-digit code.
                </li>
              </ol>
              <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
                ✨ From your next login onwards, you will receive OTPs automatically!
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onRegisterSuccess}
                className="w-full bg-[#0B5CE5] hover:bg-blue-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;

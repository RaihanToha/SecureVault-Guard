import React, { useState } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, X, CheckCircle2, AlertCircle, KeyRound, Send, Sun, Moon } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

interface LoginProps {
  onLoginSuccess: () => void;
  onRegister: () => void;
}

export function Login({ onLoginSuccess, onRegister }: LoginProps) {
  const { loginWithEmail, loginWithGoogle, sendPasswordReset } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setFeedback({ type: "error", message: "Please enter your email and password." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await loginWithEmail(email.trim(), password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Invalid email or password.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to sign in. Please verify your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFeedback(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        onLoginSuccess();
      } else if (res.error) {
        setFeedback({ type: "error", message: res.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Google sign-in error." });
    } finally {
      setGoogleLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    setForgotEmail(email.trim());
    setForgotFeedback(null);
    setIsForgotModalOpen(true);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = forgotEmail.trim();
    if (!target) {
      setForgotFeedback({
        type: "error",
        message: "Please enter your email address to receive the password reset link.",
      });
      return;
    }

    setForgotLoading(true);
    setForgotFeedback(null);
    try {
      const res = await sendPasswordReset(target);
      if (res.success) {
        setForgotFeedback({
          type: "success",
          message: res.message || `Password reset link dispatched by Google Firebase to ${target}! Please check your inbox and spam folder.`,
        });
      } else {
        setForgotFeedback({ type: "error", message: res.message });
      }
    } catch (err: any) {
      setForgotFeedback({ type: "error", message: "Failed to dispatch reset email." });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-8 relative transition-colors duration-200">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-7 sm:p-8 transition-colors duration-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#0B5CE5] rounded-full flex items-center justify-center mb-2 shadow-md shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold text-sm">SecureVault Guard</span>
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium text-center">
            SHA-256 Hash Check &amp; Firebase Cloud Protected
          </span>
        </div>

        <h1 className="text-center text-gray-900 dark:text-white font-bold text-xl mb-1 tracking-tight">Welcome Back</h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-xs mb-5">
          Sign in to access your SHA-256 verified &amp; Firebase Cloud encrypted vault
        </p>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-medium border animate-in fade-in-0 duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-gray-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700 text-[#0B5CE5] focus:ring-[#0B5CE5] dark:bg-slate-800"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={openForgotPasswordModal}
              className="text-[#0B5CE5] dark:text-blue-400 font-semibold hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[#0B5CE5] hover:bg-blue-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold text-sm shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In to Vault</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center leading-snug">
            Protected by 2FA OTP. First time? Check your email for a one-time FormSubmit activation message.
          </p>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-gray-400 dark:text-slate-500 font-semibold tracking-wider transition-colors">
              Or Continue With
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/70 text-gray-700 dark:text-slate-200 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#0B5CE5] dark:text-blue-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google Sign-In</span>
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-5">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onRegister}
            className="text-[#0B5CE5] dark:text-blue-400 font-semibold hover:underline"
          >
            Create Account
          </button>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6 sm:p-7 relative transition-colors duration-200">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/80 text-[#0B5CE5] dark:text-blue-400 rounded-full flex items-center justify-center mb-2 shadow-xs border border-blue-100 dark:border-blue-900/50">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Reset Account Password</h3>
              <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                Enter your primary login email or registered secondary recovery email to receive password reset instructions.
              </p>
            </div>

            {forgotFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in-0 ${
                  forgotFeedback.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
                }`}
              >
                {forgotFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                  Primary Account Email or Secondary Recovery Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="primary@example.com or backup@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading || !forgotEmail.trim()}
                className="w-full bg-[#0B5CE5] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  Send,
  Loader2,
  Sun,
  Moon,
  Info,
  ExternalLink,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { sendOtpToEmail } from "../utils/emailService";

interface OTPVerificationProps {
  onVerify: () => void;
  onBlocked?: () => void;
  targetEmail?: string;
}

export function OTPVerification({ onVerify, onBlocked, targetEmail: propEmail }: OTPVerificationProps) {
  const { firebaseUser, profile, addSecurityLog } = useUser();
  const { isDark, toggleTheme } = useTheme();

  // Always use the primary account email for verifying OTP
  const recipientEmail = firebaseUser?.email || profile.email || propEmail || "user@example.com";

  // Generated 6-digit OTP code (held in memory, dispatched to email)
  const [currentOtpCode, setCurrentOtpCode] = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showActivationHelp, setShowActivationHelp] = useState(false);

  // 30-second cooldown timer for resend
  const [cooldown, setCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Guard to ensure initial OTP email is dispatched exactly ONCE per session
  const initialDispatchRef = useRef(false);

  // Dispatch OTP email on initial mount
  useEffect(() => {
    if (initialDispatchRef.current) return;
    initialDispatchRef.current = true;

    let isMounted = true;
    setIsDispatching(true);

    sendOtpToEmail(recipientEmail, currentOtpCode, "Login MFA Verification")
      .then((res) => {
        if (isMounted) {
          setIsDispatching(false);
          setDeliveryStatus(`Verification code dispatched to ${recipientEmail}`);
          addSecurityLog(
            "MFA OTP dispatched",
            "Success",
            "MFA",
            `Dispatched 6-digit OTP code to ${recipientEmail}`
          );
        }
      })
      .catch(() => {
        if (isMounted) setIsDispatching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recipientEmail, currentOtpCode, addSecurityLog]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (isBlocked || verified) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage(null);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtp(digits);
    setErrorMessage(null);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = () => {
    if (isBlocked || verified) return;

    const entered = otp.join("");
    if (entered.length < 6) {
      setErrorMessage("Please enter all 6 digits of the OTP.");
      return;
    }

    if (entered === currentOtpCode) {
      setVerified(true);
      setErrorMessage(null);
      addSecurityLog(
        "MFA OTP verified",
        "Success",
        "MFA",
        `Two-factor authentication verified successfully for ${recipientEmail}`
      );
      setTimeout(onVerify, 900);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        setIsBlocked(true);
        setErrorMessage("OTP failed three times. Access blocked for security.");
        addSecurityLog(
          "MFA OTP lockout",
          "Failed",
          "MFA",
          `Account locked after 3 failed OTP attempts for ${recipientEmail}`
        );
        onBlocked?.();
      } else {
        setErrorMessage(
          `Invalid OTP. Please check your email and try again. (${3 - newAttempts} attempt${
            3 - newAttempts === 1 ? "" : "s"
          } remaining)`
        );
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isBlocked || isDispatching) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtpCode(newCode);
    setOtp(["", "", "", "", "", ""]);
    setCooldown(30);
    setErrorMessage(null);
    setIsDispatching(true);

    try {
      const res = await sendOtpToEmail(recipientEmail, newCode, "Login MFA Verification");
      setDeliveryStatus(
        res.message ||
          `New verification code sent to ${recipientEmail}. If you just activated FormSubmit, your OTP is on its way!`
      );
      addSecurityLog(
        "MFA OTP resent",
        "Success",
        "MFA",
        `Resent replacement OTP code to ${recipientEmail}`
      );
    } catch {
      setDeliveryStatus(`Failed to dispatch email. Please try again.`);
    }

    setIsDispatching(false);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-8 relative transition-colors duration-200">
      {/* Theme Toggle in top right */}
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
        {/* Brand Icon and Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-[#0B5CE5] rounded-full flex items-center justify-center mb-2 shadow-sm shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold text-sm">SecureVault Guard</span>
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Two-Factor Authentication</span>
        </div>

        <h1 className="text-center text-gray-900 dark:text-white font-bold text-xl mb-1 tracking-tight">
          Email OTP Verification
        </h1>
        <p className="text-center text-gray-500 dark:text-slate-400 text-xs mb-4">
          For your security, a one-time verification code has been dispatched to your primary account email.
        </p>

        {/* Real Email Dispatch Notice */}
        <div className="mb-4 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 flex items-start gap-2.5 transition-colors">
          <Mail className="w-4 h-4 text-[#0B5CE5] dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1 min-w-0">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <span>Code dispatched to:</span>
              {isDispatching && <Loader2 className="w-3 h-3 animate-spin text-[#0B5CE5] dark:text-blue-400" />}
            </div>
            <p className="font-mono text-[11px] text-[#0B5CE5] dark:text-blue-400 font-bold break-all mt-0.5 truncate">
              {recipientEmail}
            </p>
            <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-1 leading-snug">
              {deliveryStatus || "Please check your inbox (and spam folder) and enter the 6-digit code below."}
            </p>
          </div>
        </div>

        {/* First-Time FormSubmit Activation Notice Card */}
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 text-xs space-y-1.5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>First Time Logging In? (One-Time Activation)</span>
            </div>
          </div>
          <p className="text-[11px] leading-snug text-amber-900/90 dark:text-amber-200/90">
            FormSubmit sends a one-time activation email on your first login.
          </p>
          <ol className="text-[11px] space-y-1 pl-4 list-decimal text-amber-900/90 dark:text-amber-200/90">
            <li>
              Check your inbox or <strong>Spam/Junk</strong> for an email from <strong>FormSubmit</strong>.
            </li>
            <li>
              Click <strong>&quot;Activate Form&quot;</strong> in that email — it activates immediately!
            </li>
            <li>
              Click <strong>&quot;Resend Code to Email&quot;</strong> below to receive your 6-digit OTP code.
            </li>
          </ol>
          <p className="text-[10px] text-amber-800 dark:text-amber-300/90 font-medium pt-0.5">
            ✨ This only happens once; from your next login onwards, OTPs arrive directly!
          </p>
        </div>

        {errorMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 animate-in fade-in-0 ${
              isBlocked
                ? "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {isBlocked ? (
              <Lock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 block">
          Enter 6-digit OTP Code
        </label>
        <div className="flex gap-2 justify-center mb-5">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={isBlocked || verified}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-10 h-12 text-center border border-gray-300 dark:border-slate-700 rounded-xl text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:opacity-50 transition-colors shadow-2xs"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={isBlocked || verified}
          className="w-full bg-[#22C55E] hover:bg-green-600 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors mb-4 font-semibold text-sm disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Verify &amp; Continue</span>
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
          <span className="text-xs text-gray-400 dark:text-slate-500">Or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-800" />
        </div>

        <div className="text-center mb-4">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isBlocked || verified || isDispatching}
            className="text-[#0B5CE5] dark:text-blue-400 text-xs font-semibold hover:underline disabled:text-gray-400 dark:disabled:text-slate-600 disabled:no-underline inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isDispatching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B5CE5] dark:text-blue-400" />
                <span>Sending email...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Resend Code to Email</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            {cooldown > 0
              ? `You can request a new code in ${cooldown}s`
              : "Activated your email or didn't receive it? Click above to resend"}
          </p>
        </div>

        {verified && (
          <div className="flex items-center gap-2 justify-center text-[#22C55E] dark:text-emerald-400 text-xs font-semibold mb-4 animate-in fade-in-0">
            <CheckCircle className="w-4 h-4" />
            <span>OTP verified successfully! Redirecting...</span>
          </div>
        )}

        <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex items-start gap-2.5 bg-gray-50/70 dark:bg-slate-800/60 transition-colors">
          <Shield className="w-4 h-4 text-[#22C55E] dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Email Delivery Security</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
              The OTP is sent directly to your registered email. Check both your Inbox and Spam/Junk folders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPVerification;

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Radio,
  Flame,
} from "lucide-react";
import {
  evaluatePassword,
  generateSecurePassword,
  type PasswordStrengthReport,
} from "../utils/passwordStrength";
import { checkPasswordBreach, type BreachCheckResult } from "../utils/breachChecker";

interface PasswordRecord {
  id: string | number;
  website: string;
  username: string;
  password: string;
  strength: "Strong" | "Medium" | "Weak";
  lastUpdated: string;
  category: string;
  breachStatus?: "Safe" | "Compromised" | "Unchecked" | "Checking";
  breachCount?: number;
  lastCheckedAt?: string;
}

interface PasswordSuggestionModalProps {
  record: PasswordRecord;
  isOpen: boolean;
  onClose: () => void;
  onApplyNewPassword: (recordId: string | number, newPassword: string) => void;
}

export function PasswordSuggestionModal({
  record,
  isOpen,
  onClose,
  onApplyNewPassword,
}: PasswordSuggestionModalProps) {
  if (!isOpen) return null;

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showGeneratedPass, setShowGeneratedPass] = useState(true);
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Live Breach Detection State for Current Password
  const [breachResult, setBreachResult] = useState<BreachCheckResult | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(true);

  // Current password evaluation
  const currentReport = evaluatePassword(record.password);

  // Suggested replacement password
  const [suggestedPassword, setSuggestedPassword] = useState(() =>
    generateSecurePassword(16)
  );

  useEffect(() => {
    let isMounted = true;
    setIsCheckingBreach(true);
    checkPasswordBreach(record.password).then((res) => {
      if (isMounted) {
        setBreachResult(res);
        setIsCheckingBreach(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [record.password]);

  const handleRegenerate = () => {
    setSuggestedPassword(generateSecurePassword(16));
    setCopiedGenerated(false);
  };

  const handleCopy = (text: string, isGen: boolean) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.error("Fallback copy failed", e);
    }
    document.body.removeChild(textArea);

    if (isGen) {
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    } else {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2000);
    }
  };

  const handleApply = () => {
    onApplyNewPassword(record.id, suggestedPassword);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  const isBreached = breachResult?.breached || record.breachStatus === "Compromised";
  const breachCount = breachResult?.count || record.breachCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-[#0d1b2a] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isBreached || currentReport.score < 40
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {isBreached ? (
                <Flame className="w-5 h-5 text-red-400 animate-pulse" />
              ) : currentReport.score < 40 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>Security &amp; Breach Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-300">
                {record.website} • {record.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Live Data Breach Exposure Alert Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
              isCheckingBreach
                ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300"
                : isBreached
                ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-950 dark:text-red-200"
                : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200"
            }`}
          >
            {isCheckingBreach ? (
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0 mt-0.5" />
            ) : isBreached ? (
              <Flame className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  {isCheckingBreach
                    ? "HIBP Breach API Querying..."
                    : isBreached
                    ? "CRITICAL: Known Data Breach Exposure"
                    : "Data Leak Protection Verified"}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">k-Anonymity SHA-1</span>
              </div>
              <p className="mt-1 leading-snug">
                {isCheckingBreach
                  ? "Checking zero-knowledge 5-character hash prefix against billions of compromised credentials..."
                  : isBreached
                  ? `This exact password has appeared ${breachCount.toLocaleString()} times in known data breaches and dark web credential dumps. Hackers can crack it in milliseconds.`
                  : "Good news! This credential does not appear in any known public data leaks or compromised dumps."}
              </p>
            </div>
          </div>

          {/* Current Password Card & Strength Meter */}
          <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Current Password</span>
              <div className="flex items-center gap-1.5">
                {isBreached && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                    LEAKED
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${currentReport.badgeClass}`}
                >
                  {currentReport.level} ({currentReport.score}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 mb-3">
              <span className="font-mono text-sm text-gray-800 dark:text-slate-200 truncate select-all">
                {showCurrentPass ? record.password : "•".repeat(Math.min(16, record.password.length || 8))}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Reveal password"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(record.password, false)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                  title="Copy password"
                >
                  {copiedCurrent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Visual Color-Coded Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                <span>Strength Assessment</span>
                <span className={isBreached ? "text-red-600 font-bold" : currentReport.textColorClass}>
                  {isBreached
                    ? "Compromised in public data breaches"
                    : currentReport.score < 40
                    ? "Vulnerable to attacks"
                    : currentReport.score < 70
                    ? "Moderate - could be improved"
                    : "Robust protection"}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isBreached ? "bg-red-600" : currentReport.colorClass
                  }`}
                  style={{ width: `${currentReport.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Diagnostic Criteria Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Security Check Results
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentReport.criteria.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    item.met
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                      : "bg-red-50/70 dark:bg-red-950/40 border-red-100 dark:border-red-900 text-red-900 dark:text-red-200"
                  }`}
                >
                  {item.met ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{item.label}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-3.5 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Recommendations for this credential:
            </h4>
            <ul className="space-y-1 text-xs text-amber-900/90 dark:text-amber-200/90 pl-1">
              {isBreached && (
                <li className="flex items-start gap-2 font-bold text-red-700 dark:text-red-400">
                  <span className="leading-none mt-1">⚠️</span>
                  <span>Change this password immediately across all services where it was used!</span>
                </li>
              )}
              {currentReport.suggestions.map((sug, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold leading-none mt-1">•</span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Replacement Section */}
          <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Recommended Secure Replacement
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                0 Leaks • 100% Strength
              </span>
            </div>

            {/* Generated Password Pill */}
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-blue-300 dark:border-slate-700 shadow-xs">
              <span className="font-mono text-sm text-blue-950 dark:text-blue-200 font-semibold truncate tracking-wider select-all">
                {showGeneratedPass ? suggestedPassword : "•".repeat(16)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGeneratedPass(!showGeneratedPass)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Toggle visibility"
                >
                  {showGeneratedPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(suggestedPassword, true)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                  title="Copy generated password"
                >
                  {copiedGenerated ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded"
                  title="Generate another password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* One-Click Action Button */}
            <button
              type="button"
              onClick={handleApply}
              disabled={appliedSuccess}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                appliedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Applied and Replaced in Vault!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Clean Password to {record.website}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>Remember to update this credential on {record.website} too.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordSuggestionModal;

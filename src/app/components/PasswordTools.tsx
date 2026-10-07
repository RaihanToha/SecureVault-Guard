import { useState, useEffect } from "react";
import {
  Shield,
  Copy,
  CheckCircle,
  Radio,
  Flame,
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { checkPasswordBreach, calculateSha1, type BreachCheckResult } from "../utils/breachChecker";

const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function generatePassword(
  length: number,
  opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }
) {
  let pool = "";
  if (opts.upper) pool += CHARS.upper;
  if (opts.lower) pool += CHARS.lower;
  if (opts.numbers) pool += CHARS.numbers;
  if (opts.symbols) pool += CHARS.symbols;
  if (!pool) pool = CHARS.lower;
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
}

function getStrength(pass: string): { label: string; color: string; width: string } {
  if (!pass) return { label: "", color: "", width: "0%" };
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNum = /[0-9]/.test(pass);
  const hasSym = /[^A-Za-z0-9]/.test(pass);
  const score = [hasUpper, hasLower, hasNum, hasSym, pass.length >= 12].filter(Boolean).length;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Medium", color: "bg-yellow-400", width: "66%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

export function PasswordTools() {
  const [activeTab, setActiveTab] = useState<"generator" | "checker">("generator");

  // Generator state
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [generated, setGenerated] = useState("XyT@pL9MKz2Qa8!Z");
  const [copied, setCopied] = useState(false);
  const [genBreachResult, setGenBreachResult] = useState<BreachCheckResult | null>(null);
  const [isCheckingGen, setIsCheckingGen] = useState(false);

  // Checker state
  const [testPassword, setTestPassword] = useState("");
  const [showTestPass, setShowTestPass] = useState(false);
  const [testBreachResult, setTestBreachResult] = useState<BreachCheckResult | null>(null);
  const [isCheckingTest, setIsCheckingTest] = useState(false);
  const [testSha1Prefix, setTestSha1Prefix] = useState("");

  const toggle = (key: keyof typeof opts) =>
    setOpts((o) => ({ ...o, [key]: !o[key] }));

  // Check generated password for breaches
  const runBreachCheckOnGen = async (pwd: string) => {
    setIsCheckingGen(true);
    const res = await checkPasswordBreach(pwd);
    setGenBreachResult(res);
    setIsCheckingGen(false);
  };

  useEffect(() => {
    runBreachCheckOnGen(generated);
  }, []);

  const handleGenerate = () => {
    const newPwd = generatePassword(length, opts);
    setGenerated(newPwd);
    setCopied(false);
    runBreachCheckOnGen(newPwd);
  };

  const handleCopy = (text: string) => {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Debounced breach checker for custom tester
  useEffect(() => {
    if (!testPassword) {
      setTestBreachResult(null);
      setTestSha1Prefix("");
      return;
    }

    let active = true;
    setIsCheckingTest(true);

    calculateSha1(testPassword).then((hash) => {
      if (active) setTestSha1Prefix(hash.slice(0, 5));
    });

    const timer = setTimeout(() => {
      checkPasswordBreach(testPassword).then((res) => {
        if (active) {
          setTestBreachResult(res);
          setIsCheckingTest(false);
        }
      });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [testPassword]);

  const strength = getStrength(generated);
  const testStrength = getStrength(testPassword);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1 text-2xl font-bold tracking-tight">
            Password Tools &amp; Breach Inspector
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Generate cryptographically secure passwords and audit credentials against known public data leaks in real time.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl shrink-0 border border-gray-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "generator"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Password Generator
          </button>
          <button
            onClick={() => setActiveTab("checker")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "checker"
                ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>Live Breach Check</span>
          </button>
        </div>
      </div>

      {activeTab === "generator" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generator Controls */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Password Length</label>
                <span className="text-sm text-[#0B5CE5] dark:text-blue-400 font-bold">{length} characters</span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-1">
                <span>8</span>
                <span>32</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: "upper", label: "Uppercase Letters (A-Z)" },
                { key: "lower", label: "Lowercase Letters (a-z)" },
                { key: "numbers", label: "Numbers (0-9)" },
                { key: "symbols", label: "Special Symbols (!@#$...)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opts[key as keyof typeof opts]}
                    onChange={() => toggle(key as keyof typeof opts)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-[#0B5CE5] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm font-semibold shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              Generate High-Entropy Password
            </button>
          </div>

          {/* Generated Password & Real-Time Breach Verification */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
            <h3 className="text-gray-900 dark:text-white font-bold text-base">Generated Password Output</h3>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={generated}
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 font-mono pr-10 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => handleCopy(generated)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Copy password"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Password Strength:</span>
                <span
                  className={`font-bold ${
                    strength.label === "Strong"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : strength.label === "Medium"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
            </div>

            {/* Real-Time Leak Check Pill */}
            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Have I Been Pwned Range API:
                </span>
                {isCheckingGen ? (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                  </span>
                ) : genBreachResult?.breached ? (
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Compromised ({genBreachResult.count.toLocaleString()} leaks)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 0 Leaks (Safe)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                Verified using k-Anonymity SHA-1 hash prefixing. Never exposes the plaintext credential over the network.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Real-time Breach Lookup Tab */
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-600 dark:text-red-400" />
              Live Password Leak &amp; Breach Inspector
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Type or paste any password below to perform an on-demand zero-knowledge breach check against billions of exposed passwords in known public data breaches.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">
                Test Password
              </label>
              <div className="relative">
                <input
                  type={showTestPass ? "text" : "password"}
                  placeholder="e.g. yt123, password, or your custom password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full pl-3 pr-20 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] font-mono bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowTestPass(!showTestPass)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title={showTestPass ? "Hide" : "Show"}
                  >
                    {showTestPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {isCheckingTest && (
                    <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                </div>
              </div>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Quick examples to test:</span>
              {["yt123", "password", "123456", "admin", "Secure#Pass9924!"].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setTestPassword(example)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-mono text-[11px] transition-colors border border-gray-200/50 dark:border-slate-700"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Result Display */}
            {testPassword && (
              <div className="space-y-3 pt-2">
                {/* Live Strength */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-slate-400">Local Complexity:</span>
                    <span
                      className={`font-bold ${
                        testStrength.label === "Strong"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : testStrength.label === "Medium"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {testStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${testStrength.color}`}
                      style={{ width: testStrength.width }}
                    />
                  </div>
                </div>

                {/* API Result Card */}
                {testBreachResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                      testBreachResult.breached
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200"
                        : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200"
                    }`}
                  >
                    {testBreachResult.breached ? (
                      <Flame className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {testBreachResult.breached
                            ? "COMPROMISED IN KNOWN DATA BREACHES"
                            : "CLEAN: 0 PUBLIC LEAKS DETECTED"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-current">
                          Prefix: {testSha1Prefix}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">
                        {testBreachResult.breached
                          ? `This password was found in ${testBreachResult.count.toLocaleString()} known data breach records in the Have I Been Pwned database. You must avoid using it.`
                          : "No records found matching this hash prefix and suffix. This password has not appeared in known major security breaches."}
                      </p>
                      <div className="pt-1 text-[11px] opacity-75">
                        Checked at: {testBreachResult.checkedAt} • Have I Been Pwned Range API
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordTools;

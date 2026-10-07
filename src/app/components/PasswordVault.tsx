import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ShieldAlert,
  Check,
  Flame,
  Radio,
  RefreshCw,
  ShieldCheck,
  Zap,
  Tag as TagIcon,
  Plus,
  X,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import {
  evaluatePassword,
  generateSecurePassword,
  type PasswordStrengthReport,
} from "../utils/passwordStrength";
import { checkPasswordBreach, type BreachCheckResult } from "../utils/breachChecker";
import { PasswordSuggestionModal } from "./PasswordSuggestionModal";
import { useUser, type PasswordRecord } from "../context/UserContext";
import { VaultSearchFilter, type FilterTagOption, type SortOption } from "./VaultSearchFilter";

const POPULAR_TAGS = ["Personal", "Work", "Finance", "Social", "Email", "Critical", "Shopping", "Banking", "Dev"];

export function PasswordVault() {
  const {
    passwords: records,
    addPassword,
    updatePasswordInVault,
    deletePasswordFromVault,
    addSecurityLog,
    isScanningBreaches,
    scanAllPasswordsForBreaches,
    checkSingleCredentialBreach,
  } = useUser();

  const [showPasswords, setShowPasswords] = useState<Record<string | number, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Form state
  const [form, setForm] = useState({
    website: "",
    username: "",
    password: "",
    category: "Personal",
    tags: [] as string[],
    customTagInput: "",
  });
  const [showFormPass, setShowFormPass] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [scanningMsg, setScanningMsg] = useState<string | null>(null);

  // Single credential checking state
  const [checkingRowId, setCheckingRowId] = useState<string | number | null>(null);

  // Live evaluation of the new password in form
  const formPasswordReport = evaluatePassword(form.password);
  const [formBreachInfo, setFormBreachInfo] = useState<BreachCheckResult | null>(null);

  // Check new password input for breaches in real-time
  useEffect(() => {
    let active = true;
    if (!form.password) {
      setFormBreachInfo(null);
      return;
    }
    const timer = setTimeout(() => {
      checkPasswordBreach(form.password).then((res) => {
        if (active) setFormBreachInfo(res);
      });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.password]);

  // Suggestion Modal state
  const [selectedRecordForSuggestion, setSelectedRecordForSuggestion] =
    useState<PasswordRecord | null>(null);

  const handle = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAddTag = (tagToAdd?: string) => {
    const rawTag = (tagToAdd || form.customTagInput).trim().replace(/^#/, "");
    if (!rawTag) return;
    if (!form.tags.includes(rawTag)) {
      setForm((f) => ({
        ...f,
        tags: [...f.tags, rawTag],
        customTagInput: "",
      }));
    } else {
      setForm((f) => ({ ...f, customTagInput: "" }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleGenerateInForm = () => {
    const generated = generateSecurePassword(16);
    setForm((f) => ({ ...f, password: generated }));
    setShowFormPass(true);
  };

  const handleSave = async () => {
    if (!form.website.trim() || !form.username.trim() || !form.password) return;
    const report = evaluatePassword(form.password);
    const strength =
      report.level === "Very Strong" || report.level === "Strong"
        ? "Strong"
        : report.level === "Medium"
        ? "Medium"
        : "Weak";

    // Combine category with tags, deduplicating
    const initialTags = Array.from(new Set([form.category, ...form.tags].filter(Boolean)));

    await addPassword({
      website: form.website.trim(),
      username: form.username.trim(),
      password: form.password,
      strength,
      lastUpdated: "Just now",
      category: form.category,
      tags: initialTags,
    });

    setForm({
      website: "",
      username: "",
      password: "",
      category: "Personal",
      tags: [],
      customTagInput: "",
    });
    setSavedSuccessMsg("Password encrypted and saved to vault successfully!");
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleDelete = async (id: string | number) => {
    await deletePasswordFromVault(id);
    setSavedSuccessMsg("Password record deleted from vault.");
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const toggleShow = (id: string | number) => {
    setShowPasswords((p) => {
      const next = !p[id];
      if (next) {
        addSecurityLog("Password viewed", "Success", "Password Vault", `Decrypted and viewed password`);
      }
      return { ...p, [id]: next };
    });
  };

  const copyToClipboard = (text: string, id: string | number) => {
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
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyNewPassword = async (recordId: string | number, newPassword: string) => {
    await updatePasswordInVault(recordId, newPassword);
    setSavedSuccessMsg("Password strengthened and updated successfully!");
    setTimeout(() => setSavedSuccessMsg(null), 3500);
  };

  // Run full vault scan
  const handleFullBreachScan = async () => {
    setScanningMsg(null);
    const res = await scanAllPasswordsForBreaches();
    if (res.compromised > 0) {
      setScanningMsg(`Scan complete: ${res.compromised} compromised credential(s) detected in public leaks.`);
    } else {
      setScanningMsg(`Scan complete: All ${res.total} credentials verified clean with zero data breaches.`);
    }
    setTimeout(() => setScanningMsg(null), 5000);
  };

  // Single credential on-demand check
  const handleCheckSingleRow = async (id: string | number) => {
    setCheckingRowId(id);
    const res = await checkSingleCredentialBreach(id);
    setCheckingRowId(null);
    if (res.breached) {
      setSavedSuccessMsg(`Alert: This credential was found in ${res.count.toLocaleString()} known data leaks!`);
    } else {
      setSavedSuccessMsg("Verified: Zero breach occurrences found in leak database.");
    }
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  // Extract all dynamic tags across all password records
  const dynamicTagOptions: FilterTagOption[] = useMemo(() => {
    const tagCountMap: Record<string, number> = {};

    records.forEach((r) => {
      const itemTags = new Set<string>();
      if (r.category) itemTags.add(r.category);
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t) => itemTags.add(t));
      }
      itemTags.forEach((t) => {
        const normalized = t.trim();
        if (normalized) {
          tagCountMap[normalized] = (tagCountMap[normalized] || 0) + 1;
        }
      });
    });

    const list: FilterTagOption[] = [
      {
        label: "All",
        value: "All",
        count: records.length,
      },
    ];

    // Add unique tags from vault
    const sortedTags = Object.keys(tagCountMap).sort((a, b) => tagCountMap[b] - tagCountMap[a]);
    sortedTags.forEach((t) => {
      list.push({
        label: t,
        value: t,
        count: tagCountMap[t],
      });
    });

    return list;
  }, [records]);

  // Compromised credentials list
  const compromisedRecords = records.filter(
    (r) => r.breachStatus === "Compromised" || (r.breachCount && r.breachCount > 0)
  );

  // Real-time filtering logic
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = records.filter((r) => {
      const allItemTags = [r.category, ...(r.tags || [])]
        .filter(Boolean)
        .map((t) => t.toLowerCase());

      // 1. Search Query: matches title/website, username, category, tags
      const matchesSearch =
        !query ||
        r.website.toLowerCase().includes(query) ||
        r.username.toLowerCase().includes(query) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        allItemTags.some((t) => t.includes(query));

      if (!matchesSearch) return false;

      // 2. Tag Filter
      if (selectedTag && selectedTag !== "All") {
        const matchesTag = allItemTags.includes(selectedTag.toLowerCase());
        if (!matchesTag) return false;
      }

      // 3. Status Filter
      if (statusFilter !== "All") {
        const isCompromised =
          r.breachStatus === "Compromised" || (r.breachCount && r.breachCount > 0);
        const report = evaluatePassword(r.password);

        if (statusFilter === "Compromised") {
          if (!isCompromised) return false;
        } else if (statusFilter === "Safe") {
          if (r.breachStatus !== "Safe" || isCompromised) return false;
        } else if (statusFilter === "Weak") {
          if (report.level !== "Weak") return false;
        } else if (statusFilter === "Medium") {
          if (report.level !== "Medium") return false;
        } else if (statusFilter === "Strong") {
          if (report.level !== "Strong" && report.level !== "Very Strong") return false;
        }
      }

      return true;
    });

    // 4. Sorting
    return result.sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.website.localeCompare(b.website);
      }
      if (sortBy === "title-desc") {
        return b.website.localeCompare(a.website);
      }
      if (sortBy === "weakest") {
        return evaluatePassword(a.password).score - evaluatePassword(b.password).score;
      }
      if (sortBy === "strongest") {
        return evaluatePassword(b.password).score - evaluatePassword(a.password).score;
      }
      // default: newest
      return String(b.id).localeCompare(String(a.id));
    });
  }, [records, search, selectedTag, statusFilter, sortBy]);

  const sortOptions: SortOption[] = [
    { label: "Recently Added", value: "newest" },
    { label: "Title (A-Z)", value: "title-asc" },
    { label: "Title (Z-A)", value: "title-desc" },
    { label: "Weakest Passwords", value: "weakest" },
    { label: "Strongest Passwords", value: "strongest" },
  ];

  const secondaryFilterOptions = [
    { label: "All Statuses", value: "All", count: records.length },
    { label: "🚨 Leaked / Compromised", value: "Compromised", count: compromisedRecords.length },
    {
      label: "Weak Passwords",
      value: "Weak",
      count: records.filter((r) => evaluatePassword(r.password).level === "Weak").length,
    },
    {
      label: "Medium Passwords",
      value: "Medium",
      count: records.filter((r) => evaluatePassword(r.password).level === "Medium").length,
    },
    {
      label: "Strong Passwords",
      value: "Strong",
      count: records.filter((r) => ["Strong", "Very Strong"].includes(evaluatePassword(r.password).level)).length,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1 text-2xl font-bold tracking-tight">
            Password Vault
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Store, audit, and organize credentials with AES-256 encryption, tag filtering, &amp; real-time leak detection.
          </p>
        </div>

        {/* Global Breach Scanner Button */}
        <button
          type="button"
          onClick={handleFullBreachScan}
          disabled={isScanningBreaches}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Radio className={`w-4 h-4 text-red-400 dark:text-red-300 ${isScanningBreaches ? "animate-spin" : ""}`} />
          <span>{isScanningBreaches ? "Scanning Leak Database..." : "Scan Vault for Breaches"}</span>
        </button>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{savedSuccessMsg}</span>
        </div>
      )}

      {scanningMsg && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200 shadow-xs">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-medium">{scanningMsg}</span>
        </div>
      )}

      {/* Real-time Data Breach Warning Banner */}
      {compromisedRecords.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in fade-in-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {compromisedRecords.length} Password{compromisedRecords.length > 1 ? "s" : ""} Exposed in Known Data Breaches
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-red-700 uppercase tracking-wider">
                  Critical
                </span>
              </div>
              <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
                The Have I Been Pwned database detected that these passwords have appeared in public credential dumps. They are actively targeted by credential-stuffing bots.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-red-200">Affected accounts:</span>
                {compromisedRecords.map((cr) => (
                  <button
                    key={cr.id}
                    onClick={() => setSelectedRecordForSuggestion(cr)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
                  >
                    <span>{cr.website}</span>
                    <span className="text-[10px] text-amber-300">
                      ({cr.breachCount ? `${cr.breachCount.toLocaleString()} leaks` : "Exposed"})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedRecordForSuggestion(compromisedRecords[0])}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Remediate Exposed Accounts</span>
          </button>
        </div>
      )}

      {/* Main Grid: Add Password Form & Saved Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Password Form */}
        <div className="col-span-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-gray-900 dark:text-white font-bold text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0B5CE5] dark:text-blue-400" />
              <span>Add New Password</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Encrypted locally using AES-256 before synchronization.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                Website / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Google Workspace, GitHub, Chase"
                value={form.website}
                onChange={handle("website")}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                Username / Email
              </label>
              <input
                type="text"
                placeholder="e.g. user@domain.com or admin"
                value={form.username}
                onChange={handle("username")}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleGenerateInForm}
                  className="text-xs font-semibold text-[#0B5CE5] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showFormPass ? "text" : "password"}
                  placeholder="Enter or generate password"
                  value={form.password}
                  onChange={handle("password")}
                  className="w-full pl-3 pr-10 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showFormPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Visualizer */}
              {form.password && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 space-y-2 text-xs animate-in fade-in-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-600 dark:text-slate-300">Strength:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${formPasswordReport.badgeClass}`}>
                      {formPasswordReport.level} ({formPasswordReport.score}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${formPasswordReport.colorClass}`}
                      style={{ width: `${formPasswordReport.score}%` }}
                    />
                  </div>

                  {/* Real-time Breach check result for new password */}
                  {formBreachInfo && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                      {formBreachInfo.breached ? (
                        <>
                          <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span className="text-red-700 dark:text-red-400 font-semibold">
                            Exposed in {formBreachInfo.count.toLocaleString()} known data leaks!
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            0 breaches detected in leak database.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={handle("category")}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer shadow-2xs"
              >
                <option>Personal</option>
                <option>Work</option>
                <option>Finance</option>
                <option>Social</option>
                <option>Entertainment</option>
                <option>Security</option>
              </select>
            </div>

            {/* Tags Input & Suggestion Chips */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Tags</span>
                <span className="text-[10px] text-gray-400 font-normal">Press Enter or click +</span>
              </label>

              {/* Tag Input */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="relative flex-1">
                  <TagIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. Critical, Banking)..."
                    value={form.customTagInput}
                    onChange={(e) => setForm((f) => ({ ...f, customTagInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Current Tags Chips */}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-medium"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Tag Suggestions */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 mr-1">Quick:</span>
                {POPULAR_TAGS.map((pt) => {
                  const isAdded = form.tags.includes(pt);
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => (isAdded ? handleRemoveTag(pt) : handleAddTag(pt))}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                        isAdded
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      #{pt}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[#0B5CE5] hover:bg-blue-600 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-semibold shadow-xs cursor-pointer mt-2"
            >
              <Shield className="w-4 h-4" />
              <span>Save Encrypted Password</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-3">
            <Lock className="w-3.5 h-3.5" />
            k-Anonymity SHA-1 privacy protected.
          </div>
        </div>

        {/* Saved Records Table & Search Filter Section */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {/* Real-time Search and Filter Component */}
          <VaultSearchFilter
            searchQuery={search}
            onSearchChange={setSearch}
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
            tags={dynamicTagOptions}
            secondaryFilter={{
              label: "Status",
              value: statusFilter,
              options: secondaryFilterOptions,
              onChange: setStatusFilter,
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={sortOptions}
            totalCount={records.length}
            filteredCount={filtered.length}
            itemTypeLabel="passwords"
            placeholder="Search accounts by title, username, or tag..."
          />

          {/* Table of Passwords */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-gray-900 dark:text-white font-bold text-base">
                Saved Password Records
              </h3>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {filtered.length} of {records.length} displayed
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[650px]">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                    <th className="text-left pb-2 pr-3">Website &amp; Account</th>
                    <th className="text-left pb-2 pr-3">Stored Password</th>
                    <th className="text-left pb-2 pr-3 min-w-[170px]">Strength &amp; Breach Status</th>
                    <th className="text-left pb-2 pr-3">Category &amp; Tags</th>
                    <th className="text-right pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                  {filtered.map((rec) => {
                    const report = evaluatePassword(rec.password);
                    const isWeak = report.level === "Weak";
                    const isMedium = report.level === "Medium";
                    const isBreached =
                      rec.breachStatus === "Compromised" || (rec.breachCount && rec.breachCount > 0);
                    const isRowChecking = checkingRowId === rec.id;
                    const allItemTags = Array.from(
                      new Set([rec.category, ...(rec.tags || [])].filter(Boolean))
                    );

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Website & Username */}
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{rec.website}</span>
                            {isBreached && (
                              <Flame
                                className="w-3.5 h-3.5 text-red-600 shrink-0"
                                title="Exposed in data breaches"
                              />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{rec.username}</div>
                        </td>

                        {/* Password with Reveal */}
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-700 dark:text-slate-300 font-medium">
                              {showPasswords[rec.id]
                                ? rec.password
                                : "•".repeat(Math.min(12, rec.password.length || 8))}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShow(rec.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded cursor-pointer"
                              title={showPasswords[rec.id] ? "Hide" : "Show"}
                            >
                              {showPasswords[rec.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Strength & Real-Time Breach Badge */}
                        <td className="py-3 pr-3">
                          <div className="space-y-1.5 max-w-[180px]">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${report.badgeClass}`}
                              >
                                {report.level}
                              </span>

                              {/* Breach Indicator Pill */}
                              {isBreached ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                  <Flame className="w-3 h-3" />
                                  <span>Leaked</span>
                                </span>
                              ) : rec.breachStatus === "Safe" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>0 Leaks</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCheckSingleRow(rec.id)}
                                  disabled={isRowChecking}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  {isRowChecking ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <span>Check leak</span>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Color-Coded Progress Bar */}
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-200/50 dark:border-slate-700">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isBreached ? "bg-red-600" : report.colorClass
                                }`}
                                style={{ width: `${report.score}%` }}
                              />
                            </div>

                            {/* Quick Suggestion Button */}
                            {(isWeak || isMedium || isBreached) && (
                              <button
                                type="button"
                                onClick={() => setSelectedRecordForSuggestion(rec)}
                                className={`text-[10px] font-bold flex items-center gap-1 pt-0.5 hover:underline cursor-pointer ${
                                  isBreached
                                    ? "text-red-700 dark:text-red-400"
                                    : isWeak
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                <Lightbulb className="w-3 h-3 shrink-0" />
                                <span>{isBreached ? "🚨 Remediate Breach" : "Strengthen Password"}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Category & Clickable Tags */}
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
                            {allItemTags.map((tag) => {
                              const isCurrentTag = selectedTag.toLowerCase() === tag.toLowerCase();
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => setSelectedTag(isCurrentTag ? "All" : tag)}
                                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                                    isCurrentTag
                                      ? "bg-[#0B5CE5] text-white"
                                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                  }`}
                                  title={`Filter by tag: #${tag}`}
                                >
                                  #{tag}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Run Single Row Breach Check */}
                            <button
                              type="button"
                              onClick={() => handleCheckSingleRow(rec.id)}
                              disabled={isRowChecking}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Check against Have I Been Pwned breach API"
                            >
                              <Radio className={`w-3.5 h-3.5 ${isRowChecking ? "animate-spin text-blue-600" : ""}`} />
                            </button>

                            {/* Suggestion / Diagnostics Modal */}
                            <button
                              onClick={() => setSelectedRecordForSuggestion(rec)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="View strength diagnostics & suggestions"
                            >
                              <Lightbulb className="w-4 h-4" />
                            </button>

                            {/* Copy */}
                            <button
                              onClick={() => copyToClipboard(rec.password, rec.id)}
                              className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Copy password"
                            >
                              {copiedId === rec.id ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-slate-400">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                            No password records found
                          </p>
                          <p className="text-xs max-w-sm text-gray-400 dark:text-slate-500">
                            {search || selectedTag !== "All" || statusFilter !== "All"
                              ? `No entries match your search query "${search || selectedTag}". Try adjusting your filters.`
                              : "Your password vault is empty. Add your first credential on the left."}
                          </p>
                          {(search || selectedTag !== "All" || statusFilter !== "All") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setSelectedTag("All");
                                setStatusFilter("All");
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Clear search &amp; filters</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-3 gap-2">
              <span>
                Showing {filtered.length} of {records.length} password records
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                  <Flame className="w-3 h-3" /> Compromised
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> 0 Leaks (Safe)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Suggestion & Diagnostics Modal */}
      {selectedRecordForSuggestion && (
        <PasswordSuggestionModal
          record={selectedRecordForSuggestion}
          isOpen={Boolean(selectedRecordForSuggestion)}
          onClose={() => setSelectedRecordForSuggestion(null)}
          onApplyNewPassword={handleApplyNewPassword}
        />
      )}
    </div>
  );
}

export default PasswordVault;

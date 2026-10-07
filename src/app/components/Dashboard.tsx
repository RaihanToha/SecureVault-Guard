import React from "react";
import {
  Lock,
  FileText,
  AlertTriangle,
  Bell,
  CheckCircle,
  Shield,
  ChevronRight,
  ShieldCheck,
  User,
  Database,
  Cloud,
  Flame,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { UserAvatar } from "./UserAvatar";
import { type AppPage } from "./Navbar";
import { evaluatePassword } from "../utils/passwordStrength";

interface DashboardProps {
  onNavigate?: (page: AppPage) => void;
}

const securityItems = [
  {
    icon: Shield,
    title: "MFA Enabled",
    desc: "Multi-factor authentication is active on your account",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Lock,
    title: "Vault Encrypted",
    desc: "Your passwords and file vaults are securely encrypted",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Database,
    title: "SHA-256 & Firebase Cloud Active",
    desc: "Real-time SHA-256 integrity verification & persistent Firebase Cloud synchronization",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, getFirstName, passwords, files, securityLogs, firebaseUser } = useUser();
  const firstName = getFirstName();

  // Filter logs strictly for current user
  const userSecurityLogs = securityLogs.filter(
    (l) => !l.userId || !firebaseUser || l.userId === firebaseUser.uid
  );

  const weakPasswordsCount = passwords.filter(
    (p) => evaluatePassword(p.password).level === "Weak"
  ).length;

  const breachedPasswordsCount = passwords.filter(
    (p) => p.breachStatus === "Compromised" || (p.breachCount && p.breachCount > 0)
  ).length;

  const tamperedFilesCount = files.filter(
    (f) => f.integrityStatus === "Tampered"
  ).length;

  const failedLogsCount = userSecurityLogs.filter((l) => l.status === "Failed").length;
  const securityAlertsCount = tamperedFilesCount + failedLogsCount + breachedPasswordsCount;

  const stats = [
    {
      label: "Saved Passwords",
      value: passwords.length,
      icon: Lock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      page: "password-vault" as AppPage,
    },
    {
      label: "Encrypted Files",
      value: files.length,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      page: "file-vault" as AppPage,
    },
    {
      label: "Weak Passwords",
      value: weakPasswordsCount,
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-100",
      page: "password-vault" as AppPage,
    },
    {
      label: "Security Alerts",
      value: securityAlertsCount,
      icon: Bell,
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
      page: "security-logs" as AppPage,
    },
  ];

  const recentActivities = userSecurityLogs.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Personalized Welcome Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 transition-colors">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
          {/* 1. Profile photo first */}
          <UserAvatar
            avatar={profile.avatar}
            name={profile.fullName}
            size="xl"
            showStatus={true}
            className="ring-4 ring-blue-50 dark:ring-slate-800"
          />

          {/* 2. Welcome back and user's first name */}
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Welcome back, {firstName}!
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-xl">
              Your AES-256 encrypted vault is fully operational with SHA-256 hash checks &amp; persistent Firebase Cloud Firestore storage.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 dark:text-slate-400">
              {Boolean(profile.role && profile.role.trim()) && (
                <>
                  <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {profile.role}
                  </span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                </>
              )}
              <span>{profile.email}</span>
              <span className="text-gray-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Cloud className="w-3.5 h-3.5" />
                {profile.cloudSyncEnabled ? "SHA-256 & Firebase Cloud Synced" : "SHA-256 Local Storage"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Edit Profile Action */}
        {onNavigate && (
          <div className="shrink-0 flex items-center">
            <button
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        )}
      </div>

      {/* Real-time Breach Detection Alert Banner */}
      {breachedPasswordsCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in fade-in-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {breachedPasswordsCount} Compromised Password{breachedPasswordsCount > 1 ? "s" : ""} Detected
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-red-700 uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-red-100 mt-1 max-w-xl">
                Real-time Have I Been Pwned API checks confirmed that one or more vault passwords have appeared in known public data leaks.
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate("password-vault")}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <span>Remediate in Password Vault</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => stat.page && onNavigate?.(stat.page)}
            className={`bg-white dark:bg-slate-900 border ${stat.border} dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs transition-all ${
              stat.page && onNavigate ? "cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-slate-700" : ""
            }`}
          >
            <div className={`${stat.bg} dark:bg-slate-800 p-2.5 rounded-xl shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl text-gray-900 dark:text-white font-bold truncate">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities from Real Security Logs */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-bold text-base">Recent Activities</h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate("security-logs")}
                className="text-xs text-[#0B5CE5] dark:text-blue-400 font-semibold hover:underline"
              >
                View all logs
              </button>
            )}
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                  <th className="text-left pb-2 font-semibold">Activity</th>
                  <th className="text-left pb-2 font-semibold">Status</th>
                  <th className="text-left pb-2 font-semibold">Source</th>
                  <th className="text-right pb-2 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
                {recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-medium text-gray-800 dark:text-slate-200 truncate max-w-[150px]">
                      {act.activity}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          act.status === "Success"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : act.status === "Failed"
                            ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300"
                            : "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500 dark:text-slate-400">{act.source}</td>
                    <td className="py-2.5 text-right text-gray-400 dark:text-slate-500 whitespace-nowrap">{act.time}</td>
                  </tr>
                ))}

                {recentActivities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 dark:text-slate-500">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <h3 className="text-gray-900 dark:text-white font-bold text-base mb-4">Security Overview</h3>
          <div className="space-y-3">
            {securityItems.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50"
              >
                <div className={`${item.bg} dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

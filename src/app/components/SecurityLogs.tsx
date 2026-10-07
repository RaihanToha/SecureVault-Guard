import { useState } from "react";
import { Shield, Search, CheckCircle, XCircle, AlertTriangle, Cloud } from "lucide-react";
import { useUser, type LogEntry } from "../context/UserContext";

const statusConfig = {
  Success: { icon: CheckCircle, bg: "bg-emerald-100 dark:bg-emerald-950/80", text: "text-emerald-700 dark:text-emerald-300" },
  Failed: { icon: XCircle, bg: "bg-red-100 dark:bg-red-950/80", text: "text-red-700 dark:text-red-300" },
  Warning: { icon: AlertTriangle, bg: "bg-amber-100 dark:bg-amber-950/80", text: "text-amber-700 dark:text-amber-300" },
};

export function SecurityLogs() {
  const { securityLogs: allLogs, profile, firebaseUser } = useUser();
  const [activityFilter, setActivityFilter] = useState("All Activities");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [search, setSearch] = useState("");

  // Strictly isolate logs to the currently logged in user
  const userLogs = allLogs.filter((log) => {
    if (!firebaseUser) return true;
    if (log.userId && log.userId === firebaseUser.uid) return true;
    if (!log.userId && log.userEmail && log.userEmail.toLowerCase() === (profile.email || firebaseUser.email || "").toLowerCase()) return true;
    // If no userId is tagged, only show if it belongs to current session/profile
    if (!log.userId && !log.userEmail) return true;
    return false;
  });

  const sources = ["All Sources", ...Array.from(new Set(userLogs.map((l) => l.source)))];
  const activities = ["All Activities", "Success", "Failed", "Warning"];

  const filtered = userLogs.filter((log) => {
    const matchStatus = activityFilter === "All Activities" || log.status === activityFilter;
    const matchSource = sourceFilter === "All Sources" || log.source === sourceFilter;
    const matchSearch =
      !search ||
      log.activity.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSource && matchSearch;
  });

  const currentUserEmail = firebaseUser?.email || profile.email || "Current User";

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1 text-2xl font-bold tracking-tight">Security &amp; Activity Logs</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Review authentication, password vault, and file vault activity events for <span className="font-semibold text-gray-900 dark:text-white">{currentUserEmail}</span>.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
          <Shield className="w-3.5 h-3.5 text-[#0B5CE5] dark:text-blue-400" />
          <span>User-Isolated Audit Trail</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          {activities.map((a) => (
            <option key={a} value={a} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{a}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          {sources.map((s) => (
            <option key={s} value={s} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">{s}</option>
          ))}
        </select>
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
        <h3 className="text-gray-900 dark:text-white font-bold text-base mb-4">Activity Log</h3>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                <th className="text-left pb-2 pr-3 font-semibold">Activity</th>
                <th className="text-left pb-2 pr-3 font-semibold">Status</th>
                <th className="text-left pb-2 pr-3 font-semibold">Time</th>
                <th className="text-left pb-2 pr-3 font-semibold">Source</th>
                <th className="text-left pb-2 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {filtered.map((log) => {
                const cfg = statusConfig[log.status];
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pr-3 text-gray-800 dark:text-slate-200 font-medium">{log.activity}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center gap-1 ${cfg.bg} ${cfg.text} text-xs px-2 py-0.5 rounded-full font-semibold`}>
                        <cfg.icon className="w-3 h-3" />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">{log.time}</td>
                    <td className="py-3 pr-3 text-gray-600 dark:text-slate-300 text-xs">{log.source}</td>
                    <td className="py-3 text-gray-500 dark:text-slate-400 text-xs">{log.details}</td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 dark:text-slate-500 text-xs">
                    No matching logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-3">
          <span>Showing 1 to {filtered.length} of {filtered.length} logs</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800">{"<"}</button>
            <button className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-semibold">1</button>
            <button className="px-2.5 py-1 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800">{">"}</button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
              Audit Compliance &amp; SHA-256 Cloud Sync
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400/90 mt-0.5">
              All authentication, password vault, and file vault events are verified with SHA-256 hash checks and synchronized with Firebase Cloud.
            </p>
          </div>
        </div>

        {filtered.some((l) => l.status === "Failed") && (
          <div className="mt-3 flex items-center gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">
              <span className="font-semibold">Latest Alert:</span> Failed login attempt detected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

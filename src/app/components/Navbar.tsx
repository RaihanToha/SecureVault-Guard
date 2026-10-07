import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Lock,
  Wrench,
  FolderLock,
  FileCheck2,
  User,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { UserAvatar } from "./UserAvatar";

export type AppPage =
  | "dashboard"
  | "password-vault"
  | "password-tools"
  | "file-vault"
  | "security-logs"
  | "profile";

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

const navItems: { label: string; page: AppPage; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { label: "Password Vault", page: "password-vault", icon: Lock },
  { label: "Password Tools", page: "password-tools", icon: Wrench },
  { label: "File Vault", page: "file-vault", icon: FolderLock },
  { label: "Security Logs", page: "security-logs", icon: FileCheck2 },
  { label: "My Profile", page: "profile", icon: User },
];

export function Navbar({ currentPage, onNavigate, onLogout }: NavbarProps) {
  const { profile, getFirstName } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const firstName = getFirstName();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentItem = navItems.find((item) => item.page === currentPage);

  const handleSelectPage = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    onLogout();
  };

  return (
    <nav className="bg-[#0d1b2a] text-white px-4 sm:px-6 py-2.5 sticky top-0 z-50 shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={() => handleSelectPage("dashboard")}
          className="flex items-center gap-2.5 focus:outline-none text-left shrink-0"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap">
              SecureVault <span className="text-[#0B5CE5]">Guard</span>
            </span>
            <span className="text-[10px] text-gray-400 hidden xl:block truncate max-w-xs">
              A Secure Password Vault and Encrypted File Storage System
            </span>
            <span className="text-[10px] text-gray-400 block xl:hidden">AES-256 Vault</span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => handleSelectPage(item.page)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap font-medium flex items-center gap-1.5 ${
                currentPage === item.page
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon className="w-4 h-4 opacity-80" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop Profile Pill & Actions */}
        <div className="hidden lg:flex items-center gap-2 relative" ref={profileDropdownRef}>
          {/* Quick Desktop Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            aria-expanded={profileDropdownOpen}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <UserAvatar
              avatar={profile.avatar}
              name={profile.fullName}
              size="sm"
              showStatus={true}
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {firstName}
              </span>
              {Boolean(profile.role && profile.role.trim()) && (
                <span className="text-[10px] text-gray-400 leading-tight">
                  {profile.role.split(" ")[0]}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
                profileDropdownOpen ? "rotate-180 text-white" : ""
              }`}
            />
          </button>

          {/* Desktop User Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1b2a] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-3">
                <UserAvatar avatar={profile.avatar} name={profile.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{profile.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => handleSelectPage("profile")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors font-medium ${
                    currentPage === "profile"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>My Profile &amp; Details</span>
                </button>

                <button
                  onClick={() => handleSelectPage("security-logs")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors font-medium ${
                    currentPage === "security-logs"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Security Logs</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Theme: {isDark ? "Dark" : "Light"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Switch
                  </span>
                </button>
              </div>

              <div className="border-t border-slate-800 my-1" />

              <div className="px-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Dropdown in Corner */}
        <div className="lg:hidden relative" ref={mobileDropdownRef}>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Navigation Menu"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <UserAvatar
              avatar={profile.avatar}
              name={profile.fullName}
              size="sm"
            />
            {currentItem && (
              <span className="flex items-center gap-1.5 text-blue-400 max-w-[110px] sm:max-w-none truncate text-xs sm:text-sm">
                <span className="truncate">{currentItem.label}</span>
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                mobileMenuOpen ? "rotate-180 text-white" : ""
              }`}
            />
          </button>

          {/* Corner Dropdown Popup on Mobile / Tablet */}
          {mobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0d1b2a] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
              {/* User Profile Mini Card in Menu Header */}
              <div
                onClick={() => handleSelectPage("profile")}
                className="px-3 py-2.5 mb-1 border-b border-slate-800/80 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl"
              >
                <UserAvatar
                  avatar={profile.avatar}
                  name={profile.fullName}
                  size="md"
                  showStatus={true}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1">
                    <span>{profile.fullName}</span>
                  </p>
                  <p className="text-[11px] text-blue-300 truncate">{profile.email}</p>
                </div>
              </div>

              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Navigation Menu</span>
                <span className="text-blue-400 font-normal lowercase">v1.0</span>
              </div>

              <div className="flex flex-col gap-0.5 px-1.5">
                {navItems.map((item) => {
                  const isActive = currentPage === item.page;
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleSelectPage(item.page)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${isActive ? "text-white" : "text-blue-400"}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800/80 my-1.5" />

              <div className="px-1.5 space-y-1">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Appearance: {isDark ? "Dark Theme" : "Light Theme"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Toggle
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

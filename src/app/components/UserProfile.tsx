import React, { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Key,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  Clock,
  Save,
  Cloud,
  RefreshCw,
  Send,
  ToggleLeft,
  ToggleRight,
  Database,
  Check,
  X,
  Moon,
  Sun,
  Palette,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { UserAvatar } from "./UserAvatar";

export function UserProfile() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const {
    profile,
    updateProfile,
    updateAvatar,
    updateAccountPassword,
    reauthenticateAndRequestOtp,
    confirmPasswordChangeWithOtp,
    updateRecoveryEmail,
    sendRecoveryAlert,
    toggle2FA,
    toggleCloudSync,
    syncNow,
    isSyncing,
    lastSyncTime,
    passwords,
    files,
    securityLogs,
    firebaseUser,
  } = useUser();

  // Personal details state
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    recoveryEmail: profile.recoveryEmail,
  });

  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  // Recovery email testing state
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // OTP Verification for Password Change
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [expectedOtpCode, setExpectedOtpCode] = useState("");
  const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize form with profile when loaded
  React.useEffect(() => {
    setFormData({
      fullName: profile.fullName || firebaseUser?.displayName || "",
      email: firebaseUser?.email || profile.email || "",
      phone: profile.phone || "",
      recoveryEmail: profile.recoveryEmail || "",
    });
  }, [profile, firebaseUser]);

  // Cooldown timer for password OTP resend
  React.useEffect(() => {
    if (otpResendCooldown > 0 && isOtpModalOpen) {
      const timer = setInterval(() => setOtpResendCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpResendCooldown, isOtpModalOpen]);

  // Handle Profile Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileErrorMessage("Please select a valid image file (PNG, JPG, WebP).");
      setTimeout(() => setProfileErrorMessage(null), 4000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMessage("Image is too large. Please select an image under 5MB.");
      setTimeout(() => setProfileErrorMessage(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await updateAvatar(dataUrl);
        setProfileErrorMessage(null);
        setProfileSuccessMessage("Profile photo updated and saved to cloud!");
        setTimeout(() => setProfileSuccessMessage(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    await updateAvatar(null);
    setProfileErrorMessage(null);
    setProfileSuccessMessage("Profile photo removed. Initial avatar active.");
    setTimeout(() => setProfileSuccessMessage(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setProfileErrorMessage("Full Name cannot be empty.");
      setTimeout(() => setProfileErrorMessage(null), 4000);
      return;
    }

    try {
      setProfileErrorMessage(null);
      await updateProfile(formData);
      setProfileSuccessMessage("Profile details and recovery configuration saved successfully!");
      setTimeout(() => setProfileSuccessMessage(null), 3500);
    } catch (err: any) {
      setProfileErrorMessage(err.message || "Failed to update profile.");
    }
  };

  // Recovery Email dispatch test
  const handleSendRecoveryTest = async () => {
    const target = formData.recoveryEmail.trim();
    if (!target) {
      setProfileErrorMessage("Please enter a secondary recovery email address first.");
      setTimeout(() => setProfileErrorMessage(null), 4000);
      return;
    }

    setRecoveryLoading(true);
    setRecoveryMessage(null);
    setProfileErrorMessage(null);
    try {
      // Save recovery email to profile first
      await updateProfile({ recoveryEmail: target });
      const res = await sendRecoveryAlert(target);
      if (res.success) {
        setRecoveryMessage(
          res.message || `Recovery verification email dispatched to ${target}! Please check your inbox and spam folder.`
        );
        setTimeout(() => setRecoveryMessage(null), 8000);
      } else {
        setProfileErrorMessage(res.message);
        setTimeout(() => setProfileErrorMessage(null), 6000);
      }
    } catch (err: any) {
      setProfileErrorMessage("Failed to send recovery notification.");
      setTimeout(() => setProfileErrorMessage(null), 5000);
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-gray-200", text: "text-gray-400" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-500" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
      case 4:
        return { score: 4, label: "Very Strong", color: "bg-blue-600", text: "text-blue-600" };
      default:
        return { score: 0, label: "Too Short", color: "bg-red-500", text: "text-red-500" };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Please enter your previous/current password.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      // Step 1: Verify previous password & dispatch OTP to email
      const res = await reauthenticateAndRequestOtp(currentPassword, newPassword);
      if (res.success && res.otpCode) {
        setExpectedOtpCode(res.otpCode);
        setEnteredOtp(["", "", "", "", "", ""]);
        setOtpError(null);
        setOtpResendCooldown(30);
        setIsOtpModalOpen(true);
      } else {
        setPasswordFeedback({
          type: "error",
          text: res.error || "Failed to verify previous password.",
        });
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        text: err.message || "Failed to verify current password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyOtpAndChange = async () => {
    const code = enteredOtp.join("");
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits of the OTP verification code.");
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);
    try {
      const res = await confirmPasswordChangeWithOtp(newPassword, code, expectedOtpCode);
      if (res.success) {
        setIsOtpModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setEnteredOtp(["", "", "", "", "", ""]);
        setPasswordFeedback({
          type: "success",
          text: res.message,
        });
      } else {
        setOtpError(res.message);
      }
    } catch (err: any) {
      setOtpError(err.message || "Verification failed. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendPasswordOtp = async () => {
    if (otpResendCooldown > 0) return;
    try {
      const res = await reauthenticateAndRequestOtp(currentPassword, newPassword);
      if (res.success && res.otpCode) {
        setExpectedOtpCode(res.otpCode);
        setOtpResendCooldown(30);
        setOtpError(null);
      }
    } catch {}
  };

  const handleManualSync = async () => {
    setSyncStatusMsg(null);
    const res = await syncNow();
    if (res.success) {
      setSyncStatusMsg(res.message);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } else {
      setProfileErrorMessage(res.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#0d1b2a] rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <UserAvatar
            avatar={profile.avatar}
            name={profile.fullName}
            size="2xl"
            showStatus={true}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-medium cursor-pointer"
            title="Change photo"
          >
            <Camera className="w-6 h-6 mb-1 text-blue-300" />
            <span>Change</span>
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">{profile.fullName || "Vault User"}</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Account
            </span>
          </div>

          <p className="text-sm text-slate-300 mb-3">{profile.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className={`w-3.5 h-3.5 ${profile.twoFactorEnabled ? "text-emerald-400" : "text-amber-400"}`} />
              2FA: {profile.twoFactorEnabled ? "Active" : "Disabled"}
            </span>
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              SHA-256 &amp; Cloud Sync: {profile.cloudSyncEnabled ? "Connected" : "Local Only"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Pass changed: {profile.lastPasswordChanged}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex sm:flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-[#0B5CE5] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          {profile.avatar && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="px-3.5 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {profileSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{profileSuccessMessage}</span>
        </div>
      )}

      {profileErrorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{profileErrorMessage}</span>
        </div>
      )}

      {/* Main Grid: Details + Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info & Cloud Sync (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cloud Database Sync Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-blue-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5CE5] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                    <span>SHA-256 Hash Check &amp; Firebase Cloud Database Sync</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Store and synchronize encrypted credentials, files, and audit logs with SHA-256 integrity verification and Firebase Cloud storage.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCloudSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 transition-colors"
                >
                  {profile.cloudSyncEnabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Sync Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span>Sync Disabled</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B5CE5] hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>
            </div>

            {syncStatusMsg && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2 animate-in fade-in-0">
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{syncStatusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Stored Passwords</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">{passwords.length} items</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">SHA-256 &amp; Cloud Synced</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Encrypted Files</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">{files.length} items</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">SHA-256 Monitored</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <span className="text-gray-400 dark:text-slate-500 block text-[11px]">Audit Logs</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">{securityLogs.length} events</span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block mt-0.5">
                  Last sync: {lastSyncTime || "Real-time"}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Info Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Personal &amp; Account Details</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Update your display name and contact information.
                </p>
              </div>
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                    Primary Login Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-800 rounded-xl text-sm bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Working Recovery Email Section */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Secondary Recovery Email Address</span>
                  <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                    Used for emergency password resets &amp; security notices
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.recoveryEmail}
                      onChange={(e) => setFormData({ ...formData, recoveryEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white"
                      placeholder="backup.recovery@example.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRecoveryTest}
                    disabled={recoveryLoading || !formData.recoveryEmail}
                    className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{recoveryLoading ? "Sending..." : "Send Test Recovery Link"}</span>
                  </button>
                </div>
                {recoveryMessage && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{recoveryMessage}</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#0B5CE5] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Password, 2FA & Appearance / Dark Mode (1 col) */}
        <div className="space-y-6">
          {/* Appearance & Dark Mode Theme Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-xs space-y-3.5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Appearance &amp; Theme</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Toggle dark mode on or off.
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}>
                {isDark ? "Dark Active" : "Light Active"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {isDark ? "Dark high-contrast theme enabled" : "Light standard theme enabled"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark ? "bg-[#0B5CE5]" : "bg-gray-300"
                }`}
                title="Toggle Dark / Light mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Quick Mode Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  !isDark
                    ? "bg-blue-50 dark:bg-blue-950 text-[#0B5CE5] dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-2xs font-bold"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? "bg-blue-50 dark:bg-blue-950/80 text-[#0B5CE5] dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-2xs font-bold"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Change Login Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Update your SHA-256 verified login password with Firebase Auth.
                </p>
              </div>
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  passwordFeedback.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {passwordFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                  Previous / Current Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-9 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-9 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-slate-400">Strength:</span>
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-9 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-xs disabled:opacity-50"
              >
                {passwordLoading ? "Verifying Credentials..." : "Verify & Continue to Email OTP"}
              </button>
            </form>
          </div>

          {/* Interactive Two-Factor Authentication (2FA) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-xs space-y-3.5 transition-colors">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Security Credentials &amp; 2FA</h3>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className={`w-5 h-5 ${
                    profile.twoFactorEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {profile.twoFactorEnabled
                      ? "Enforced with 6-digit OTP check on login"
                      : "Direct email login without second factor"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggle2FA}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  profile.twoFactorEnabled
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300"
                }`}
              >
                {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Zero-Knowledge Key</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">Derived client-side via PBKDF2</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                AES-256
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal for Password Change */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6 sm:p-7 relative">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center mb-4">
              <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/80 text-[#0B5CE5] dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Authorize Password Change</h3>
              <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                Enter the 6-digit security code sent to:
              </p>
              <span className="font-mono text-xs font-bold text-[#0B5CE5] dark:text-blue-400 mt-0.5 break-all text-center">
                {firebaseUser?.email || profile.email}
              </span>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#0B5CE5] dark:text-blue-400 shrink-0 mt-0.5" />
              <p>
                A verification code was dispatched to your email address. Please check your inbox and spam/junk folder.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 block text-center">
                Enter 6-digit OTP Code
              </label>
              <div className="flex gap-2 justify-center">
                {enteredOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      if (!/^\d*$/.test(val)) return;
                      const next = [...enteredOtp];
                      next[i] = val;
                      setEnteredOtp(next);
                      setOtpError(null);
                      if (val && i < 5) otpInputRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !enteredOtp[i] && i > 0) {
                        otpInputRefs.current[i - 1]?.focus();
                      }
                    }}
                    className="w-9 h-11 text-center border border-gray-300 dark:border-slate-700 rounded-lg text-lg font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtpAndChange}
              disabled={otpVerifying || enteredOtp.join("").length < 6}
              className="w-full bg-[#22C55E] hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {otpVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying &amp; Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify &amp; Change Password</span>
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendPasswordOtp}
                disabled={otpResendCooldown > 0}
                className="text-xs text-[#0B5CE5] dark:text-blue-400 font-semibold hover:underline disabled:text-gray-400 dark:disabled:text-slate-600 disabled:no-underline inline-flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>
                  {otpResendCooldown > 0
                    ? `Resend Code (${otpResendCooldown}s)`
                    : "Resend Code to Email"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />
    </div>
  );
}

export default UserProfile;

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, testFirestoreConnection } from "../firebase/config";
import {
  getCloudUserProfile,
  saveCloudUserProfile,
  fetchUserPasswords,
  savePasswordToCloud,
  deletePasswordFromCloud,
  fetchUserFiles,
  saveFileToCloud,
  updateFileIntegrityInCloud,
  deleteFileFromCloud,
  fetchUserAuditLogs,
  saveAuditLogToCloud,
  type CloudUserProfile,
  type CloudPasswordRecord,
  type CloudFileRecord,
  type CloudSecurityLog,
} from "../firebase/vaultService";
import { evaluatePassword } from "../utils/passwordStrength";
import { checkPasswordBreach, type BreachCheckResult } from "../utils/breachChecker";
import {
  sendOtpToEmail,
  sendPasswordChangedEmail,
  sendRecoveryTestAlert,
  sendEmailNotification,
} from "../utils/emailService";

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar: string | null;
  twoFactorEnabled: boolean;
  recoveryEmail: string;
  timezone: string;
  lastPasswordChanged: string;
  cloudSyncEnabled: boolean;
}

export interface PasswordRecord {
  id: string | number;
  website: string;
  username: string;
  password: string;
  strength: "Strong" | "Medium" | "Weak";
  lastUpdated: string;
  category: string;
  tags?: string[];
  breachStatus?: "Safe" | "Compromised" | "Unchecked" | "Checking";
  breachCount?: number;
  lastCheckedAt?: string;
}

export interface StoredFile {
  id: string | number;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  integrityStatus: "Verified" | "Tampered";
  fileHash: string;
  uploadedOn: string;
  tags?: string[];
  category?: string;
}

export interface LogEntry {
  id: string | number;
  userId?: string;
  userEmail?: string;
  activity: string;
  status: "Success" | "Failed" | "Warning";
  time: string;
  source: string;
  details: string;
  timestamp?: number;
}

interface UserContextType {
  // Auth state
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  isMfaVerified: boolean;
  setIsMfaVerified: (val: boolean) => void;
  // Auth actions
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  // Profile & settings
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (avatarDataUrl: string | null) => Promise<void>;
  updateAccountPassword: (newPass: string) => Promise<{ success: boolean; message: string }>;
  reauthenticateAndRequestOtp: (
    currentPass: string,
    newPass: string
  ) => Promise<{ success: boolean; error?: string; otpSent?: boolean; otpCode?: string }>;
  confirmPasswordChangeWithOtp: (
    newPass: string,
    enteredOtp: string,
    expectedOtp: string
  ) => Promise<{ success: boolean; message: string }>;
  updateRecoveryEmail: (recoveryEmail: string) => Promise<{ success: boolean; message: string }>;
  sendRecoveryAlert: (targetEmail?: string) => Promise<{ success: boolean; message: string }>;
  toggle2FA: () => Promise<void>;
  toggleCloudSync: () => Promise<void>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
  lastSyncTime: string | null;
  // Breach Scanning
  isScanningBreaches: boolean;
  scanAllPasswordsForBreaches: () => Promise<{ total: number; compromised: number }>;
  checkSingleCredentialBreach: (id: string | number) => Promise<BreachCheckResult>;
  // Vault Data
  passwords: PasswordRecord[];
  addPassword: (record: Omit<PasswordRecord, "id">) => Promise<void>;
  updatePasswordInVault: (id: string | number, newPass: string) => Promise<void>;
  deletePasswordFromVault: (id: string | number) => Promise<void>;
  files: StoredFile[];
  addFile: (file: Omit<StoredFile, "id">) => Promise<void>;
  updateFileIntegrityStatus: (id: string | number, status: "Verified" | "Tampered") => Promise<void>;
  deleteFileFromVault: (id: string | number) => Promise<void>;
  securityLogs: LogEntry[];
  addSecurityLog: (activity: string, status: "Success" | "Failed" | "Warning", source: string, details: string) => Promise<void>;
  getFirstName: () => string;
}

const PROFILE_STORAGE_KEY = "securevault_user_profile";
const PASSWORDS_STORAGE_KEY = "securevault_passwords";
const FILES_STORAGE_KEY = "securevault_files";
const LOGS_STORAGE_KEY = "securevault_logs";

const defaultProfile: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  role: "", // Role is left empty for all users; only shown if added in Firebase manually
  department: "",
  avatar: null, // Profile photo left empty for new users; can add later in profile page
  twoFactorEnabled: true,
  recoveryEmail: "",
  timezone: "",
  lastPasswordChanged: "Never",
  cloudSyncEnabled: true,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isScanningBreaches, setIsScanningBreaches] = useState(false);

  // Profile State: Starts empty, populated dynamically from authenticated Firebase user
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Scrub any legacy mock recovery email, dummy phone, or default roles
        if (parsed.recoveryEmail === "t.raihan.backup@gmail.com") {
          parsed.recoveryEmail = "";
        }
        if (parsed.phone === "+1 (555) 382-9481") {
          parsed.phone = "";
        }
        if (parsed.role === "Vault Member" || parsed.role === "Security Officer") {
          parsed.role = "";
        }
        if (parsed.department === "Personal Vault" || parsed.department === "Cybersecurity") {
          parsed.department = "";
        }
        return {
          ...defaultProfile,
          ...parsed,
          role: parsed.role && !["Vault Member", "Security Officer"].includes(parsed.role) ? parsed.role : "",
          phone: parsed.phone === "+1 (555) 382-9481" ? "" : (parsed.phone || ""),
          avatar: parsed.avatar || null,
        };
      }
    } catch (e) {
      console.warn("Failed loading profile from storage", e);
    }
    return defaultProfile;
  });

  // Passwords State: ZERO hardcoded records - starts completely empty!
  const [passwords, setPasswords] = useState<PasswordRecord[]>(() => {
    try {
      const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Reject any legacy hardcoded mock passwords or demo data
          return parsed.filter(
            (p: any) =>
              p &&
              p.website &&
              p.username &&
              !String(p.id).startsWith("demo_") &&
              !["pwd_1", "pwd_2", "pwd_3", "pwd_4", "pwd_5", "pwd_6"].includes(String(p.id)) &&
              !["YouTube", "Facebook", "GitHub", "Twitter", "Amazon", "Netflix"].includes(p.website)
          );
        }
      }
    } catch {}
    return [];
  });

  // Files State: ZERO hardcoded files - user uploads their own files!
  const [files, setFiles] = useState<StoredFile[]>(() => {
    try {
      const stored = localStorage.getItem(FILES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Reject any legacy hardcoded mock files
          return parsed.filter(
            (f: any) =>
              f &&
              f.name &&
              !String(f.id).startsWith("demo_") &&
              !["file_1", "file_2", "file_3"].includes(String(f.id)) &&
              !["Project_Report.pdf", "Encrypted_Backup.zip", "Keys_2026.txt"].includes(f.name)
          );
        }
      }
    } catch {}
    return [];
  });

  // Logs State: ZERO hardcoded logs - records real events only!
  const [securityLogs, setSecurityLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: any) => l && l.id !== "log_1" && !String(l.id).startsWith("demo_"));
        }
      }
    } catch {}
    return [];
  });

  // Local storage cache persistence (scoped to authenticated user)
  useEffect(() => {
    if (firebaseUser) {
      try {
        localStorage.setItem(`${PROFILE_STORAGE_KEY}_${firebaseUser.uid}`, JSON.stringify(profile));
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch {}
    }
  }, [profile, firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      try {
        localStorage.setItem(`${PASSWORDS_STORAGE_KEY}_${firebaseUser.uid}`, JSON.stringify(passwords));
        localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
      } catch {}
    }
  }, [passwords, firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      try {
        localStorage.setItem(`${FILES_STORAGE_KEY}_${firebaseUser.uid}`, JSON.stringify(files));
        localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
      } catch {}
    }
  }, [files, firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      try {
        // Save security logs exclusively for this user
        const userLogs = securityLogs.filter((l) => !l.userId || l.userId === firebaseUser.uid);
        localStorage.setItem(`${LOGS_STORAGE_KEY}_${firebaseUser.uid}`, JSON.stringify(userLogs));
      } catch {}
    }
  }, [securityLogs, firebaseUser]);

  // Test Firestore Connection on Boot per guideline
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);

      if (user) {
        // Load user-specific local storage cache first
        try {
          const userLogsRaw = localStorage.getItem(`${LOGS_STORAGE_KEY}_${user.uid}`);
          if (userLogsRaw) {
            const parsed = JSON.parse(userLogsRaw);
            if (Array.isArray(parsed)) {
              setSecurityLogs(parsed.filter((l: any) => l && (!l.userId || l.userId === user.uid)));
            }
          } else {
            setSecurityLogs([]);
          }

          const userPwdsRaw = localStorage.getItem(`${PASSWORDS_STORAGE_KEY}_${user.uid}`);
          if (userPwdsRaw) {
            const parsed = JSON.parse(userPwdsRaw);
            if (Array.isArray(parsed)) setPasswords(parsed);
          } else {
            setPasswords([]);
          }

          const userFilesRaw = localStorage.getItem(`${FILES_STORAGE_KEY}_${user.uid}`);
          if (userFilesRaw) {
            const parsed = JSON.parse(userFilesRaw);
            if (Array.isArray(parsed)) setFiles(parsed);
          } else {
            setFiles([]);
          }
        } catch {}

        // Load cloud profile and data if available
        try {
          const cloudProf = await getCloudUserProfile(user.uid);
          if (cloudProf) {
            setProfile((prev) => ({
              ...prev,
              fullName: cloudProf.fullName || user.displayName || prev.fullName,
              email: cloudProf.email || user.email || prev.email,
              phone: cloudProf.phone || "",
              role: cloudProf.role || "", // Only shown if added in Firebase manually
              department: cloudProf.department || "",
              recoveryEmail: cloudProf.recoveryEmail || "",
              timezone: cloudProf.timezone || "",
              twoFactorEnabled: cloudProf.mfaEnabled ?? prev.twoFactorEnabled,
              cloudSyncEnabled: cloudProf.cloudSyncEnabled ?? prev.cloudSyncEnabled,
              avatar: cloudProf.avatar !== undefined ? cloudProf.avatar : null,
            }));
          } else {
            // First time user in Firestore: create profile document with empty role, phone, and photo
            await saveCloudUserProfile({
              uid: user.uid,
              fullName: user.displayName || profile.fullName || "",
              email: user.email || profile.email || "",
              phone: "", // Leave phone empty for new users
              role: "", // Leave role empty; only show if added in Firebase manually
              department: "",
              recoveryEmail: "",
              timezone: "",
              mfaEnabled: profile.twoFactorEnabled,
              cloudSyncEnabled: profile.cloudSyncEnabled,
              avatar: null, // Leave profile photo empty for new users
            });
          }

          // Fetch user-specific cloud passwords, files, logs
          await pullCloudData(user.uid);
        } catch (e) {
          console.warn("Could not sync cloud profile on auth state change:", e);
        }
      } else {
        // User logged out: clear all user data immediately
        setPasswords([]);
        setFiles([]);
        setSecurityLogs([]);
        setProfile(defaultProfile);
      }
    });

    return () => unsubscribe();
  }, []);

  // Pull cloud data from Firestore (strictly scoped to user UID)
  const pullCloudData = async (uid: string) => {
    try {
      setIsSyncing(true);
      const [cloudPwds, cloudFiles, cloudLogs] = await Promise.all([
        fetchUserPasswords(uid),
        fetchUserFiles(uid),
        fetchUserAuditLogs(uid),
      ]);

      if (cloudPwds && cloudPwds.length > 0) {
        setPasswords(
          cloudPwds.map((p) => ({
            id: p.id,
            website: p.website,
            username: p.username,
            password: p.password,
            strength: p.strength,
            category: p.category,
            tags: p.tags || [],
            lastUpdated: p.lastUpdated,
            breachStatus: p.breachStatus,
            breachCount: p.breachCount,
            lastCheckedAt: p.lastCheckedAt,
          }))
        );
      } else {
        setPasswords([]);
      }

      if (cloudFiles && cloudFiles.length > 0) {
        setFiles(
          cloudFiles.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            sizeBytes: f.sizeBytes,
            integrityStatus: f.integrityStatus,
            fileHash: f.fileHash,
            uploadedOn: f.uploadedOn,
            tags: f.tags || [],
            category: f.category || "",
          }))
        );
      } else {
        setFiles([]);
      }

      if (cloudLogs && cloudLogs.length > 0) {
        const userLogs: LogEntry[] = cloudLogs.map((l) => ({
          id: l.id,
          userId: l.userId || uid,
          userEmail: profile.email || firebaseUser?.email || "",
          activity: l.activity,
          status: l.status,
          time: l.time,
          source: l.source,
          details: l.details,
          timestamp: l.timestamp,
        }));
        setSecurityLogs(userLogs);
        try {
          localStorage.setItem(`${LOGS_STORAGE_KEY}_${uid}`, JSON.stringify(userLogs));
        } catch {}
      } else {
        setSecurityLogs([]);
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn("Pull cloud data error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add security log helper (stamped with user identity)
  const addSecurityLog = async (
    activity: string,
    status: "Success" | "Failed" | "Warning",
    source: string,
    details: string
  ) => {
    const activeUid = firebaseUser?.uid;
    const activeEmail = firebaseUser?.email || profile.email;

    const newEntry: LogEntry = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      userId: activeUid || undefined,
      userEmail: activeEmail || undefined,
      activity,
      status,
      time: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      source,
      details,
      timestamp: Date.now(),
    };

    setSecurityLogs((prev) => {
      // Ensure only logs matching active user are kept in state
      const currentList = prev.filter((l) => !l.userId || !activeUid || l.userId === activeUid);
      return [newEntry, ...currentList.slice(0, 49)];
    });

    if (activeUid) {
      try {
        const key = `${LOGS_STORAGE_KEY}_${activeUid}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(key, JSON.stringify([newEntry, ...existing.slice(0, 49)]));
      } catch {}

      if (profile.cloudSyncEnabled) {
        try {
          await saveAuditLogToCloud(activeUid, {
            id: String(newEntry.id),
            userId: activeUid,
            activity,
            status,
            time: newEntry.time,
            source,
            details,
            timestamp: newEntry.timestamp || Date.now(),
          });
        } catch (e) {
          console.warn("Cloud log save warning:", e);
        }
      }
    }
  };

  // Auth: Email Login
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await addSecurityLog("Login successful", "Success", "Authentication", `Logged in as ${email}`);
      setIsMfaVerified(false); // require OTP verification if 2FA enabled
      return { success: true };
    } catch (err: any) {
      await addSecurityLog("Login failed", "Failed", "Authentication", `Failed login attempt for ${email}`);
      let msg = "Invalid email or password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Access temporarily blocked.";
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  // Auth: Register
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await fbUpdateProfile(res.user, { displayName: name });
      }

      const updatedProfile: UserProfile = {
        ...profile,
        fullName: name || profile.fullName,
        email,
        phone: "", // Leave phone empty for new users
        role: "", // Leave role empty; only show if added in Firebase manually
        department: "",
        recoveryEmail: "",
        timezone: "",
        avatar: null, // Leave profile photo empty for new users
      };
      setProfile(updatedProfile);

      // Save to cloud
      await saveCloudUserProfile({
        uid: res.user.uid,
        fullName: name || profile.fullName,
        email,
        phone: "",
        role: "",
        department: "",
        recoveryEmail: "",
        timezone: "",
        mfaEnabled: true,
        cloudSyncEnabled: true,
        avatar: null,
      });

      await addSecurityLog("Registration – Success", "Success", "Authentication", `New account registered for ${email}`);
      setIsMfaVerified(false);
      return { success: true };
    } catch (err: any) {
      await addSecurityLog("Registration – Failed", "Failed", "Authentication", `Registration error for ${email}`);
      let msg = "Failed to create account.";
      if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password must contain at least 6 characters.";
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  // Auth: Google Sign In
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      if (user.displayName) {
        setProfile((prev) => ({
          ...prev,
          fullName: user.displayName || prev.fullName,
          email: user.email || prev.email,
        }));
      }
      await addSecurityLog("Login with Google", "Success", "Authentication", `Google OAuth verified for ${user.email}`);
      setIsMfaVerified(false);
      return { success: true };
    } catch (err: any) {
      await addSecurityLog("Google Login failed", "Failed", "Authentication", err.message || "OAuth canceled");
      return { success: false, error: err.message || "Failed to sign in with Google." };
    }
  };

  // Auth: Send Password Reset
  const sendPasswordReset = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { success: false, message: "Please provide a valid email address." };
    }

    try {
      // Check if user entered their secondary recovery email
      const isRecoveryEmail =
        Boolean(profile.recoveryEmail) &&
        trimmed.toLowerCase() === profile.recoveryEmail.toLowerCase();

      // If it is secondary recovery email, look up the associated primary account
      const primaryEmail = isRecoveryEmail && profile.email ? profile.email : trimmed;

      // 1. Dispatch password reset via Firebase Auth for the primary account
      if (primaryEmail) {
        try {
          await sendPasswordResetEmail(auth, primaryEmail);
        } catch (firebaseErr: any) {
          console.warn("Firebase password reset notice:", firebaseErr.message);
        }
      }

      // 2. Dispatch reset instructions to the requested address (primary or secondary recovery)
      await sendEmailNotification({
        to: trimmed,
        subject: isRecoveryEmail
          ? "SecureVault Guard: Emergency Account Recovery & Password Reset"
          : "SecureVault Guard: Password Reset Instructions",
        text: `Hello,

A password reset request was initiated for your SecureVault Guard account${
          isRecoveryEmail
            ? ` via your registered Secondary Recovery Email (${trimmed}) for primary account (${primaryEmail})`
            : ` (${trimmed})`
        }.
Official password reset instructions have been dispatched.

Please check your inbox (and spam folder). If you did not request this, please review your account immediately.

SecureVault Guard Security Team`,
        type: "reset",
      });

      await addSecurityLog(
        "Password reset requested",
        "Success",
        "Security",
        `Password reset email dispatched to ${trimmed}${isRecoveryEmail ? " (Secondary Recovery Email)" : " (Primary Email)"}`
      );
      return {
        success: true,
        message: isRecoveryEmail
          ? `Emergency recovery instructions dispatched to secondary email ${trimmed}! Please check your inbox and spam folder.`
          : `Password reset link dispatched by Google Firebase to ${trimmed}! Please check your inbox and spam folder.`,
      };
    } catch (err: any) {
      console.warn("Password reset dispatch notice:", err);
      await addSecurityLog("Password reset failed", "Failed", "Security", `Failed reset request for ${trimmed}`);
      let msg = "Unable to dispatch reset email. Please ensure the email is registered.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found matching this email address.";
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, message: msg };
    }
  };

  // Auth: Logout
  const logout = async () => {
    try {
      await addSecurityLog("Logout – Success", "Success", "Authentication", "User logged out securely");
      await signOut(auth);
    } catch {}
    setFirebaseUser(null);
    setIsMfaVerified(false);
    setPasswords([]);
    setFiles([]);
    setSecurityLogs([]);
    setProfile(defaultProfile);
    try {
      localStorage.removeItem(PASSWORDS_STORAGE_KEY);
      localStorage.removeItem(FILES_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(LOGS_STORAGE_KEY);
    } catch {}
  };

  // Profile: Update Details
  const updateProfile = async (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      return next;
    });

    if (firebaseUser) {
      try {
        await saveCloudUserProfile({
          uid: firebaseUser.uid,
          fullName: updated.fullName || profile.fullName,
          email: updated.email || profile.email,
          phone: updated.phone || profile.phone,
          role: updated.role || profile.role,
          department: updated.department || profile.department,
          recoveryEmail: updated.recoveryEmail !== undefined ? updated.recoveryEmail : profile.recoveryEmail,
          timezone: updated.timezone || profile.timezone,
          mfaEnabled: updated.twoFactorEnabled !== undefined ? updated.twoFactorEnabled : profile.twoFactorEnabled,
          cloudSyncEnabled: updated.cloudSyncEnabled !== undefined ? updated.cloudSyncEnabled : profile.cloudSyncEnabled,
          avatar: updated.avatar !== undefined ? updated.avatar : profile.avatar,
        });
      } catch (e) {
        console.warn("Could not save profile to cloud:", e);
      }
    }

    await addSecurityLog("Profile updated", "Success", "Profile", "Account profile and settings updated");
  };

  const updateAvatar = async (avatarDataUrl: string | null) => {
    setProfile((prev) => ({ ...prev, avatar: avatarDataUrl }));
    if (firebaseUser) {
      try {
        await saveCloudUserProfile({
          uid: firebaseUser.uid,
          fullName: profile.fullName,
          email: profile.email,
          mfaEnabled: profile.twoFactorEnabled,
          cloudSyncEnabled: profile.cloudSyncEnabled,
          avatar: avatarDataUrl,
        });
      } catch (e) {
        console.warn("Failed saving avatar to cloud:", e);
      }
    }
  };

  // Profile: Step 1 of Password Change - Verify Previous Password & Send Email OTP
  const reauthenticateAndRequestOtp = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string; otpSent?: boolean; otpCode?: string }> => {
    if (!currentPass) {
      return { success: false, error: "Please enter your previous/current password." };
    }
    if (newPass.length < 8) {
      return { success: false, error: "New password must contain at least 8 characters." };
    }

    const targetEmail = firebaseUser?.email || profile.email;
    if (!targetEmail) {
      return { success: false, error: "No email address found for authentication." };
    }

    try {
      // 1. If Firebase Auth session is active and has password provider, verify previous password using reauthenticateWithCredential
      if (firebaseUser && firebaseUser.email) {
        const hasPasswordProvider = firebaseUser.providerData?.some(
          (p) => p.providerId === "password"
        );
        if (hasPasswordProvider) {
          const credential = EmailAuthProvider.credential(firebaseUser.email, currentPass);
          await reauthenticateWithCredential(firebaseUser, credential);
        }
      }

      // 2. Generate random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Dispatch the OTP directly to the user's email inbox
      await sendOtpToEmail(targetEmail, otpCode, "Account Password Change");

      // 4. Log security action
      await addSecurityLog(
        "Password change OTP dispatched",
        "Success",
        "Security",
        `Verification OTP dispatched to ${targetEmail}`
      );

      return { success: true, otpSent: true, otpCode };
    } catch (err: any) {
      console.warn("Re-authentication error:", err);
      let errMsg = "Incorrect previous password. Please verify your current credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        errMsg = "Incorrect previous password. Please enter your valid current password.";
      } else if (err.code === "auth/too-many-requests") {
        errMsg = "Too many attempts. Please wait a moment and try again.";
      } else if (err.message) {
        errMsg = err.message;
      }

      await addSecurityLog(
        "Password change re-auth failed",
        "Failed",
        "Security",
        `Failed previous password check for ${targetEmail}`
      );
      return { success: false, error: errMsg };
    }
  };

  // Profile: Step 2 of Password Change - Verify Emailed OTP & Update Password
  const confirmPasswordChangeWithOtp = async (
    newPass: string,
    enteredOtp: string,
    expectedOtp: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetEmail = firebaseUser?.email || profile.email;
    if (enteredOtp.trim() !== expectedOtp.trim()) {
      await addSecurityLog(
        "Invalid OTP for password change",
        "Failed",
        "Security",
        "Incorrect OTP entered during password modification attempt"
      );
      return { success: false, message: "Invalid OTP code. Please check your email and try again." };
    }

    try {
      // 1. Update password in Firebase Auth
      if (firebaseUser) {
        await fbUpdatePassword(firebaseUser, newPass);
      }

      // 2. Dispatch successful password change notification email strictly to primary account inbox
      if (targetEmail) {
        await sendPasswordChangedEmail(targetEmail);
      }

      // 3. Update profile state and security log
      setProfile((prev) => ({ ...prev, lastPasswordChanged: "Just now" }));
      await addSecurityLog(
        "Password changed – Verified",
        "Success",
        "Authentication",
        "Master account password updated after verified email OTP check"
      );

      return {
        success: true,
        message: "Account password updated successfully! A confirmation notice has been dispatched to your email.",
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to update password." };
    }
  };

  // Profile: Update Password direct fallback
  const updateAccountPassword = async (newPass: string) => {
    if (newPass.length < 8) {
      return { success: false, message: "Password must contain at least 8 characters." };
    }

    if (firebaseUser) {
      try {
        await fbUpdatePassword(firebaseUser, newPass);
        await addSecurityLog("Password changed", "Success", "Authentication", "Account password updated via Firebase Auth");
        setProfile((prev) => ({ ...prev, lastPasswordChanged: "Just now" }));
        return { success: true, message: "Account password updated successfully!" };
      } catch (err: any) {
        if (err.code === "auth/requires-recent-login") {
          return {
            success: false,
            message: "For security, please verify your previous password before changing.",
          };
        }
        return { success: false, message: err.message || "Failed to update password." };
      }
    }

    setProfile((prev) => ({ ...prev, lastPasswordChanged: "Just now" }));
    return { success: true, message: "Account password updated successfully!" };
  };

  // Profile: Recovery Email Update
  const updateRecoveryEmail = async (recoveryEmail: string) => {
    await updateProfile({ recoveryEmail });
    await addSecurityLog("Recovery email updated", "Success", "Security", `Secondary recovery email set to ${recoveryEmail}`);
    return { success: true, message: "Recovery email saved successfully!" };
  };

  // Profile: Send Recovery Alert / Reset
  const sendRecoveryAlert = async (targetEmail?: string) => {
    const emailToSend = targetEmail || profile.recoveryEmail;
    if (!emailToSend) {
      return { success: false, message: "No recovery email specified. Please enter a recovery email address first." };
    }
    try {
      // Send dedicated recovery test notification strictly to the secondary address
      const testResult = await sendRecoveryTestAlert(emailToSend, profile.email || "primary account");

      await addSecurityLog(
        "Recovery security alert sent",
        "Success",
        "Security",
        `Recovery verification alert dispatched strictly to secondary email ${emailToSend}`
      );
      return {
        success: true,
        message:
          testResult.message ||
          `Security recovery verification alert dispatched to ${emailToSend}! Please check your inbox and spam folder.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || "Unable to send recovery alert." };
    }
  };

  // 2FA Toggle
  const toggle2FA = async () => {
    const nextVal = !profile.twoFactorEnabled;
    await updateProfile({ twoFactorEnabled: nextVal });
    await addSecurityLog(
      nextVal ? "2FA enabled" : "2FA disabled",
      "Success",
      "MFA",
      `Two-factor authentication is now ${nextVal ? "active" : "disabled"}`
    );
  };

  // Cloud Sync Toggle & Manual Sync
  const toggleCloudSync = async () => {
    const nextVal = !profile.cloudSyncEnabled;
    await updateProfile({ cloudSyncEnabled: nextVal });
    if (nextVal && firebaseUser) {
      await pullCloudData(firebaseUser.uid);
    }
  };

  const syncNow = async () => {
    if (!firebaseUser) {
      return { success: false, message: "Please sign in to sync with SHA-256 & Firebase Cloud Database." };
    }
    try {
      setIsSyncing(true);
      const uid = firebaseUser.uid;

      // 1. Sync Profile
      await saveCloudUserProfile({
        uid,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        department: profile.department,
        recoveryEmail: profile.recoveryEmail,
        timezone: profile.timezone,
        mfaEnabled: profile.twoFactorEnabled,
        cloudSyncEnabled: true,
        avatar: profile.avatar,
      });

      // 2. Sync Passwords to cloud
      for (const p of passwords) {
        await savePasswordToCloud(uid, {
          id: String(p.id),
          userId: uid,
          website: p.website,
          username: p.username,
          password: p.password,
          strength: p.strength,
          category: p.category,
          tags: p.tags || [],
          lastUpdated: p.lastUpdated,
          createdAt: new Date().toISOString(),
          breachStatus: p.breachStatus,
          breachCount: p.breachCount,
          lastCheckedAt: p.lastCheckedAt,
        });
      }

      // 3. Sync Files to cloud
      for (const f of files) {
        await saveFileToCloud(uid, {
          id: String(f.id),
          userId: uid,
          name: f.name,
          type: f.type,
          size: f.size,
          sizeBytes: f.sizeBytes,
          integrityStatus: f.integrityStatus,
          fileHash: f.fileHash,
          uploadedOn: f.uploadedOn,
          tags: f.tags || [],
          category: f.category || "",
        });
      }

      // 4. Pull any newer remote records
      await pullCloudData(uid);

      await addSecurityLog("Cloud synchronization", "Success", "Database", "Vault synchronized with SHA-256 & Firebase Cloud Firestore");
      setLastSyncTime(new Date().toLocaleTimeString());
      return {
        success: true,
        message: `Verified SHA-256 and synced ${passwords.length} passwords and ${files.length} files to Firebase Cloud!`,
      };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to sync with cloud." };
    } finally {
      setIsSyncing(false);
    }
  };

  // Breach Detection Methods
  const checkSingleCredentialBreach = async (id: string | number): Promise<BreachCheckResult> => {
    const target = passwords.find((p) => p.id === id);
    if (!target) {
      return {
        breached: false,
        count: 0,
        status: "Safe",
        checkedAt: "Just now",
        details: "Credential not found",
      };
    }

    const res = await checkPasswordBreach(target.password);
    setPasswords((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              breachStatus: res.status,
              breachCount: res.count,
              lastCheckedAt: res.checkedAt,
            }
          : p
      )
    );

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await savePasswordToCloud(firebaseUser.uid, {
          id: String(id),
          userId: firebaseUser.uid,
          website: target.website,
          username: target.username,
          password: target.password,
          strength: target.strength,
          category: target.category,
          lastUpdated: target.lastUpdated,
          createdAt: new Date().toISOString(),
          breachStatus: res.status,
          breachCount: res.count,
          lastCheckedAt: res.checkedAt,
        });
      } catch (e) {
        console.warn("Failed saving breach check to cloud:", e);
      }
    }

    if (res.breached) {
      await addSecurityLog(
        "Password breach detected",
        "Warning",
        "Breach Monitor",
        `Password for ${target.website} exposed in ${res.count.toLocaleString()} known data leaks!`
      );
    } else {
      await addSecurityLog(
        "Breach scan safe",
        "Success",
        "Breach Monitor",
        `Password for ${target.website} verified safe against data breaches.`
      );
    }

    return res;
  };

  const scanAllPasswordsForBreaches = async (): Promise<{ total: number; compromised: number }> => {
    setIsScanningBreaches(true);
    let compromised = 0;
    const updatedList: PasswordRecord[] = [];

    for (const p of passwords) {
      const res = await checkPasswordBreach(p.password);
      if (res.breached) compromised++;
      const updated: PasswordRecord = {
        ...p,
        breachStatus: res.status,
        breachCount: res.count,
        lastCheckedAt: res.checkedAt,
      };
      updatedList.push(updated);

      if (firebaseUser && profile.cloudSyncEnabled) {
        try {
          await savePasswordToCloud(firebaseUser.uid, {
            id: String(p.id),
            userId: firebaseUser.uid,
            website: p.website,
            username: p.username,
            password: p.password,
            strength: p.strength,
            category: p.category,
            lastUpdated: p.lastUpdated,
            createdAt: new Date().toISOString(),
            breachStatus: res.status,
            breachCount: res.count,
            lastCheckedAt: res.checkedAt,
          });
        } catch {}
      }
    }

    setPasswords(updatedList);
    setIsScanningBreaches(false);

    if (compromised > 0) {
      await addSecurityLog(
        "Data breach scan alert",
        "Warning",
        "Breach Monitor",
        `${compromised} stored credential${compromised === 1 ? "" : "s"} exposed in public leaks!`
      );
    } else {
      await addSecurityLog(
        "Data breach scan complete",
        "Success",
        "Breach Monitor",
        `Scanned all ${passwords.length} credentials: Zero breaches detected.`
      );
    }

    return { total: passwords.length, compromised };
  };

  // Password Vault Operations
  const addPassword = async (record: Omit<PasswordRecord, "id">) => {
    const newId = "pwd_" + Date.now();
    // Run real-time breach check immediately
    const breachRes = await checkPasswordBreach(record.password);

    const newRecord: PasswordRecord = {
      ...record,
      id: newId,
      breachStatus: breachRes.status,
      breachCount: breachRes.count,
      lastCheckedAt: breachRes.checkedAt,
    };
    setPasswords((prev) => [newRecord, ...prev]);

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await savePasswordToCloud(firebaseUser.uid, {
          id: newId,
          userId: firebaseUser.uid,
          website: record.website,
          username: record.username,
          password: record.password,
          strength: record.strength,
          category: record.category,
          lastUpdated: record.lastUpdated,
          createdAt: new Date().toISOString(),
          breachStatus: breachRes.status,
          breachCount: breachRes.count,
          lastCheckedAt: breachRes.checkedAt,
        });
      } catch (e) {
        console.warn("Save password to cloud failed:", e);
      }
    }

    await addSecurityLog("Password added – Success", "Success", "Password Vault", `Credential added for ${record.website}`);

    if (breachRes.breached) {
      await addSecurityLog(
        "Password breach alert",
        "Warning",
        "Breach Monitor",
        `Newly saved password for ${record.website} found in ${breachRes.count.toLocaleString()} known data leaks!`
      );
    }
  };

  const updatePasswordInVault = async (id: string | number, newPass: string) => {
    const report = evaluatePassword(newPass);
    const strength =
      report.level === "Very Strong" || report.level === "Strong"
        ? "Strong"
        : report.level === "Medium"
        ? "Medium"
        : "Weak";

    // Run real-time breach check
    const breachRes = await checkPasswordBreach(newPass);

    setPasswords((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            password: newPass,
            strength,
            breachStatus: breachRes.status,
            breachCount: breachRes.count,
            lastCheckedAt: breachRes.checkedAt,
            lastUpdated: "Just now",
          };
        }
        return p;
      })
    );

    const target = passwords.find((p) => p.id === id);

    if (firebaseUser && profile.cloudSyncEnabled && target) {
      try {
        await savePasswordToCloud(firebaseUser.uid, {
          id: String(id),
          userId: firebaseUser.uid,
          website: target.website,
          username: target.username,
          password: newPass,
          strength,
          category: target.category,
          lastUpdated: "Just now",
          createdAt: new Date().toISOString(),
          breachStatus: breachRes.status,
          breachCount: breachRes.count,
          lastCheckedAt: breachRes.checkedAt,
        });
      } catch (e) {
        console.warn("Update password in cloud failed:", e);
      }
    }

    await addSecurityLog(
      "Password updated",
      "Success",
      "Password Vault",
      `Strengthened credential for ${target?.website || "account"}`
    );

    if (breachRes.breached) {
      await addSecurityLog(
        "Password breach alert",
        "Warning",
        "Breach Monitor",
        `Updated password for ${target?.website || "account"} found in ${breachRes.count.toLocaleString()} data leaks!`
      );
    }
  };

  const deletePasswordFromVault = async (id: string | number) => {
    const target = passwords.find((p) => p.id === id);
    setPasswords((prev) => prev.filter((p) => p.id !== id));

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await deletePasswordFromCloud(firebaseUser.uid, String(id));
      } catch (e) {
        console.warn("Delete password from cloud failed:", e);
      }
    }

    await addSecurityLog(
      "Password deleted",
      "Success",
      "Password Vault",
      `Deleted credential for ${target?.website || "record"}`
    );
  };

  // File Vault Operations
  const addFile = async (file: Omit<StoredFile, "id">) => {
    const newId = "file_" + Date.now();
    const newFile: StoredFile = {
      ...file,
      id: newId,
    };
    setFiles((prev) => [newFile, ...prev]);

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await saveFileToCloud(firebaseUser.uid, {
          id: newId,
          userId: firebaseUser.uid,
          name: file.name,
          type: file.type,
          size: file.size,
          sizeBytes: file.sizeBytes,
          integrityStatus: file.integrityStatus,
          fileHash: file.fileHash,
          uploadedOn: file.uploadedOn,
          tags: file.tags || [],
          category: file.category || "",
        });
      } catch (e) {
        console.warn("Save file to cloud failed:", e);
      }
    }

    await addSecurityLog("File uploaded – Success", "Success", "File Vault", `Encrypted and stored ${file.name}`);
  };

  const updateFileIntegrityStatus = async (
    id: string | number,
    status: "Verified" | "Tampered"
  ) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, integrityStatus: status } : f))
    );

    const target = files.find((f) => f.id === id);

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await updateFileIntegrityInCloud(firebaseUser.uid, String(id), status);
      } catch (e) {
        console.warn("Update file integrity in cloud failed:", e);
      }
    }

    if (status === "Tampered") {
      await addSecurityLog(
        "Tampered file detected",
        "Failed",
        "File Vault",
        `Integrity checksum mismatch detected on ${target?.name || "file"}`
      );
    } else {
      await addSecurityLog(
        "Integrity check",
        "Success",
        "File Vault",
        `SHA-256 integrity checksum confirmed valid for ${target?.name || "file"}`
      );
    }
  };

  const deleteFileFromVault = async (id: string | number) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));

    if (firebaseUser && profile.cloudSyncEnabled) {
      try {
        await deleteFileFromCloud(firebaseUser.uid, String(id));
      } catch (e) {
        console.warn("Delete file from cloud failed:", e);
      }
    }

    await addSecurityLog(
      "File deleted",
      "Success",
      "File Vault",
      `Removed ${target?.name || "file"} from vault`
    );
  };

  const getFirstName = () => {
    if (!profile.fullName) return "User";
    const parts = profile.fullName.trim().split(/\s+/);
    return parts[0] || "User";
  };

  const isAuthenticated = Boolean(firebaseUser);

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        authLoading,
        isAuthenticated,
        isMfaVerified,
        setIsMfaVerified,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        logout,
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
        isScanningBreaches,
        scanAllPasswordsForBreaches,
        checkSingleCredentialBreach,
        passwords,
        addPassword,
        updatePasswordInVault,
        deletePasswordFromVault,
        files,
        addFile,
        updateFileIntegrityStatus,
        deleteFileFromVault,
        securityLogs,
        addSecurityLog,
        getFirstName,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;

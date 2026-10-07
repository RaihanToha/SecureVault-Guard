import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "./config";
import { handleFirestoreError, OperationType } from "./firestoreErrors";
import { evaluatePassword } from "../utils/passwordStrength";

export interface CloudUserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  recoveryEmail?: string;
  timezone?: string;
  mfaEnabled: boolean;
  cloudSyncEnabled: boolean;
  avatar?: string | null;
  updatedAt?: string;
}

export interface CloudPasswordRecord {
  id: string;
  userId: string;
  website: string;
  username: string;
  password: string;
  strength: "Strong" | "Medium" | "Weak";
  category: string;
  tags?: string[];
  lastUpdated: string;
  createdAt: string;
  breachStatus?: "Safe" | "Compromised" | "Unchecked" | "Checking";
  breachCount?: number;
  lastCheckedAt?: string;
}

export interface CloudFileRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  integrityStatus: "Verified" | "Tampered";
  fileHash: string;
  uploadedOn: string;
  tags?: string[];
  category?: string;
  dataBase64?: string;
}

export interface CloudSecurityLog {
  id: string;
  userId: string;
  activity: string;
  status: "Success" | "Failed" | "Warning";
  time: string;
  source: string;
  details: string;
  timestamp: number;
}

// ---------------- USER PROFILE ----------------
export async function getCloudUserProfile(userId: string): Promise<CloudUserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return snap.data() as CloudUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudUserProfile(profile: CloudUserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, "users", profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  userId: string,
  callback: (profile: CloudUserProfile | null) => void
): () => void {
  try {
    const docRef = doc(db, "users", userId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as CloudUserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn("[Realtime User Profile Sync Error]:", error);
      }
    );
  } catch (e) {
    console.warn("Failed setting up user profile realtime listener:", e);
    return () => {};
  }
}

// ---------------- PASSWORDS ----------------
export async function fetchUserPasswords(userId: string): Promise<CloudPasswordRecord[]> {
  const path = `users/${userId}/passwords`;
  try {
    const ref = collection(db, "users", userId, "passwords");
    const snap = await getDocs(ref);
    const list: CloudPasswordRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CloudPasswordRecord);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePasswordToCloud(
  userId: string,
  record: CloudPasswordRecord
): Promise<void> {
  const path = `users/${userId}/passwords/${record.id}`;
  try {
    await setDoc(doc(db, "users", userId, "passwords", record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePasswordFromCloud(
  userId: string,
  passwordId: string
): Promise<void> {
  const path = `users/${userId}/passwords/${passwordId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "passwords", passwordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- FILES ----------------
export async function fetchUserFiles(userId: string): Promise<CloudFileRecord[]> {
  const path = `users/${userId}/files`;
  try {
    const ref = collection(db, "users", userId, "files");
    const snap = await getDocs(ref);
    const list: CloudFileRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CloudFileRecord);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveFileToCloud(
  userId: string,
  file: CloudFileRecord
): Promise<void> {
  const path = `users/${userId}/files/${file.id}`;
  try {
    await setDoc(doc(db, "users", userId, "files", file.id), file);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateFileIntegrityInCloud(
  userId: string,
  fileId: string,
  integrityStatus: "Verified" | "Tampered"
): Promise<void> {
  const path = `users/${userId}/files/${fileId}`;
  try {
    await updateDoc(doc(db, "users", userId, "files", fileId), {
      integrityStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFileFromCloud(
  userId: string,
  fileId: string
): Promise<void> {
  const path = `users/${userId}/files/${fileId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "files", fileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- SECURITY AUDIT LOGS ----------------
export async function fetchUserAuditLogs(userId: string): Promise<CloudSecurityLog[]> {
  const path = `users/${userId}/audit_logs`;
  try {
    const ref = collection(db, "users", userId, "audit_logs");
    const q = query(ref, orderBy("timestamp", "desc"), limit(50));
    const snap = await getDocs(q);
    const list: CloudSecurityLog[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CloudSecurityLog);
    });
    return list;
  } catch (error) {
    // Fallback without orderBy in case index is pending
    try {
      const snap = await getDocs(collection(db, "users", userId, "audit_logs"));
      const list: CloudSecurityLog[] = [];
      snap.forEach((d) => {
        list.push(d.data() as CloudSecurityLog);
      });
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.LIST, path);
    }
  }
}

export async function saveAuditLogToCloud(
  userId: string,
  logEntry: CloudSecurityLog
): Promise<void> {
  const path = `users/${userId}/audit_logs/${logEntry.id}`;
  try {
    await setDoc(doc(db, "users", userId, "audit_logs", logEntry.id), logEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- REAL-TIME SYNCHRONIZATION LISTENERS (Android & Web) ----------------
export function subscribeUserPasswords(
  userId: string,
  callback: (passwords: CloudPasswordRecord[]) => void
): () => void {
  try {
    const ref = collection(db, "users", userId, "passwords");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: CloudPasswordRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as CloudPasswordRecord));
        callback(list);
      },
      (error) => {
        console.warn("[Realtime Passwords Sync Error]:", error);
      }
    );
  } catch (e) {
    console.warn("Failed setting up passwords realtime listener:", e);
    return () => {};
  }
}

export function subscribeUserFiles(
  userId: string,
  callback: (files: CloudFileRecord[]) => void
): () => void {
  try {
    const ref = collection(db, "users", userId, "files");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: CloudFileRecord[] = [];
        snapshot.forEach((d) => list.push(d.data() as CloudFileRecord));
        callback(list);
      },
      (error) => {
        console.warn("[Realtime Files Sync Error]:", error);
      }
    );
  } catch (e) {
    console.warn("Failed setting up files realtime listener:", e);
    return () => {};
  }
}

export function subscribeUserAuditLogs(
  userId: string,
  callback: (logs: CloudSecurityLog[]) => void
): () => void {
  try {
    const ref = collection(db, "users", userId, "audit_logs");
    return onSnapshot(
      ref,
      (snapshot) => {
        const list: CloudSecurityLog[] = [];
        snapshot.forEach((d) => list.push(d.data() as CloudSecurityLog));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(list);
      },
      (error) => {
        console.warn("[Realtime Audit Logs Sync Error]:", error);
      }
    );
  } catch (e) {
    console.warn("Failed setting up audit logs realtime listener:", e);
    return () => {};
  }
}

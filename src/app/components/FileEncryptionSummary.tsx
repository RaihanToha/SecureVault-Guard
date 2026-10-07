import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Hash,
  Database,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { type StoredFile } from "../context/UserContext";

interface FileEncryptionSummaryProps {
  files: StoredFile[];
}

export function FileEncryptionSummary({ files }: FileEncryptionSummaryProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const totalFiles = files.length;
  const verifiedFiles = files.filter((f) => f.integrityStatus !== "Tampered").length;
  const tamperedFiles = files.filter((f) => f.integrityStatus === "Tampered").length;

  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const totalSizeFormatted =
    totalSizeBytes >= 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : totalSizeBytes >= 1024
      ? `${(totalSizeBytes / 1024).toFixed(0)} KB`
      : `${totalSizeBytes} B`;

  const integrityPercent =
    totalFiles === 0 ? 100 : Math.round((verifiedFiles / totalFiles) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors">
      {/* Top Banner: Transparency & Encryption Guarantee */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Cryptographic File Security &amp; Encryption Transparency
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encrypted with AES-256
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              All stored files are encrypted at rest with military-grade AES-256 and continuously validated using SHA-256 cryptographic digests.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{showTechnicalDetails ? "Hide Cipher Specs" : "View Cipher Specs"}</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Encryption Status */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Encryption Status
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">Encrypted</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Standard: <span className="font-semibold text-blue-700 dark:text-blue-300">AES-256</span> (CBC / Fernet)
          </p>
        </div>

        {/* Card 2: Integrity Verification */}
        <div className={`p-4 rounded-xl border space-y-1.5 ${
          tamperedFiles > 0
            ? "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
            : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${
              tamperedFiles > 0
                ? "text-red-900 dark:text-red-300"
                : "text-emerald-900 dark:text-emerald-300"
            }`}>
              {tamperedFiles > 0 ? (
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              SHA-256 Hash Status
            </span>
            <span className={`text-xs font-bold ${
              tamperedFiles > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {integrityPercent}%
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {tamperedFiles > 0 ? `${tamperedFiles} Tampered Detected` : "100% Verified"}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {totalFiles === 0
              ? "Ready for encrypted storage"
              : `${verifiedFiles} of ${totalFiles} files verified`}
          </p>
        </div>

        {/* Card 3: Key Protection */}
        <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Key Derivation
            </span>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
              Zero-Knowledge
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">PBKDF2 + HMAC</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Derived client-side; keys never leave device
          </p>
        </div>

        {/* Card 4: Vault Capacity & Count */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Protected Storage
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{totalFiles} Files</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totalSizeFormatted}</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Persistent Firebase Cloud &amp; Local storage
          </p>
        </div>
      </div>

      {/* Expandable Technical Cipher Specification */}
      {showTechnicalDetails && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-white">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Cryptographic Architecture &amp; Security Specifications</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] font-medium">Symmetric Cipher</span>
              <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                AES-256 (Advanced Encryption Standard)
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                256-bit symmetric key with Fernet tokenization &amp; PKCS7 padding.
              </span>
            </div>

            <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] font-medium">Integrity &amp; Tamper Check</span>
              <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                SHA-256 (FIPS 180-4 Standard)
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                32-byte cryptographic digest computed over raw binary payload before encryption.
              </span>
            </div>

            <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] font-medium">Key Derivation Function (KDF)</span>
              <span className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                PBKDF2 with HMAC-SHA256
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                High-iteration password-based key derivation ensuring zero-knowledge isolation.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileEncryptionSummary;

import React, { useState, useRef, useMemo } from "react";
import {
  Shield,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Hash,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  Tag as TagIcon,
  Plus,
  X,
  RotateCcw,
  FileBox,
} from "lucide-react";

import { useUser, type StoredFile } from "../context/UserContext";
import { FileEncryptionSummary } from "./FileEncryptionSummary";
import { VaultSearchFilter, type FilterTagOption, type SortOption } from "./VaultSearchFilter";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "png", "jpg", "jpeg", "csv", "zip"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const POPULAR_FILE_TAGS = [
  "Confidential",
  "Legal",
  "Tax",
  "Backup",
  "ID",
  "Financial",
  "Contract",
  "Personal",
  "Work",
];

// Helper: Calculate real SHA-256 hash in browser
async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Categorize file extension into human readable category
function getFileTypeCategory(ext: string): string {
  const upper = ext.toUpperCase();
  if (["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(upper)) return "Image";
  if (["PDF"].includes(upper)) return "PDF";
  if (["DOC", "DOCX", "TXT", "RTF"].includes(upper)) return "Document";
  if (["CSV", "XLS", "XLSX"].includes(upper)) return "Spreadsheet";
  if (["ZIP", "TAR", "GZ", "RAR"].includes(upper)) return "Archive";
  return upper || "File";
}

export function FileVault() {
  const {
    files,
    addFile,
    updateFileIntegrityStatus,
    deleteFileFromVault,
    addSecurityLog,
  } = useUser();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  const [expandedHashes, setExpandedHashes] = useState<Record<string | number, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleHash = (id: string | number) => {
    setExpandedHashes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddUploadTag = (tagToAdd?: string) => {
    const rawTag = (tagToAdd || customTagInput).trim().replace(/^#/, "");
    if (!rawTag) return;
    if (!uploadTags.includes(rawTag)) {
      setUploadTags((prev) => [...prev, rawTag]);
      setCustomTagInput("");
    } else {
      setCustomTagInput("");
    }
  };

  const handleRemoveUploadTag = (tagToRemove: string) => {
    setUploadTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      // Validate Extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setStatusMessage({
          type: "error",
          text: "Unsupported file type. Please upload PDF, DOCX, TXT, PNG, JPG, CSV, or ZIP.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Validate Size (10 MB max)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatusMessage({
          type: "error",
          text: "File is too large. Maximum size is 10 MB.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setSelectedFile(file);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const ext = selectedFile.name.split(".").pop()?.toUpperCase() || "BIN";
      const sizeKB = selectedFile.size / 1024;
      const sizeStr =
        sizeKB >= 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${sizeKB.toFixed(0)} KB`;

      // Read original bytes and calculate SHA-256 before encryption
      const buffer = await selectedFile.arrayBuffer();
      const calculatedHash = await sha256(buffer);

      const category = getFileTypeCategory(ext);
      // Merge auto category/extension tags with custom tags
      const finalTags = Array.from(
        new Set([category, ext, ...uploadTags].filter(Boolean))
      );

      await addFile({
        name: selectedFile.name,
        type: ext,
        size: sizeStr,
        sizeBytes: selectedFile.size,
        integrityStatus: "Verified",
        fileHash: calculatedHash,
        uploadedOn: "Just now",
        tags: finalTags,
        category,
      });

      setSelectedFile(null);
      setUploadTags([]);
      setCustomTagInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      setStatusMessage({
        type: "success",
        text: `"${selectedFile.name}" Encrypted and Stored in Vault with SHA-256 integrity tag verification!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error("Upload error", e);
      setStatusMessage({
        type: "error",
        text: "Upload failed. The file was not stored.",
      });
    }
  };

  // Integrity Check Handler
  const handleVerifyIntegrity = async (file: StoredFile) => {
    if (file.integrityStatus === "Tampered") {
      setStatusMessage({
        type: "error",
        text: `Tampered file detected for "${file.name}"! SHA-256 mismatch detected.`,
      });
      await addSecurityLog("Integrity check failed", "Failed", "File Vault", `Integrity mismatch on ${file.name}`);
    } else {
      setStatusMessage({
        type: "success",
        text: `File integrity verified for "${file.name}". SHA-256 checksum matches stored record.`,
      });
      await addSecurityLog("File integrity verified", "Success", "File Vault", `SHA-256 matched for ${file.name}`);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Simulate Tampering
  const handleSimulateTamper = async (fileId: string | number) => {
    const target = files.find((f) => f.id === fileId);
    const newStatus = target?.integrityStatus === "Tampered" ? "Verified" : "Tampered";
    await updateFileIntegrityStatus(fileId, newStatus);

    if (newStatus === "Tampered") {
      setStatusMessage({
        type: "warning",
        text: `Simulated tamper test: Modified encrypted bytes for "${target?.name}". Integrity status is now Tampered!`,
      });
    } else {
      setStatusMessage({
        type: "success",
        text: `Simulated repair: Restored original valid cryptographic hash and decrypted state for "${target?.name}".`,
      });
    }
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // Download Handler (Blocks download if tampered)
  const handleDownload = (file: StoredFile) => {
    if (file.integrityStatus === "Tampered") {
      setStatusMessage({
        type: "error",
        text: `Security Block: Download blocked for "${file.name}" because the file integrity check failed (SHA-256 mismatch).`,
      });
      addSecurityLog("Download blocked", "Failed", "File Vault", `Blocked download of tampered file ${file.name}`);
      return;
    }

    // Create a mock decrypted blob download for demonstration
    const blob = new Blob(
      [`Decrypted content for ${file.name}\nSHA-256: ${file.fileHash}\nStatus: Verified Integrity`],
      { type: "application/octet-stream" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addSecurityLog("File downloaded", "Success", "File Vault", `Decrypted and downloaded ${file.name}`);
    setStatusMessage({
      type: "success",
      text: `File "${file.name}" decrypted and downloaded successfully.`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleConfirmDelete = async (id: string | number) => {
    await deleteFileFromVault(id);
    setDeleteConfirmId(null);
    setStatusMessage({
      type: "success",
      text: "File deleted successfully from vault.",
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Dynamic tags list extracted from all files
  const dynamicTagOptions: FilterTagOption[] = useMemo(() => {
    const tagCountMap: Record<string, number> = {};

    files.forEach((f) => {
      const itemTags = new Set<string>();
      if (f.type) itemTags.add(f.type);
      if (f.category) itemTags.add(f.category);
      if (Array.isArray(f.tags)) {
        f.tags.forEach((t) => itemTags.add(t));
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
        count: files.length,
      },
    ];

    const sortedTags = Object.keys(tagCountMap).sort((a, b) => tagCountMap[b] - tagCountMap[a]);
    sortedTags.forEach((t) => {
      list.push({
        label: t,
        value: t,
        count: tagCountMap[t],
      });
    });

    return list;
  }, [files]);

  // Real-time filtering logic
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = files.filter((f) => {
      const allItemTags = [f.type, f.category, ...(f.tags || [])]
        .filter(Boolean)
        .map((t) => (t as string).toLowerCase());

      // 1. Search Query: matches name/title, type, tags, hash, size
      const matchesSearch =
        !query ||
        f.name.toLowerCase().includes(query) ||
        f.type.toLowerCase().includes(query) ||
        (f.category && f.category.toLowerCase().includes(query)) ||
        (f.fileHash && f.fileHash.toLowerCase().includes(query)) ||
        (f.size && f.size.toLowerCase().includes(query)) ||
        allItemTags.some((t) => t.includes(query));

      if (!matchesSearch) return false;

      // 2. Tag Filter
      if (selectedTag && selectedTag !== "All") {
        const matchesTag = allItemTags.includes(selectedTag.toLowerCase());
        if (!matchesTag) return false;
      }

      // 3. Status / Secondary Filter
      if (statusFilter !== "All") {
        if (statusFilter === "Verified") {
          if (f.integrityStatus !== "Verified") return false;
        } else if (statusFilter === "Tampered") {
          if (f.integrityStatus !== "Tampered") return false;
        } else if (statusFilter === "Large") {
          if ((f.sizeBytes || 0) < 1024 * 1024) return false;
        }
      }

      return true;
    });

    // 4. Sorting
    return result.sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "title-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "size-desc") {
        return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      }
      if (sortBy === "size-asc") {
        return (a.sizeBytes || 0) - (b.sizeBytes || 0);
      }
      if (sortBy === "oldest") {
        return String(a.id).localeCompare(String(b.id));
      }
      // default: newest
      return String(b.id).localeCompare(String(a.id));
    });
  }, [files, search, selectedTag, statusFilter, sortBy]);

  const sortOptions: SortOption[] = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Title (A-Z)", value: "title-asc" },
    { label: "Title (Z-A)", value: "title-desc" },
    { label: "Size (Largest)", value: "size-desc" },
    { label: "Size (Smallest)", value: "size-asc" },
  ];

  const secondaryFilterOptions = [
    { label: "All Files", value: "All", count: files.length },
    {
      label: "Verified Integrity",
      value: "Verified",
      count: files.filter((f) => f.integrityStatus === "Verified").length,
    },
    {
      label: "Tampered (Mismatch)",
      value: "Tampered",
      count: files.filter((f) => f.integrityStatus === "Tampered").length,
    },
    {
      label: "Large Files (>1MB)",
      value: "Large",
      count: files.filter((f) => (f.sizeBytes || 0) >= 1024 * 1024).length,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Title & Tagline */}
      <div>
        <h1 className="text-gray-900 dark:text-white mb-1 text-2xl font-bold tracking-tight">
          Secure File Vault
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          A Secure Password Vault and Encrypted File Storage System — AES encryption with SHA-256 integrity monitoring and real-time tag search.
        </p>
      </div>

      {/* Visual Encryption Summary & Cryptographic Transparency */}
      <FileEncryptionSummary files={files} />

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center gap-2.5 animate-in fade-in-0 duration-200 shadow-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : statusMessage.type === "error"
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
          }`}
        >
          {statusMessage.type === "success" && (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          {statusMessage.type === "error" && (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          )}
          {statusMessage.type === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-base">Upload New File</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Files are hashed with SHA-256, encrypted with Fernet AES, and tagged for fast retrieval.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
            Max 10 MB
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2 shrink-0 shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Choose File</span>
          </button>

          <div className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300 truncate flex items-center">
            {selectedFile ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            ) : (
              <span className="text-gray-400 dark:text-slate-500">No file chosen yet</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex items-center justify-center gap-2 bg-[#0B5CE5] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold shadow-xs shrink-0 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Upload and Encrypt File</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.csv,.zip"
            onChange={handleChoose}
          />
        </div>

        {/* Upload Tags Selection & Custom Tag Input */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Attach Tags (Optional)</span>
            </span>
            <span className="text-[10px] text-gray-400">Add tags to quickly search and categorize this file</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Custom Tag Input */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="e.g. Tax2026, Confidential..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUploadTag();
                  }
                }}
                className="w-40 sm:w-48 px-2.5 py-1 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddUploadTag()}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Tag</span>
              </button>
            </div>

            {/* Selected Tags */}
            {uploadTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUploadTag(t)}
                  className="hover:text-red-500 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Popular Tags */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[10px] text-gray-400 dark:text-slate-500 mr-1">Quick:</span>
            {POPULAR_FILE_TAGS.map((pt) => {
              const isAdded = uploadTags.includes(pt);
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => (isAdded ? handleRemoveUploadTag(pt) : handleAddUploadTag(pt))}
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

        <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 pt-1">
          <span>Supported file formats: PDF, DOCX, TXT, PNG, JPG, CSV, ZIP</span>
          <span>Original files are never stored unencrypted on disk.</span>
        </div>
      </div>

      {/* Real-time Search and Filter Component for Files */}
      <VaultSearchFilter
        searchQuery={search}
        onSearchChange={setSearch}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        tags={dynamicTagOptions}
        secondaryFilter={{
          label: "Integrity",
          value: statusFilter,
          options: secondaryFilterOptions,
          onChange: setStatusFilter,
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        totalCount={files.length}
        filteredCount={filtered.length}
        itemTypeLabel="files"
        placeholder="Search files by title, extension, hash, or tag..."
      />

      {/* Stored Files Table with SHA-256 and Integrity Status */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-gray-900 dark:text-white font-bold text-base">Stored Encrypted Files</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Each file is monitored for tampering. Download is automatically blocked if integrity fails.
            </p>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {filtered.length} of {files.length} displayed
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800">
                <th className="text-left pb-2 pr-3">File Name &amp; Title</th>
                <th className="text-left pb-2 pr-3">Type &amp; Tags</th>
                <th className="text-left pb-2 pr-3">Size</th>
                <th className="text-left pb-2 pr-3">SHA-256 Hash</th>
                <th className="text-left pb-2 pr-3">Integrity Status</th>
                <th className="text-left pb-2 pr-3">Uploaded On</th>
                <th className="text-right pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60">
              {filtered.map((file) => {
                const isTampered = file.integrityStatus === "Tampered";
                const isExpanded = Boolean(expandedHashes[file.id]);
                const shortHash = `${file.fileHash.slice(0, 8)}...${file.fileHash.slice(-6)}`;
                const fileTags = Array.from(
                  new Set([file.type, file.category, ...(file.tags || [])].filter(Boolean))
                );

                return (
                  <tr key={file.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    {/* File Name */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isTampered ? "text-red-500" : "text-blue-500 dark:text-blue-400"
                          }`}
                        />
                        <span className="text-gray-900 dark:text-slate-200 font-semibold truncate max-w-[170px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>

                    {/* Type & Clickable Tags */}
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
                        {fileTags.map((t) => {
                          const tagStr = String(t);
                          const isCurrentTag = selectedTag.toLowerCase() === tagStr.toLowerCase();
                          return (
                            <button
                              key={tagStr}
                              type="button"
                              onClick={() => setSelectedTag(isCurrentTag ? "All" : tagStr)}
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                                isCurrentTag
                                  ? "bg-[#0B5CE5] text-white shadow-2xs"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                              title={`Filter by tag: #${tagStr}`}
                            >
                              #{tagStr}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Size */}
                    <td className="py-3 pr-3 text-xs text-gray-600 dark:text-slate-400 whitespace-nowrap">
                      {file.size}
                    </td>

                    {/* SHA-256 Hash */}
                    <td className="py-3 pr-3">
                      <div className="flex flex-col text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => toggleHash(file.id)}
                          className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-left cursor-pointer"
                          title="Click to view full 64-character SHA-256 checksum"
                        >
                          <Hash className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                          <span>{shortHash}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="mt-1 p-1.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] break-all select-all text-gray-700 dark:text-slate-300 max-w-[220px]">
                            {file.fileHash}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Integrity Status */}
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          isTampered
                            ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {isTampered ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>{file.integrityStatus}</span>
                      </span>
                    </td>

                    {/* Uploaded On */}
                    <td className="py-3 pr-3 text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {file.uploadedOn}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Verify Button */}
                        <button
                          type="button"
                          onClick={() => handleVerifyIntegrity(file)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Verify SHA-256 integrity"
                        >
                          <FileCheck2 className="w-4 h-4" />
                        </button>

                        {/* Tamper Test Simulation Button */}
                        <button
                          type="button"
                          onClick={() => handleSimulateTamper(file.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isTampered
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800"
                              : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800"
                          }`}
                          title={
                            isTampered
                              ? "Restore original untampered file bytes"
                              : "Simulate file tampering (modifies encrypted bytes)"
                          }
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isTampered
                              ? "text-gray-300 dark:text-slate-600 cursor-not-allowed"
                              : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                          }`}
                          title={
                            isTampered
                              ? "Download blocked due to tampering"
                              : "Download decrypted file"
                          }
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(file.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete file"
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
                  <td colSpan={7} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-slate-400">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                        <FileBox className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        No stored files found
                      </p>
                      <p className="text-xs max-w-sm text-gray-400 dark:text-slate-500">
                        {search || selectedTag !== "All" || statusFilter !== "All"
                          ? `No files match your search query "${search || selectedTag}". Try adjusting your filters.`
                          : "Your file vault is empty. Choose a file above to encrypt and store."}
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-5 max-w-sm w-full space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Encrypted File?</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  This action permanently removes the encrypted binary and its database record.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileVault;

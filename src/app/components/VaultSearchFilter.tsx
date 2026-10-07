import React from "react";
import {
  Search,
  X,
  Tag,
  ArrowUpDown,
  Filter,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface FilterTagOption {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}

export interface SortOption {
  label: string;
  value: string;
}

export interface VaultSearchFilterProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  tags: FilterTagOption[];
  secondaryFilter?: {
    label: string;
    value: string;
    options: { label: string; value: string; count?: number }[];
    onChange: (val: string) => void;
  };
  sortBy?: string;
  onSortChange?: (val: string) => void;
  sortOptions?: SortOption[];
  totalCount: number;
  filteredCount: number;
  itemTypeLabel?: string; // e.g. "passwords", "files"
  placeholder?: string;
  className?: string;
}

export function VaultSearchFilter({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  tags,
  secondaryFilter,
  sortBy,
  onSortChange,
  sortOptions,
  totalCount,
  filteredCount,
  itemTypeLabel = "items",
  placeholder = "Search by title, tag, or username...",
  className = "",
}: VaultSearchFilterProps) {
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      (selectedTag && selectedTag !== "All") ||
      (secondaryFilter && secondaryFilter.value !== "All")
  );

  const handleResetFilters = () => {
    onSearchChange("");
    onTagSelect("All");
    if (secondaryFilter) {
      secondaryFilter.onChange("All");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onSearchChange("");
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors ${className}`}
    >
      {/* Top Row: Real-time Search Input + Secondary Filters / Sort */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Bar with live clear button & result badge */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-24 py-2.5 bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0B5CE5] dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
          />

          {/* Right Action within Search Input: Clear button and Result Counter */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Clear search query (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900/90 border border-gray-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs select-none">
              {filteredCount} / {totalCount} {itemTypeLabel}
            </span>
          </div>
        </div>

        {/* Secondary Filter Dropdown (Optional) */}
        {secondaryFilter && (
          <div className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium hidden sm:inline shrink-0">
              {secondaryFilter.label}:
            </span>
            <select
              value={secondaryFilter.value}
              onChange={(e) => secondaryFilter.onChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {secondaryFilter.options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  {opt.label} {opt.count !== undefined ? `(${opt.count})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Options (Optional) */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <div className="flex items-center gap-1.5 bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium hidden sm:inline shrink-0">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {sortOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom Row: Filter Tag Pills & Reset action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100/80 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3" />
            <span>Tags:</span>
          </span>

          {tags.map((tag) => {
            const isSelected = selectedTag.toLowerCase() === tag.value.toLowerCase();
            const Icon = tag.icon;

            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => onTagSelect(tag.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-[#0B5CE5] text-white shadow-xs scale-[1.02]"
                    : tag.colorClass
                    ? tag.colorClass
                    : "bg-gray-100/90 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200/80 dark:hover:bg-slate-700/80 border border-transparent dark:border-slate-700/50"
                }`}
              >
                {Icon && <Icon className={`w-3 h-3 ${isSelected ? "text-white" : ""}`} />}
                <span>{tag.label}</span>
                {tag.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-gray-200/90 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    {tag.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reset Filters Shortcut button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 hover:underline py-1 ml-auto shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default VaultSearchFilter;

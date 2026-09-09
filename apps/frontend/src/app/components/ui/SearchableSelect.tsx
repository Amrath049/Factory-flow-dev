import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";

export interface OptionItem {
  value: string;
  label: string;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
}

interface SearchableSelectProps {
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  onSearchQueryChange?: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  onSearchQueryChange,
  loading = false,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (onSearchQueryChange) {
      onSearchQueryChange(q);
    }
  };

  const filteredOptions = options.filter((opt) => {
    // If onSearchQueryChange is provided, backend handles filtering.
    // Otherwise fallback to client-side filtering.
    if (onSearchQueryChange) return true;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(query)) ||
      opt.value.toLowerCase().includes(query)
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl shadow-xs text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-left ${
          isOpen ? "ring-2 ring-indigo-500 border-indigo-500" : "hover:border-gray-400"
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <span className="font-medium text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden py-1 transition-all">
          {/* Search Input Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search..."
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {loading && (
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {loading && filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-gray-400 italic">Searching...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-gray-400 italic">No matching results</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-indigo-50/70 transition-colors ${
                      isSelected ? "bg-indigo-50 font-semibold text-indigo-900" : "text-gray-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium text-gray-900 truncate">{opt.label}</span>
                      {opt.subtext && <span className="text-[11px] text-gray-500 truncate">{opt.subtext}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            opt.badgeColor || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Icd10Item } from "../data/icd10";

interface Icd10AutocompleteProps {
  items: Icd10Item[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: Icd10Item) => void;
  placeholder?: string;
}

export function Icd10Autocomplete({
  items,
  value,
  onChange,
  onSelect,
  placeholder = "Cari kode atau nama ICD-10...",
}: Icd10AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return items.slice(0, 20);
    return items
      .filter((item) => {
        const haystack = [
          item.code,
          item.title,
          item.sourceLabel,
          ...(item.keywords || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 20);
  }, [items, value]);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:bg-white transition-all outline-none font-mono"
        placeholder={placeholder}
      />

      {isOpen && filteredItems.length > 0 && (
        <div className="absolute z-20 mt-2 min-h-[18rem] max-h-[26rem] w-full overflow-y-auto rounded-2xl border border-yellow-100 bg-white shadow-xl">
          {filteredItems.map((item) => (
            <button
              key={`${item.source || "unknown"}-${item.code}-${item.title}`}
              type="button"
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className="flex min-h-[4.5rem] w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5 text-left hover:bg-yellow-50 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="font-mono text-sm font-black text-yellow-700">{item.code}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{item.title}</span>
                    {item.sourceLabel && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        {item.sourceLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

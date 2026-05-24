import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PatientFood } from "@/lib/patient-substitutions-service";

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface FoodAutocompleteProps {
  foods: PatientFood[];
  value: PatientFood | null;
  onChange: (food: PatientFood | null) => void;
  placeholder: string;
}

export function FoodAutocomplete({ foods, value, onChange, placeholder }: FoodAutocompleteProps) {
  const [inputText, setInputText] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputText(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const query = stripDiacritics(inputText.trim().toLowerCase());
  const suggestions =
    query.length > 0 && !value
      ? foods
          .filter((f) => stripDiacritics(f.name.toLowerCase()).includes(query))
          .slice(0, 8)
      : [];

  function handleInputChange(text: string) {
    setInputText(text);
    if (value) onChange(null);
    setOpen(true);
  }

  function handleSelect(food: PatientFood) {
    onChange(food);
    setInputText(food.name);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setInputText("");
    setOpen(false);
  }

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={inputText}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/40"
      />
      {inputText && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Limpar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showDropdown && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-slate-900 shadow-lg">
          {suggestions.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(food);
                }}
                className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-slate-100"
              >
                <span className="text-sm font-medium">{food.name}</span>
                <span className="text-xs text-slate-500">{food.calories_per_100g} kcal/100g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

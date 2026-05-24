import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  findPatientSubstitutions,
  type HouseholdUnit,
  type PatientFood,
  type PatientSubstitutionsResult,
} from "@/lib/patient-substitutions-service";
import { OriginalFoodCard } from "./OriginalFoodCard";
import { SubstitutionCard } from "./SubstitutionCard";

interface SubstitutionsPanelProps {
  food: PatientFood | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubstitutionsPanel({ food, open, onOpenChange }: SubstitutionsPanelProps) {
  const [referenceGrams, setReferenceGrams] = useState(100);
  const [pickerResetKey, setPickerResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatientSubstitutionsResult | null>(null);

  useEffect(() => {
    if (!food) return;
    setReferenceGrams(100);
    setPickerResetKey((k) => k + 1);
  }, [food?.id]);

  useEffect(() => {
    if (!food || !open) return;
    setLoading(true);
    setResult(null);
    findPatientSubstitutions(food.id, { referenceQuantityG: referenceGrams, limit: 12 })
      .then((r) => setResult(r))
      .finally(() => setLoading(false));
  }, [food, referenceGrams, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-0 text-slate-900 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-slate-200 px-4 pb-3 pt-6 text-left sm:px-6">
          <SheetTitle className="text-slate-900">Substituições</SheetTitle>
          <SheetDescription className="text-slate-500">
            Mesmo macrogrupo, gramas ajustadas para manter os macros.
          </SheetDescription>
        </SheetHeader>

        {!food ? (
          <p className="px-4 py-4 text-sm text-slate-500 sm:px-6">Selecione um alimento.</p>
        ) : (
          <>
            <div className="sticky top-0 z-20 space-y-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
              <OriginalFoodCard food={food} referenceGrams={referenceGrams} />
              <ReferenceQuantityPicker
                key={pickerResetKey}
                value={referenceGrams}
                onChange={setReferenceGrams}
                householdUnits={food.common_units}
              />
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-6">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Calculando equivalentes...</span>
                </div>
              )}

              {!loading && result && result.substitutions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Não encontramos substitutos parecidos para este alimento.
                </p>
              )}

              {!loading && result && result.substitutions.length > 0 && (
                <>
                  {/* Banner quando a melhor substituição é fraca (score < 70) */}
                  {result.substitutions[0].similarity_score < 70 && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Nenhuma substituição é muito próxima.</strong> Este alimento tem um
                        perfil nutricional bem específico. Use as opções abaixo com moderação e prefira
                        confirmar com seu nutricionista antes de trocar.
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {result.substitutions.map((sub) => (
                      <SubstitutionCard
                        key={sub.id}
                        original={result.original}
                        referenceGrams={result.reference_quantity_g}
                        sub={sub}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

type PickerMode = "grams" | "units";

function ReferenceQuantityPicker({
  value,
  onChange,
  householdUnits,
}: {
  value: number;
  onChange: (n: number) => void;
  householdUnits: HouseholdUnit[];
}) {
  const unit = householdUnits[0] ?? null;
  const [mode, setMode] = useState<PickerMode>("grams");
  const [unitCount, setUnitCount] = useState(1);

  const handleGramsChange = (g: number) => {
    onChange(g);
    if (unit) setUnitCount(Math.round((g / unit.grams) * 10) / 10);
  };

  const handleUnitCountChange = (n: number) => {
    setUnitCount(n);
    if (unit) onChange(Math.round(n * unit.grams));
  };

  const switchToGrams = () => setMode("grams");
  const switchToUnits = () => {
    if (!unit) return;
    setMode("units");
    setUnitCount(Math.round((value / unit.grams) * 10) / 10 || 1);
  };

  const gramPresets = [50, 100, 150, 200];
  const unitPresets = [0.5, 1, 2, 3];

  const chipBase =
    "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300";
  const activeChip =
    "border-emerald-500 bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-slate-600">
          Quantidade de referência
        </label>

        {unit && (
          <div className="flex rounded-full border border-slate-200 bg-white text-xs">
            <button
              type="button"
              onClick={switchToGrams}
              className={`rounded-full px-3 py-1 transition ${
                mode === "grams" ? activeChip : "text-slate-500"
              }`}
            >
              Gramas
            </button>
            <button
              type="button"
              onClick={switchToUnits}
              className={`rounded-full px-3 py-1 transition ${
                mode === "units" ? activeChip : "text-slate-500"
              }`}
            >
              {unit.unit.charAt(0).toUpperCase() + unit.unit.slice(1)}
            </button>
          </div>
        )}
      </div>

      {mode === "grams" ? (
        <>
          <div className="mb-2 flex items-center justify-end gap-1">
            <input
              type="number"
              min={10}
              max={2000}
              step={10}
              value={value}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) handleGramsChange(n);
              }}
              className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-sm text-slate-500">g</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {gramPresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleGramsChange(p)}
                className={`flex-1 rounded-full py-1 text-xs transition ${
                  value === p ? activeChip : chipBase
                }`}
              >
                {p}g
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-end gap-1">
            <input
              type="number"
              min={0.5}
              max={20}
              step={0.5}
              value={unitCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) handleUnitCountChange(n);
              }}
              className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            />
            <span className="max-w-[80px] truncate text-sm text-slate-500">
              {unit!.unit}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unitPresets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleUnitCountChange(p)}
                className={`flex-1 rounded-full py-1 text-xs transition ${
                  unitCount === p ? activeChip : chipBase
                }`}
              >
                {p}×
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-right text-xs text-slate-500">= {value}g</p>
        </>
      )}
    </div>
  );
}

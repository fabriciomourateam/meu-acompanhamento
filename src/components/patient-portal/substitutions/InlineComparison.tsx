import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PatientFood } from "@/lib/patient-substitutions-service";
import { formatHouseholdMeasure } from "@/lib/patient-substitutions-service";

interface InlineComparisonProps {
  base: PatientFood;
  target: PatientFood;
}

function MacroPill({
  label,
  value,
  labelColor,
}: {
  label: string;
  value: number;
  labelColor: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium">
      <span className={`font-semibold ${labelColor}`}>{label}</span>
      <span className="text-slate-600">{value.toFixed(1)}g</span>
    </span>
  );
}

function diffLabel(diff: number): string {
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}g`;
}

function diffColor(diff: number): string {
  const abs = Math.abs(diff);
  if (abs < 5) return "text-emerald-600";
  if (abs < 8) return "text-amber-600";
  return "text-rose-600";
}

type InputMode = "grams" | "units";

export function InlineComparison({ base, target }: InlineComparisonProps) {
  const baseUnit = base.common_units[0] ?? null;

  const [inputMode, setInputMode] = useState<InputMode>("grams");
  const [baseGrams, setBaseGrams] = useState(100);
  const [unitCount, setUnitCount] = useState(1);

  useEffect(() => {
    setInputMode("grams");
    setBaseGrams(100);
    setUnitCount(1);
  }, [base.id]);

  const handleGramsChange = (g: number) => {
    setBaseGrams(g);
    if (baseUnit) setUnitCount(Math.round((g / baseUnit.grams) * 10) / 10);
  };

  const handleUnitCountChange = (n: number) => {
    setUnitCount(n);
    if (baseUnit) setBaseGrams(Math.round(n * baseUnit.grams));
  };

  const switchToGrams = () => setInputMode("grams");
  const switchToUnits = () => {
    if (!baseUnit) return;
    setInputMode("units");
    setUnitCount(Math.round((baseGrams / baseUnit.grams) * 10) / 10 || 1);
  };

  const equivalentGrams =
    target.calories_per_100g > 0
      ? Math.round((baseGrams * base.calories_per_100g) / target.calories_per_100g)
      : 0;
  const mult = equivalentGrams / 100;
  const baseMult = baseGrams / 100;

  const baseKcal = Math.round(base.calories_per_100g * baseMult);
  const targetProtein = target.protein_per_100g * mult;
  const targetCarbs = target.carbs_per_100g * mult;
  const targetFats = target.fats_per_100g * mult;
  const targetKcal = Math.round(target.calories_per_100g * mult);

  const baseHousehold = formatHouseholdMeasure(baseGrams, base.common_units);
  const targetHousehold = formatHouseholdMeasure(equivalentGrams, target.common_units);

  const sameGroup = base.macro_group === target.macro_group;

  const proteinDiff = targetProtein - base.protein_per_100g * baseMult;
  const carbsDiff = targetCarbs - base.carbs_per_100g * baseMult;
  const fatsDiff = targetFats - base.fats_per_100g * baseMult;

  const labelColors = {
    kcal: "text-slate-500",
    prot: "text-rose-600",
    carb: "text-sky-600",
    gord: "text-amber-600",
  };

  const chipBase =
    "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300";
  const activeChip = "border-emerald-500 bg-emerald-100 text-emerald-800 font-semibold shadow-sm shadow-emerald-500/20";

  const gramPresets = [50, 100, 150, 200];
  const unitPresets = [0.5, 1, 2, 3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Aviso de grupos diferentes */}
      {!sameGroup && (
        <div className="px-4 pt-3">
          <Badge className="flex w-full items-start gap-2 whitespace-normal rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-left text-xs font-medium text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Atenção:</strong> grupos nutricionais diferentes — equivalência apenas calórica.
              Verifique com seu nutricionista antes de substituir.
            </span>
          </Badge>
        </div>
      )}

      <div className="p-3 sm:p-4">
        {/* Seletor de quantidade */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-600">
              Quantidade de {base.name}
            </label>

            {baseUnit && (
              <div className="flex rounded-full border border-slate-200 bg-white text-xs">
                <button
                  type="button"
                  onClick={switchToGrams}
                  className={`rounded-full px-3 py-1 transition ${
                    inputMode === "grams" ? activeChip : "text-slate-500"
                  }`}
                >
                  Gramas
                </button>
                <button
                  type="button"
                  onClick={switchToUnits}
                  className={`rounded-full px-3 py-1 transition ${
                    inputMode === "units" ? activeChip : "text-slate-500"
                  }`}
                >
                  {baseUnit.unit.charAt(0).toUpperCase() + baseUnit.unit.slice(1)}
                </button>
              </div>
            )}
          </div>

          {inputMode === "grams" ? (
            <>
              <div className="mb-2 flex items-center justify-end gap-1">
                <input
                  type="number"
                  min={10}
                  max={2000}
                  step={10}
                  value={baseGrams}
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
                      baseGrams === p ? activeChip : chipBase
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
                  {baseUnit!.unit}
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
                    {p} {p === 1 ? "" : "×"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-right text-xs text-slate-400">= {baseGrams}g</p>
            </>
          )}
        </div>

        {/* Frase de equivalência */}
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-bold text-slate-900">
            {inputMode === "units" && baseUnit
              ? `${unitCount} ${baseUnit.unit} de ${base.name} (${baseGrams}g)`
              : `${baseGrams}g de ${base.name}`}
          </span>
          {inputMode === "grams" && baseHousehold && (
            <span className="text-slate-500"> ({baseHousehold})</span>
          )}
          {" "}equivalem a{" "}
          <span className="font-bold text-emerald-600">
            {equivalentGrams}g de {target.name}
          </span>
          {targetHousehold && <span className="text-slate-500"> ≈ {targetHousehold}</span>}
        </p>

        {/* Dois painéis de macros lado a lado */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="mb-2 truncate text-[11px] sm:text-xs font-semibold text-slate-500">
              {base.name} ({baseGrams}g)
            </p>
            <div className="flex flex-wrap gap-1">
              <MacroPill label="kcal" value={baseKcal} labelColor={labelColors.kcal} />
              <MacroPill label="Prot" value={base.protein_per_100g * baseMult} labelColor={labelColors.prot} />
              <MacroPill label="Carb" value={base.carbs_per_100g * baseMult} labelColor={labelColors.carb} />
              <MacroPill label="Gord" value={base.fats_per_100g * baseMult} labelColor={labelColors.gord} />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="mb-2 truncate text-[11px] sm:text-xs font-semibold text-slate-500">
              {target.name} ({equivalentGrams}g)
            </p>
            <div className="flex flex-wrap gap-1">
              <MacroPill label="kcal" value={targetKcal} labelColor={labelColors.kcal} />
              <MacroPill label="Prot" value={targetProtein} labelColor={labelColors.prot} />
              <MacroPill label="Carb" value={targetCarbs} labelColor={labelColors.carb} />
              <MacroPill label="Gord" value={targetFats} labelColor={labelColors.gord} />
            </div>
          </div>
        </div>

        {/* Linha de diferença */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>Diferença:</span>
          <span>
            Prot <span className={`font-semibold ${diffColor(proteinDiff)}`}>{diffLabel(proteinDiff)}</span>
          </span>
          <span>
            Carb <span className={`font-semibold ${diffColor(carbsDiff)}`}>{diffLabel(carbsDiff)}</span>
          </span>
          <span>
            Gord <span className={`font-semibold ${diffColor(fatsDiff)}`}>{diffLabel(fatsDiff)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

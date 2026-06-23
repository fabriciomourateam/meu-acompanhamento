interface MacroBadgeRowProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  size?: "sm" | "md";
}

const FORMATS = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
};

export function MacroBadgeRow({ calories, protein, carbs, fats, size = "md" }: MacroBadgeRowProps) {
  const cls = FORMATS[size];

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`rounded-full font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ${cls}`}>
        {Math.round(calories)} kcal
      </span>
      <span className={`rounded-full font-medium bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 ${cls}`}>
        Prot {protein.toFixed(1)}g
      </span>
      <span className={`rounded-full font-medium bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 ${cls}`}>
        Carb {carbs.toFixed(1)}g
      </span>
      <span className={`rounded-full font-medium bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 ${cls}`}>
        Gord {fats.toFixed(1)}g
      </span>
    </div>
  );
}

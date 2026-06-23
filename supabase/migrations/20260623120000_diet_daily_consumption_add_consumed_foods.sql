-- Persistir o consumo GRANULAR por alimento no servidor (alem de consumed_meals),
-- pra restaurar o estado completo entre aparelhos / apos o iOS descartar o
-- localStorage. Mesma forma de consumed_meals (jsonb com array de ids de diet_foods).
ALTER TABLE diet_daily_consumption
  ADD COLUMN IF NOT EXISTS consumed_foods jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN diet_daily_consumption.consumed_foods IS
  'Ids de diet_foods consumidos no dia (consumo granular por alimento). Persistido junto com consumed_meals pra restaurar o estado completo entre aparelhos.';

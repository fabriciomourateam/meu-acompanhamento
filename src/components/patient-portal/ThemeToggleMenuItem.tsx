import { Moon, Sun, Monitor, Check } from 'lucide-react';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useTheme, type ThemeMode } from '@/lib/theme';

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Escuro', Icon: Moon },
  { value: 'system', label: 'Automático', Icon: Monitor },
];

/**
 * Seção do menu (⋮) pra escolher o tema: Claro / Escuro / Automático.
 * Padrão do app é Claro; "Automático" segue o aparelho (prefers-color-scheme).
 */
export function ThemeToggleMenuItem() {
  const { mode, setMode } = useTheme();

  return (
    <>
      <DropdownMenuLabel className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide px-2 py-1.5">
        Tema
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
        {OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            // Esconde o indicador padrão (à esquerda) e usamos um check à direita.
            className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer py-2.5 pl-2 [&>span:first-child]:hidden"
          >
            <Icon className="w-4 h-4 mr-2 text-emerald-500" />
            <span>{label}</span>
            {mode === value && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

import { Moon, Sun } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';

/**
 * Item do menu (⋮) que alterna entre tema claro e escuro.
 * Padrão do app é claro; aqui o aluno escolhe o escuro se quiser.
 */
export function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        // Mantém o menu aberto pro aluno ver o tema trocar na hora.
        e.preventDefault();
        toggleTheme();
      }}
      className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer py-2.5"
    >
      {isDark ? (
        <Sun className="w-4 h-4 mr-2 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 mr-2 text-indigo-500" />
      )}
      {isDark ? 'Tema claro' : 'Tema escuro'}
    </DropdownMenuItem>
  );
}

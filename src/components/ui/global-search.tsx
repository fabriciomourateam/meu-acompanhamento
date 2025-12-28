import { useEffect, useRef, useState } from 'react';
import { Search, Users, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGlobalSearch, SearchResult } from '@/hooks/use-global-search';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchTerm, setSearchTerm, searchResults } = useGlobalSearch();
  const [isFocused, setIsFocused] = useState(false);

  // Mostrar dropdown quando tem foco E (tem resultados OU está digitando)
  const showDropdown = isFocused && searchTerm.length >= 2;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
      // Ctrl/Cmd + K para focar na busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'plan':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'checkin':
        return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsFocused(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        placeholder="Buscar pacientes... (Ctrl+K)"
        className="pl-10 w-48 sm:w-64 md:w-80 input-premium"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
      />
      
      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Command className="rounded-lg border shadow-lg bg-popover">
            <CommandList>
              {searchResults.length === 0 ? (
                <CommandEmpty className="py-6 text-center text-sm">
                  Nenhum resultado encontrado.
                </CommandEmpty>
              ) : (
                <CommandGroup heading={`${searchResults.length} resultado(s)`}>
                  {searchResults.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultClick(result)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {result.type === 'patient' ? 'Paciente' : 
                         result.type === 'plan' ? 'Plano' : 'Check-in'}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

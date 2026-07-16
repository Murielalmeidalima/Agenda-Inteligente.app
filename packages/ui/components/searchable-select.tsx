import * as React from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#2C2825] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all',
          triggerClassName
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-neutral-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-[#E5E0D8] bg-white text-neutral-950 shadow-lg flex flex-col">
          <div className="flex items-center border-b border-neutral-100 px-3 py-2 shrink-0 bg-[#FAF9F6]">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-[#8A847C]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400 text-[#2C2825]"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto py-1 max-h-48 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="relative flex w-full cursor-default select-none items-center py-2.5 px-3 text-xs text-neutral-500 italic">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center py-2.5 pl-8 pr-2 text-sm outline-none hover:bg-[#FAF9F6] text-[#2C2825] hover:text-[#D4AF37] text-left transition-colors',
                      isSelected && 'bg-[#FAF6E9] text-[#D4AF37] font-semibold'
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4 text-[#D4AF37]" />}
                    </span>
                    {opt.label}
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

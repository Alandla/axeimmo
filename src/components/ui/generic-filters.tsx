"use client";

import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Check, X } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

interface AnimateChangeInHeightProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height;
        setHeight(observedHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, damping: 0.2, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};

export enum FilterOperator {
  IS = "is",
  IS_NOT = "is not",
  IS_ANY_OF = "is any of",
  INCLUDE = "include",
  DO_NOT_INCLUDE = "do not include",
  INCLUDE_ALL_OF = "include all of",
  INCLUDE_ANY_OF = "include any of",
  EXCLUDE_ALL_OF = "exclude all of",
  EXCLUDE_IF_ANY_OF = "exclude if any of",
  BEFORE = "before",
  AFTER = "after",
}

export type FilterOption<T = string> = {
  name: T;
  icon: React.ReactNode | undefined;
  label?: string;
};

export type GenericFilter<T extends string = string> = {
  id: string;
  type: T;
  operator: FilterOperator;
  value: string[];
};

export interface FilterConfig<T extends string = string> {
  filterTypes: T[];
  filterOptions: Record<string, FilterOption<string>[]>;
  filterOperators: (filterType: T, filterValues: string[]) => FilterOperator[];
  getFilterIcon: (type: T | string) => React.ReactNode;
  getFilterLabel?: (value: string) => string;
  getFilterTypeLabel?: (type: T) => string;
  getSelectedText?: (count: number) => string;
}

const FilterOperatorDropdown = <T extends string>({
  filterType,
  operator,
  filterValues,
  setOperator,
  config,
  tFilters,
}: {
  filterType: T;
  operator: FilterOperator;
  filterValues: string[];
  setOperator: (operator: FilterOperator) => void;
  config: FilterConfig<T>;
  tFilters?: any;
}) => {
  const operators = config.filterOperators(filterType, filterValues);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent px-1.5 text-muted-foreground hover:text-accent-foreground transition shrink-0 border-l border-input h-full flex items-center">
        {tFilters ? tFilters(`operators.${operator}`) : operator}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op}
            onClick={() => setOperator(op)}
          >
            {tFilters ? tFilters(`operators.${op}`) : op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FilterValueCombobox = <T extends string>({
  filterType,
  filterValues,
  setFilterValues,
  config,
  tFilters,
}: {
  filterType: T;
  filterValues: string[];
  setFilterValues: (filterValues: string[]) => void;
  config: FilterConfig<T>;
  tFilters?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const commandInputRef = useRef<HTMLInputElement>(null);
  const nonSelectedFilterValues = config.filterOptions[filterType]?.filter(
    (filter) => !filterValues.includes(filter.name)
  );

  return (
    <Popover
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => {
            setCommandInput("");
          }, 200);
        }
      }}
    >
      <PopoverTrigger
        className="px-1.5 hover:bg-accent transition hover:text-accent-foreground shrink-0 border-l border-input h-full flex items-center"
      >
        <div className="flex gap-1.5 items-center">
          {(() => {
            // Récupérer toutes les icônes des valeurs sélectionnées
            const allIcons = filterValues?.slice(0, 3).map((value, index) => ({
              value,
              icon: config.getFilterIcon(value),
              index
            })).filter(item => item.icon) || [];
            
            if (allIcons.length === 0) return null;
            
            // Déduplicater les icônes basées sur le filterType
            // Les icônes du même filterType sont généralement identiques
            const uniqueIcons = [];
            const seenFilterTypes = new Set();
            
            for (const item of allIcons) {
              // Pour le même filterType, toutes les icônes sont généralement identiques
              // Sauf pour les utilisateurs qui ont chacun leur avatar
              const isUserFilter = filterType.toString().includes('created-by') || 
                                 filterType.toString().includes('uploaded-by');
              
              const iconKey = isUserFilter ? item.value : filterType.toString();
              
              if (!seenFilterTypes.has(iconKey)) {
                seenFilterTypes.add(iconKey);
                uniqueIcons.push(item);
              }
            }
            
            if (uniqueIcons.length === 0) return null;
            
            return (
              <div className="flex items-center flex-row -space-x-1.5">
                <AnimatePresence mode="popLayout">
                  {uniqueIcons.map((item) => (
                    <motion.div
                      key={`${item.value}-${item.index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.icon}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })()}
          {filterValues?.length === 1
            ? (config.getFilterLabel ? config.getFilterLabel(filterValues[0]) : filterValues[0])
            : (config.getSelectedText ? config.getSelectedText(filterValues?.length || 0) : `${filterValues?.length} selected`)}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={config.getFilterTypeLabel ? config.getFilterTypeLabel(filterType) : String(filterType)}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value);
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>{tFilters ? tFilters('ui.no-results') : 'No results found'}</CommandEmpty>
              <CommandGroup>
                {filterValues.map((value) => (
                  <CommandItem
                    key={value}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      setFilterValues(filterValues.filter((v) => v !== value));
                      setTimeout(() => {
                        setCommandInput("");
                      }, 200);
                      setOpen(false);
                    }}
                  >
                    <Checkbox checked={true} />
                    {config.getFilterIcon(value)}
                    {config.getFilterLabel ? config.getFilterLabel(value) : value}
                  </CommandItem>
                ))}
              </CommandGroup>
              {nonSelectedFilterValues?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {nonSelectedFilterValues.map((filter: FilterOption) => (
                      <CommandItem
                        className="group flex gap-2 items-center"
                        key={filter.name}
                        value={filter.label || filter.name}
                        onSelect={(currentValue: string) => {
                          setFilterValues([...filterValues, filter.name]);
                          setTimeout(() => {
                            setCommandInput("");
                          }, 200);
                          setOpen(false);
                        }}
                      >
                        <Checkbox
                          checked={false}
                          className="opacity-0 group-data-[selected=true]:opacity-100"
                        />
                        {filter.icon}
                        <span className="text-accent-foreground">
                          {filter.label || filter.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  );
};

const FilterValueDateCombobox = <T extends string>({
  filterType,
  filterValues,
  setFilterValues,
  config,
  tFilters,
}: {
  filterType: T;
  filterValues: string[];
  setFilterValues: (filterValues: string[]) => void;
  config: FilterConfig<T>;
  tFilters?: any;
}) => {
  const [open, setOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const commandInputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => {
            setCommandInput("");
          }, 200);
        }
      }}
    >
      <PopoverTrigger
        className="px-1.5 hover:bg-accent transition hover:text-accent-foreground shrink-0 border-l border-input h-full flex items-center"
      >
        {config.getFilterLabel ? config.getFilterLabel(filterValues[0]) : filterValues[0]}
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={config.getFilterTypeLabel ? config.getFilterTypeLabel(filterType) : String(filterType)}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => {
                setCommandInput(e.currentTarget.value);
              }}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>{tFilters ? tFilters('ui.no-results') : 'No results found'}</CommandEmpty>
              <CommandGroup>
                {config.filterOptions[filterType].map(
                  (filter: FilterOption) => (
                    <CommandItem
                      className="group flex gap-2 items-center"
                      key={filter.name}
                      value={filter.label || filter.name}
                      onSelect={(currentValue: string) => {
                        setFilterValues([filter.name]);
                        setTimeout(() => {
                          setCommandInput("");
                        }, 200);
                        setOpen(false);
                      }}
                    >
                      <span className="text-accent-foreground">
                        {filter.label || filter.name}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          filterValues.includes(filter.name)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  );
};

export default function GenericFilters<T extends string>({
  filters,
  setFilters,
  config,
  isDateFilter,
  tFilters,
}: {
  filters: GenericFilter<T>[];
  setFilters: Dispatch<SetStateAction<GenericFilter<T>[]>>;
  config: FilterConfig<T>;
  isDateFilter?: (filterType: T) => boolean;
  tFilters?: any;
}) {
  const activeFilters = filters.filter((filter) => filter.value?.length > 0);
  
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {activeFilters.map((filter) => (
        <div key={filter.id} className="flex items-center text-xs border border-input rounded-sm overflow-hidden h-6">
          <div className="flex gap-1.5 shrink-0 px-1.5 items-center h-full">
            {config.getFilterIcon(filter.type)}
            {config.getFilterTypeLabel ? config.getFilterTypeLabel(filter.type) : String(filter.type)}
          </div>
          <FilterOperatorDropdown
            filterType={filter.type}
            operator={filter.operator}
            filterValues={filter.value}
            setOperator={(operator) => {
              setFilters((prev) =>
                prev.map((f) => (f.id === filter.id ? { ...f, operator } : f))
              );
            }}
            config={config}
            tFilters={tFilters}
          />
          {isDateFilter && isDateFilter(filter.type) ? (
            <FilterValueDateCombobox
              filterType={filter.type}
              filterValues={filter.value}
              setFilterValues={(filterValues) => {
                setFilters((prev) => {
                  if (filterValues.length === 0) {
                    // Supprimer le filtre si plus de valeurs
                    return prev.filter((f) => f.id !== filter.id);
                  }
                  
                  return prev.map((f) => {
                    if (f.id === filter.id) {
                      // Mettre à jour l'opérateur en fonction du nombre de valeurs
                      const availableOperators = config.filterOperators(f.type, filterValues);
                      let newOperator = f.operator;
                      
                      // Si l'opérateur actuel n'est plus disponible, prendre le premier disponible
                      if (!availableOperators.includes(f.operator)) {
                        newOperator = availableOperators[0] || f.operator;
                      }
                      
                      return { ...f, value: filterValues, operator: newOperator };
                    }
                    return f;
                  });
                });
              }}
              config={config}
              tFilters={tFilters}
            />
          ) : (
            <FilterValueCombobox
              filterType={filter.type}
              filterValues={filter.value}
              setFilterValues={(filterValues) => {
                setFilters((prev) => {
                  if (filterValues.length === 0) {
                    // Supprimer le filtre si plus de valeurs
                    return prev.filter((f) => f.id !== filter.id);
                  }
                  
                  return prev.map((f) => {
                    if (f.id === filter.id) {
                      // Mettre à jour l'opérateur en fonction du nombre de valeurs
                      const availableOperators = config.filterOperators(f.type, filterValues);
                      let newOperator = f.operator;
                      
                      // Si l'opérateur actuel n'est plus disponible, prendre le premier disponible
                      if (!availableOperators.includes(f.operator)) {
                        newOperator = availableOperators[0] || f.operator;
                      }
                      
                      return { ...f, value: filterValues, operator: newOperator };
                    }
                    return f;
                  });
                });
              }}
              config={config}
              tFilters={tFilters}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFilters((prev) => prev.filter((f) => f.id !== filter.id));
            }}
            className="h-6 w-6 text-muted-foreground hover:text-accent-foreground hover:bg-accent transition shrink-0 border-l border-input rounded-none"
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
} 
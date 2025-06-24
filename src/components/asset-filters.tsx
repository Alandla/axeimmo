"use client";

import { Button } from "@/src/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { ListFilter, Image, Video, User, Bot, Calendar, UserCircle } from "lucide-react";
import { nanoid } from "nanoid";
import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimateChangeInHeight, FilterOperator } from "@/src/components/ui/generic-filters";
import GenericFilters, { GenericFilter, FilterConfig, FilterOption } from "@/src/components/ui/generic-filters";
import { IMediaSpace } from "@/src/types/space";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

// Types de filtres pour les assets
export enum AssetFilterType {
  TYPE = "Type",
  UPLOADED_BY = "Uploaded by",
  AI_GENERATED = "AI Generated",
  CREATED_DATE = "Created date",
}

// Options pour chaque type de filtre
export enum AssetType {
  IMAGE = "Image",
  VIDEO = "Video",
}

export enum AIGenerated {
  YES = "Yes",
  NO = "No",
}

export enum DateRange {
  TODAY = "Today",
  YESTERDAY = "Yesterday", 
  LAST_7_DAYS = "Last 7 days",
  LAST_30_DAYS = "Last 30 days",
  LAST_90_DAYS = "Last 90 days",
}

const AssetFilterIcon = ({
  type,
}: {
  type: AssetFilterType | AssetType | AIGenerated | DateRange | string;
}) => {
  switch (type) {
    case AssetFilterType.TYPE:
      return <Image className="size-3.5" />;
    case AssetFilterType.UPLOADED_BY:
      return <UserCircle className="size-3.5" />;
    case AssetFilterType.AI_GENERATED:
      return <Bot className="size-3.5" />;
    case AssetFilterType.CREATED_DATE:
      return <Calendar className="size-3.5" />;
    case AssetType.IMAGE:
      return <Image className="size-3.5 text-blue-500" />;
    case AssetType.VIDEO:
      return <Video className="size-3.5 text-green-500" />;
    case AIGenerated.YES:
      return <Bot className="size-3.5 text-purple-500" />;
    case AIGenerated.NO:
      return <User className="size-3.5 text-gray-500" />;
    default:
      // Pour les utilisateurs, créer un avatar
      if (typeof type === 'string' && !Object.values(DateRange).includes(type as DateRange)) {
        return (
          <Avatar className="size-3.5 rounded-full text-[9px]">
            <AvatarFallback className="bg-blue-300 text-white text-xs">
              {type.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      }
      return <Calendar className="size-3.5" />;
  }
};

// Configuration des filtres pour les assets
const createAssetFilterConfig = (
  members: Array<{ id: string; name: string; image: string }> = []
): FilterConfig<AssetFilterType> => {
  const typeFilterOptions: FilterOption<string>[] = Object.values(AssetType).map(
    (type) => ({
      name: type,
      icon: <AssetFilterIcon type={type} />,
    })
  );

  const uploadedByFilterOptions: FilterOption<string>[] = members.map(
    (member) => ({
      name: member.name,
      icon: <AssetFilterIcon type={member.name} />,
    })
  );

  const aiGeneratedFilterOptions: FilterOption<string>[] = Object.values(AIGenerated).map(
    (value) => ({
      name: value,
      icon: <AssetFilterIcon type={value} />,
    })
  );

  const dateFilterOptions: FilterOption<string>[] = Object.values(DateRange).map(
    (date) => ({
      name: date,
      icon: undefined,
    })
  );

  return {
    filterTypes: Object.values(AssetFilterType) as AssetFilterType[],
    filterOptions: {
      [AssetFilterType.TYPE]: typeFilterOptions,
      [AssetFilterType.UPLOADED_BY]: uploadedByFilterOptions,
      [AssetFilterType.AI_GENERATED]: aiGeneratedFilterOptions,
      [AssetFilterType.CREATED_DATE]: dateFilterOptions,
    },
    filterOperators: (filterType: AssetFilterType, filterValues: string[]) => {
      switch (filterType) {
        case AssetFilterType.TYPE:
        case AssetFilterType.UPLOADED_BY:
        case AssetFilterType.AI_GENERATED:
          if (Array.isArray(filterValues) && filterValues.length > 1) {
            return [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT];
          } else {
            return [FilterOperator.IS, FilterOperator.IS_NOT];
          }
        case AssetFilterType.CREATED_DATE:
          return [FilterOperator.IS, FilterOperator.IS_NOT];
        default:
          return [];
      }
    },
    getFilterIcon: (type: AssetFilterType | string) => <AssetFilterIcon type={type} />,
  };
};

// Hook pour filtrer les assets
export const useAssetFilters = (assets: IMediaSpace[]) => {
  const { activeSpace } = useActiveSpaceStore();
  const [filters, setFilters] = React.useState<GenericFilter<AssetFilterType>[]>([]);

  const filteredAssets = React.useMemo(() => {
    if (filters.length === 0) return assets;

    return assets.filter((asset) => {
      return filters.every((filter) => {
        const { operator, value, type } = filter;
        
        switch (type) {
          case AssetFilterType.TYPE:
            const assetType = asset.media.type === 'image' ? AssetType.IMAGE : AssetType.VIDEO;
            if (operator === FilterOperator.IS) {
              return value.includes(assetType);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(assetType);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(assetType);
            }
            break;

          case AssetFilterType.AI_GENERATED:
            const isAIGenerated = asset.media.requestId ? AIGenerated.YES : AIGenerated.NO;
            if (operator === FilterOperator.IS) {
              return value.includes(isAIGenerated);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(isAIGenerated);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(isAIGenerated);
            }
            break;

          case AssetFilterType.UPLOADED_BY:
            const uploaderName = activeSpace?.members?.find(m => m.id === asset.uploadedBy)?.name || asset.uploadedBy;
            if (operator === FilterOperator.IS) {
              return value.includes(uploaderName);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(uploaderName);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(uploaderName);
            }
            break;

          case AssetFilterType.CREATED_DATE:
            const assetDate = new Date(asset.uploadedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - assetDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const matchesDateRange = value.some((dateRange) => {
              switch (dateRange) {
                case DateRange.TODAY:
                  return diffDays <= 1;
                case DateRange.YESTERDAY:
                  return diffDays === 2;
                case DateRange.LAST_7_DAYS:
                  return diffDays <= 7;
                case DateRange.LAST_30_DAYS:
                  return diffDays <= 30;
                case DateRange.LAST_90_DAYS:
                  return diffDays <= 90;
                default:
                  return false;
              }
            });

            if (operator === FilterOperator.IS) {
              return matchesDateRange;
            } else if (operator === FilterOperator.IS_NOT) {
              return !matchesDateRange;
            }
            break;
        }
        return true;
      });
    });
  }, [assets, filters, activeSpace]);

  return {
    filters,
    setFilters,
    filteredAssets,
  };
};

// Composant de filtres pour les assets
interface AssetFiltersProps {
  filters: GenericFilter<AssetFilterType>[];
  setFilters: React.Dispatch<React.SetStateAction<GenericFilter<AssetFilterType>[]>>;
}

export function AssetFilters({ filters, setFilters }: AssetFiltersProps) {
  const t = useTranslations('assets');
  const { activeSpace } = useActiveSpaceStore();
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<AssetFilterType | null>(null);
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);

  const config = createAssetFilterConfig(activeSpace?.members);

  const filterViewOptions: FilterOption<AssetFilterType>[][] = [
    [
      {
        name: AssetFilterType.TYPE,
        icon: <AssetFilterIcon type={AssetFilterType.TYPE} />,
      },
      {
        name: AssetFilterType.AI_GENERATED,
        icon: <AssetFilterIcon type={AssetFilterType.AI_GENERATED} />,
      },
      {
        name: AssetFilterType.UPLOADED_BY,
        icon: <AssetFilterIcon type={AssetFilterType.UPLOADED_BY} />,
      },
    ],
    [
      {
        name: AssetFilterType.CREATED_DATE,
        icon: <AssetFilterIcon type={AssetFilterType.CREATED_DATE} />,
      },
    ],
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      <Popover
        open={open}
        onOpenChange={(open: boolean) => {
          setOpen(open);
          if (!open) {
            setTimeout(() => {
              setSelectedView(null);
              setCommandInput("");
            }, 200);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            size="sm"
            className={cn(
              "transition group h-6 text-xs rounded-sm flex gap-1.5",
              filters.length > 0 && "w-6"
            )}
          >
            <ListFilter className="size-3 shrink-0 transition-all text-muted-foreground group-hover:text-primary" />
            {!filters.length && t('filter')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <AnimateChangeInHeight>
            <Command>
              <CommandInput
                placeholder={selectedView ? selectedView : t('filter-placeholder')}
                className="h-9"
                value={commandInput}
                onInputCapture={(e) => {
                  setCommandInput(e.currentTarget.value);
                }}
                ref={commandInputRef}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {selectedView ? (
                  <CommandGroup>
                    {config.filterOptions[selectedView].map(
                      (filter: FilterOption) => (
                        <CommandItem
                          className="group text-muted-foreground flex gap-2 items-center"
                          key={filter.name}
                          value={filter.name}
                          onSelect={(currentValue) => {
                            setFilters((prev) => [
                              ...prev,
                              {
                                id: nanoid(),
                                type: selectedView,
                                operator: FilterOperator.IS,
                                value: [currentValue],
                              },
                            ]);
                            setTimeout(() => {
                              setSelectedView(null);
                              setCommandInput("");
                            }, 200);
                            setOpen(false);
                          }}
                        >
                          {filter.icon}
                          <span className="text-accent-foreground">
                            {filter.name}
                          </span>
                          {filter.label && (
                            <span className="text-muted-foreground text-xs ml-auto">
                              {filter.label}
                            </span>
                          )}
                        </CommandItem>
                      )
                    )}
                  </CommandGroup>
                ) : (
                  filterViewOptions.map(
                    (group: FilterOption<AssetFilterType>[], index: number) => (
                      <React.Fragment key={index}>
                        <CommandGroup>
                          {group.map((filter: FilterOption<AssetFilterType>) => (
                            <CommandItem
                              className="group text-muted-foreground flex gap-2 items-center"
                              key={filter.name}
                              value={filter.name}
                              onSelect={(currentValue) => {
                                setSelectedView(currentValue as AssetFilterType);
                                setCommandInput("");
                                commandInputRef.current?.focus();
                              }}
                            >
                              {filter.icon}
                              <span className="text-accent-foreground">
                                {filter.name}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {index < filterViewOptions.length - 1 && (
                          <CommandSeparator />
                        )}
                      </React.Fragment>
                    )
                  )
                )}
              </CommandList>
            </Command>
          </AnimateChangeInHeight>
        </PopoverContent>
      </Popover>
      
      <GenericFilters
        filters={filters}
        setFilters={setFilters}
        config={config}
        isDateFilter={(filterType) => filterType === AssetFilterType.CREATED_DATE}
      />
      
      {filters.filter((filter) => filter.value?.length > 0).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="transition group h-6 text-xs items-center rounded-sm"
          onClick={() => setFilters([])}
        >
          Clear
        </Button>
      )}
    </div>
  );
} 
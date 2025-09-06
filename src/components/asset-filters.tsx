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
import { ListFilter, Image, Video, User, Bot, Calendar, UserCircle, Filter, FilterX, ImagePlay } from "lucide-react";
import { nanoid } from "nanoid";
import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimateChangeInHeight, FilterOperator } from "@/src/components/ui/generic-filters";
import GenericFilters, { GenericFilter, FilterConfig, FilterOption } from "@/src/components/ui/generic-filters";
import { IMediaSpace } from "@/src/types/space";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { useAssetFiltersStore } from "@/src/store/assetFiltersStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { 
  AssetFilterType, 
  AssetType, 
  AIGenerated, 
  DateRange 
} from "@/src/types/filters";

// Composant pour les avatars d'utilisateurs
const UserAvatar = ({ 
  userName, 
  members 
}: { 
  userName: string; 
  members?: Array<{ id: string; name: string; image?: string }> 
}) => {
  const member = members?.find(m => m.name === userName);
  return (
    <Avatar className="size-4 rounded-sm">
      {member?.image && <AvatarImage src={member.image} alt={member.name ?? ''} />}
      <AvatarFallback className="rounded-sm">
        {userName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

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
    case AssetType.ELEMENT:
      return <ImagePlay className="size-3.5 text-purple-500" />;
    case AIGenerated.YES:
    case AIGenerated.NO:
      return null;
    default:
      return <Calendar className="size-3.5" />;
  }
};

// Configuration des filtres pour les assets
const createAssetFilterConfig = (
  members: Array<{ id: string; name: string; image?: string }> = [],
  t: any
): FilterConfig<AssetFilterType> => {
  const typeFilterOptions: FilterOption<string>[] = Object.values(AssetType).map(
    (type) => ({
      name: type,
      label: t(`asset-types-values.${type}`),
      icon: <AssetFilterIcon type={type} />,
    })
  );

  const uploadedByFilterOptions: FilterOption<string>[] = members.map(
    (member) => ({
      name: member.name,
      icon: <UserAvatar userName={member.name} members={members} />,
    })
  );

  const aiGeneratedFilterOptions: FilterOption<string>[] = Object.values(AIGenerated).map(
    (value) => ({
      name: value,
      label: t(`boolean.${value}`),
      icon: undefined,
    })
  );

  const dateFilterOptions: FilterOption<string>[] = Object.values(DateRange).map(
    (date) => ({
      name: date,
      label: t(`date-ranges.${date}`),
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
    getFilterIcon: (type: AssetFilterType | string) => {
      // Si c'est un nom d'utilisateur (pas dans les enums), utiliser UserAvatar
      if (typeof type === 'string' && 
          !Object.values(AssetFilterType).includes(type as AssetFilterType) &&
          !Object.values(AssetType).includes(type as AssetType) &&
          !Object.values(AIGenerated).includes(type as AIGenerated) &&
          !Object.values(DateRange).includes(type as DateRange)) {
        return <UserAvatar userName={type} members={members} />;
      }
      
      // Retourner undefined pour les types qui n'ont pas d'icône
      if (Object.values(AIGenerated).includes(type as AIGenerated)) {
        return undefined;
      }
      
      return <AssetFilterIcon type={type} />;
    },
    getFilterLabel: (value: string) => {
      // Pour les types d'assets
      if (Object.values(AssetType).includes(value as AssetType)) {
        return t(`asset-types-values.${value}`);
      }
      if (Object.values(AIGenerated).includes(value as AIGenerated)) {
        return t(`boolean.${value}`);
      }
      if (Object.values(DateRange).includes(value as DateRange)) {
        return t(`date-ranges.${value}`);
      }
      
      // Pour les noms d'utilisateurs ou autres valeurs
      return value;
    },
    getFilterTypeLabel: (type: AssetFilterType) => {
      return t(`asset-types.${type}`);
    },
    getSelectedText: (count: number) => {
      const key = count > 1 ? 'selected-plural' : 'selected';
      return `${count} ${t(`ui.${key}`)}`;
    },
  };
};

// Hook pour filtrer les assets
export const useAssetFilters = (assets: IMediaSpace[]) => {
  const { activeSpace } = useActiveSpaceStore();
  const { filters, setFilters, clearFilters, updateFilter, removeFilter } = useAssetFiltersStore();

  const filteredAssets = React.useMemo(() => {
    if (filters.length === 0) return assets;

    return assets.filter((asset) => {
      return filters.every((filter) => {
        const { operator, value, type } = filter;
        
        switch (type) {
          case AssetFilterType.TYPE:
            let assetType: AssetType;
            if (asset.media.usage === 'element') {
              assetType = AssetType.ELEMENT;
            } else {
              assetType = asset.media.type === 'image' ? AssetType.IMAGE : AssetType.VIDEO;
            }
            
            if (operator === FilterOperator.IS) {
              return value.includes(assetType);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(assetType);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(assetType);
            }
            break;

          case AssetFilterType.AI_GENERATED:
            // Vérifier si c'est généré par AI : video.id contient "animated" ou image.id existe
            const isAIGenerated = (
              (asset.media.video?.id && asset.media.video.id.includes('animated')) ||
              (asset.media.image?.id && asset.media.image.id.includes('animated')) ||
              asset.media.requestId
            ) ? AIGenerated.YES : AIGenerated.NO;
            
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
                case DateRange.LAST_3_DAYS:
                  return diffDays <= 3;
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
    clearFilters,
    updateFilter,
    removeFilter,
    filteredAssets,
  };
};

// Composant de filtres pour les assets
export function AssetFilters() {
  const t = useTranslations('assets');
  const tFilters = useTranslations('filters');
  const { activeSpace } = useActiveSpaceStore();
  const { filters, setFilters, clearFilters } = useAssetFiltersStore();
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<AssetFilterType | null>(null);
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);

  // Adapter pour GenericFilters qui s'attend à une signature de useState
  const setFiltersForGeneric = React.useCallback((updater: React.SetStateAction<GenericFilter<AssetFilterType>[]>) => {
    if (typeof updater === 'function') {
      setFilters(updater(filters));
    } else {
      setFilters(updater);
    }
  }, [filters, setFilters]);

  const config = createAssetFilterConfig(activeSpace?.members, tFilters);

  const filterViewOptions: FilterOption<AssetFilterType>[][] = [
    [
      {
        name: AssetFilterType.TYPE,
        label: tFilters(`asset-types.${AssetFilterType.TYPE}`),
        icon: <AssetFilterIcon type={AssetFilterType.TYPE} />,
      },
      {
        name: AssetFilterType.AI_GENERATED,
        label: tFilters(`asset-types.${AssetFilterType.AI_GENERATED}`),
        icon: <AssetFilterIcon type={AssetFilterType.AI_GENERATED} />,
      },
      {
        name: AssetFilterType.UPLOADED_BY,
        label: tFilters(`asset-types.${AssetFilterType.UPLOADED_BY}`),
        icon: <AssetFilterIcon type={AssetFilterType.UPLOADED_BY} />,
      },
    ],
    [
      {
        name: AssetFilterType.CREATED_DATE,
        label: tFilters(`asset-types.${AssetFilterType.CREATED_DATE}`),
        icon: <AssetFilterIcon type={AssetFilterType.CREATED_DATE} />,
      },
    ],
  ];

  return (
    <div className="flex gap-2 flex-wrap items-center">
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
            variant="outline"
            role="combobox"
            aria-expanded={open}
            size="sm"
            className={cn(
              "transition group h-6 text-xs rounded-sm flex gap-1.5",
              filters.length > 0 && "w-6"
            )}
          >
            <Filter className="shrink-0 transition-all text-muted-foreground group-hover:text-primary" />
            {!filters.length && t('filter')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <AnimateChangeInHeight>
            <Command>
              <CommandInput
                placeholder={selectedView ? tFilters(`asset-types.${selectedView}`) : t('filter-placeholder')}
                className="h-9"
                value={commandInput}
                onInputCapture={(e) => {
                  setCommandInput(e.currentTarget.value);
                }}
                ref={commandInputRef}
              />
              <CommandList>
                <CommandEmpty>{tFilters('ui.no-results')}</CommandEmpty>
                {selectedView ? (
                  <CommandGroup>
                    {config.filterOptions[selectedView].map(
                      (filter: FilterOption) => (
                        <CommandItem
                          className="group text-muted-foreground flex gap-2 items-center"
                          key={filter.name}
                          value={filter.label || filter.name}
                          onSelect={(currentValue) => {
                            setFilters([
                              ...filters,
                              {
                                id: nanoid(),
                                type: selectedView,
                                operator: FilterOperator.IS,
                                value: [filter.name],
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
                            {filter.label || filter.name}
                          </span>
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
                              value={filter.label || filter.name}
                              onSelect={(currentValue) => {
                                setSelectedView(filter.name);
                                setCommandInput("");
                                commandInputRef.current?.focus();
                              }}
                            >
                              {filter.icon}
                              <span className="text-accent-foreground">
                                {filter.label || filter.name}
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
        setFilters={setFiltersForGeneric}
        config={config}
        isDateFilter={(filterType) => filterType === AssetFilterType.CREATED_DATE}
        tFilters={tFilters}
      />
      
      {filters.filter((filter) => filter.value?.length > 0).length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="transition group h-6 text-xs items-center rounded-sm"
          onClick={clearFilters}
        >
          <FilterX />
          {t('clear-filters')}
        </Button>
      )}
    </div>
  );
} 
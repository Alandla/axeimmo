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
import { ListFilter, Clock, User, Calendar, UserCircle, Video } from "lucide-react";
import { nanoid } from "nanoid";
import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimateChangeInHeight, FilterOperator } from "@/src/components/ui/generic-filters";
import GenericFilters, { GenericFilter, FilterConfig, FilterOption } from "@/src/components/ui/generic-filters";
import { IVideo } from "@/src/types/video";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

// Types de filtres pour les vidéos (préparés pour plus tard)
export enum VideoFilterType {
  DURATION = "Duration",
  CREATED_BY = "Created by", 
  HAS_AVATAR = "Has avatar",
  IS_OUTDATED = "Is outdated",
  CREATED_DATE = "Created date",
}

// Options pour chaque type de filtre
export enum VideoDuration {
  SHORT = "Short (< 30s)",
  MEDIUM = "Medium (30s-2m)",
  LONG = "Long (> 2m)",
}

export enum HasAvatar {
  YES = "Yes",
  NO = "No",
}

export enum IsOutdated {
  YES = "Yes",
  NO = "No",
}

export enum VideoDateRange {
  TODAY = "Today",
  YESTERDAY = "Yesterday", 
  LAST_7_DAYS = "Last 7 days",
  LAST_30_DAYS = "Last 30 days",
  LAST_90_DAYS = "Last 90 days",
}

const VideoFilterIcon = ({
  type,
}: {
  type: VideoFilterType | VideoDuration | HasAvatar | IsOutdated | VideoDateRange | string;
}) => {
  switch (type) {
    case VideoFilterType.DURATION:
      return <Clock className="size-3.5" />;
    case VideoFilterType.CREATED_BY:
      return <UserCircle className="size-3.5" />;
    case VideoFilterType.HAS_AVATAR:
      return <User className="size-3.5" />;
    case VideoFilterType.IS_OUTDATED:
      return <Video className="size-3.5" />;
    case VideoFilterType.CREATED_DATE:
      return <Calendar className="size-3.5" />;
    case VideoDuration.SHORT:
      return <Clock className="size-3.5 text-green-500" />;
    case VideoDuration.MEDIUM:
      return <Clock className="size-3.5 text-orange-500" />;
    case VideoDuration.LONG:
      return <Clock className="size-3.5 text-red-500" />;
    case HasAvatar.YES:
      return <User className="size-3.5 text-purple-500" />;
    case HasAvatar.NO:
      return <User className="size-3.5 text-gray-500" />;
    case IsOutdated.YES:
      return <Video className="size-3.5 text-red-500" />;
    case IsOutdated.NO:
      return <Video className="size-3.5 text-green-500" />;
    default:
      // Pour les utilisateurs, créer un avatar
      if (typeof type === 'string' && !Object.values(VideoDateRange).includes(type as VideoDateRange)) {
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

// Configuration des filtres pour les vidéos (préparée pour plus tard)
const createVideoFilterConfig = (
  members: Array<{ id: string; name: string; image: string }> = []
): FilterConfig<VideoFilterType> => {
  const durationFilterOptions: FilterOption<string>[] = Object.values(VideoDuration).map(
    (duration) => ({
      name: duration,
      icon: <VideoFilterIcon type={duration} />,
    })
  );

  const createdByFilterOptions: FilterOption<string>[] = members.map(
    (member) => ({
      name: member.name,
      icon: <VideoFilterIcon type={member.name} />,
    })
  );

  const hasAvatarFilterOptions: FilterOption<string>[] = Object.values(HasAvatar).map(
    (value) => ({
      name: value,
      icon: <VideoFilterIcon type={value} />,
    })
  );

  const isOutdatedFilterOptions: FilterOption<string>[] = Object.values(IsOutdated).map(
    (value) => ({
      name: value,
      icon: <VideoFilterIcon type={value} />,
    })
  );

  const dateFilterOptions: FilterOption<string>[] = Object.values(VideoDateRange).map(
    (date) => ({
      name: date,
      icon: undefined,
    })
  );

  return {
    filterTypes: Object.values(VideoFilterType) as VideoFilterType[],
    filterOptions: {
      [VideoFilterType.DURATION]: durationFilterOptions,
      [VideoFilterType.CREATED_BY]: createdByFilterOptions,
      [VideoFilterType.HAS_AVATAR]: hasAvatarFilterOptions,
      [VideoFilterType.IS_OUTDATED]: isOutdatedFilterOptions,
      [VideoFilterType.CREATED_DATE]: dateFilterOptions,
    },
    filterOperators: (filterType: VideoFilterType, filterValues: string[]) => {
      switch (filterType) {
        case VideoFilterType.DURATION:
        case VideoFilterType.CREATED_BY:
        case VideoFilterType.HAS_AVATAR:
        case VideoFilterType.IS_OUTDATED:
          if (Array.isArray(filterValues) && filterValues.length > 1) {
            return [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT];
          } else {
            return [FilterOperator.IS, FilterOperator.IS_NOT];
          }
        case VideoFilterType.CREATED_DATE:
          return [FilterOperator.IS, FilterOperator.IS_NOT];
        default:
          return [];
      }
    },
    getFilterIcon: (type: VideoFilterType | string) => <VideoFilterIcon type={type} />,
  };
};

// Hook pour filtrer les vidéos (pour plus tard)
export const useVideoFilters = (videos: IVideo[]) => {
  const { activeSpace } = useActiveSpaceStore();
  const [filters, setFilters] = React.useState<GenericFilter<VideoFilterType>[]>([]);

  const filteredVideos = React.useMemo(() => {
    if (filters.length === 0) return videos;

    return videos.filter((video) => {
      return filters.every((filter) => {
        const { operator, value, type } = filter;
        
        switch (type) {
          case VideoFilterType.DURATION:
            // Implémenter la logique de filtrage par durée
            // Cette partie sera implémentée lors de l'utilisation côté serveur
            break;

          case VideoFilterType.HAS_AVATAR:
            const hasAvatar = video.video?.avatar ? HasAvatar.YES : HasAvatar.NO;
            if (operator === FilterOperator.IS) {
              return value.includes(hasAvatar);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(hasAvatar);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(hasAvatar);
            }
            break;

          case VideoFilterType.IS_OUTDATED:
            const isOutdated = video.archived ? IsOutdated.YES : IsOutdated.NO;
            if (operator === FilterOperator.IS) {
              return value.includes(isOutdated);
            } else if (operator === FilterOperator.IS_NOT) {
              return !value.includes(isOutdated);
            } else if (operator === FilterOperator.IS_ANY_OF) {
              return value.includes(isOutdated);
            }
            break;

          case VideoFilterType.CREATED_BY:
            // Implémenter la logique de filtrage par créateur
            // Cette partie sera implémentée lors de l'utilisation côté serveur
            break;

          case VideoFilterType.CREATED_DATE:
            // Implémenter la logique de filtrage par date
            // Cette partie sera implémentée lors de l'utilisation côté serveur
            break;
        }
        return true;
      });
    });
  }, [videos, filters, activeSpace]);

  return {
    filters,
    setFilters,
    filteredVideos,
  };
};

// Composant de filtres pour les vidéos (pour plus tard)
interface VideoFiltersProps {
  filters: GenericFilter<VideoFilterType>[];
  setFilters: React.Dispatch<React.SetStateAction<GenericFilter<VideoFilterType>[]>>;
}

export function VideoFilters({ filters, setFilters }: VideoFiltersProps) {
  const t = useTranslations('videos');
  const { activeSpace } = useActiveSpaceStore();
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<VideoFilterType | null>(null);
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);

  const config = createVideoFilterConfig(activeSpace?.members);

  const filterViewOptions: FilterOption<VideoFilterType>[][] = [
    [
      {
        name: VideoFilterType.DURATION,
        icon: <VideoFilterIcon type={VideoFilterType.DURATION} />,
      },
      {
        name: VideoFilterType.HAS_AVATAR,
        icon: <VideoFilterIcon type={VideoFilterType.HAS_AVATAR} />,
      },
      {
        name: VideoFilterType.IS_OUTDATED,
        icon: <VideoFilterIcon type={VideoFilterType.IS_OUTDATED} />,
      },
      {
        name: VideoFilterType.CREATED_BY,
        icon: <VideoFilterIcon type={VideoFilterType.CREATED_BY} />,
      },
    ],
    [
      {
        name: VideoFilterType.CREATED_DATE,
        icon: <VideoFilterIcon type={VideoFilterType.CREATED_DATE} />,
      },
    ],
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      <GenericFilters
        filters={filters}
        setFilters={setFilters}
        config={config}
        isDateFilter={(filterType) => filterType === VideoFilterType.CREATED_DATE}
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
              "transition group h-6 text-xs items-center rounded-sm flex gap-1.5 items-center",
              filters.length > 0 && "w-6"
            )}
          >
            <ListFilter className="size-3 shrink-0 transition-all text-muted-foreground group-hover:text-primary" />
            {!filters.length && t('filter')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
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
                    (group: FilterOption<VideoFilterType>[], index: number) => (
                      <React.Fragment key={index}>
                        <CommandGroup>
                          {group.map((filter: FilterOption<VideoFilterType>) => (
                            <CommandItem
                              className="group text-muted-foreground flex gap-2 items-center"
                              key={filter.name}
                              value={filter.name}
                              onSelect={(currentValue) => {
                                setSelectedView(currentValue as VideoFilterType);
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
    </div>
  );
} 
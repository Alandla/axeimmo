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
import { ListFilter, Clock, User, Bot, Calendar, UserCircle, Filter, FilterX, Video } from "lucide-react";
import { nanoid } from "nanoid";
import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimateChangeInHeight, FilterOperator } from "@/src/components/ui/generic-filters";
import GenericFilters, { GenericFilter, FilterConfig, FilterOption } from "@/src/components/ui/generic-filters";
import { IVideo } from "@/src/types/video";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { useVideoFiltersStore } from "@/src/store/videoFiltersStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { 
  VideoFilterType, 
  VideoDuration, 
  HasAvatar, 
  IsOutdated, 
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

const VideoFilterIcon = ({
  type,
}: {
  type: VideoFilterType | VideoDuration | HasAvatar | IsOutdated | DateRange | string;
}) => {
  switch (type) {
    case VideoFilterType.DURATION:
      return <Clock className="size-3.5" />;
    case VideoFilterType.CREATED_BY:
      return <UserCircle className="size-3.5" />;
    case VideoFilterType.HAS_AVATAR:
      return <Bot className="size-3.5" />;
    case VideoFilterType.IS_OUTDATED:
      return <Video className="size-3.5" />;
    case VideoFilterType.CREATED_DATE:
      return <Calendar className="size-3.5" />;
    case VideoDuration.LESS_THAN_30S:
    case VideoDuration.BETWEEN_30S_1MIN:
    case VideoDuration.BETWEEN_1MIN_2MIN:
    case VideoDuration.BETWEEN_2MIN_5MIN:
    case VideoDuration.MORE_THAN_5MIN:
      return <Clock className="size-3.5 text-blue-500" />;
    case HasAvatar.YES:
    case HasAvatar.NO:
    case IsOutdated.YES:
    case IsOutdated.NO:
      return null;
    default:
      return <Calendar className="size-3.5" />;
  }
};

// Configuration des filtres pour les vidéos
const createVideoFilterConfig = (
  members: Array<{ id: string; name: string; image?: string }> = [],
  t: any
): FilterConfig<VideoFilterType> => {
  const durationFilterOptions: FilterOption<string>[] = Object.values(VideoDuration).map(
    (duration) => ({
      name: duration,
      label: t(`durations.${duration}`),
      icon: <VideoFilterIcon type={duration} />,
    })
  );

  const createdByFilterOptions: FilterOption<string>[] = members.map(
    (member) => ({
      name: member.name,
      icon: <UserAvatar userName={member.name} members={members} />,
    })
  );

  const hasAvatarFilterOptions: FilterOption<string>[] = Object.values(HasAvatar).map(
    (value) => ({
      name: value,
      label: t(`boolean.${value}`),
      icon: <VideoFilterIcon type={value} />,
    })
  );

  const isOutdatedFilterOptions: FilterOption<string>[] = Object.values(IsOutdated).map(
    (value) => ({
      name: value,
      label: t(`boolean.${value}`),
      icon: <VideoFilterIcon type={value} />,
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
    getFilterIcon: (type: VideoFilterType | string) => {
      if (typeof type === 'string' && 
          !Object.values(VideoFilterType).includes(type as VideoFilterType) &&
          !Object.values(VideoDuration).includes(type as VideoDuration) &&
          !Object.values(HasAvatar).includes(type as HasAvatar) &&
          !Object.values(IsOutdated).includes(type as IsOutdated) &&
          !Object.values(DateRange).includes(type as DateRange)) {
        return <UserAvatar userName={type} members={members} />;
      }
      return <VideoFilterIcon type={type} />;
    },
    getFilterLabel: (value: string) => {
      // Pour les valeurs spécifiques
      if (Object.values(VideoDuration).includes(value as VideoDuration)) {
        return t(`durations.${value}`);
      }
      if (Object.values(HasAvatar).includes(value as HasAvatar) || 
          Object.values(IsOutdated).includes(value as IsOutdated)) {
        return t(`boolean.${value}`);
      }
      if (Object.values(DateRange).includes(value as DateRange)) {
        return t(`date-ranges.${value}`);
      }
      
      // Pour les noms d'utilisateurs ou autres valeurs
      return value;
    },
    getFilterTypeLabel: (type: VideoFilterType) => {
      return t(`video-types.${type}`);
    },
    getSelectedText: (count: number) => {
      const key = count > 1 ? 'selected-plural' : 'selected';
      return `${count} ${t(`ui.${key}`)}`;
    },
  };
};

// Composant de filtres pour les vidéos
export function VideoFilters() {
  const t = useTranslations('videos');
  const tFilters = useTranslations('filters');
  const { activeSpace } = useActiveSpaceStore();
  const { filters, setFilters, clearFilters } = useVideoFiltersStore();
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<VideoFilterType | null>(null);
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);

  // Adapter pour GenericFilters qui s'attend à une signature de useState
  const setFiltersForGeneric = React.useCallback((updater: React.SetStateAction<GenericFilter<VideoFilterType>[]>) => {
    if (typeof updater === 'function') {
      setFilters(updater(filters));
    } else {
      setFilters(updater);
    }
  }, [filters, setFilters]);

  const config = createVideoFilterConfig(activeSpace?.members, tFilters);

  const filterViewOptions: FilterOption<VideoFilterType>[][] = [
    [
      {
        name: VideoFilterType.DURATION,
        label: tFilters(`video-types.${VideoFilterType.DURATION}`),
        icon: <VideoFilterIcon type={VideoFilterType.DURATION} />,
      },
      {
        name: VideoFilterType.HAS_AVATAR,
        label: tFilters(`video-types.${VideoFilterType.HAS_AVATAR}`),
        icon: <VideoFilterIcon type={VideoFilterType.HAS_AVATAR} />,
      },
      {
        name: VideoFilterType.IS_OUTDATED,
        label: tFilters(`video-types.${VideoFilterType.IS_OUTDATED}`),
        icon: <VideoFilterIcon type={VideoFilterType.IS_OUTDATED} />,
      },
      {
        name: VideoFilterType.CREATED_BY,
        label: tFilters(`video-types.${VideoFilterType.CREATED_BY}`),
        icon: <VideoFilterIcon type={VideoFilterType.CREATED_BY} />,
      },
    ],
    [
      {
        name: VideoFilterType.CREATED_DATE,
        label: tFilters(`video-types.${VideoFilterType.CREATED_DATE}`),
        icon: <VideoFilterIcon type={VideoFilterType.CREATED_DATE} />,
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
                    (group: FilterOption<VideoFilterType>[], index: number) => (
                      <React.Fragment key={index}>
                        <CommandGroup>
                          {group.map((filter: FilterOption<VideoFilterType>) => (
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
        isDateFilter={(filterType) => filterType === VideoFilterType.CREATED_DATE}
        tFilters={tFilters}
      />
      
      {filters.filter((filter: GenericFilter<VideoFilterType>) => filter.value?.length > 0).length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="transition group h-6 text-xs items-center rounded-sm"
          onClick={clearFilters}
        >
          <FilterX />
          Clear
        </Button>
      )}
    </div>
  );
} 
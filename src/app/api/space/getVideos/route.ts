import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { getVideosBySpaceId, VideoFilters } from '@/src/dao/videoDao';
import { GenericFilter, FilterOperator } from '@/src/components/ui/generic-filters';
import { VideoFilterType, VideoDuration, HasAvatar, IsOutdated, DateRange } from '@/src/types/filters';

// Fonction pour convertir les filtres UI vers les filtres DAO
const convertFiltersToDao = (uiFilters: GenericFilter<VideoFilterType>[]): VideoFilters => {
  const daoFilters: VideoFilters = {};

  for (const filter of uiFilters) {
    console.log("filter", filter);
    const { type, operator, value } = filter;

    switch (type) {
      case VideoFilterType.DURATION:
        // Convertir les durées textuelles en secondes
        const durations = value.map(duration => {
          switch (duration) {
            case VideoDuration.LESS_THAN_30S:
              return { min: 0, max: 30 };
            case VideoDuration.BETWEEN_30S_1MIN:
              return { min: 30, max: 60 };
            case VideoDuration.BETWEEN_1MIN_2MIN:
              return { min: 60, max: 120 };
            case VideoDuration.BETWEEN_2MIN_5MIN:
              return { min: 120, max: 300 };
            case VideoDuration.MORE_THAN_5MIN:
              return { min: 300, max: undefined };
            default:
              return null;
          }
        }).filter(Boolean);

        if (durations.length > 0) {
          // Pour IS_ANY_OF, on prend la plage la plus large
          const allMins = durations.map(d => d!.min).filter(v => v !== undefined);
          const allMaxs = durations.map(d => d!.max).filter(v => v !== undefined);
          
          daoFilters.duration = {
            min: Math.min(...allMins),
            max: allMaxs.length > 0 ? Math.max(...allMaxs) : undefined,
            isNot: operator === "is not"
          };
        }
        break;

      case VideoFilterType.CREATED_BY:
        // Les valeurs sont déjà des IDs d'utilisateurs
        console.log("value", value);
        if (value.length > 0) {
          daoFilters.createdBy = {
            userIds: value,
            isNot: operator === "is not"
          };
        }
        break;

      case VideoFilterType.HAS_AVATAR:
        if (value.length > 0) {
          const hasAvatarValue = value[0] === HasAvatar.YES;
          daoFilters.hasAvatar = {
            value: hasAvatarValue,
            isNot: operator === "is not"
          };
        }
        break;

      case VideoFilterType.IS_OUTDATED:
        if (value.length > 0) {
          const isOutdatedValue = value[0] === IsOutdated.YES;
          daoFilters.isOutdated = {
            value: isOutdatedValue,
            isNot: operator === "is not"
          };
        }
        break;

      case VideoFilterType.CREATED_DATE:
        // Convertir les plages de dates
        if (value.length > 0) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          let startDate: Date | undefined;
          let endDate: Date | undefined;

          value.forEach(dateRange => {
            let rangeStart: Date;
            let rangeEnd: Date;

            switch (dateRange) {
              case DateRange.TODAY:
                rangeStart = today;
                rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
              case DateRange.YESTERDAY:
                rangeStart = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                rangeEnd = today;
                break;
              case DateRange.LAST_3_DAYS:
                rangeStart = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
                rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
              case DateRange.LAST_7_DAYS:
                rangeStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
              case DateRange.LAST_30_DAYS:
                rangeStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
              case DateRange.LAST_90_DAYS:
                rangeStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                rangeEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
              default:
                return;
            }

            if (!startDate || rangeStart < startDate) {
              startDate = rangeStart;
            }
            if (!endDate || rangeEnd > endDate) {
              endDate = rangeEnd;
            }
          });

          if (startDate && endDate) {
            daoFilters.createdDate = {
              startDate,
              endDate,
              isNot: operator === "is not"
            };
          }
        }
        break;
    }
  }

  return daoFilters;
};

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/getVideos by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, page = 1, limit = 20, filters } = params;

  try {
    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convertir les filtres UI vers les filtres DAO si on a des filtres
    let daoFilters: VideoFilters | undefined;
    if (filters && filters.length > 0) {
      daoFilters = convertFiltersToDao(filters);
      console.log("daoFilters", daoFilters);
    }

    const { videos, totalCount, currentPage, totalPages } = await getVideosBySpaceId(spaceId, page, limit, daoFilters);

    return NextResponse.json({ data: { videos, totalCount, currentPage, totalPages } })
  } catch (error) {
    console.error('Error getting space videos:', error)
    return NextResponse.json({ error: 'Error getting space videos' }, { status: 500 })
  }
}
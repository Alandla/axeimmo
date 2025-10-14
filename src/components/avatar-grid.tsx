"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import {
  IconGenderFemale,
  IconGenderMale,
  IconGenderMaleFemale,
  VoiceCard,
} from "./voice-card";
import { Badge } from "@/src/components/ui/badge";
import { Check, UserRoundX, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/src/hooks/use-toast";
import { basicApiCall, basicApiDeleteCall } from "@/src/lib/api";
import { avatarsConfig } from "../config/avatars.config";
import { Avatar, AvatarLook } from "../types/avatar";
import { AvatarCard } from "./avatar-card";
import { AvatarLookCard } from "./avatar-look-card";
import { useCreationStore } from "../store/creationStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination";
import { cn, getMostFrequentString } from "@/src/lib/utils";
import { useActiveSpaceStore } from "../store/activeSpaceStore";
import { getSpaceAvatars } from "../service/space.service";
import { useAvatarsStore } from "../store/avatarsStore";
import { HorizontalScrollList } from "./ui/horizontal-scroll-list";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { InfiniteScroll } from "@/src/components/ui/infinite-scroll";
import CreateAvatarModal from "@/src/components/modal/create-avatar-modal";
import AvatarLookChatbox from "@/src/components/avatar-look-chatbox";
import { getMediaUrlFromFileByPresignedUrl } from "@/src/service/upload.service";
import { AddLookCard } from "./add-look-card";
import ModalConfirmDeleteAvatar from "@/src/components/modal/confirm-delete-avatar";
import ModalConfirmDeleteLook from "@/src/components/modal/confirm-delete-look";
import { Avatar as UIAvatar, AvatarFallback } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import UnlockAvatarCreationModal from "@/src/components/modal/unlock-avatar-creation";
import { PlanName } from "../types/enums";

// Composant pour la carte "No avatar"
function NoAvatarCard({
  selectedLook,
  onLookChange,
  onAvatarNameChange,
}: {
  selectedLook: AvatarLook | null;
  onLookChange: (look: AvatarLook | null) => void;
  onAvatarNameChange: (name: string | null) => void;
}) {
  const t = useTranslations("avatars");
  const isSelected = !selectedLook;

  const handleClick = () => {
    onLookChange(null);
    onAvatarNameChange(null);
  };

  return (
    <Card
      className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Image principale */}
      <div className="w-full aspect-[3/4] relative bg-gray-100 flex items-center justify-center">
        <UserRoundX className="h-12 w-12 text-gray-400" />
      </div>

      {/* Bande d'information en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">
            {t("no-avatar-name")}
          </h3>
        </div>
      </div>
    </Card>
  );
}

// Skeleton pour une carte d'avatar personnel en chargement
function AvatarSkeletonCard() {
  return (
    <Card className="relative overflow-hidden rounded-lg">
      <div className="w-full aspect-[3/4] relative">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );
}

interface AvatarGridComponentProps {
  mode?: "default" | "large";
  variant?: "select" | "create";
  // Props pour le mode contrôlé
  selectedLook?: AvatarLook | null;
  onLookChange?: (look: AvatarLook | null) => void;
  selectedAvatarName?: string | null;
  onAvatarNameChange?: (name: string | null) => void;
  // Props pour personnaliser le comportement
  showNoAvatar?: boolean;
}

export function AvatarGridComponent({
  mode = "default",
  variant = "select",
  selectedLook: controlledSelectedLook,
  onLookChange,
  selectedAvatarName: controlledSelectedAvatarName,
  onAvatarNameChange,
  showNoAvatar = true,
}: AvatarGridComponentProps) {
  const t = useTranslations("avatars");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Déterminer si on est en mode contrôlé
  const isControlled =
    controlledSelectedLook !== undefined || onLookChange !== undefined;

  // Store hooks (utilisés seulement en mode non-contrôlé)
  const storeState = useCreationStore();
  const {
    selectedVoice,
    setSelectedLook: setStoreSelectedLook,
    selectedLook: storeSelectedLook,
  } = storeState;

  // Valeurs effectives (contrôlées ou du store)
  const selectedLook = isControlled
    ? controlledSelectedLook
    : storeSelectedLook;
  const selectedAvatarName = isControlled
    ? controlledSelectedAvatarName
    : storeState.selectedAvatarName;

  // Fonctions de mise à jour
  const setSelectedLook = (look: AvatarLook | null) => {
    if (isControlled && onLookChange) {
      onLookChange(look);
    } else if (!isControlled) {
      setStoreSelectedLook(look);
    }
  };

  const setSelectedAvatarName = (name: string | null) => {
    if (isControlled && onAvatarNameChange) {
      onAvatarNameChange(name);
    } else if (!isControlled) {
      storeState.setSelectedAvatarName(name);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>(
    selectedVoice?.gender || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const avatarsPerPage = mode === "large" ? 12 : 6;
  const [visiblePublicCount, setVisiblePublicCount] =
    useState<number>(avatarsPerPage);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeAvatar, setActiveAvatar] = useState<Avatar | null>(null);
  const [publicAvatars, setPublicAvatars] = useState<Avatar[]>(avatarsConfig);
  const [spaceAvatars, setSpaceAvatars] = useState<Avatar[]>([]);
  const [isLoadingSpaceAvatars, setIsLoadingSpaceAvatars] =
    useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUploadingLook, setIsUploadingLook] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [barRect, setBarRect] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const [isModalConfirmDeleteOpen, setIsModalConfirmDeleteOpen] =
    useState(false);
  const [isModalConfirmDeleteLookOpen, setIsModalConfirmDeleteLookOpen] =
    useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [editingLook, setEditingLook] = useState<AvatarLook | null>(null);
  const [shouldFocusChatbox, setShouldFocusChatbox] = useState(false);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const [pulseCounter, setPulseCounter] = useState(0);

  // États pour l'édition du nom d'avatar
  const [isEditingAvatarName, setIsEditingAvatarName] = useState(false);
  const [editedAvatarName, setEditedAvatarName] = useState("");
  const avatarNameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateUrlParamsForAvatar = (avatar: Avatar | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (avatar) {
      params.set("avatar", avatar.id);
      try { useAvatarsStore.getState().setActiveAvatarName(avatar.name) } catch {}
    } else {
      params.delete("avatar");
      try { useAvatarsStore.getState().setActiveAvatarName(null) } catch {}
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : `${pathname}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    const updateRect = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setBarRect({ left: rect.left, width: rect.width });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  // reference handled in AvatarLookChatbox

  const { activeSpace, lastUsedParameters } = useActiveSpaceStore();
  const {
    avatarsBySpace,
    getCachedAvatars,
    fetchAvatars,
    fetchAvatarsInBackground,
    setAvatars,
    startSse,
    stopSse,
  } = useAvatarsStore();

  // Récupérer les informations du créateur de l'avatar
  const getAvatarCreator = () => {
    if (!activeAvatar || !activeSpace?.members) {
      return { id: "", name: "API", image: "" };
    }
    // Pour l'instant, on utilise le premier membre disponible ou on retourne des valeurs par défaut
    // TODO: Ajouter un système d'historique pour les avatars
    if (activeSpace.members.length > 0) {
      return activeSpace.members[0] || { id: "", name: "API", image: "" };
    }
    return { id: "", name: "API", image: "" };
  };

  const avatarCreator = getAvatarCreator();

  // Ajouter l'état pour la pagination des looks
  const [currentLookPage, setCurrentLookPage] = useState(1);
  const looksPerPage = mode === "large" ? 12 : 6;

  // Sync local spaceAvatars with store updates (e.g., SSE refresh)
  useEffect(() => {
    if (!activeSpace?.id) return;
    const fromStore = avatarsBySpace.get(activeSpace.id);
    if (fromStore) {
      setSpaceAvatars(fromStore);
      // Keep active avatar in sync if present
      if (activeAvatar?.id) {
        const refreshedActive = fromStore.find((a) => a.id === activeAvatar.id);
        if (refreshedActive) setActiveAvatar(refreshedActive);
      }
    }
  }, [avatarsBySpace, activeSpace?.id]);

  // Fonctions pour l'édition du nom d'avatar
  const startEditingAvatarName = useCallback(() => {
    if (!activeAvatar) return;
    setIsEditingAvatarName(true);
    setEditedAvatarName(activeAvatar.name);
    setTimeout(() => {
      avatarNameInputRef.current?.focus();
    }, 200);
  }, [activeAvatar]);

  const handleAvatarNameSave = useCallback(async () => {
    if (!activeAvatar || !activeSpace?.id) return;

    setIsEditingAvatarName(false);
    if (editedAvatarName !== activeAvatar.name && editedAvatarName.trim()) {
      try {
        await basicApiCall(
          `/space/${activeSpace.id}/avatars/${activeAvatar.id}/rename`,
          {
            name: editedAvatarName.trim(),
          }
        );

        // Mettre à jour l'avatar local
        const updatedAvatar = {
          ...activeAvatar,
          name: editedAvatarName.trim(),
        };
        setActiveAvatar(updatedAvatar);

        // Mettre à jour dans la liste des avatars de l'espace
        setSpaceAvatars((prev) =>
          prev.map((avatar) =>
            avatar.id === activeAvatar.id
              ? { ...avatar, name: editedAvatarName.trim() }
              : avatar
          )
        );
        // Sync store
        setAvatars(
          activeSpace.id,
          useAvatarsStore
            .getState()
            .avatarsBySpace.get(activeSpace.id)
            ?.map((a) =>
              a.id === activeAvatar.id
                ? ({ ...a, name: editedAvatarName.trim() } as Avatar)
                : a
            ) || []
        );

        toast({
          title: t("toast.avatar-name-saved"),
          description: t("toast.avatar-name-saved-description"),
          variant: "confirm",
        });
      } catch (error) {
        console.error("Error updating avatar name:", error);
        setEditedAvatarName(activeAvatar.name);
        toast({
          title: t("toast.error"),
          description: t("toast.avatar-name-error"),
          variant: "destructive",
        });
      }
    } else {
      setEditedAvatarName(activeAvatar.name);
    }
  }, [activeAvatar, activeSpace?.id, editedAvatarName, t, toast]);

  // Fonction pour supprimer un avatar
  const handleDeleteAvatar = useCallback(
    async (avatar: Avatar) => {
      if (!activeSpace?.id) return;

      try {
        await basicApiDeleteCall(
          `/space/${activeSpace.id}/avatars/${avatar.id}/delete`
        );

        // Retirer l'avatar de la liste des avatars de l'espace
        setSpaceAvatars((prev) => prev.filter((a) => a.id !== avatar.id));
        // Sync store
        setAvatars(
          activeSpace.id,
          (
            useAvatarsStore.getState().avatarsBySpace.get(activeSpace.id) || []
          ).filter((a) => a.id !== avatar.id)
        );

        // Si l'avatar supprimé était l'avatar actif, le désélectionner
        if (activeAvatar?.id === avatar.id) {
          setActiveAvatar(null);
          updateUrlParamsForAvatar(null);
        }

        toast({
          title: t("toast.avatar-deleted"),
          description: t("toast.avatar-deleted-description"),
          variant: "confirm",
        });
      } catch (error) {
        console.error("Error deleting avatar:", error);
        toast({
          title: t("toast.error"),
          description: t("toast.avatar-delete-error"),
          variant: "destructive",
        });
      }
    },
    [activeSpace?.id, activeAvatar, t, toast]
  );

  // Fonction pour supprimer un look
  const handleDeleteLook = useCallback(
    async (look: AvatarLook) => {
      if (!activeSpace?.id || !activeAvatar?.id || !look.id) return;

      try {
        await basicApiDeleteCall(
          `/space/${activeSpace.id}/avatars/${activeAvatar.id}/looks/${look.id}/delete`
        );

        // Retirer le look de l'avatar local
        const updatedAvatar = {
          ...activeAvatar,
          looks: activeAvatar.looks.filter((l: AvatarLook) => l.id !== look.id),
        };
        setActiveAvatar(updatedAvatar);

        // Mettre à jour dans la liste des avatars de l'espace
        setSpaceAvatars((prev) =>
          prev.map((avatar) =>
            avatar.id === activeAvatar.id ? updatedAvatar : avatar
          )
        );
        // Sync store
        setAvatars(
          activeSpace.id,
          (
            useAvatarsStore.getState().avatarsBySpace.get(activeSpace.id) || []
          ).map((a) => (a.id === activeAvatar.id ? updatedAvatar : a))
        );

        // Si le look supprimé était sélectionné, le désélectionner
        if (selectedLook?.id === look.id) {
          setSelectedLook(null);
        }

        toast({
          title: t("toast.look-deleted"),
          description: t("toast.look-deleted-description"),
          variant: "confirm",
        });
      } catch (error) {
        console.error("Error deleting look:", error);
        toast({
          title: t("toast.error"),
          description: t("toast.look-delete-error"),
          variant: "destructive",
        });
      }
    },
    [activeSpace?.id, activeAvatar, selectedLook, t, toast]
  );

  // Fonction pour gérer l'édition d'un look
  const focusChatboxPrompt = useCallback(() => {
    const attemptFocus = (attempts = 0) => {
      if (attempts > 10) return;
      const el = promptInputRef.current;
      if (!el) {
        setTimeout(() => attemptFocus(attempts + 1), 100);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      el.click();
      setTimeout(() => {
        if (document.activeElement !== el) attemptFocus(attempts + 1);
      }, 50);
    };
    setTimeout(() => attemptFocus(0), 200);
  }, []);

  const handleEditLook = useCallback((look: AvatarLook) => {
    setEditingLook(look);
    setShouldFocusChatbox(true);
    focusChatboxPrompt();
    setPulseCounter((c) => c + 1);
  }, [focusChatboxPrompt]);


  // Polling pour rafraîchir tant que des thumbnails manquent
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Obtenir tous les tags uniques (espace + publics)
  const allTags = Array.from(
    new Set(
      [...spaceAvatars, ...publicAvatars].flatMap((avatar) => avatar.tags)
    )
  );

  // Fonction pour trier les avatars avec les derniers utilisés en premier
  const sortAvatarsByLastUsed = (avatarsToSort: Avatar[]) => {
    if (!lastUsedParameters?.avatars) return avatarsToSort;

    return [...avatarsToSort].sort((a, b) => {
      // Vérifier si l'avatar a un look dans les derniers utilisés
      const aHasLastUsedLook = a.looks.some(
        (look) => look.id && lastUsedParameters.avatars.includes(look.id)
      );
      const bHasLastUsedLook = b.looks.some(
        (look) => look.id && lastUsedParameters.avatars.includes(look.id)
      );

      if (aHasLastUsedLook && !bHasLastUsedLook) return -1;
      if (!aHasLastUsedLook && bHasLastUsedLook) return 1;

      // Si les deux ont des looks utilisés, trier par le plus récent look utilisé
      if (aHasLastUsedLook && bHasLastUsedLook) {
        const aMinIndex = Math.min(
          ...a.looks
            .filter(
              (look) => look.id && lastUsedParameters.avatars.includes(look.id)
            )
            .map((look) =>
              look.id ? lastUsedParameters.avatars.indexOf(look.id) : Infinity
            )
        );
        const bMinIndex = Math.min(
          ...b.looks
            .filter(
              (look) => look.id && lastUsedParameters.avatars.includes(look.id)
            )
            .map((look) =>
              look.id ? lastUsedParameters.avatars.indexOf(look.id) : Infinity
            )
        );
        return aMinIndex - bMinIndex;
      }

      return 0;
    });
  };

  // Fonction pour trier les looks avec les derniers utilisés en premier
  const sortLooksByLastUsed = (looksToSort: AvatarLook[]) => {
    if (!lastUsedParameters?.avatars) return looksToSort;

    return [...looksToSort].sort((a, b) => {
      const aIsLastUsed = a.id && lastUsedParameters.avatars.includes(a.id);
      const bIsLastUsed = b.id && lastUsedParameters.avatars.includes(b.id);

      if (aIsLastUsed && !bIsLastUsed) return -1;
      if (!aIsLastUsed && bIsLastUsed) return 1;

      // Si les deux sont dans lastUsed, trier par ordre d'utilisation (plus récent d'abord)
      if (aIsLastUsed && bIsLastUsed && a.id && b.id) {
        const aIndex = lastUsedParameters.avatars.indexOf(a.id);
        const bIndex = lastUsedParameters.avatars.indexOf(b.id);
        return aIndex - bIndex;
      }

      return 0;
    });
  };

  const fetchSpaceAvatars = async (
    lastUsed?: String | undefined,
    forceRefresh: boolean = false
  ) => {
    if (activeSpace?.id) {
      try {
        setIsLoadingSpaceAvatars(true);
        // Utiliser le store pour le flux principal
        const spaceAvatarsFetched: Avatar[] = await fetchAvatars(
          activeSpace.id,
          forceRefresh
        );
        setSpaceAvatars(spaceAvatarsFetched || []);
        // Mettre à jour l'activeAvatar pour refléter les dernières thumbnails/looks
        if (activeAvatar?.id && spaceAvatarsFetched) {
          const refreshedActive = spaceAvatarsFetched.find(
            (a) => a.id === activeAvatar.id
          );
          if (refreshedActive) setActiveAvatar(refreshedActive);
        }
        if (lastUsed && spaceAvatarsFetched) {
          const avatar = spaceAvatarsFetched.find(
            (avatar) => avatar.id === lastUsed
          );
          if (avatar) {
            const look = avatar.looks.find((l) => l.id === lastUsed);
            if (look) {
              setSelectedLook(look);
            }
          }
        }
        // Sync initial active avatar from URL after fetch
        const avatarFromUrl = searchParams?.get("avatar");
        if (avatarFromUrl) {
          const foundSpace = spaceAvatarsFetched?.find(
            (a) => a.id === avatarFromUrl
          );
          const foundPublic = avatarsConfig.find((a) => a.id === avatarFromUrl);
          const toActivate = foundSpace || foundPublic || null;
          if (toActivate) {
            setActiveAvatar(toActivate);
          }
        }
      } finally {
        setIsLoadingSpaceAvatars(false);
      }
    }
  };

  useEffect(() => {
    let lastUsed: String | undefined;
    if (lastUsedParameters) {
      const mostFrequent = getMostFrequentString(lastUsedParameters.avatars);
      if (mostFrequent && mostFrequent === "999") {
        lastUsed = mostFrequent;
        const avatar = avatarsConfig.find((avatar) =>
          avatar.looks.some((look) => look.id === lastUsed)
        );
        if (avatar) {
          const look = avatar.looks.find((l) => l.id === lastUsed);
          if (look) {
            setSelectedLook(look);
          }
        }
      }
    }

    if (activeSpace?.id) {
      // Cache-first
      const cached = getCachedAvatars(activeSpace.id);
      if (cached) {
        setSpaceAvatars(cached);
        setIsLoadingSpaceAvatars(false);
      }
      // SWR rafraîchissement en arrière-plan
      fetchAvatarsInBackground(activeSpace.id)
        .then((fresh) => {
          // mettre à jour local si toujours même espace
          if (
            useActiveSpaceStore.getState().activeSpace?.id === activeSpace.id
          ) {
            setSpaceAvatars(fresh);
          }
        })
        .catch(() => {});
      // Si pas de cache, charger de manière bloquante pour la première vue
      if (!cached) {
        // Activer immédiatement le loading pour afficher les skeletons au premier rendu
        setIsLoadingSpaceAvatars(true);
        fetchSpaceAvatars(lastUsed);
      }
    } else {
      // Pas d'espace actif: pas de chargement d'avatars
      setIsLoadingSpaceAvatars(false);
    }
  }, [activeSpace?.id]);

  // Handle initial activation from URL when already have public avatars (no space)
  useEffect(() => {
    if (spaceAvatars.length === 0) {
      const avatarFromUrl = searchParams?.get("avatar");
      if (avatarFromUrl) {
        const foundPublic = avatarsConfig.find((a) => a.id === avatarFromUrl);
        if (foundPublic) setActiveAvatar(foundPublic);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarsConfig.length]);

  // Abonnement SSE via store + fallback polling si thumbnails manquent
  useEffect(() => {
    const hasMissingThumbnails = spaceAvatars.some(
      (a) =>
        !a.thumbnail || a.looks.some((l) => !l.thumbnail || l.thumbnail === "")
    );

    const startPolling = () => {
      if (pollingRef.current || !activeSpace?.id) return;
      pollingRef.current = setInterval(async () => {
        try {
          const latest: Avatar[] = await fetchAvatarsInBackground(
            activeSpace.id as string
          );
          setSpaceAvatars(latest);
          // Mettre à jour activeAvatar si présent
          if (activeAvatar?.id) {
            const refreshedActive = latest.find(
              (a) => a.id === activeAvatar.id
            );
            if (refreshedActive) setActiveAvatar(refreshedActive);
          }
          const stillMissing = latest.some(
            (a) =>
              !a.thumbnail ||
              a.looks.some((l) => !l.thumbnail || l.thumbnail === "")
          );
          if (!stillMissing && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } catch (e) {
          // Stop polling on error to avoid loops; user can trigger manual refresh
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }, 10000);
    };

    // Démarrer SSE via store
    if (activeSpace?.id) {
      startSse(activeSpace.id);
    } else if (hasMissingThumbnails) {
      startPolling();
    }

    return () => {
      if (activeSpace?.id) stopSse(activeSpace.id);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [spaceAvatars, activeSpace?.id]);

  // Filtrer les avatars publics
  const filteredPublicAvatars = sortAvatarsByLastUsed(
    publicAvatars.filter((avatar) => {
      const matchesSearch = avatar.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGender =
        selectedGender === "all" ? true : avatar.gender === selectedGender;
      const matchesTags =
        selectedTags.length === 0
          ? true
          : selectedTags.every((tag) => avatar.tags.includes(tag));
      return matchesSearch && matchesGender && matchesTags;
    })
  );

  // Filtrer les avatars de l'espace
  const filteredSpaceAvatars = sortAvatarsByLastUsed(
    spaceAvatars.filter((avatar) => {
      const matchesSearch = avatar.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGender =
        selectedGender === "all" ? true : avatar.gender === selectedGender;
      const matchesTags =
        selectedTags.length === 0
          ? true
          : selectedTags.every((tag) => avatar.tags.includes(tag));
      return matchesSearch && matchesGender && matchesTags;
    })
  );

  // Pagination pour avatars publics (variant select) ou infinite scroll (variant create)
  const showNoAvatarCard =
    variant === "select" && !activeAvatar && currentPage === 1 && showNoAvatar;

  // Pour le variant select, utiliser la pagination classique
  const currentAvatars =
    variant === "select"
      ? filteredPublicAvatars.slice(
          (currentPage - 1) * avatarsPerPage,
          currentPage * avatarsPerPage
        )
      : filteredPublicAvatars.slice(0, visiblePublicCount);

  const totalPages = Math.ceil(filteredPublicAvatars.length / avatarsPerPage);

  // Pour la première page du variant select, inclure éventuellement la carte "No avatar"
  const avatarsToShow =
    variant === "select" && showNoAvatarCard
      ? currentAvatars.slice(0, avatarsPerPage - 1)
      : currentAvatars;

  // Calculs pour la pagination des looks
  const filteredLooks = activeAvatar
    ? sortLooksByLastUsed(
        activeAvatar.looks.filter((look) => {
          if (selectedTags.length === 0) return true;
          return selectedTags.every((tag) => look.tags?.includes(tag) || false);
        })
      )
    : [];

  const indexOfLastLook = currentLookPage * looksPerPage;
  const indexOfFirstLook = indexOfLastLook - looksPerPage;
  const currentLooks = filteredLooks.slice(indexOfFirstLook, indexOfLastLook);
  const totalLookPages = Math.ceil(filteredLooks.length / looksPerPage);

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    handleFilters(filteredPublicAvatars);
  };

  // Mettre à jour les gestionnaires d'événements des filtres
  const handleFilters = (filteredResults: Avatar[]) => {
    if (
      currentPage !== 1 &&
      currentPage * avatarsPerPage > filteredResults.length
    ) {
      setCurrentPage(1);
    }
    // Reset visible public count when filters change in create variant
    if (variant === "create") {
      setVisiblePublicCount(avatarsPerPage);
    }
  };

  // Mise à jour de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const newFilteredAvatars = sortAvatarsByLastUsed(
      publicAvatars.filter((avatar) => {
        const matchesSearch = avatar.name
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesGender =
          selectedGender === "all" ? true : avatar.gender === selectedGender;
        const matchesTags =
          selectedTags.length === 0
            ? true
            : selectedTags.every((tag) => avatar.tags.includes(tag));
        return matchesSearch && matchesGender && matchesTags;
      })
    );
    handleFilters(newFilteredAvatars);
  };

  // Pour le variant create, garder la logique infinite scroll
  const totalPublicWithNoAvatar =
    variant === "create"
      ? filteredPublicAvatars.length + (showNoAvatarCard ? 1 : 0)
      : 0;
  const effectivePublicCount =
    variant === "create"
      ? Math.min(visiblePublicCount, totalPublicWithNoAvatar)
      : 0;
  const hasMorePublic =
    variant === "create" && effectivePublicCount < totalPublicWithNoAvatar;
  const loadMorePublic = () => {
    if (variant === "create") {
      setVisiblePublicCount((c) => c + avatarsPerPage);
    }
  };

  // Fonctions de pagination pour les looks
  const getLookPageNumbers = () => {
    const pageNumbers = [];
    const totalPagesToShow = 5;
    const halfWay = Math.floor(totalPagesToShow / 2);

    let startPage = Math.max(currentLookPage - halfWay, 1);
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalLookPages);

    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalLookPages,
    };
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const totalPagesToShow = 3;
    const halfWay = Math.floor(totalPagesToShow / 2);

    let startPage = Math.max(currentPage - halfWay, 1);
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);

    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages,
    };
  };

  const handleLookPageChange = (page: number) => {
    if (page >= 1 && page <= totalLookPages) {
      setCurrentLookPage(page);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fonctions pour créer un nouveau look
  const handleFileUpload = () => {
    if (!activeAvatar || !activeSpace?.id) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await processFileUpload(file);
    };
    input.click();
  };

  const handleFileDrop = async (file: File) => {
    if (!activeAvatar || !activeSpace?.id) return;
    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {
    if (!activeAvatar || !activeSpace?.id) return;

    try {
      setIsUploadingLook(true);
      const { mediaUrl } = await getMediaUrlFromFileByPresignedUrl(file);

      // Créer le nouveau look avec l'image
      const lookRes = await basicApiCall<{ data: AvatarLook }>(
        `/space/${activeSpace.id}/avatars/${activeAvatar.id}/looks`,
        {
          imageUrl: mediaUrl,
          lookName: `Look ${activeAvatar.looks.length + 1}`,
          place: "unspecified",
          tags: [],
          format: "vertical",
        }
      );

      const createdLook = lookRes as AvatarLook;
      if (createdLook) {
        // Mettre à jour l'avatar actif localement
        const updatedAvatar: Avatar = {
          ...activeAvatar,
          looks: [...activeAvatar.looks, createdLook],
          thumbnail:
            activeAvatar.thumbnail ||
            createdLook.thumbnail ||
            activeAvatar.thumbnail,
        };
        setActiveAvatar(updatedAvatar);

        // Mettre à jour la liste des avatars de l'espace
        setSpaceAvatars((prev) =>
          prev.map((a) => (a.id === updatedAvatar.id ? updatedAvatar : a))
        );

        // Synchroniser le store
        setAvatars(
          activeSpace.id,
          (
            useAvatarsStore.getState().avatarsBySpace.get(activeSpace.id) || []
          ).map((a) => (a.id === updatedAvatar.id ? updatedAvatar : a))
        );

        // Rafraîchir en arrière-plan sans bloquer l'UI (même logique que handleGenerate)
        try {
          const latest = await fetchAvatarsInBackground(activeSpace.id);
          setSpaceAvatars(latest);
          if (activeAvatar?.id) {
            const refreshedActive = latest.find(
              (a) => a.id === activeAvatar.id
            );
            if (refreshedActive) setActiveAvatar(refreshedActive);
          }
        } catch {}
      }
    } catch (error) {
      console.error("Error creating new look:", error);
    } finally {
      setIsUploadingLook(false);
    }
  };

  const isChatboxVisible = variant === "create" && !!activeAvatar && spaceAvatars.some((a) => a.id === activeAvatar.id);

  return (
    <div className="space-y-4" ref={containerRef}>
      <AnimatePresence mode="wait">
        {activeAvatar ? (
          <motion.div
            key="avatar-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setActiveAvatar(null);
                setCurrentLookPage(1);
                updateUrlParamsForAvatar(null);
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {isEditingAvatarName ? (
              <input
                ref={avatarNameInputRef}
                type="text"
                value={editedAvatarName}
                onChange={(e) => setEditedAvatarName(e.target.value)}
                onBlur={handleAvatarNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleAvatarNameSave()}
                className="text-xl font-semibold border-0 border-b border-b-input focus:outline-none focus:ring-0 bg-transparent min-w-0 w-auto"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold cursor-text hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                onClick={startEditingAvatarName}
                title={t("click-to-edit")}
              >
                {activeAvatar.name}
              </h2>
            )}
            <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
              {activeAvatar.looks.length} Looks
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("created-by")}</span>
              <UIAvatar className="h-5 w-5">
                {avatarCreator.image && (
                  <AvatarImage
                    src={avatarCreator.image}
                    alt={avatarCreator.name ?? ""}
                  />
                )}
                <AvatarFallback className="text-xs">
                  {avatarCreator.name?.charAt(0) ?? "A"}
                </AvatarFallback>
              </UIAvatar>
              <span className="font-medium">{avatarCreator.name}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <div className="flex gap-4 items-center w-full">
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
              <Select
                value={selectedGender}
                onValueChange={(value) => {
                  setSelectedGender(value);
                  handleFilters(filteredPublicAvatars);
                }}
              >
                <SelectTrigger className="w-[140px] sm:w-[200px]">
                  <SelectValue>
                    {selectedGender === "all" ? (
                      <div className="flex items-center">
                        <IconGenderMaleFemale className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">
                          {tCommon("all-m")}
                        </span>
                      </div>
                    ) : selectedGender === "male" ? (
                      <div className="flex items-center">
                        <IconGenderMale className="w-4 h-4 text-blue-500" />
                        <span className="hidden sm:inline ml-1">
                          {t("gender.male")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <IconGenderFemale className="w-4 h-4 text-pink-500" />
                        <span className="hidden sm:inline ml-1">
                          {t("gender.female")}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex">
                      <IconGenderMaleFemale className="w-4 h-4 mr-2" />
                      {tCommon("all-m")}
                    </div>
                  </SelectItem>
                  <SelectItem value="male">
                    <div className="flex">
                      <IconGenderMale className="w-4 h-4 mr-2 text-blue-500" />
                      {t("gender.male")}
                    </div>
                  </SelectItem>
                  <SelectItem value="female">
                    <div className="flex">
                      <IconGenderFemale className="w-4 h-4 mr-2 text-pink-500" />
                      {t("gender.female")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HorizontalScrollList>
        {activeAvatar
          ? activeAvatar.tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleTag(tag)}
              >
                {selectedTags.includes(tag) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {t(`tags.${tag}`)}
              </Badge>
            ))
          : allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleTag(tag)}
              >
                {selectedTags.includes(tag) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {t(`tags.${tag}`)}
              </Badge>
            ))}
      </HorizontalScrollList>

      <div
        className={`grid gap-4 ${
          variant === "create"
            ? "grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {activeAvatar ? (
          // Afficher les looks de l'avatar sélectionné
          <>
            {/* Carte pour créer un nouveau look (uniquement pour les avatars de l'espace) */}
            {variant === "create" &&
              spaceAvatars.some((a) => a.id === activeAvatar.id) && (
                <AddLookCard
                  onFileUpload={handleFileUpload}
                  onFileDrop={handleFileDrop}
                  isUploading={isUploadingLook}
                />
              )}

            {/* Looks existants */}
            {(currentLooks as AvatarLook[]).length > 0 ? (
              (currentLooks as AvatarLook[]).map((look: AvatarLook) => (
                <AvatarLookCard
                  key={look.id}
                  look={look}
                  avatarName={activeAvatar.name}
                  avatarId={activeAvatar.id}
                  isLastUsed={
                    look.id
                      ? lastUsedParameters?.avatars?.includes(look.id)
                      : false
                  }
                  selectedLook={selectedLook}
                  onLookChange={
                    variant === "create" ? () => {} : setSelectedLook
                  }
                  onAvatarNameChange={
                    variant === "create" ? () => {} : setSelectedAvatarName
                  }
                  setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteLookOpen}
                  isPublic={!spaceAvatars.some((a) => a.id === activeAvatar.id)}
                  canEdit={variant === "create"}
                  onLookRenamed={(lookId, newName) => {
                    // Update activeAvatar
                    const updatedAvatar = {
                      ...activeAvatar,
                      looks: activeAvatar.looks.map((l) =>
                        l.id === lookId ? { ...l, name: newName } : l
                      ),
                    };
                    setActiveAvatar(updatedAvatar);
                    // Update in spaceAvatars
                    setSpaceAvatars((prev) =>
                      prev.map((a) =>
                        a.id === activeAvatar.id ? updatedAvatar : a
                      )
                    );
                  }}
                  onEditLook={variant === "create" ? handleEditLook : undefined}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t("no-looks-found")}
              </div>
            )}
          </>
        ) : (
          // Afficher d'abord la section des avatars du space, puis la section des avatars publics
          <>
            <>
              <div className="col-span-full mt-2 mb-1 text-lg font-semibold text-muted-foreground">
                {t("sections.yours")}
              </div>
              {variant === "create" && (
                <Card
                  className="relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-primary/20"
                  onClick={() => {
                    const limit = ((): number => {
                      if (
                        typeof activeSpace?.avatarsLimit === "number" &&
                        activeSpace.avatarsLimit > 0
                      )
                        return activeSpace.avatarsLimit;
                      switch (activeSpace?.planName) {
                        case PlanName.ENTREPRISE:
                          return 20;
                        case PlanName.PRO:
                          return 10;
                        case PlanName.START:
                          return 5;
                        default:
                          return 0;
                      }
                    })();
                    const used = spaceAvatars.length;
                    const remaining = Math.max(0, limit - used);
                    if (remaining <= 0) {
                      setIsUnlockModalOpen(true);
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                >
                  {/* Contenu principal centré */}
                  <div className="w-full aspect-[3/4] relative bg-white flex flex-col items-center justify-center p-4">
                    <Plus className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 text-center font-medium">
                      {t("create-new-name")}
                    </p>
                  </div>

                  {/* Compteur en bas */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t">
                    <div className="text-center">
                      <span className="text-xs text-gray-600">
                        {(() => {
                          const limit = ((): number => {
                            if (
                              typeof activeSpace?.avatarsLimit === "number" &&
                              activeSpace.avatarsLimit > 0
                            )
                              return activeSpace.avatarsLimit;
                            switch (activeSpace?.planName) {
                              case PlanName.ENTREPRISE:
                                return 20;
                              case PlanName.PRO:
                                return 10;
                              case PlanName.START:
                                return 5;
                              default:
                                return 0;
                            }
                          })();
                          const used = spaceAvatars.length;
                          const remaining = Math.max(0, limit - used);
                          return t("left-counter", { remaining, limit });
                        })()}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
              {isLoadingSpaceAvatars &&
                filteredSpaceAvatars.length === 0 &&
                Array.from({ length: 4 }).map((_, idx) => (
                  <AvatarSkeletonCard key={`skeleton-${idx}`} />
                ))}
              {filteredSpaceAvatars.length > 0 &&
                filteredSpaceAvatars.map((avatar: Avatar) => (
                  <AvatarCard
                    key={`space-${avatar.id}`}
                    avatar={avatar}
                    onClick={() => {
                      setActiveAvatar(avatar);
                      updateUrlParamsForAvatar(avatar);
                    }}
                    isLastUsed={avatar.looks.some(
                      (look) =>
                        look.id &&
                        lastUsedParameters?.avatars?.includes(look.id)
                    )}
                    selectedAvatarName={selectedAvatarName}
                    setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteOpen}
                    onSeeLooks={(avatar) => {
                      setActiveAvatar(avatar);
                      updateUrlParamsForAvatar(avatar);
                    }}
                    isPublic={false}
                    canEdit={variant === "create"}
                  />
                ))}
            </>

            <div className="col-span-full mt-4 mb-1 text-lg font-semibold text-muted-foreground">
              {t("sections.public")}
            </div>
            {showNoAvatarCard && (
              <NoAvatarCard
                selectedLook={selectedLook || null}
                onLookChange={setSelectedLook}
                onAvatarNameChange={setSelectedAvatarName}
              />
            )}
            {(avatarsToShow as Avatar[]).map((avatar: Avatar) => (
              <AvatarCard
                key={`public-${avatar.id}`}
                avatar={avatar}
                onClick={() => {
                  setActiveAvatar(avatar);
                  updateUrlParamsForAvatar(avatar);
                }}
                isLastUsed={avatar.looks.some(
                  (look) =>
                    look.id && lastUsedParameters?.avatars?.includes(look.id)
                )}
                selectedAvatarName={selectedAvatarName}
                setIsModalConfirmDeleteOpen={setIsModalConfirmDeleteOpen}
                onSeeLooks={(avatar) => {
                  setActiveAvatar(avatar);
                  updateUrlParamsForAvatar(avatar);
                }}
                isPublic={true}
                canEdit={false}
              />
            ))}
            {variant === "create" && (
              <div className="col-span-full">
                <InfiniteScroll
                  onLoadMore={loadMorePublic}
                  hasMore={hasMorePublic}
                  loader={
                    <div className="text-center py-4 text-muted-foreground">
                      {tCommon("infinite-scroll.loading")}
                    </div>
                  }
                  endMessage={
                    <div className="text-center py-4 text-muted-foreground">
                      {tCommon("infinite-scroll.end")}
                    </div>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <CreateAvatarModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onCreated={(avatar) => {
          // Sélectionner automatiquement l'avatar nouvellement créé et ouvrir ses looks
          setActiveAvatar(avatar);
          setCurrentLookPage(1);
          // Mettre à jour localement et dans le store sans refetch
          setSpaceAvatars((prev) => [avatar, ...prev]);
          setAvatars(activeSpace?.id as string, [
            avatar,
            ...(useAvatarsStore
              .getState()
              .avatarsBySpace.get(activeSpace?.id as string) || []),
          ]);
        }}
      />

      <UnlockAvatarCreationModal
        isOpen={isUnlockModalOpen}
        setIsOpen={setIsUnlockModalOpen}
      />

      {activeAvatar
        ? // Pagination des looks
          totalLookPages > 1 && (
            <Pagination className={isChatboxVisible ? "pb-40" : undefined}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    showText={false}
                    onClick={() => handleLookPageChange(currentLookPage - 1)}
                    className={cn(
                      "cursor-pointer sm:hidden",
                      currentLookPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                  <PaginationPrevious
                    showText={true}
                    onClick={() => handleLookPageChange(currentLookPage - 1)}
                    className={cn(
                      "cursor-pointer hidden sm:flex",
                      currentLookPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {getLookPageNumbers().showStartEllipsis && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handleLookPageChange(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  </>
                )}

                {getLookPageNumbers().numbers.map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={currentLookPage === pageNumber}
                      onClick={() => handleLookPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {getLookPageNumbers().showEndEllipsis && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handleLookPageChange(totalLookPages)}
                      >
                        {totalLookPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    showText={false}
                    onClick={() => handleLookPageChange(currentLookPage + 1)}
                    className={cn(
                      "cursor-pointer sm:hidden",
                      currentLookPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                  <PaginationNext
                    showText={true}
                    onClick={() => handleLookPageChange(currentLookPage + 1)}
                    className={cn(
                      "cursor-pointer hidden sm:flex",
                      currentLookPage === totalPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )
        : null}

      {variant === "select" && !activeAvatar && totalPages > 1 && (
        // Pagination des avatars publics
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                showText={false}
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "cursor-pointer sm:hidden",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
              <PaginationPrevious
                showText={true}
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "cursor-pointer hidden sm:flex",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>

            {getPageNumbers().showStartEllipsis && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(1)}>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              </>
            )}

            {getPageNumbers().numbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={currentPage === pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {getPageNumbers().showEndEllipsis && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                showText={false}
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "cursor-pointer sm:hidden",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
              <PaginationNext
                showText={true}
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "cursor-pointer hidden sm:flex",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {variant === "create" &&
        activeAvatar &&
        spaceAvatars.some((a) => a.id === activeAvatar.id) && (
          <AvatarLookChatbox
            anchorRef={containerRef}
            activeAvatar={activeAvatar}
            spaceId={activeSpace?.id as string}
            onRefresh={async () => {
              if (!activeSpace?.id) return;
              const latest = await fetchAvatarsInBackground(activeSpace.id);
              setSpaceAvatars(latest);
              if (activeAvatar?.id) {
                const refreshedActive = latest.find(
                  (a) => a.id === activeAvatar.id
                );
                if (refreshedActive) setActiveAvatar(refreshedActive);
              }
            }}
            initialReferenceImage={editingLook?.thumbnail || null}
            promptInputRef={promptInputRef}
            pulseSignal={pulseCounter}
          />
        )}

      <ModalConfirmDeleteAvatar
        isOpen={isModalConfirmDeleteOpen}
        setIsOpen={setIsModalConfirmDeleteOpen}
        handleDeleteAvatar={handleDeleteAvatar}
      />

      <ModalConfirmDeleteLook
        isOpen={isModalConfirmDeleteLookOpen}
        setIsOpen={setIsModalConfirmDeleteLookOpen}
        handleDeleteLook={handleDeleteLook}
      />
    </div>
  );
}

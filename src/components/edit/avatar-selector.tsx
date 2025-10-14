'use client'

import { User } from "lucide-react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";
import { AvatarLook } from "@/src/types/avatar";
import { cn } from "@/src/lib/utils";

interface AvatarSelectorProps {
  selectedAvatar: AvatarLook | null;
  onAvatarSelect: () => void;
  disabled?: boolean;
}

export default function AvatarSelector({
  selectedAvatar,
  onAvatarSelect,
  disabled = false,
}: AvatarSelectorProps) {
  const t = useTranslations("edit");

  return (
    <button
      onClick={onAvatarSelect}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 overflow-hidden"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <User className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {selectedAvatar 
            ? (selectedAvatar.name || t('custom-avatar'))
            : t('no-avatar')
          }
        </span>
      </div>
      <CaretSortIcon className="h-4 w-4 opacity-50 flex-shrink-0" />
    </button>
  );
} 
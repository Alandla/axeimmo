import { ITransition } from "@/src/types/video";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, MoreVertical, Trash2 } from "lucide-react";
import { motion } from 'framer-motion';
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

interface TransitionProps {
  transition: ITransition;
  index: number;
  onDeleteTransition: (index: number) => void;
  selectedIndex?: number;
  setSelectedIndex?: (index: number) => void;
}

export default function Transition({ 
  transition,
  index,
  onDeleteTransition,
  selectedIndex,
  setSelectedIndex
}: TransitionProps) {
  const t = useTranslations('edit.transition')

  const isSelected = selectedIndex === index;

  return (
    <motion.div
      layout="position"
      className="cursor-pointer"
      onClick={() => setSelectedIndex?.(index)}
    >
      <Card className={`m-2 transition-card relative h-11 overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <div 
          className="absolute inset-0 w-full h-full mix-blend-difference bg-cover bg-center"
          style={{ backgroundImage: `url(${transition.thumbnail})`}}
        />
        <CardContent className="flex items-center justify-between p-2 relative z-10">
          <Badge variant={isSelected ? "default" : "outline"} className={cn(!isSelected && "bg-white bg-opacity-50")}>
            {t('transition')} {index + 1}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn("flex items-center bg-white bg-opacity-50 hover:bg-accent hover:bg-opacity-100 rounded-md p-1 cursor-pointer transition-all duration-200", isSelected && "bg-accent bg-opacity-100")}>
                    <MoreVertical className="w-4 h-4" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={cn(
                  "flex items-center text-destructive cursor-pointer hover:bg-red-200 hover:text-destructive focus:bg-red-200 focus:text-destructive"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTransition(index);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
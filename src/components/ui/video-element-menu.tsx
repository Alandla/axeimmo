import { Button } from "./button";
import { motion } from "framer-motion";
import { RefreshCw, X, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { IElement, ISequence, IWord } from "../../types/video";
import { LayersManager } from "./layers-manager";

interface VideoElementMenuProps {
  element: IElement;
  sequences: ISequence[];
  index: number;
  scale: number;
  onElementMediaChange?: (index: number) => void;
  onElementStartChange?: (index: number, start: number) => void;
  onElementEndChange?: (index: number, end: number) => void;
  onElementDelete?: (index: number) => void;
  onMouseDown?: (ev: React.MouseEvent) => void;
  onClick?: (ev: React.MouseEvent) => void;
  overlappingElements?: IElement[];
  allElements?: IElement[];
  onElementReorder?: (fromIndex: number, toIndex: number) => void;
}

export const VideoElementMenu = ({
  element,
  sequences,
  index,
  scale,
  onElementMediaChange,
  onElementStartChange,
  onElementEndChange,
  onElementDelete,
  onMouseDown,
  onClick,
  overlappingElements = [],
  allElements = [],
  onElementReorder,
}: VideoElementMenuProps) => {
  // Obtenir tous les mots avec leurs timings pour les menus Start/End
  const getWordsForStartMenu = (element: IElement) => {
    const items: ({ type: 'separator'; sequenceIndex: number } | { type: 'word'; word: IWord; sequenceIndex: number })[] = [];
    
    sequences.forEach((sequence, sequenceIndex) => {
      const validWords = sequence.words.filter(word => word.start < element.end);
      if (validWords.length > 0) {
        items.push({ type: 'separator', sequenceIndex });
        validWords.forEach((word) => {
          items.push({ type: 'word', word, sequenceIndex });
        });
      }
    });
    return items;
  };

  const getWordsForEndMenu = (element: IElement) => {
    const items: ({ type: 'separator'; sequenceIndex: number } | { type: 'word'; word: IWord; sequenceIndex: number })[] = [];
    
    sequences.forEach((sequence, sequenceIndex) => {
      const validWords = sequence.words.filter(word => word.end > element.start);
      if (validWords.length > 0) {
        items.push({ type: 'separator', sequenceIndex });
        validWords.forEach((word) => {
          items.push({ type: 'word', word, sequenceIndex });
        });
      }
    });
    return items;
  };

  // Afficher le bouton layers s'il y a des éléments qui se chevauchent
  const showLayersButton = overlappingElements.length >= 1;

  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      style={{
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          transform: `scale(${1 / Math.max(0.0001, scale)})`,
          transformOrigin: "bottom center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white border shadow-lg rounded-md p-1"
        >
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onElementMediaChange?.(index)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {showLayersButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-3"
                >
                  <LayersManager
                    elements={[element, ...overlappingElements].sort((a, b) => {
                      const indexA = allElements.findIndex(el => el === a);
                      const indexB = allElements.findIndex(el => el === b);
                      return indexB - indexA; // Du plus haut z-index au plus bas
                    })}
                    allElements={allElements}
                    onReorder={onElementReorder}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="w-px h-4 bg-border mx-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-1 mr-1">
                  {element.start.toFixed(2)}s
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: '240px' }}
              >
                {getWordsForStartMenu(element).map((item, itemIndex) => {
                  if (item.type === 'separator') {
                    return (
                      <div
                        key={`separator-${item.sequenceIndex}`}
                        className="px-2 py-1 text-xs text-muted-foreground font-medium"
                      >
                        Sequence {item.sequenceIndex + 1}
                      </div>
                    );
                  } else {
                    const isSelected = Math.abs(item.word.start - element.start) < 0.01;
                    return (
                      <DropdownMenuItem
                        key={`word-${item.sequenceIndex}-${itemIndex}`}
                        className={`cursor-pointer text-xs flex justify-between ${isSelected && "bg-accent text-accent-foreground"}`}
                        onClick={() => onElementStartChange?.(index, item.word.start)}
                      >
                        <span>{item.word.word}</span>
                        <span className="text-muted-foreground ml-2">
                          {item.word.start.toFixed(2)}s
                        </span>
                      </DropdownMenuItem>
                    );
                  }
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <span>-</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-1 ml-1">
                  {element.end.toFixed(2)}s
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: '240px' }}
              >
                {getWordsForEndMenu(element).map((item, itemIndex) => {
                  if (item.type === 'separator') {
                    return (
                      <div
                        key={`separator-${item.sequenceIndex}`}
                        className="px-2 py-1 text-xs text-muted-foreground font-medium"
                      >
                        Sequence {item.sequenceIndex + 1}
                      </div>
                    );
                  } else {
                    const isSelected = Math.abs(item.word.end - element.end) < 0.01;
                    return (
                      <DropdownMenuItem
                        key={`word-${item.sequenceIndex}-${itemIndex}`}
                        className={`cursor-pointer text-xs flex justify-between ${isSelected && "bg-accent text-accent-foreground"}`}
                        onClick={() => onElementEndChange?.(index, item.word.end)}
                      >
                        <span>{item.word.word}</span>
                        <span className="text-muted-foreground ml-2">
                          {item.word.end.toFixed(2)}s
                        </span>
                      </DropdownMenuItem>
                    );
                  }
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1"></div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-red-200 hover:text-destructive"
              onClick={() => onElementDelete?.(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

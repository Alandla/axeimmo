import { useState, useEffect } from "react";
import { motion, Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useTranslations } from 'next-intl';
import { IElement } from "../../types/video";

interface LayersManagerProps {
  elements: IElement[];
  onReorder?: (fromIndex: number, toIndex: number) => void;
  allElements?: IElement[]; // Tous les éléments pour trouver les indices globaux
}

interface LayerItemProps {
  element: IElement;
  displayIndex: number;
  originalIndex: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const LayerItem = ({ element, displayIndex, originalIndex, onDragStart, onDragEnd }: LayerItemProps) => {
  const getMediaPreview = (element: IElement) => {
    if (element.media.type === 'image' && element.media.image) {
      return element.media.image.link;
    } else if (element.media.type === 'video' && element.media.video) {
      return element.media.video.link;
    }
    return null;
  };

  const getMediaName = (element: IElement) => {
    // Priorité 1: Utiliser element.media.name si disponible
    if (element.media.name) {
      // Raccourcir le nom si trop long
      return element.media.name.length > 20 ? element.media.name.substring(0, 17) + '...' : element.media.name;
    }

    // Priorité 2: Utiliser l'URL pour extraire le nom de fichier
    const mediaUrl = getMediaPreview(element);
    if (mediaUrl) {
      const filename = mediaUrl.split('/').pop()?.split('?')[0] || '';
      if (filename && filename.length > 0) {
        // Raccourcir le nom si trop long
        return filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
      }
    }
    
    // Fallback: Utiliser le type et un identifiant basé sur l'index original
    return `${element.media.type === 'image' ? 'Image' : 'Vidéo'} ${originalIndex + 1}`;
  };

  const mediaUrl = getMediaPreview(element);
  const mediaType = element.media.type;
  const mediaName = getMediaName(element);

  return (
    <Reorder.Item
      key={originalIndex}
      value={element}
      className="flex items-center gap-2 p-2 bg-white border rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-50"
      whileDrag={{ scale: 1.02, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
      
      <div className="w-8 h-8 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
        {mediaUrl && (
          mediaType === 'image' ? (
            <img 
              src={mediaUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={mediaUrl} 
              className="w-full h-full object-cover"
              muted
            />
          )
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" title={mediaName}>
          {mediaName}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {element.start.toFixed(1)}s - {element.end.toFixed(1)}s
        </div>
      </div>
    </Reorder.Item>
  );
};

export const LayersManager = ({ elements, onReorder, allElements = elements }: LayersManagerProps) => {
  const t = useTranslations('edit');
  
  // Les éléments sont déjà triés du plus haut z-index au plus bas
  const [displayElements, setDisplayElements] = useState([...elements]);
  const [initialOrder, setInitialOrder] = useState([...elements]);
  const [isDragging, setIsDragging] = useState(false);

  // Mettre à jour quand les éléments changent
  useEffect(() => {
    setDisplayElements([...elements]);
    if (!isDragging) {
      setInitialOrder([...elements]);
    }
  }, [elements, isDragging]);

  const handleReorder = (newOrder: IElement[]) => {
    // Mise à jour visuelle immédiate pendant le drag
    setDisplayElements(newOrder);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setInitialOrder([...displayElements]);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    if (!onReorder) {
      return;
    }
    
    // Trouver quel élément a bougé
    for (let i = 0; i < displayElements.length; i++) {
      if (displayElements[i] !== initialOrder[i]) {
        const movedElement = displayElements[i];
        const fromGlobalIndex = allElements.findIndex(el => el === movedElement);
        
        // Créer un mapping des éléments vers leur nouvelle position souhaitée
        const targetGlobalIndex = displayElements.length - 1 - i; // Inversion car displayElements va du plus haut au plus bas z-index
        
        onReorder(fromGlobalIndex, targetGlobalIndex);
        break;
      }
    }
  };

  return (
    <div className="w-full max-w-xs">
      <div className="text-xs font-medium text-gray-600 mb-2 px-1">
        {t('elements-order')}
      </div>
      
      <Reorder.Group 
        axis="y" 
        values={displayElements} 
        onReorder={handleReorder}
        className="space-y-1"
      >
        {displayElements.map((element, index) => {
          const originalIndex = allElements.findIndex(el => el === element);
          // L'index affiché correspond au z-index réel (plus l'index est élevé, plus le z-index est élevé)
          const displayIndex = originalIndex;
          return (
            <LayerItem 
              key={originalIndex}
              element={element}
              displayIndex={displayIndex}
              originalIndex={originalIndex}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
};

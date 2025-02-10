import { ITransition } from "@/src/types/video";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import TransitionListSettings from "./transition-list-settings";
import TransitionMusics from "./transition-musics";

interface TransitionSettingsProps {
  video: any;
  transition: ITransition;
  transitionIndex: number;
  spaceId: string;
  updateTransition: (transitionIndex: number, newTransition: ITransition) => void;
}

export default function TransitionSettings({ 
  video, 
  transition, 
  transitionIndex, 
  spaceId,
  updateTransition 
}: TransitionSettingsProps) {
  const t = useTranslations('edit.transition')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <>
      <CardHeader className="p-2 sm:p-6">
        <CardTitle>Transition {transitionIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 pt-0 sm:p-6 sm:pt-0 max-w-full overflow-hidden">
        <Tabs defaultValue="transition">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transition">{t('transition')}</TabsTrigger>
            <TabsTrigger value="sound">{t('sound')}</TabsTrigger>
          </TabsList>

          <TabsContent value="transition">
            <TransitionListSettings 
              video={video} 
              transition={transition} 
              transitionIndex={transitionIndex} 
              spaceId={spaceId}
              updateTransition={updateTransition}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
            />
          </TabsContent>

          <TabsContent value="sound">
            <TransitionMusics 
              transition={transition}
              transitionIndex={transitionIndex}
              updateTransition={updateTransition}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
}
import { ITransition } from "@/src/types/video";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useTranslations } from "next-intl";
import TransitionListSettings from "./transition-list-settings";

export default function TransitionSettings({ video, transition, transitionIndex, spaceId }: { video: any, transition: ITransition, transitionIndex: number, spaceId: string }) {
  const t = useTranslations('edit.transition')

  return (
    <>
      <CardHeader className="p-2 sm:p-6">
        <CardTitle>Transition {transitionIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 pt-0 sm:p-6 sm:pt-0">
        <Tabs defaultValue="transition">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transition">{t('transition')}</TabsTrigger>
            <TabsTrigger value="sound">{t('sound')}</TabsTrigger>
          </TabsList>
          <TabsContent value="transition">
            <TransitionListSettings video={video} transition={transition} transitionIndex={transitionIndex} spaceId={spaceId} />
          </TabsContent>
          <TabsContent value="sound">
            Music settings
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  )
}
import { zodResolver } from "@hookform/resolvers/zod"
import { ControllerRenderProps, useForm } from "react-hook-form"
import { z } from "zod"
import { useTranslations } from 'next-intl'
import { Building2, Target, Save, Loader2, MessageSquareText } from 'lucide-react'

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { basicApiCall } from "../lib/api"
import { useToast } from "../hooks/use-toast"
import { useState } from "react"
import { SimpleSpace } from "../types/space"
import { Form, FormField, FormItem } from "./ui/form"

const spaceSettingsFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  companyMission: z.string().optional(),
  companyTarget: z.string().optional(),
})

type SpaceSettingsFormValues = z.infer<typeof spaceSettingsFormSchema>

export function SpaceSettingsForm() {
  const t = useTranslations('settings.space')
  const tErrors = useTranslations('errors')
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // This can come from your database or API.
  const defaultValues: Partial<SpaceSettingsFormValues> = {
    name: activeSpace?.name || "",
    companyMission: activeSpace?.companyMission || "",
    companyTarget: activeSpace?.companyTarget || "",
  }

  const form = useForm<SpaceSettingsFormValues>({
    resolver: zodResolver(spaceSettingsFormSchema),
    defaultValues,
    mode: "onChange",
  })

  async function onSubmit(data: SpaceSettingsFormValues) {
    if (!activeSpace) return;
    setIsLoading(true)
    try {
      const updatedSpace: SimpleSpace = await basicApiCall(`/space/${activeSpace.id}`, data);
      setActiveSpace(updatedSpace);
      toast({
        title: t('update-success-title'),
        description: t('update-success-description'),
      })
    } catch (error) {
       toast({
        title: tErrors('generic-title'),
        description: tErrors('generic-description'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:px-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<SpaceSettingsFormValues, "name"> }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start justify-between h-24">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <Label htmlFor={field.name} className="text-base">{t('name-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('name-description')}
                    </p>
                  </div>
                  <Input 
                    id={field.name}
                    placeholder={t('name-placeholder')} 
                    className="w-full sm:w-96" 
                    {...field} 
                  />
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="companyMission"
            render={({ field }: { field: ControllerRenderProps<SpaceSettingsFormValues, "companyMission"> }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start justify-between sm:h-36">
                  <div className="space-y-1 sm:pt-2">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4" />
                      <Label htmlFor={field.name} className="text-base">{t('mission-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('mission-description')}
                    </p>
                  </div>
                  <div className="w-full sm:w-96 mt-2 sm:mt-0">
                    <Textarea
                      id={field.name}
                      placeholder={t('mission-placeholder')}
                      className="resize-none w-full"
                      rows={4}
                      {...field}
                    />
                  </div>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="companyTarget"
            render={({ field }: { field: ControllerRenderProps<SpaceSettingsFormValues, "companyTarget"> }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start justify-between sm:h-36">
                  <div className="space-y-1 sm:pt-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <Label htmlFor={field.name} className="text-base">{t('target-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('target-description')}
                    </p>
                  </div>
                  <div className="w-full sm:w-96 mt-2 sm:mt-0">
                    <Textarea
                      id={field.name}
                      placeholder={t('target-placeholder')}
                      className="resize-none w-full"
                      rows={4}
                      {...field}
                    />
                  </div>
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex items-start justify-between h-24">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {t('save-button')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 
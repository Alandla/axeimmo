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
import { useState, useEffect } from "react"
import { SimpleSpace } from "../types/space"
import { Form, FormField, FormItem } from "./ui/form"
import { Skeleton } from "./ui/skeleton"

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
  const [isFormReady, setIsFormReady] = useState(false)

  

  const form = useForm<SpaceSettingsFormValues>({
    resolver: zodResolver(spaceSettingsFormSchema),
    defaultValues: {
      name: "",
      companyMission: "",
      companyTarget: "",
    },
    mode: "onChange",
  })

  // Update form values when activeSpace changes (au refresh on a pas les valeurs, contrairement au drawer où les données étaient déjà chargées)
  useEffect(() => {
    if (activeSpace) {
      form.reset({
        name: activeSpace.name || "",
        companyMission: activeSpace.companyMission || "",
        companyTarget: activeSpace.companyTarget || "",
      })
      setIsFormReady(true)
    }
  }, [activeSpace, form])

  async function onSubmit(data: SpaceSettingsFormValues) {
    if (!activeSpace) return;
    setIsLoading(true)
    try {
      const updatedSpace: SimpleSpace = await basicApiCall(`/space/${activeSpace.id}`, data);
      setActiveSpace(updatedSpace);
      toast({
        title: t('update-success-title'),
        description: t('update-success-description'),
        variant: "confirm",
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


  // Show loading skeleton while form is not ready
  if (!isFormReady) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('general-description')}
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Name field skeleton */}
          <div className="flex flex-col sm:flex-row items-start justify-between h-24">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <Label className="text-base">{t('name-label')}</Label>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('name-description')}
              </p>
            </div>
            <Skeleton className="h-10 w-full sm:w-[250px]" />
          </div>
          
          {/* Mission field skeleton */}
          <div className="flex flex-col sm:flex-row items-start justify-between">
            <div className="space-y-1 sm:w-1/2">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" />
                <Label className="text-base">{t('mission-label')}</Label>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('mission-description')}
              </p>
            </div>
            <Skeleton className="h-24 w-full sm:w-[400px]" />
          </div>
          
          {/* Target field skeleton */}
          <div className="flex flex-col sm:flex-row items-start justify-between">
            <div className="space-y-1 sm:w-1/2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <Label className="text-base">{t('target-label')}</Label>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('target-description')}
              </p>
            </div>
            <Skeleton className="h-24 w-full sm:w-[400px]" />
          </div>
          
          {/* Button skeleton */}
          <div className="flex items-start justify-between h-24">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('general-description')}
        </p>
      </div>
      
      <Form {...form}>        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<SpaceSettingsFormValues, "name"> }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start justify-between sm:h-24 space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={field.name} className="font-semibold">{t('name-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('name-description')}
                    </p>
                  </div>
                  <Input 
                    id={field.name}
                    placeholder={t('name-placeholder')} 
                    className="w-full sm:w-[250px]" 
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
                <div className="flex flex-col sm:flex-row items-start justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1 sm:w-1/2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={field.name} className="font-semibold">{t('mission-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('mission-description')}
                    </p>
                  </div>
                  <Textarea
                    id={field.name}
                    placeholder={t('mission-placeholder')}
                    className="resize-none w-full sm:w-[400px]"
                    rows={4}
                    {...field}
                  />
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="companyTarget"
            render={({ field }: { field: ControllerRenderProps<SpaceSettingsFormValues, "companyTarget"> }) => (
              <FormItem>
                <div className="flex flex-col sm:flex-row items-start justify-between space-y-2 sm:space-y-0">
                  <div className="space-y-1 sm:w-1/2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={field.name} className="font-semibold">{t('target-label')}</Label>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('target-description')}
                    </p>
                  </div>
                  <Textarea
                    id={field.name}
                    placeholder={t('target-placeholder')}
                    className="resize-none w-full sm:w-[400px]"
                    rows={4}
                    {...field}
                  />
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex items-start justify-between h-24">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('save-button')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 
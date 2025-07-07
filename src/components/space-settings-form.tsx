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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <Label className="text-base">{t('name-label')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('name-description')}
            </p>
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          
          {/* Mission field skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              <Label className="text-base">{t('mission-label')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('mission-description')}
            </p>
            <Skeleton className="h-24 w-full max-w-2xl" />
          </div>
          
          {/* Target field skeleton */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <Label className="text-base">{t('target-label')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('target-description')}
            </p>
            <Skeleton className="h-24 w-full max-w-2xl" />
          </div>
          
          {/* Button skeleton */}
          <div className="pt-4">
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <Label htmlFor={field.name} className="text-base">{t('name-label')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('name-description')}
                  </p>
                  <Input 
                    id={field.name}
                    placeholder={t('name-placeholder')} 
                    className="w-full max-w-md" 
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" />
                    <Label htmlFor={field.name} className="text-base">{t('mission-label')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('mission-description')}
                  </p>
                  <Textarea
                    id={field.name}
                    placeholder={t('mission-placeholder')}
                    className="resize-none w-full max-w-2xl"
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <Label htmlFor={field.name} className="text-base">{t('target-label')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('target-description')}
                  </p>
                  <Textarea
                    id={field.name}
                    placeholder={t('target-placeholder')}
                    className="resize-none w-full max-w-2xl"
                    rows={4}
                    {...field}
                  />
                </div>
              </FormItem>
            )}
          />
          
          <div className="pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('save-button')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 
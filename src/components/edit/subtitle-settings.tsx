import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Italic, Minus, Plus, CaseUpper, RectangleEllipsis, RectangleHorizontal, StretchHorizontal, WholeWord, MoveVertical, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, PaintBucket, AArrowUp, View, Save, Loader2 } from 'lucide-react'
import { useTranslations } from "next-intl"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion"
import { Slider } from "@/src/components/ui/slider"
import { Switch } from "@/src/components/ui/switch"
import { templates } from "@/src/config/subtitles.config"
import SelectFonts from "../ui/select/select-fonts"

export default function SubtitleSettings({ video, updateSubtitleStyle, handleSaveSubtitleStyle }: { video: any, updateSubtitleStyle: any, handleSaveSubtitleStyle: any }) {
  const t = useTranslations('edit.sequence-edit')
  const [isSaving, setIsSaving] = useState(false)

  const updateStyle = (updates: Partial<typeof video.video.subtitle.style>) => {
    updateSubtitleStyle({ style: updates })
  }

  const incrementSize = () => {
    updateStyle({ fontSize: parseInt(video?.video?.subtitle?.style?.fontSize) + 1 })
  }

  const decrementSize = () => {
    updateStyle({ fontSize: parseInt(video?.video?.subtitle?.style?.fontSize) - 1 })
  }

  const incrementSizeBorder = () => {
    updateStyle({ border: { ...video?.video?.subtitle?.style?.border, size: parseInt(video?.video?.subtitle?.style?.border?.size) + 1 } })
  }

  const decrementSizeBorder = () => {
    updateStyle({ border: { ...video?.video?.subtitle?.style?.border, size: parseInt(video?.video?.subtitle?.style?.border?.size) - 1 } })
  }

  const incrementSizeActiveWord = () => {
    updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, fontSize: parseInt(video?.video?.subtitle?.style?.activeWord?.fontSize) + 1 } })
  }

  const decrementSizeActiveWord = () => {
    updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, fontSize: parseInt(video?.video?.subtitle?.style?.activeWord?.fontSize) - 1 } })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle({ color: e.target.value })
  }

  const toggleStyle = (style: 'isItalic' | 'isPunctuation' | 'isUppercase') => {
    updateStyle({ [style]: !video?.video?.subtitle?.style[style] })
  }

  const toggleStyleActiveWord = (style: 'isItalic' | 'isUppercase') => {
    updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, [style]: !video?.video?.subtitle?.style?.activeWord[style] } })
  }

  const onSaveSubtitleStyle = async () => {
    setIsSaving(true)
    await handleSaveSubtitleStyle()
    setIsSaving(false)
  }

  const currentTemplate = templates.find(t => t.name === video?.video?.subtitle?.style?.template)
  const showShadowOption = currentTemplate?.optionsAvailable.includes('shadow')
  const showBorderOption = currentTemplate?.optionsAvailable.includes('border')
  const showActiveWordOption = currentTemplate?.optionsAvailable.includes('activeWord')
  const showAnimationOption = currentTemplate?.optionsAvailable.includes('animation')

  return (
    <>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Subtitle Style</CardTitle>
          <Button size="sm" onClick={onSaveSubtitleStyle} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 w-full">
          <SelectFonts value={video?.video?.subtitle?.style?.fontFamily || "Montserrat"} onChange={(value) => updateStyle({ fontFamily: value })} />
          <Select value={video?.video?.subtitle?.style?.fontWeight || "500"} onValueChange={(value) => updateStyle({ fontWeight: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Weight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300" className="font-light">Light</SelectItem>
              <SelectItem value="500" className="font-normal">Regular</SelectItem>
              <SelectItem value="600" className="font-medium">Medium</SelectItem>
              <SelectItem value="800" className="font-bold">Bold</SelectItem>
              <SelectItem value="900" className="font-black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4 w-full">
          <div className="flex items-center w-1/2">
            <div 
              className="w-9 h-9 rounded-l-md border border-r-0 border-input cursor-pointer"
              style={{ backgroundColor: video?.video?.subtitle?.style?.color || "#FFFFFF" }}
              onClick={() => document.getElementById('color-picker')?.click()}
            />
            <Input
              type="text"
              value={video?.video?.subtitle?.style?.color || "#FFFFFF"}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="flex-1 rounded-l-none uppercase"
              pattern="^#[0-9A-Fa-f]{6}$"
              title="Hexadecimal color code"
            />
            <input
              id="color-picker"
              type="color"
              value={video?.video?.subtitle?.style?.color || "#FFFFFF"}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="sr-only"
            />
          </div>

          <div className="w-1/2 relative">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={video?.video?.subtitle?.style?.fontSize?.toString() || "20"}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                updateStyle({ fontSize: parseInt(value) })
              }}
              className="w-full pl-8 pr-8 text-center"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={decrementSize}
              className="absolute left-0 top-0 bottom-0 px-2"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={incrementSize}
              className="absolute right-0 top-0 bottom-0 px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex w-full">
          <Button
            variant={video?.video?.subtitle?.style?.isItalic ? "default" : "outline"}
            className="flex-1 rounded-r-none"
            onClick={() => toggleStyle('isItalic')}
          >
            <Italic className="h-4 w-4" />
            Italic
          </Button>
          <Button
            variant={video?.video?.subtitle?.style?.isPunctuation ? "default" : "outline"}
            className="flex-1 rounded-none border-x-0"
            onClick={() => toggleStyle('isPunctuation')}
          >
            <RectangleEllipsis className="h-4 w-4" />
            No Punctuation
          </Button>
          <Button
            variant={video?.video?.subtitle?.style?.isUppercase ? "default" : "outline"}
            className="flex-1 rounded-l-none"
            onClick={() => toggleStyle('isUppercase')}
          >
            <CaseUpper className="h-4 w-4" />
            Uppercase
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="layout">
            <AccordionTrigger>Layout</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <div className="flex w-full">
                  <Button
                    variant={video?.video?.subtitle?.style?.mode === 'word' ? "default" : "outline"}
                    className="flex-1 rounded-r-none"
                    onClick={() => updateStyle({ mode: 'word' })}
                  >
                    <WholeWord className="h-4 w-4" />
                    Word
                  </Button>
                  <Button
                    variant={video?.video?.subtitle?.style?.mode === 'line' ? "default" : "outline"}
                    className="flex-1 rounded-none border-x-0"
                    onClick={() => updateStyle({ mode: 'line' })}
                  >
                    <RectangleHorizontal className="h-4 w-4" />
                    Line
                  </Button>
                  <Button
                    variant={video?.video?.subtitle?.style?.mode === 'twoLines' ? "default" : "outline"}
                    className="flex-1 rounded-l-none"
                    onClick={() => updateStyle({ mode: 'twoLines' })}
                  >
                    <StretchHorizontal className="h-4 w-4" />
                    Two Lines
                  </Button>
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 min-w-20">
                    <MoveVertical className="h-4 w-4" />
                    Position
                  </span>
                    <div className="flex">
                      <Button
                        variant={video?.video?.subtitle?.style?.position === 15 ? "default" : "outline"}
                        onClick={() => updateStyle({ position: 15 })}
                        className="rounded-r-none px-3"
                      >
                        <AlignVerticalJustifyStart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={video?.video?.subtitle?.style?.position === 50 ? "default" : "outline"}
                        onClick={() => updateStyle({ position: 50 })}
                        className="rounded-none border-x-0 px-3"
                      >
                        <AlignVerticalJustifyCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={video?.video?.subtitle?.style?.position === 75 ? "default" : "outline"}
                        onClick={() => updateStyle({ position: 75 })}
                        className="rounded-l-none rounded-r-none border-r-0 px-3"
                      >
                        <AlignVerticalJustifyEnd className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={video?.video?.subtitle?.style?.position?.toString() || "50"}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                          updateStyle({ position: value })
                        }}
                        className="w-32 rounded-l-none text-center"
                      />
                    </div>
                    <Slider
                      value={[video?.video?.subtitle?.style?.position || 50]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value: number[]) => updateStyle({ position: value[0] })}
                      className="w-32"
                    />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {showAnimationOption && (
            <AccordionItem value="animation">
              <AccordionTrigger>Animation</AccordionTrigger>
              <AccordionContent>
              <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-2 min-w-20">
                        <View className="h-4 w-4" />
                        Appear
                      </span>
                      <div className="flex items-center w-1/2">
                        <Select value={video?.video?.subtitle?.style?.animation?.appear || "none"} onValueChange={(value) => updateStyle({ animation: { ...video?.video?.subtitle?.style?.animation, appear: value } })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Animation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="fade">Fade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {showShadowOption && (
            <AccordionItem value="shadow">
              <AccordionTrigger>
                <div className="flex items-center justify-between flex-1">
                  Shadow
                  <Switch 
                    checked={video?.video?.subtitle?.style?.shadow?.isActive || false}
                    className="mr-2"
                    onCheckedChange={(checked: boolean) => 
                      updateStyle({ 
                        shadow: { 
                          ...video?.video?.subtitle?.style?.shadow, 
                          isActive: checked 
                        } 
                      })
                    }
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  <div className="flex w-full">
                    <Button
                      variant={video?.video?.subtitle?.style?.shadow?.size === 1 ? "default" : "outline"}
                      className="flex-1 rounded-r-none"
                      onClick={() => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, size: 1 } })}
                    >
                      <span className="text-xs font-extralight">xs</span>
                    </Button>
                    <Button
                      variant={video?.video?.subtitle?.style?.shadow?.size === 2 ? "default" : "outline"}
                      className="flex-1 rounded-none border-x-0"
                      onClick={() => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, size: 2 } })}
                    >
                      <span className="text-xs font-light">s</span>
                    </Button>
                    <Button
                      variant={video?.video?.subtitle?.style?.shadow?.size === 3 ? "default" : "outline"}
                      className="flex-1 rounded-none"
                      onClick={() => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, size: 3 } })}
                    >
                      <span className="text-xs">M</span>
                    </Button>
                    <Button
                      variant={video?.video?.subtitle?.style?.shadow?.size === 4 ? "default" : "outline"}
                      className="flex-1 rounded-none border-x-0"
                      onClick={() => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, size: 4 } })}
                    >
                      <span className="text-xs font-semibold">L</span>
                    </Button>
                    <Button
                      variant={video?.video?.subtitle?.style?.shadow?.size === 5 ? "default" : "outline"}
                      className="flex-1 rounded-l-none"
                      onClick={() => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, size: 5 } })}
                    >
                      <span className="text-xs font-bold">XL</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 min-w-20">
                      <PaintBucket className="h-4 w-4" />
                      Color
                    </span>
                    <div className="flex items-center w-1/2">
                      <div 
                        className="w-9 h-9 rounded-l-md border border-r-0 border-input cursor-pointer"
                        style={{ backgroundColor: video?.video?.subtitle?.style?.shadow?.color || "#000000" }}
                        onClick={() => document.getElementById('color-picker-shadow')?.click()}
                      />
                      <Input
                        type="text"
                        value={video?.video?.subtitle?.style?.shadow?.color || "#000000"}
                        onChange={(e) => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, color: e.target.value } })}
                        className="flex-1 rounded-l-none uppercase"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Hexadecimal color code"
                      />
                      <input
                        id="color-picker-shadow"
                        type="color"
                        value={video?.video?.subtitle?.style?.shadow?.color || "#000000"}
                        onChange={(e) => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, color: e.target.value } })}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {showBorderOption && (
            <AccordionItem value="border">
              <AccordionTrigger>
                <div className="flex items-center justify-between flex-1">
                  Border
                  <Switch 
                    checked={video?.video?.subtitle?.style?.border?.isActive || false}
                    className="mr-2"
                    onCheckedChange={(checked: boolean) => 
                      updateStyle({ 
                        border: { 
                          ...video?.video?.subtitle?.style?.border, 
                          isActive: checked 
                        } 
                      })
                    }
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 min-w-20">
                      <PaintBucket className="h-4 w-4" />
                      Color
                    </span>
                    <div className="flex items-center w-1/2">
                      <div 
                        className="w-9 h-9 rounded-l-md border border-r-0 border-input cursor-pointer"
                        style={{ backgroundColor: video?.video?.subtitle?.style?.shadow?.color || "#000000" }}
                        onClick={() => document.getElementById('color-picker-shadow')?.click()}
                      />
                      <Input
                        type="text"
                        value={video?.video?.subtitle?.style?.shadow?.color || "#000000"}
                        onChange={(e) => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, color: e.target.value } })}
                        className="flex-1 rounded-l-none uppercase"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Hexadecimal color code"
                      />
                      <input
                        id="color-picker-shadow"
                        type="color"
                        value={video?.video?.subtitle?.style?.shadow?.color || "#000000"}
                        onChange={(e) => updateStyle({ shadow: { ...video?.video?.subtitle?.style?.shadow, color: e.target.value } })}
                        className="sr-only"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 min-w-20">
                      <AArrowUp className="h-4 w-4" />
                      Size
                    </span>
                    <div className="w-1/2 relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={video?.video?.subtitle?.style?.border?.size?.toString() || "2"}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          updateStyle({ border: { ...video?.video?.subtitle?.style?.border, size: parseInt(value) } })
                        }}
                        className="w-full pl-8 pr-8 text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={decrementSizeBorder}
                        className="absolute left-0 top-0 bottom-0 px-2"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={incrementSizeBorder}
                        className="absolute right-0 top-0 bottom-0 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {showActiveWordOption && (
            <AccordionItem value="activeWord">
              <AccordionTrigger>
                <div className="flex items-center justify-between flex-1">
                  Active Word
                  <Switch 
                    checked={video?.video?.subtitle?.style?.activeWord?.isActive || false}
                    className="mr-2"
                    onCheckedChange={(checked: boolean) => 
                      updateStyle({ 
                        activeWord: { 
                          ...video?.video?.subtitle?.style?.activeWord, 
                          isActive: checked 
                        } 
                      })
                    }
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex gap-4 w-full">
                    <SelectFonts value={video?.video?.subtitle?.style?.activeWord?.fontFamily || "Montserrat"} onChange={(value) => updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, fontFamily: value } })} />

                    <Select value={video?.video?.subtitle?.style?.activeWord?.fontWeight || "500"} onValueChange={(value) => updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, fontWeight: value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300" className="font-light">Light</SelectItem>
                        <SelectItem value="500" className="font-normal">Regular</SelectItem>
                        <SelectItem value="600" className="font-medium">Medium</SelectItem>
                        <SelectItem value="800" className="font-bold">Bold</SelectItem>
                        <SelectItem value="900" className="font-black">Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-4 w-full">
                    <div className="flex items-center w-1/2">
                      <div 
                        className="w-9 h-9 rounded-l-md border border-r-0 border-input cursor-pointer"
                        style={{ backgroundColor: video?.video?.subtitle?.style?.activeWord?.color || "#FFFFFF" }}
                        onClick={() => document.getElementById('color-picker-activeWord')?.click()}
                      />
                      <Input
                        type="text"
                        value={video?.video?.subtitle?.style?.activeWord?.color || "#FFFFFF"}
                        onChange={(e) => updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, color: e.target.value } })}
                        className="flex-1 rounded-l-none uppercase"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Hexadecimal color code"
                      />
                      <input
                        id="color-picker-activeWord"
                        type="color"
                        value={video?.video?.subtitle?.style?.activeWord?.color || "#FFFFFF"}
                        onChange={(e) => updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, color: e.target.value } })}
                        className="sr-only"
                      />
                    </div>

                    <div className="w-1/2 relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={video?.video?.subtitle?.style?.activeWord?.fontSize?.toString() || "20"}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          updateStyle({ activeWord: { ...video?.video?.subtitle?.style?.activeWord, fontSize: parseInt(value) } })
                        }}
                        className="w-full pl-8 pr-8 text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={decrementSizeActiveWord}
                        className="absolute left-0 top-0 bottom-0 px-2"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={incrementSizeActiveWord}
                        className="absolute right-0 top-0 bottom-0 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex w-full">
                    <Button
                      variant={video?.video?.subtitle?.style?.activeWord?.isItalic ? "default" : "outline"}
                      className="flex-1 rounded-r-none"
                      onClick={() => toggleStyleActiveWord('isItalic')}
                    >
                      <Italic className="h-4 w-4" />
                      Italic
                    </Button>
                    <Button
                      variant={video?.video?.subtitle?.style?.activeWord?.isUppercase ? "default" : "outline"}
                      className="flex-1 rounded-l-none border-l-0"
                      onClick={() => toggleStyleActiveWord('isUppercase')}
                    >
                      <CaseUpper className="h-4 w-4" />
                      Uppercase
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </>
  )
}
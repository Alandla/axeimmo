import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog"

interface PreviewModalProps {
  previewUrl: string
  avatarName: string
  lookPlace: string
  children: React.ReactNode
}

export function PreviewModal({ previewUrl, avatarName, lookPlace, children }: PreviewModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
            <DialogTitle>
                {avatarName} - {lookPlace}
            </DialogTitle>
        </DialogHeader>
        <video 
          src={previewUrl} 
          controls 
          autoPlay 
          className="w-full rounded-lg"
        />
      </DialogContent>
    </Dialog>
  )
}

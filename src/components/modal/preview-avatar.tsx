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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
            <DialogTitle>
                {avatarName} - {lookPlace}
            </DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <video 
            src={previewUrl} 
            controls 
            autoPlay 
            className="max-w-full max-h-[60vh] rounded-lg"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

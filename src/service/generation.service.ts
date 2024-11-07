import { useCreationStore } from '../store/creationStore'
import { UploadedFile } from '../types/files'
import { StepState } from '../types/step'
import { getMediaUrlFromFileByPresignedUrl, uploadFiles } from './upload.service'

// On récupère directement le store sans le hook
const creationStore = useCreationStore.getState()

export const startGeneration = async () => {
  const { files, steps, setSteps } = useCreationStore.getState()
  
  // Exemple de mise à jour d'un step
  const updateStepProgress = (stepId: number, progress: number) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId 
        ? { ...step, progress, state: progress === 100 ? StepState.COMPLETED : StepState.IN_PROGRESS }
        : step
    )
    setSteps(updatedSteps)
  }

  let uploadedFiles: UploadedFile[] = []
  if (files.length > 0) {
    updateStepProgress(0, 0)
    uploadedFiles = await uploadFiles(files, updateStepProgress)
  }

  // Continuer la génération...
  console.log('continue generation')
}
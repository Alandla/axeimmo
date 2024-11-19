import { auth, runs } from '@trigger.dev/sdk/v3'
import { basicApiCall } from '../lib/api'
import { useCreationStore } from '../store/creationStore'
import { UploadedFile } from '../types/files'
import { Steps, StepState } from '../types/step'
import { uploadFiles } from './upload.service'
import { useActiveSpaceStore } from '../store/activeSpaceStore'

export const startGeneration = async () => {
  const { files, script, selectedVoice, selectedAvatar, setSteps } = useCreationStore.getState()
  const { activeSpace } = useActiveSpaceStore.getState()
  
  const updateStepProgress = (stepName: string, progress: number) => {
    const currentSteps = useCreationStore.getState().steps
    const updatedSteps = currentSteps.map(step => 
      step.name === stepName 
        ? { ...step, progress, state: progress === 100 ? StepState.COMPLETED : StepState.IN_PROGRESS }
        : step
    )
    setSteps(updatedSteps)
  }

  let uploadedFiles: UploadedFile[] = []
  if (files.length > 0) {
    updateStepProgress("MEDIA_UPLOAD", 0)
    uploadedFiles = await uploadFiles(files, updateStepProgress)
  }

  const options = {
    files: uploadedFiles,
    script: script,
    voice: selectedVoice,
    avatar: selectedAvatar,
    spaceId: activeSpace?.id
  }

  //Start generation task
  const { runId, publicAccessToken } = await basicApiCall("/trigger/startGeneration", { options, showToast: false }) as { runId: string, publicAccessToken: string }

  //Access to the generation task
  auth.configure({
    accessToken: publicAccessToken,
  });

  //Subscribe to the generation task
  for await (const run of runs.subscribeToRun(runId)) {
    console.log(run)
    console.log(run.metadata);
    updateStepProgress(run.metadata?.name as Steps, run.metadata?.progress as number)
    if (run.status === "COMPLETED") {
      break
    }
  }

  // Continuer la génération...
  console.log('continue generation')
}
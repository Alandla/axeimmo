import { auth, runs } from '@trigger.dev/sdk/v3'
import { basicApiCall } from '../lib/api'
import { useCreationStore } from '../store/creationStore'
import { Steps, StepState } from '../types/step'
import { uploadFiles } from './upload.service'
import { IMedia } from '../types/video'

export const startGeneration = async (userId: string, spaceId: string) => {
  const { files, script, selectedVoice, selectedLook, setSteps } = useCreationStore.getState()
  
  const updateStepProgress = (stepName: string, progress: number) => {
    const currentSteps = useCreationStore.getState().steps
    const updatedSteps = currentSteps.map(step => 
      step.name === stepName 
        ? { ...step, progress, state: progress === 100 ? StepState.COMPLETED : StepState.IN_PROGRESS }
        : step
    )
    setSteps(updatedSteps)
  }

  let uploadedFiles: IMedia[] = []
  if (files.length > 0) {
    console.log("files", files)
    updateStepProgress("MEDIA_UPLOAD", 0)
    uploadedFiles = await uploadFiles(files, updateStepProgress)
  }

  const options = {
    files: uploadedFiles,
    script: script,
    voice: selectedVoice,
    avatar: selectedLook,
    userId: userId,
    spaceId: spaceId
  }

  //Start generation task
  const { runId, publicAccessToken } = await basicApiCall("/trigger/startGeneration", { options }) as { runId: string, publicAccessToken: string }

  //Access to the generation task
  auth.configure({
    accessToken: publicAccessToken,
  });

  let videoId = ''

  //Subscribe to the generation task
  let lastStep;
  try {
    for await (const run of runs.subscribeToRun(runId)) {
      
      if (run.status === "FAILED") {
        const currentSteps = useCreationStore.getState().steps
        const updatedSteps = currentSteps.map(step => 
          step.name === run.metadata?.name 
            ? { ...step, state: StepState.FAILED }
            : step
        )
        setSteps(updatedSteps)
        throw new Error('Generation failed')
      }

      if (lastStep && run.metadata?.name !== lastStep) {
        updateStepProgress(lastStep as Steps, 100)
      }
      updateStepProgress(run.metadata?.name as Steps, run.metadata?.progress as number)
      lastStep = run.metadata?.name as Steps
      if (run.status === "COMPLETED") {
        videoId = run.output?.videoId as string
        break
      }
    }
  } catch (error) {
    console.error('Generation error:', error)
    return null
  }

  return videoId
}
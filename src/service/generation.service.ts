import { auth } from '@trigger.dev/sdk/v3'
import { basicApiCall } from '../lib/api'
import { useCreationStore } from '../store/creationStore'
import { Steps, StepState } from '../types/step'
import { uploadFiles } from './upload.service'
import { IMedia } from '../types/video'
import { useVideosStore } from '../store/videosStore'

// Create hooks for components to use
export const useGenerationProcess = () => {
  const startGeneration = async (userId: string, spaceId: string) => {
    const { files, script, selectedVoice, selectedLook, setSteps, setLastStep } = useCreationStore.getState()
    
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
      updateStepProgress("MEDIA_UPLOAD", 0)
      uploadedFiles = await uploadFiles(files, updateStepProgress)
    }
    updateStepProgress(Steps.QUEUE, 20)

    setLastStep(Steps.QUEUE)
    
    const options = {
      files: uploadedFiles,
      script: script,
      voice: selectedVoice,
      avatar: selectedLook,
      userId: userId,
      spaceId: spaceId
    }

    // Start generation task
    const response = await basicApiCall("/trigger/startGeneration", { options });
    const { runId, publicAccessToken } = response as { runId: string, publicAccessToken: string };

    // Return the information needed for useRealtimeRun hook
    return {
      runId,
      publicAccessToken,
      spaceId
    };
  }

  return { startGeneration };
};

// Fonction pour traiter les mises à jour du run
export const handleRunUpdate = (run: any, spaceId: string) => {
  const { setSteps } = useCreationStore.getState();
  let videoId = '';
  
  if (run) {
    if (run.status === "FAILED") {
      const currentSteps = useCreationStore.getState().steps;
      const updatedSteps = currentSteps.map(step => 
        step.name === run.metadata?.name 
          ? { ...step, state: StepState.FAILED }
          : step
      );
      setSteps(updatedSteps);
      throw new Error('Generation failed');
    }

    // Update step progress
    const updateStepProgress = (stepName: string, progress: number) => {
      const currentSteps = useCreationStore.getState().steps;
      const updatedSteps = currentSteps.map(step => 
        step.name === stepName 
          ? { ...step, progress, state: progress === 100 ? StepState.COMPLETED : StepState.IN_PROGRESS }
          : step
      );
      setSteps(updatedSteps);
    };

    // Si on change d'étape, on complète toutes les étapes précédentes
    const lastStep = useCreationStore.getState().lastStep;
    const currentSteps = useCreationStore.getState().steps;
    if (lastStep && run.metadata?.name !== lastStep) {
      updateStepProgress(lastStep as Steps, 100);
      // Trouver l'index de la nouvelle étape
      const stepOrder = Object.values(Steps);
      const newStepIndex = stepOrder.indexOf(run.metadata?.name as Steps);
      
      // Mettre à 100% toutes les étapes précédentes qui ne sont pas complètes
      currentSteps.forEach(step => {
        const stepIndex = stepOrder.indexOf(step.name);
        if (stepIndex < newStepIndex && step.progress < 100) {
          updateStepProgress(step.name, 100);
        }
      });
    }
    
    // Mettre à jour l'étape actuelle
    updateStepProgress(run.metadata?.name as Steps, run.metadata?.progress as number);
    useCreationStore.getState().setLastStep(run.metadata?.name as Steps);
    
    // Quand le processus est terminé
    if (run.status === "COMPLETED") {
      updateStepProgress(Steps.REDIRECTING, 80)
      videoId = run.output?.videoId as string;
      
      // Générer la miniature
      if (videoId) {
        try {
          basicApiCall("/video/generateThumbnail", { videoId });
        } catch (e) {
          console.error('Error generating thumbnail:', e);
        }
      }
      
      return videoId;
    }
  }
  
  return null;
};
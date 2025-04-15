import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Video, 
  AlertCircle,
  CheckCircle2,
  Music,
  User
} from 'lucide-react';
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/src/components/ui/card";
import { IExport } from '../types/export';
import { basicApiCall } from '../lib/api';
import { IVideo } from '../types/video';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { auth, runs } from '@trigger.dev/sdk/v3';
import confetti from 'canvas-confetti';

type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';
type ExportStep = 'avatar' | 'render' | 'render-audio';

export default function VideoExportProgress({ exportData, video }: { exportData: IExport | null, video: IVideo | null }) {
  const t = useTranslations('export')
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>('pending');
  const [step, setStep] = useState<ExportStep>('render');
  const [startedExport, setStartedExport] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const triggerConfetti = () => {
    const end = Date.now() + 1000; // 1 seconde
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  useEffect(() => {
    const fetchExport = async () => {
      console.log("Fetching export", exportData, video)
      try {
        if (exportData?.status === 'pending' && video && exportData && !exportData.runId) {

          const options = {
            videoId: video.id,
            exportId: exportData.id
          }

          if (!startedExport) {
            setStartedExport(true)
            const { runId, publicAccessToken } = await basicApiCall('/trigger/startExport', { options }) as { runId: string, publicAccessToken: string };

            auth.configure({
              accessToken: publicAccessToken,
            });
            

            for await (const run of runs.subscribeToRun(runId)) {
              setStatus(run.metadata?.status as ExportStatus)
              if (run.metadata?.progress) {
                setProgress(run.metadata?.progress as number)
              } else {
                setProgress(0)
              }
              setStep(run.metadata?.step as ExportStep)
              if (run.status === "COMPLETED") {
                setDownloadUrl(run.metadata?.downloadUrl as string)
                triggerConfetti()
                break
              }
              if (run.status === "FAILED") {
                setErrorMessage(run.metadata?.errorMessage as string)
                break
              }
            }
          }
        } else if (exportData && video && exportData.status === 'processing' && exportData.runId) {
          const { runId, publicAccessToken } = await basicApiCall('/trigger/getAccessToken', { runId: exportData.runId }) as { runId: string, publicAccessToken: string };

          auth.configure({
            accessToken: publicAccessToken,
          });

          for await (const run of runs.subscribeToRun(runId)) {
            if (run.status === "COMPLETED") {
              setDownloadUrl(run.output.url as string)
              setStatus('completed')
              triggerConfetti()
              break
            }
            if (run.status === "FAILED") {
              setErrorMessage(run.output.error as string)
              setStatus('failed')
              break
            }
            setStatus(run.metadata?.status as ExportStatus)
            setProgress(run.metadata?.progress as number)
            setStep(run.metadata?.step as ExportStep)
          }
        } else if (exportData && video && exportData.status === 'completed' && exportData.runId) {
          triggerConfetti()
          setDownloadUrl(exportData.downloadUrl as string)
          setStatus('completed')
        }
      } catch (error) {
        console.error('Error fetching export:', error)
        setStatus('failed')
      }
    }
    fetchExport()
  }, [exportData, video])

  // Fonction pour afficher l'icône en fonction de l'étape actuelle
  const renderStepIcon = () => {
    switch (step) {
      case 'avatar':
        return <User className="w-12 h-12 text-primary animate-pulse" />;
      case 'render-audio':
        return <Music className="w-12 h-12 text-primary animate-pulse" />;
      default:
        return <Video className="w-12 h-12 text-primary animate-pulse" />;
    }
  };

  // Fonction pour afficher le titre en fonction de l'étape actuelle
  const getStepTitle = () => {
    switch (step) {
      case 'avatar':
        return t('title-avatar');
      case 'render-audio':
        return t('title-audio');
      default:
        return t('title');
    }
  };

  if (status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-center">
            <AlertCircle className="w-20 h-20 text-destructive" />
          </div>
          <CardTitle className="text-center">{t('title-failed')}</CardTitle>
          <CardDescription className="text-center">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setStatus('processing')}
            variant="default"
            size="lg"
          >
            {t('retry-export')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      {status === 'completed' ? (
        <>
          <CardHeader>
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-center">{t('title-completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center h-96 overflow-hidden">
              <video 
                className="rounded-lg"
                controls
                src={downloadUrl}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5" />
                {t('back-to-dashboard')}
              </Button>
            </Link>
            <a href={downloadUrl} download>
              <Button size="lg">
                <Download className="w-5 h-5" />
                {t('download-video')}
              </Button>
            </a>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader>
            <div className="flex justify-center">
              {renderStepIcon()}
            </div>
            <CardTitle className="text-center">{getStepTitle()}</CardTitle>
            <CardDescription className="text-center">
              {status === 'processing' ? t('processing') : t('waiting-to-start')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <span className="text-8xl font-bold text-card-foreground tabular-nums">
                {progress}
                <span className="text-primary">%</span>
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </>
      )}
    </Card>
  );
}
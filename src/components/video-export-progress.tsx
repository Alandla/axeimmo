import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Video, 
  AlertCircle,
  CheckCircle2
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
import { pollExportStatus } from '../service/rendering.service';
import { useTranslations } from 'next-intl';

type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export default function VideoExportProgress({ exportData, video }: { exportData: IExport | null, video: IVideo | null }) {
  const t = useTranslations('export')
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>('pending');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    const fetchExport = async () => {
      console.log("Fetching export", exportData, video)
      try {
        if (exportData?.status === 'pending' && video && exportData) {

          const renderResult : { renderId: string, bucketName: string } = await basicApiCall('/export/start', { video: video, exportId: exportData.id });
          setStatus('processing')

          const downloadUrl = await pollExportStatus(renderResult.renderId, renderResult.bucketName, video, exportData, setProgress, setStatus, setDownloadUrl)
          setDownloadUrl(downloadUrl)

        } else if (video && exportData) {
          console.log("ouais")
          setStatus(exportData?.status || 'pending')

          if (exportData?.renderId && exportData?.bucketName) {
            const downloadUrl = await pollExportStatus(exportData.renderId, exportData.bucketName, video, exportData, setProgress, setStatus, setDownloadUrl)
            setDownloadUrl(downloadUrl)
          }
        }
      } catch (error) {
        console.error('Error fetching export:', error)
        setStatus('failed')
      }
    }
    fetchExport()
  }, [exportData, video])

  if (status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-center">
            <AlertCircle className="w-20 h-20 text-destructive" />
          </div>
          <CardTitle className="text-center">{t('title-failed')}</CardTitle>
          <CardDescription className="text-center">
            {t('message-failed')}
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
      {status === 'processing' || status === 'pending' ? (
        <>
          <CardHeader>
            <div className="flex justify-center">
              <Video className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-center">{t('title')}</CardTitle>
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
      ) : (
        <>
          <CardHeader>
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-center">{t('title-completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video 
                className="w-full h-full object-cover"
                controls
                src={downloadUrl}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t('back-to-dashboard')}
              </Button>
            </Link>
            <Button size="lg">
              <Download className="w-5 h-5 mr-2" />
              {t('download-video')}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
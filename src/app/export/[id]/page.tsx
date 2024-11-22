'use client'

import VideoExportProgress from "@/src/components/video-export-progress";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/src/components/ui/breadcrumb"
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IExport } from "@/src/types/export";
import { basicApiGetCall } from "@/src/lib/api";
import { IVideo } from "@/src/types/video";

export default function Export() {
  const { id } = useParams()
  const [exportData, setExportData] = useState<IExport | null>(null)
  const [video, setVideo] = useState<IVideo | null>(null)

  useEffect(() => {
    const fetchExport = async () => {
      try {
        const response = await basicApiGetCall<IExport>(`/export/${id}`)
        setExportData(response)
        const video = await basicApiGetCall<IVideo>(`/video/${response.videoId}`)
        setVideo(video)
      } catch (error) {
        console.error('Error fetching export:', error)
      }
    }

    if (id) {
      fetchExport()
    }
  }, [id])

    return (
      <div className="min-h-screen bg-muted overflow-hidden">
        <header className="sticky top-0 z-10 bg-muted p-4">
          <div className="mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard" asChild>
                            <Link href="/dashboard">
                                Dashboard
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator/>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/edit/1" asChild>
                            <Link href="/edit/1">
                                Edit
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator/>
                    <BreadcrumbItem>
                        <BreadcrumbPage>{video?.title || 'Chargement...'}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 overflow-hidden">
          <div className="w-full max-w-2xl">
            <VideoExportProgress exportData={exportData} video={video} />
          </div>
        </div>
      </div>
    )
  }  
import VideoList from "@/src/components/video-list";
import { IVideo } from "@/src/types/video";
import { useEffect, useState } from "react";

export default function Dashboard() {

  const [videos, setVideos] = useState<IVideo[]>([])

  useEffect(() => {
    
  }, [])

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mes Vidéos</h1>
      <VideoList />
    </main>
  )
}

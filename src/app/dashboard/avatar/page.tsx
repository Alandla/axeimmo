'use client'

import { AvatarGridComponent } from '@/src/components/avatar-grid'

export default function AvatarPage() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <AvatarGridComponent mode="large" variant="create"/>
    </div>
  )
}



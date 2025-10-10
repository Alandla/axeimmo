import { NextRequest } from 'next/server'
import { eventBus } from '@/src/lib/events'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const spaceId = params.id

  let cleanup: (() => void) | null = null
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let closed = false

      const safeEnqueue = (chunk: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(chunk)) } catch {}
      }
      const send = (data: any) => {
        safeEnqueue(`data: ${JSON.stringify(data)}\n\n`)
      }

      const onLookUpdated = (payload: any) => {
        if (payload?.spaceId === spaceId) {
          send({ type: 'look.updated', payload })
        }
      }
      const onAvatarUpdated = (payload: any) => {
        if (payload?.spaceId === spaceId) {
          send({ type: 'avatar.updated', payload })
        }
      }

      eventBus.on('look.updated', onLookUpdated)
      eventBus.on('avatar.updated', onAvatarUpdated)

      // initial ping
      send({ type: 'connected' })

      const keepAlive = setInterval(() => {
        if (!closed) safeEnqueue(`: keep-alive\n\n`)
      }, 25000)

      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(keepAlive)
        eventBus.off('look.updated', onLookUpdated)
        eventBus.off('avatar.updated', onAvatarUpdated)
        try { controller.close() } catch {}
      }
    },
    cancel() {
      try { cleanup?.() } catch {}
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}



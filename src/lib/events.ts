import { EventEmitter } from 'events'

// Singleton process-wide event bus for simple server-side notifications
// Events: 'look.updated' with payload { spaceId, avatarId, lookId, status }
class GlobalEventBus {
  private static instance: EventEmitter | null = null
  static get(): EventEmitter {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new EventEmitter()
      GlobalEventBus.instance.setMaxListeners(100)
    }
    return GlobalEventBus.instance
  }
}

export const eventBus = GlobalEventBus.get()



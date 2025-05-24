import 'next-auth'

declare module 'next-auth' {
  interface User {
    options?: {
        lang?: string
    }
    checkAffiliate?: boolean
    hasFinishedOnboarding?: boolean
  }
}

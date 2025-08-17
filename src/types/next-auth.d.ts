import 'next-auth'

declare module 'next-auth' {
  interface User {
    firstName?: string
    options?: {
        lang?: string
    }
    checkAffiliate?: boolean
    hasFinishedOnboarding?: boolean
  }
}

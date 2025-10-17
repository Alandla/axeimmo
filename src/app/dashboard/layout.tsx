import { AppSidebar } from "@/src/components/app-sidebar"
import { Separator } from "@/src/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/src/components/ui/sidebar"
import { TooltipProvider } from "@/src/components/ui/tooltip"
import { BreadcrumbDashboard } from "@/src/components/breadcrumb-dashboard";
import { DashboardHeaderControls } from '@/src/components/dashboard-header-controls';
import { auth } from "@/src/lib/auth"
import { redirect } from "next/navigation"

export default async function LayoutPrivate({ children }: Readonly<{children: React.ReactNode}>) {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  if (!session.user?.hasFinishedOnboarding) {
    redirect('/onboarding');
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <TooltipProvider>
          <SidebarInset className="overflow-x-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <BreadcrumbDashboard />
            </div>
            <DashboardHeaderControls />
          </header>
            {children}
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </>
  );
}

"use client"

import { AppSidebar } from "@/src/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb"
import { Separator } from "@/src/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/src/components/ui/sidebar"
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from "react"
import { TooltipProvider } from "@/src/components/ui/tooltip"
import { useTranslations } from "next-intl"

function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => {
    const href = '/' + paths.slice(0, index + 1).join('/');
    return { href, label: path.charAt(0).toUpperCase() + path.slice(1) };
  });
}

export default function LayoutPrivate({ children }: Readonly<{children: React.ReactNode}>) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const t = useTranslations('breadcrumbs')

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <TooltipProvider>
          <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <Fragment key={crumb.href}>
                      {index > 0 && <BreadcrumbSeparator/>}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{t(crumb.label)}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} asChild>
                            <Link href={crumb.href}>
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
            {children}
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </>
  );
}

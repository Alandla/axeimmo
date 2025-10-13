'use client'

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/src/components/ui/breadcrumb"
import { Fragment } from "react"
import Link from "next/link";
import { useAvatarsStore } from "../store/avatarsStore";

function generateBreadcrumbs(pathname: string) {
    const paths = pathname.split('/').filter(Boolean);
    const filteredPaths = paths;
    return filteredPaths.map((path, index) => {
      const href = '/' + filteredPaths.slice(0, index + 1).join('/');
      return { href, label: path.charAt(0).toUpperCase() + path.slice(1) };
    });
}

export function BreadcrumbDashboard( ) {
  const t = useTranslations('breadcrumbs')
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const avatarId = searchParams?.get('avatar')
  const activeAvatarName = useAvatarsStore(s => s.activeAvatarName)

  return (
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
                            {t(crumb.label)}
                        </Link>
                    </BreadcrumbLink>
                )}
                </BreadcrumbItem>
            </Fragment>
            ))}
            {avatarId && activeAvatarName && (
              <>
                <BreadcrumbSeparator/>
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeAvatarName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
        </BreadcrumbList>
    </Breadcrumb>
  )
}

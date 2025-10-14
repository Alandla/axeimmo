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

function generateBreadcrumbs(pathname: string, searchParams?: URLSearchParams, activeAvatarName?: string) {
    const paths = pathname.split('/').filter(Boolean);
    // If path contains "enhance", stop at "enhance" and don't show following segments
    const enhanceIndex = paths.indexOf('enhance');
    const filteredPaths = enhanceIndex !== -1 ? paths.slice(0, enhanceIndex + 1) : paths;
    const crumbs = filteredPaths.map((path, index) => {
      const href = '/' + filteredPaths.slice(0, index + 1).join('/');
      return { href, label: path.charAt(0).toUpperCase() + path.slice(1), translate: true } as { href: string; label: string; translate?: boolean };
    });

    const hasAvatarParam = !!searchParams?.get('avatar');
    if (hasAvatarParam && activeAvatarName) {
      const hrefWithParams = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      crumbs.push({ href: hrefWithParams, label: activeAvatarName, translate: false });
    }

    return crumbs;
}

export function BreadcrumbDashboard( ) {
  const t = useTranslations('breadcrumbs')
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeAvatarName = useAvatarsStore(s => s.activeAvatarName)
  const breadcrumbs = generateBreadcrumbs(pathname, searchParams, activeAvatarName ?? undefined);

  return (
    <Breadcrumb>
        <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
                {index > 0 && <BreadcrumbSeparator/>}
                <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.translate === false ? crumb.label : t(crumb.label)}</BreadcrumbPage>
                ) : (
                    <BreadcrumbLink href={crumb.href} asChild>
                        <Link href={crumb.href}>
                            {crumb.translate === false ? crumb.label : t(crumb.label)}
                        </Link>
                    </BreadcrumbLink>
                )}
                </BreadcrumbItem>
            </Fragment>
            ))}
        </BreadcrumbList>
    </Breadcrumb>
  )
}

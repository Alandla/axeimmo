'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination"
import { cn } from "@/src/lib/utils"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  screenSize: 'mobile' | 'tablet' | 'desktop'
  translationKey?: string // Pour permettre différentes traductions (videos, assets, etc.)
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  screenSize,
  translationKey = 'common'
}: PaginationControlsProps) {
  const t = useTranslations(translationKey)

  // Générer les numéros de page à afficher selon la taille d'écran
  const generatePaginationItems = () => {
    const pageNumbers = [];
    // Adapter le nombre de pages visibles selon la taille d'écran
    const totalPagesToShow = screenSize === 'desktop' ? 5 : screenSize === 'tablet' ? 4 : 3;
    const halfWay = Math.floor(totalPagesToShow / 2);
    
    let startPage = Math.max(currentPage - halfWay, 1);
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);
    
    // Ajuster si on n'a pas assez de pages à la fin
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    };
  };

  if (totalPages <= 1) return null;

  const paginationData = generatePaginationItems();

  return (
    <div className="mt-auto p-4 border-t">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {t('pagination-info', {
            start: (currentPage - 1) * itemsPerPage + 1,
            end: Math.min(currentPage * itemsPerPage, totalCount),
            total: totalCount
          })}
        </p>
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              showText={false}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={cn(
                "cursor-pointer sm:hidden",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
            <PaginationPrevious 
              showText={true}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={cn(
                "cursor-pointer hidden sm:flex",
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
          
          {paginationData.showStartEllipsis && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {paginationData.numbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={() => onPageChange(pageNumber)}
                isActive={currentPage === pageNumber}
                className="cursor-pointer"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}

          {paginationData.showEndEllipsis && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              showText={false}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={cn(
                "cursor-pointer sm:hidden",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
            <PaginationNext 
              showText={true}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={cn(
                "cursor-pointer hidden sm:flex",
                currentPage === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
} 
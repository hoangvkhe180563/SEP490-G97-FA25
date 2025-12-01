import * as React from 'react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DOTS = 'DOTS';
const usePaginationRange = ({
  currentPage,
  totalPages,
}: Omit<PaginationProps, 'onPageChange'>): (number | string)[] => {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | string)[] = [];
  const startPage = 1;
  const endPage = totalPages;

  let centerPages: number[] = [];

  if (currentPage <= 2) {
    centerPages = [1, 2, 3];
  } else if (currentPage >= totalPages - 1) {
    centerPages = [totalPages - 2, totalPages - 1, totalPages];
  } else {
    centerPages = [currentPage - 1, currentPage, currentPage + 1];
  }

  if (!centerPages.includes(startPage)) {
    range.push(startPage);
  }

  // left
  if (centerPages[0] > startPage + 1) {
    range.push(DOTS);
  } else if (centerPages[0] === startPage + 1 && !range.includes(startPage)) {
    range.push(startPage);
  }


  // center
  centerPages = centerPages.filter(p => p > 0 && p <= totalPages);
  const uniqueCenterPages = centerPages.filter(p => !range.includes(p));
  range.push(...uniqueCenterPages);


  // right
  if (centerPages[centerPages.length - 1] < endPage - 1) {
    if (!range.includes(DOTS) || range[range.length - 1] !== DOTS) {
      range.push(DOTS);
    }
  }

  if (!centerPages.includes(endPage) && range[range.length - 1] !== endPage) {
    range.push(endPage);
  }

  const finalRange = range.filter((item, index, arr) => {
    if (index > 0 && item === arr[index - 1]) {
      return false;
    }
    return true;
  });

  return finalRange;
};

export const Paging: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const paginationRange = usePaginationRange({
    currentPage,
    totalPages,
  });

  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Pagination className="flex items-center justify-end space-x-2 py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            className={isFirstPage ? 'opacity-50' : ''}
          >
          </PaginationPrevious>
        </PaginationItem>

        {paginationRange.map((page, index) => {
          if (page === DOTS) {
            return (
              <PaginationItem key={index}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => handlePageClick(pageNumber)}
                isActive={isActive}>
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            className={isLastPage ? 'opacity-50' : ''}
          >
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
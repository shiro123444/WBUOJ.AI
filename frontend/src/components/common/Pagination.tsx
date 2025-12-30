import { Pagination as HeroUIPagination, Button } from '@heroui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  showControls?: boolean
  variant?: 'bordered' | 'flat' | 'faded' | 'light'
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showControls = true,
  variant = 'bordered',
  color = 'primary',
  size = 'md',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const startItem = totalItems && itemsPerPage 
    ? (currentPage - 1) * itemsPerPage + 1 
    : null
  const endItem = totalItems && itemsPerPage 
    ? Math.min(currentPage * itemsPerPage, totalItems) 
    : null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 sm:px-6">
      {/* Item count info */}
      {totalItems !== undefined && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          显示第 <span className="font-medium">{startItem}</span> 到{' '}
          <span className="font-medium">{endItem}</span> 条，共{' '}
          <span className="font-medium">{totalItems}</span> 条
        </div>
      )}
      
      {/* Mobile view - simple prev/next buttons */}
      <div className="flex sm:hidden gap-2">
        <Button
          size="sm"
          variant="bordered"
          isDisabled={currentPage === 1}
          onPress={() => onPageChange(currentPage - 1)}
          startContent={<ChevronLeftIcon className="h-4 w-4" />}
        >
          上一页
        </Button>
        <Button
          size="sm"
          variant="bordered"
          isDisabled={currentPage === totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          endContent={<ChevronRightIcon className="h-4 w-4" />}
        >
          下一页
        </Button>
      </div>

      {/* Desktop view - Hero UI Pagination */}
      <div className="hidden sm:block">
        <HeroUIPagination
          total={totalPages}
          page={currentPage}
          onChange={onPageChange}
          showControls={showControls}
          variant={variant}
          color={color}
          size={size}
          boundaries={1}
          siblings={1}
          classNames={{
            wrapper: 'gap-1',
            item: 'bg-transparent',
            cursor: 'bg-primary text-white font-medium',
          }}
        />
      </div>
    </div>
  )
}

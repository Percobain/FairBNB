/**
 * @fileoverview Reusable skeleton loader components for FairBNB
 */

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-nb-ink/3 rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton for property listing cards
 */
export function ListingCardSkeleton() {
  return (
    <div className="bg-nb-bg border-2 border-nb-ink rounded-nb overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for listing details page
 */
export function ListingDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery skeleton */}
            <div className="bg-nb-bg border-2 border-nb-ink rounded-nb overflow-hidden">
              <Skeleton className="h-64 md:h-96 w-full" />
            </div>

            {/* Title and details */}
            <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>

            {/* Features skeleton */}
            <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing widget skeleton */}
            <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6 sticky top-8">
              <Skeleton className="h-8 w-24 mb-4" />
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3 mb-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-12 w-full mb-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="border-t-2 border-nb-ink pt-2 flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>

            {/* Landlord info skeleton */}
            <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for dashboard stats
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b border-nb-ink/20">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton for form inputs during loading
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for gallery/image grid
 */
export function GallerySkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-nb" />
      ))}
    </div>
  );
}

/**
 * Skeleton for dispute case items
 */
export function DisputeCaseSkeleton() {
  return (
    <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * Full page skeleton with header
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-nb" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full rounded-nb" />
              <Skeleton className="h-24 w-full rounded-nb" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-nb" />
              <Skeleton className="h-32 w-full rounded-nb" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state for rental actions
 */
export function RentalActionsSkeleton() {
  return (
    <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-nb" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for tenant search/filter bar
 */
export function SearchFilterSkeleton() {
  return (
    <div className="bg-nb-bg border-4 border-nb-ink rounded-nb p-6 mb-8">
      <div className="max-w-4xl mx-auto">
        {/* Search bar skeleton */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full rounded-nb" />
        </div>
        
        {/* Filter buttons skeleton */}
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for tenant listings grid
 */
export function TenantListingsGridSkeleton({ count = 9 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for property details hero section
 */
export function PropertyHeroSkeleton() {
  return (
    <div className="bg-nb-bg border-4 border-nb-ink rounded-nb overflow-hidden mb-8">
      {/* Image skeleton */}
      <Skeleton className="h-64 md:h-96 w-full" />
      
      {/* Content overlay skeleton */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for booking widget
 */
export function BookingWidgetSkeleton() {
  return (
    <div className="bg-nb-bg border-4 border-nb-ink rounded-nb p-6 sticky top-8">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-5 w-40 mb-6" />
      
      {/* Date inputs skeleton */}
      <div className="space-y-4 mb-6">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      
      {/* Book button skeleton */}
      <Skeleton className="h-12 w-full mb-4" />
      
      {/* Price breakdown skeleton */}
      <div className="space-y-2 pt-4 border-t-2 border-nb-ink">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between font-bold pt-2 border-t border-nb-ink">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for tenant dashboard stats
 */
export function TenantDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-nb-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Current rentals section skeleton */}
        <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6 mb-8">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-nb-ink rounded">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-16 h-16 rounded" />
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity skeleton */}
        <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for rental application form
 */
export function RentalApplicationSkeleton() {
  return (
    <div className="bg-nb-bg border-4 border-nb-ink rounded-nb p-6">
      <Skeleton className="h-7 w-48 mb-6" />
      
      <div className="space-y-6">
        {/* Personal info section */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Employment info section */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional info section */}
        <div>
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
        </div>

        {/* Submit button skeleton */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for property amenities section
 */
export function AmenitiesSkeleton() {
  return (
    <div className="bg-nb-bg border-2 border-nb-ink rounded-nb p-6">
      <Skeleton className="h-6 w-24 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Responsive Layout Component
 * Renders different components based on screen size
 * 
 * @param {ReactNode} desktop - Desktop component
 * @param {ReactNode} mobile - Mobile component
 * @param {ReactNode} fallback - Optional fallback for both
 */
export default function ResponsiveLayout({ desktop, mobile, fallback }) {
  const isMobile = useIsMobile();

  if (fallback && !desktop && !mobile) {
    return fallback;
  }

  return isMobile ? (mobile || fallback) : (desktop || fallback);
}

/**
 * Example Usage Pattern 1: Separate Components
 * 
 * import DesktopDashboard from './DesktopDashboard';
 * import MobileDashboard from './MobileDashboard';
 * 
 * function Dashboard() {
 *   return (
 *     <ResponsiveLayout
 *       desktop={<DesktopDashboard />}
 *       mobile={<MobileDashboard />}
 *     />
 *   );
 * }
 */

/**
 * Example Usage Pattern 2: Inline Render
 * 
 * function ProductList() {
 *   return (
 *     <ResponsiveLayout
 *       desktop={
 *         <div className="grid grid-cols-3 gap-6">
 *           {products.map(p => <ProductCard key={p.id} product={p} />)}
 *         </div>
 *       }
 *       mobile={
 *         <div className="space-y-4">
 *           {products.map(p => <MobileProductCard key={p.id} product={p} />)}
 *         </div>
 *       }
 *     />
 *   );
 * }
 */

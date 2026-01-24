import { useIsMobile } from '../hooks/useMediaQuery';
import Navbar from './Navbar'; // Your existing desktop navbar
import MobileNavbar from './MobileNavbar';

/**
 * Responsive Navbar Component
 * Renders desktop or mobile navbar based on screen size
 */
export default function ResponsiveNavbar() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileNavbar /> : <Navbar />;
}

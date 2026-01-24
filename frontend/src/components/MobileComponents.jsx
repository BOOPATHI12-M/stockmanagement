/**
 * Mobile Utility Components
 * Common mobile-specific UI elements
 */

/**
 * Mobile Page Container
 * Handles fixed navbar spacing and mobile padding
 */
export function MobilePageContainer({ children, className = '' }) {
  return (
    <div 
      className={`min-h-screen bg-gray-50 ${className}`}
      style={{ paddingTop: '70px', paddingBottom: '20px' }}
    >
      {children}
    </div>
  );
}

/**
 * Mobile Card
 * Standard mobile card component
 */
export function MobileCard({ children, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-4 ${
        onClick ? 'cursor-pointer active:shadow-lg' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Mobile Button
 * Touch-friendly button with minimum height
 */
export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  type = 'button'
}) {
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-lg font-semibold transition-colors touch-manipulation ${
        variants[variant]
      } ${fullWidth ? 'w-full' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{ minHeight: '44px' }}
    >
      {children}
    </button>
  );
}

/**
 * Mobile Search Bar
 * Touch-friendly search input
 */
export function MobileSearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base"
        style={{ minHeight: '44px' }}
      />
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  );
}

/**
 * Mobile Header
 * Sticky header for mobile pages
 */
export function MobileHeader({ title, subtitle, actions }) {
  return (
    <div className="bg-white px-4 py-4 shadow-md mb-4 sticky top-[60px] z-40">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile Section
 * Section container with title
 */
export function MobileSection({ title, children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold mb-3 px-4">{title}</h2>
      )}
      {children}
    </div>
  );
}

/**
 * Mobile List Item
 * Touch-friendly list item
 */
export function MobileListItem({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onClick,
  rightElement 
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 bg-white border-b border-gray-200 ${
        onClick ? 'active:bg-gray-50 cursor-pointer' : ''
      }`}
      style={{ minHeight: '60px' }}
    >
      <div className="flex items-center flex-1">
        {icon && (
          <span className="text-2xl mr-3">{icon}</span>
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{title}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      {(value || rightElement) && (
        <div className="ml-4">
          {rightElement || (
            <p className="font-semibold text-gray-900">{value}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Badge
 * Status badge for mobile
 */
export function MobileBadge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
}

/**
 * Mobile Action Sheet
 * Bottom sheet for actions (like edit/delete)
 */
export function MobileActionSheet({ isOpen, onClose, actions, title }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up">
        {title && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-center">{title}</h3>
          </div>
        )}
        
        <div className="p-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full py-4 px-4 text-left font-semibold rounded-lg transition-colors touch-manipulation ${
                action.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
              style={{ minHeight: '48px' }}
            >
              {action.icon && <span className="mr-3">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
        
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-4 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Mobile Horizontal Scroll Container
 * For tables or wide content on mobile
 */
export function MobileScrollContainer({ children }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="inline-block min-w-full">
        {children}
      </div>
    </div>
  );
}

/**
 * Mobile Empty State
 */
export function MobileEmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span className="text-6xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">{message}</p>
      )}
      {action && action}
    </div>
  );
}

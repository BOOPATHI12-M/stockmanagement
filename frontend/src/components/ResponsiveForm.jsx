import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Responsive Form Component
 * Desktop: Multi-column layout
 * Mobile: Single column, touch-friendly
 * 
 * @param {Function} onSubmit - Form submit handler
 * @param {ReactNode} children - Form fields
 * @param {string} title - Form title
 * @param {string} submitText - Submit button text
 * @param {Function} onCancel - Optional cancel handler
 */
export default function ResponsiveForm({ 
  onSubmit, 
  children, 
  title, 
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  className = ''
}) {
  const isMobile = useIsMobile();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`bg-white rounded-lg shadow-md ${
        isMobile ? 'p-4' : 'p-6'
      } ${className}`}
    >
      {/* Form Title */}
      {title && (
        <h2 className={`font-bold text-gray-800 mb-6 ${
          isMobile ? 'text-xl' : 'text-2xl'
        }`}>
          {title}
        </h2>
      )}

      {/* Form Fields */}
      <div className={`space-y-${isMobile ? '4' : '6'} mb-6`}>
        {children}
      </div>

      {/* Form Actions */}
      <div className={`flex ${
        isMobile 
          ? 'flex-col space-y-3' 
          : 'flex-row justify-end space-x-3'
      } pt-4 border-t border-gray-200`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold touch-manipulation ${
              isMobile ? 'w-full' : ''
            }`}
            style={{ minHeight: '44px' }}
          >
            {cancelText}
          </button>
        )}
        <button
          type="submit"
          className={`px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold touch-manipulation ${
            isMobile ? 'w-full' : ''
          }`}
          style={{ minHeight: '44px' }}
        >
          {submitText}
        </button>
      </div>
    </form>
  );
}

/**
 * Responsive Form Field Component
 * Automatically adjusts for mobile
 */
export function FormField({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  placeholder,
  options, // For select fields
  rows = 3, // For textarea
  error,
  helpText
}) {
  const isMobile = useIsMobile();

  const inputClasses = `w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
    error ? 'border-red-500' : ''
  } ${isMobile ? 'text-base' : 'text-sm'}`;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
          style={{ minHeight: isMobile ? '44px' : '38px' }}
        />
      );
    }

    if (type === 'select' && options) {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={inputClasses}
          style={{ minHeight: isMobile ? '44px' : '38px' }}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={inputClasses}
        style={{ minHeight: isMobile ? '44px' : '38px' }}
      />
    );
  };

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-gray-700 font-medium mb-2 ${
          isMobile ? 'text-base' : 'text-sm'
        }`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Responsive Form Row Component
 * Desktop: Multi-column
 * Mobile: Single column
 */
export function FormRow({ children, columns = 2 }) {
  const isMobile = useIsMobile();

  return (
    <div className={`grid gap-4 ${
      isMobile 
        ? 'grid-cols-1' 
        : `grid-cols-${columns}`
    }`}>
      {children}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * <ResponsiveForm
 *   title="Add Product"
 *   submitText="Save Product"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * >
 *   <FormRow columns={2}>
 *     <FormField
 *       label="Product Name"
 *       name="name"
 *       value={formData.name}
 *       onChange={handleChange}
 *       required
 *     />
 *     <FormField
 *       label="Category"
 *       name="category"
 *       type="select"
 *       value={formData.category}
 *       onChange={handleChange}
 *       options={[
 *         { value: 'electronics', label: 'Electronics' },
 *         { value: 'clothing', label: 'Clothing' }
 *       ]}
 *       required
 *     />
 *   </FormRow>
 *   
 *   <FormField
 *     label="Description"
 *     name="description"
 *     type="textarea"
 *     value={formData.description}
 *     onChange={handleChange}
 *     rows={4}
 *   />
 * </ResponsiveForm>
 */

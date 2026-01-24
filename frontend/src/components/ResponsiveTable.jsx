import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Responsive Table Component
 * Desktop: Traditional table
 * Mobile: Card layout
 * 
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Column definitions [{ key, label, render? }]
 * @param {Function} onRowClick - Optional row click handler
 * @param {Object} actions - Optional actions { edit, delete, view }
 */
export default function ResponsiveTable({ 
  data = [], 
  columns = [], 
  onRowClick, 
  actions 
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileCardView data={data} columns={columns} actions={actions} />;
  }

  return <DesktopTableView data={data} columns={columns} onRowClick={onRowClick} actions={actions} />;
}

/**
 * Desktop Table View (Unchanged)
 */
function DesktopTableView({ data, columns, onRowClick, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {actions.view && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.view(row);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    )}
                    {actions.edit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.edit(row);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    )}
                    {actions.delete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.delete(row);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Mobile Card View
 */
function MobileCardView({ data, columns, actions }) {
  return (
    <div className="space-y-4 px-2">
      {data.map((row, index) => (
        <div
          key={row.id || index}
          className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
        >
          {/* Card Content */}
          <div className="space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-start py-1">
                <span className="text-sm font-medium text-gray-500 flex-shrink-0 w-1/3">
                  {col.label}:
                </span>
                <span className="text-sm text-gray-900 flex-1 text-right break-words">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>

          {/* Card Actions */}
          {actions && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
              {actions.view && (
                <button
                  onClick={() => actions.view(row)}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  👁️ View
                </button>
              )}
              {actions.edit && (
                <button
                  onClick={() => actions.edit(row)}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  ✏️ Edit
                </button>
              )}
              {actions.delete && (
                <button
                  onClick={() => actions.delete(row)}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * const columns = [
 *   { key: 'id', label: 'ID' },
 *   { key: 'name', label: 'Product Name' },
 *   { key: 'price', label: 'Price', render: (val) => `$${val}` },
 *   { key: 'stock', label: 'Stock' }
 * ];
 * 
 * const actions = {
 *   view: (row) => console.log('View', row),
 *   edit: (row) => console.log('Edit', row),
 *   delete: (row) => console.log('Delete', row)
 * };
 * 
 * <ResponsiveTable 
 *   data={products} 
 *   columns={columns} 
 *   actions={actions} 
 * />
 */

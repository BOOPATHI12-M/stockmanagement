import { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api'

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: ''
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers()
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData)
      } else {
        await createSupplier(formData)
      }
      loadSuppliers()
      resetForm()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Failed to save supplier')
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return
    
    try {
      await deleteSupplier(id)
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Failed to delete supplier')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: ''
    })
    setEditingSupplier(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 text-lg">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Suppliers Management
          </h1>
          <p className="text-gray-600">Manage your supplier contacts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-primary ${showForm ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' : ''}`}
        >
          {showForm ? (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Supplier
            </span>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  className="input-field"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder="supplier@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                  className="input-field"
                  placeholder="Supplier address"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No suppliers yet</h3>
            <p className="text-gray-600 mb-6">Add your first supplier to get started</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{supplier.name}</div>
                      {supplier.address && (
                        <div className="text-xs text-gray-500 mt-1">{supplier.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.contactPerson || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


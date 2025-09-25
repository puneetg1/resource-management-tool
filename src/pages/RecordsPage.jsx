import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../utils/auth'
import Layout from '../components/Layout'
import SchemaMappingModal from '../components/SchemaMappingModal'
import * as XLSX from 'xlsx'
import './RecordsPage.css'
import { 
  loadSchema, 
  saveSchema, 
  clearSchema,
  readAllRecords, 
  createRecord, 
  updateRecord,
  deleteRecord, 
  exportToJSON, 
  exportToExcel, 
  importFromJSONFile, 
  importFromExcelFile,
  importDataWithSchema,
  downloadFile
} from '../utils/data'

export default function RecordsPage() {
  const navigate = useNavigate()
  const [schema, setSchema] = useState(null)
  const [records, setRecords] = useState([])
  const [newRecord, setNewRecord] = useState({})
  const [showSchemaModal, setShowSchemaModal] = useState(false)
  const [uploadedData, setUploadedData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  
  // Advanced table features
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState({ field: '', direction: 'asc' })
  const [filters, setFilters] = useState({})
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'cards'
  
  // Form validation
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      navigate('/login')
      return
    }
    async function boot() {
      setIsLoading(true)
      const s = await loadSchema()
      setSchema(s)
      setNewRecord(buildEmptyRecord(s))
      setRecords(readAllRecords())
      setIsLoading(false)
    }
    boot()
  }, [navigate])

  const columns = useMemo(() => (schema?.fields || []).map(f => f.name), [schema])

  function buildEmptyRecord(s) {
    const out = {}
    ;(s?.fields || []).forEach(f => { out[f.name] = '' })
    return out
  }

  // Advanced filtering and search
  const filteredRecords = useMemo(() => {
    let result = [...records]

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter(record => 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply field filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        result = result.filter(record => 
          String(record[field] || '').toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortBy.field) {
      result.sort((a, b) => {
        const aVal = a[sortBy.field] || ''
        const bVal = b[sortBy.field] || ''
        
        if (sortBy.direction === 'asc') {
          return String(aVal).localeCompare(String(bVal))
        } else {
          return String(bVal).localeCompare(String(aVal))
        }
      })
    }

    return result
  }, [records, searchTerm, filters, sortBy])

  // Pagination
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredRecords.slice(start, end)
  }, [filteredRecords, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRecords.length / pageSize)

  // Form validation
  const validateRecord = useCallback((record) => {
    const errors = {}
    
    schema?.fields?.forEach(field => {
      const value = record[field.name]
      
      if (field.type === 'number' && value && isNaN(Number(value))) {
        errors[field.name] = 'Must be a valid number'
      }
      
      if (field.type === 'date' && value && isNaN(new Date(value).getTime())) {
        errors[field.name] = 'Must be a valid date'
      }
    })
    
    return errors
  }, [schema])

  const showMessage = useCallback((text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('success')
    }, 5000)
  }, [])

  const onCreate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const errors = validateRecord(newRecord)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }
    
    try {
      createRecord(newRecord)
      setRecords(readAllRecords())
      setNewRecord(buildEmptyRecord(schema))
      setFormErrors({})
      setShowCreateForm(false)
      showMessage('Record created successfully!')
    } catch (error) {
      showMessage(`Error creating record: ${error.message}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdate = async (recordId, updatedData) => {
    setIsSubmitting(true)
    
    const errors = validateRecord(updatedData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }
    
    try {
      updateRecord(recordId, updatedData)
      setRecords(readAllRecords())
      setEditingRecord(null)
      setFormErrors({})
      showMessage('Record updated successfully!')
    } catch (error) {
      showMessage(`Error updating record: ${error.message}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDelete = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(id)
      setRecords(readAllRecords())
      showMessage('Record deleted successfully!')
    }
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (selectedRecords.size === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedRecords.size} records?`)) {
      selectedRecords.forEach(id => deleteRecord(id))
      setRecords(readAllRecords())
      setSelectedRecords(new Set())
      setShowBulkActions(false)
      showMessage(`${selectedRecords.size} records deleted successfully!`)
    }
  }, [selectedRecords])

  const handleBulkExport = useCallback(() => {
    if (selectedRecords.size === 0) return
    
    const selectedData = records.filter(r => selectedRecords.has(r.id))
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `selected_records_${timestamp}.json`
    downloadFile(selectedData, filename, 'json')
    showMessage(`${selectedRecords.size} records exported successfully!`)
  }, [selectedRecords, records])

  const handleFileUpload = async (file, useSchemaMapping = false) => {
    setIsLoading(true)
    setMessage('')
    
    try {
      let data
      if (file.name.endsWith('.json')) {
        const text = await file.text()
        const parsed = JSON.parse(text)
        
        // Handle different JSON structures
        if (Array.isArray(parsed)) {
          data = parsed
        } else if (typeof parsed === 'object' && parsed !== null) {
          const possibleKeys = ['resources', 'data', 'records', 'items', 'results']
          let foundArray = null
          
          for (const key of possibleKeys) {
            if (parsed[key] && Array.isArray(parsed[key])) {
              foundArray = parsed[key]
              break
            }
          }
          
          if (foundArray) {
            data = foundArray
          } else {
            const values = Object.values(parsed)
            const arrayValue = values.find(val => Array.isArray(val))
            if (arrayValue) {
              data = arrayValue
            } else {
              throw new Error('No array data found in JSON. Expected format: array of records or object with array property (e.g., {"resources": [...]})')
            }
          }
        } else {
          throw new Error('Invalid JSON format')
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        throw new Error('Unsupported file format')
      }

      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of records')
      }

      if (useSchemaMapping) {
        setUploadedData(data)
        setShowSchemaModal(true)
        showMessage(`Found ${data.length} records. Please map the fields below.`)
      } else {
        if (file.name.endsWith('.json')) {
          await importFromJSONFile(file)
        } else {
          await importFromExcelFile(file)
        }
        setRecords(readAllRecords())
        showMessage(`Successfully imported ${data.length} records`)
      }
    } catch (error) {
      console.error('Import error:', error)
      showMessage(`Error importing file: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchemaConfirm = async (newSchema) => {
    setIsLoading(true)
    try {
      await importDataWithSchema(uploadedData, newSchema)
      setSchema(newSchema)
      setRecords(readAllRecords())
      showMessage(`Successfully imported ${uploadedData.length} records with new schema`)
    } catch (error) {
      showMessage(`Error importing with schema: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
      setShowSchemaModal(false)
      setUploadedData(null)
    }
  }

  const handleDownload = (format) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `records_${timestamp}.${format === 'json' ? 'json' : 'xlsx'}`
    downloadFile(filteredRecords, filename, format)
    showMessage(`Downloaded ${filename}`)
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('app_records')
      setRecords([])
      showMessage('All data cleared')
    }
  }

  const handleResetSchema = () => {
    if (window.confirm('Are you sure you want to reset to default schema? This will clear the current schema.')) {
      clearSchema()
      window.location.reload()
    }
  }

  const handleSelectAll = () => {
    if (selectedRecords.size === paginatedRecords.length) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(paginatedRecords.map(r => r.id)))
    }
  }

  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading records...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="production-records-page">
        {/* Advanced Header */}
        <div className="records-header">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">📋</span>
              Data Management Center
            </h1>
            <div className="page-meta">
              <span className="schema-badge">{schema?.title || 'Loading...'}</span>
              <span className="record-count">{records.length.toLocaleString()} records</span>
              <span className="filtered-count">
                {filteredRecords.length !== records.length ? `${filteredRecords.length} filtered` : ''}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <div className="action-group">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-outline ${showFilters ? 'active' : ''}`}
              >
                🔍 Filters
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                className="btn btn-outline"
              >
                {viewMode === 'table' ? '🃏 Cards' : '📊 Table'}
              </button>
            </div>
            <div className="action-group">
              <button onClick={() => handleDownload('json')} className="btn btn-outline">
                📄 Export JSON
              </button>
              <button onClick={() => handleDownload('excel')} className="btn btn-outline">
                📊 Export Excel
              </button>
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              ➕ Add Record
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`message ${messageType}`}>
            <span className="message-icon">
              {messageType === 'success' ? '✅' : '❌'}
            </span>
            <span className="message-text">{message}</span>
            <button 
              onClick={() => setMessage('')}
              className="message-close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Advanced Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="close-filters"
              >
                ✕
              </button>
            </div>
            <div className="filters-content">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
              
              {schema?.fields?.map(field => (
                <div key={field.name} className="filter-group">
                  <label>{field.label || field.name}</label>
                  <input
                    type="text"
                    placeholder={`Filter by ${field.label || field.name}...`}
                    value={filters[field.name] || ''}
                    onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    className="filter-input"
                  />
                </div>
              ))}
              
              <div className="filter-actions">
                <button onClick={clearFilters} className="btn btn-outline">
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedRecords.size > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-info">
              <span className="bulk-count">{selectedRecords.size} selected</span>
            </div>
            <div className="bulk-actions">
              <button onClick={handleBulkExport} className="btn btn-outline">
                📤 Export Selected
              </button>
              <button onClick={handleBulkDelete} className="btn btn-danger">
                🗑️ Delete Selected
              </button>
              <button 
                onClick={() => setSelectedRecords(new Set())}
                className="btn btn-outline"
              >
                ✕ Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Create Record Modal */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content create-modal">
              <div className="modal-header">
                <h3>Create New Record</h3>
                <button 
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormErrors({})
                    setNewRecord(buildEmptyRecord(schema))
                  }}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={onCreate} className="create-form">
                <div className="form-grid">
                  {(schema?.fields || []).map(field => (
                    <div key={field.name} className="form-group">
                      <label htmlFor={field.name}>
                        {field.label || field.name}
                        {formErrors[field.name] && (
                          <span className="error-indicator">⚠️</span>
                        )}
                      </label>
                      <input
                        id={field.name}
                        type={field.type === 'number' ? 'number' : 
                              field.type === 'date' ? 'date' : 'text'}
                        value={newRecord[field.name] ?? ''}
                        onChange={(e) => setNewRecord({ 
                          ...newRecord, 
                          [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value 
                        })}
                        className={`form-input ${formErrors[field.name] ? 'error' : ''}`}
                        placeholder={`Enter ${field.label || field.name}`}
                      />
                      {formErrors[field.name] && (
                        <span className="error-message">{formErrors[field.name]}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormErrors({})
                      setNewRecord(buildEmptyRecord(schema))
                    }}
                    className="btn btn-outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'table' ? (
          <div className="table-section">
            <div className="table-container">
              <div className="table-header">
                <div className="table-info">
                  <h3>Records Table</h3>
                  <span className="table-count">
                    {filteredRecords.length} of {records.length} records
                  </span>
                </div>
                <div className="table-controls">
                  <select 
                    value={pageSize} 
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="page-size-select"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  
                  <div className="import-section">
                    <label className="import-label">
                      <span>📁 Import JSON</span>
                      <input 
                        type="file" 
                        accept=".json,application/json" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, true)
                        }}
                        disabled={isLoading}
                      />
                    </label>
                    
                    <label className="import-label">
                      <span>📊 Import Excel</span>
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, true)
                        }}
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="table-wrapper">
                <table className="advanced-table">
                  <thead>
                    <tr>
                      <th className="select-column">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === paginatedRecords.length && paginatedRecords.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      {schema?.fields?.map(field => (
                        <th key={field.name} className="sortable">
                          <button 
                            onClick={() => handleSort(field.name)}
                            className="sort-header"
                          >
                            {field.label || field.name}
                            <div className="sort-indicators">
                              <span className={`sort-arrow ${sortBy.field === field.name && sortBy.direction === 'asc' ? 'active' : ''}`}>
                                ↑
                              </span>
                              <span className={`sort-arrow ${sortBy.field === field.name && sortBy.direction === 'desc' ? 'active' : ''}`}>
                                ↓
                              </span>
                            </div>
                          </button>
                        </th>
                      ))}
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record, index) => (
                      <tr key={record.id || index} className={selectedRecords.has(record.id) ? 'selected' : ''}>
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRecords)
                              if (e.target.checked) {
                                newSelected.add(record.id)
                              } else {
                                newSelected.delete(record.id)
                              }
                              setSelectedRecords(newSelected)
                            }}
                          />
                        </td>
                        {schema?.fields?.map(field => (
                          <td key={field.name}>
                            {editingRecord?.id === record.id ? (
                              <input
                                type={field.type === 'number' ? 'number' : 
                                      field.type === 'date' ? 'date' : 'text'}
                                value={editingRecord[field.name] || ''}
                                onChange={(e) => setEditingRecord({
                                  ...editingRecord,
                                  [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value
                                })}
                                className="inline-edit"
                                onBlur={() => onUpdate(record.id, editingRecord)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdate(record.id, editingRecord)
                                  } else if (e.key === 'Escape') {
                                    setEditingRecord(null)
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <div 
                                className="cell-content"
                                onClick={() => setEditingRecord({ ...record })}
                                title="Click to edit"
                              >
                                {field.type === 'array' ? 
                                  <div className="array-cell">
                                    {JSON.stringify(record[field.name])}
                                  </div> : 
                                  String(record[field.name] || '')
                                }
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="actions-column">
                          <div className="action-buttons">
                            <Link 
                              to={`/records/${record.id}`} 
                              className="btn btn-sm btn-outline"
                              title="Edit Record"
                            >
                              ✏️
                            </Link>
                            <button 
                              onClick={() => onDelete(record.id)} 
                              className="btn btn-sm btn-danger"
                              title="Delete Record"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
                </div>
                <div className="pagination-controls">
                  <button 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ⏮️ First
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ⬅️ Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next ➡️
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Last ⏭️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="cards-section">
            <div className="cards-grid">
              {paginatedRecords.map((record, index) => (
                <div key={record.id || index} className="record-card">
                  <div className="card-header">
                    <div className="card-title">
                      Record #{record.id?.slice(0, 8) || index + 1}
                    </div>
                    <div className="card-actions">
                      <button 
                        onClick={() => setEditingRecord({ ...record })}
                        className="btn btn-sm btn-outline"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(record.id)} 
                        className="btn btn-sm btn-danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="card-content">
                    {schema?.fields?.map(field => (
                      <div key={field.name} className="field-item">
                        <span className="field-label">{field.label || field.name}:</span>
                        <span className="field-value">
                          {field.type === 'array' ? 
                            JSON.stringify(record[field.name]) : 
                            String(record[field.name] || '')
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schema Mapping Modal */}
        <SchemaMappingModal
          isOpen={showSchemaModal}
          onClose={() => {
            setShowSchemaModal(false)
            setUploadedData(null)
          }}
          uploadedData={uploadedData}
          onSchemaConfirm={handleSchemaConfirm}
        />
      </div>
    </Layout>
  )
}
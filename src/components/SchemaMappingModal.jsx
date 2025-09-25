import { useState, useEffect } from 'react'
import './SchemaMappingModal.css'

export default function SchemaMappingModal({ 
  isOpen, 
  onClose, 
  uploadedData, 
  onSchemaConfirm 
}) {
  const [fieldMappings, setFieldMappings] = useState({})
  const [schemaName, setSchemaName] = useState('')
  const [fieldTypes, setFieldTypes] = useState({})
  const [customFieldName, setCustomFieldName] = useState('')
  const [selectedFields, setSelectedFields] = useState(new Set())

  useEffect(() => {
    if (isOpen && uploadedData && uploadedData.length > 0) {
      // Extract all unique field names from the uploaded data
      const allFields = new Set()
      uploadedData.forEach(record => {
        Object.keys(record).forEach(key => allFields.add(key))
      })
      
      const fieldsArray = Array.from(allFields)
      const initialMappings = {}
      const initialTypes = {}
      
      fieldsArray.forEach(field => {
        // Auto-detect field type based on sample data
        const sampleValue = uploadedData[0][field]
        if (Array.isArray(sampleValue)) {
          initialTypes[field] = 'array'
        } else if (typeof sampleValue === 'number') {
          initialTypes[field] = 'number'
        } else if (typeof sampleValue === 'boolean') {
          initialTypes[field] = 'boolean'
        } else {
          initialTypes[field] = 'text'
        }
        
        initialMappings[field] = field // Default mapping to same field name
      })
      
      setFieldMappings(initialMappings)
      setFieldTypes(initialTypes)
      setSchemaName('Imported Schema')
      
      // Initialize all fields as selected by default
      setSelectedFields(new Set(fieldsArray))
    }
  }, [isOpen, uploadedData])

  const handleFieldTypeChange = (fieldName, newType) => {
    setFieldTypes(prev => ({
      ...prev,
      [fieldName]: newType
    }))
  }

  const handleFieldMappingChange = (fieldName, newMapping) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: newMapping
    }))
  }

  const handleCustomFieldName = (fieldName, customName) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldName]: customName
    }))
  }

  const handleFieldSelection = (fieldName, isSelected) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(fieldName)
      } else {
        newSet.delete(fieldName)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allFields = Object.keys(fieldMappings)
    setSelectedFields(new Set(allFields))
  }

  const handleSelectNone = () => {
    setSelectedFields(new Set())
  }

  const getUsedMappings = () => {
    return Object.values(fieldMappings).filter(mapping => mapping && mapping.trim() !== '')
  }

  const getAvailableOptions = (currentField) => {
    const usedMappings = getUsedMappings()
    const currentMapping = fieldMappings[currentField]
    
    return fieldOptions.filter(option => 
      option === currentMapping || !usedMappings.includes(option)
    )
  }

  const handleConfirm = () => {
    if (selectedFields.size === 0) {
      alert('Please select at least one field to include in the schema.')
      return
    }

    const schema = {
      title: schemaName || 'Imported Schema',
      fields: Array.from(selectedFields).map(fieldName => ({
        name: fieldMappings[fieldName] || fieldName,
        label: fieldName,
        type: fieldTypes[fieldName] || 'text'
      }))
    }
    
    onSchemaConfirm(schema)
    onClose()
  }

  const handleCancel = () => {
    setFieldMappings({})
    setFieldTypes({})
    setSchemaName('')
    setSelectedFields(new Set())
    onClose()
  }

  // Get all unique field names from uploaded data for dropdown options
  const getAllFieldNames = () => {
    if (!uploadedData || uploadedData.length === 0) return []
    
    const allFields = new Set()
    uploadedData.forEach(record => {
      Object.keys(record).forEach(key => allFields.add(key))
    })
    
    return Array.from(allFields).sort()
  }

  const fieldOptions = getAllFieldNames()

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Map Fields to Schema</h3>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="schema-name-section">
            <label htmlFor="schemaName">Schema Name:</label>
            <input
              id="schemaName"
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="Enter schema name"
              className="schema-name-input"
            />
          </div>

          <div className="fields-mapping-section">
            <div className="section-header">
              <h4>Field Mappings</h4>
              <div className="selection-controls">
                <button 
                  type="button"
                  onClick={handleSelectAll}
                  className="btn btn-small btn-secondary"
                >
                  Select All
                </button>
                <button 
                  type="button"
                  onClick={handleSelectNone}
                  className="btn btn-small btn-secondary"
                >
                  Select None
                </button>
                <span className="selection-count">
                  {selectedFields.size} of {Object.keys(fieldMappings).length} selected
                </span>
              </div>
            </div>
            <p className="mapping-help-text">
              Choose which fields to include in your schema. Check the boxes for fields you want to import.
            </p>
            <div className="fields-grid">
              {Object.keys(fieldMappings).map(fieldName => (
                <div key={fieldName} className={`field-mapping-row ${selectedFields.has(fieldName) ? 'selected' : 'unselected'} ${fieldMappings[fieldName] ? 'mapped' : 'unmapped'}`}>
                  <div className="field-selection">
                    <input
                      type="checkbox"
                      checked={selectedFields.has(fieldName)}
                      onChange={(e) => handleFieldSelection(fieldName, e.target.checked)}
                      className="field-checkbox"
                    />
                  </div>
                  
                  <div className="field-info">
                    <div className="field-header">
                      <span className="field-name">{fieldName}</span>
                      {fieldMappings[fieldName] && (
                        <span className="mapped-indicator">✓ Mapped</span>
                      )}
                    </div>
                    <span 
                      className="sample-value"
                      title={JSON.stringify(uploadedData[0][fieldName])}
                    >
                      Sample: {(() => {
                        const value = uploadedData[0][fieldName]
                        const strValue = JSON.stringify(value)
                        return strValue.length > 100 ? strValue.substring(0, 100) + '...' : strValue
                      })()}
                    </span>
                  </div>
                  
                  <div className="field-mapping">
                    <label>Map to:</label>
                    <div className="mapping-controls">
                      <select
                        value={fieldMappings[fieldName] && fieldOptions.includes(fieldMappings[fieldName]) ? fieldMappings[fieldName] : ''}
                        onChange={(e) => handleFieldMappingChange(fieldName, e.target.value)}
                        className="mapping-select"
                      >
                        <option value="">Select field...</option>
                        {getAvailableOptions(fieldName).map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or enter custom name..."
                        value={fieldMappings[fieldName] && !fieldOptions.includes(fieldMappings[fieldName]) ? fieldMappings[fieldName] : ''}
                        onChange={(e) => handleCustomFieldName(fieldName, e.target.value)}
                        className="custom-field-input"
                      />
                    </div>
                  </div>
                  
                  <div className="field-type">
                    <label>Type:</label>
                    <select
                      value={fieldTypes[fieldName] || 'text'}
                      onChange={(e) => handleFieldTypeChange(fieldName, e.target.value)}
                      className="type-select"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Create Schema & Import Data
          </button>
        </div>
      </div>
    </div>
  )
}

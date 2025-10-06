import { useState, useEffect } from 'react';
import './RecordModal.css';

// Helper function to format a date string or object into YYYY-MM-DD
// This is the key to avoiding timezone issues.
function toYYYYMMDD(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    // Add the timezone offset to counteract the UTC conversion before slicing
    const dateInCorrectTz = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return dateInCorrectTz.toISOString().slice(0, 10);
  } catch (e) {
    console.error("Could not parse date:", dateInput);
    return '';
  }
}


export default function RecordModal({ isOpen, onClose, onSave, record, schema }) {
  const [formData, setFormData] = useState({});

  // ✅ FIX 1: Format the date correctly ONCE when the modal opens
  useEffect(() => {
    if (record) {
      const initialData = { ...record };
      // Find any date fields in the schema and format them
      (schema?.fields || []).forEach(field => {
        if (field.type === 'date' && initialData[field.name]) {
          initialData[field.name] = toYYYYMMDD(initialData[field.name]);
        }
      });
      setFormData(initialData);
    } else {
      setFormData({}); // Reset for a new record
    }
  }, [record, schema, isOpen]); // Rerun when modal opens

  if (!isOpen || !schema) return null;

  function handleChange(fieldName, fieldType, value) {
    let newFormData = { ...formData, [fieldName]: value };

    if (fieldName === 'Resource End date') {
      if (value) { // value is already "YYYY-MM-DD"
        // Create dates in UTC to ensure calculation is timezone-agnostic
        const endDate = new Date(`${value}T00:00:00Z`);
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        const timeDiff = endDate.getTime() - todayUTC.getTime();
        
        // ✅ FIX 2: Correct, intuitive countdown logic
        const daysRemaining = Math.round(timeDiff / (1000 * 3600 * 24));
        
        newFormData['Countdown'] = daysRemaining >= 0 ? daysRemaining : 0;
      } else {
        newFormData['Countdown'] = null;
      }
    }
    
    if (fieldType === 'number' && fieldName !== 'Countdown') {
      newFormData[fieldName] = value === '' ? '' : (Number.isNaN(Number(value)) ? formData[fieldName] : Number(value));
    }

    setFormData(newFormData);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(formData);
  }

  const modalTitle = formData._id ? 'Edit Record' : 'Create New Record';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">{modalTitle}</div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form" id="record-form">
            {(schema?.fields || []).map((field) => {
              const isCountdown = field.name === 'Countdown';
              // ✅ FIX 3: Drastically simplified rendering. No more date formatting here!
              const inputValue = formData[field.name] ?? '';

              return (
                <div key={field.name} className="form-group">
                  <label htmlFor={field.name}>{field.label || field.name}</label>

                  {field.name === 'Stream' ? (
                    <select
                      id={field.name}
                      value={inputValue}
                      onChange={(e) => handleChange(field.name, field.type, e.target.value)}
                      className="modal-input"
                    >
                      <option value="">Select a stream</option>
                      <option value="QA">QA</option>
                      <option value="Backend">Backend</option>
                      <option value="Frontend">Frontend</option>
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      type={field.type === 'date' ? 'date' : (field.type === 'number' ? 'number' : 'text')}
                      value={inputValue}
                      onChange={(e) => handleChange(field.name, field.type, e.target.value)}
                      className="modal-input"
                      required={field.name === 'First name' || field.name === 'Last name'}
                      readOnly={isCountdown}
                      style={
                        isCountdown
                          ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }
                          : {}
                      }
                    />
                  )}
                </div>
              );
            })}
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn secondary">Cancel</button>
          <button type="submit" form="record-form" className="btn primary">Save</button>
        </div>
      </div>
    </div>
  );
}


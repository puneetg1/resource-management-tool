

import { useState, useEffect } from 'react';
import './RecordModal.css';

export default function RecordModal({ isOpen, onClose, onSave, record, schema }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(record || {});
  }, [record]);

  if (!isOpen || !schema) return null;

  function handleChange(fieldName, fieldType, value) {
    let newFormData = { ...formData, [fieldName]: value };

   
    if (fieldName === 'Resource End date') {
      if (value) {
        const endDate = new Date(value);
        const today = new Date();
        

        today.setHours(0, 0, 0, 0);

    
        const timeDiff = endDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        newFormData['Countdown'] = daysRemaining >= 0 ? daysRemaining : 0;
      } else {
      
        newFormData['Countdown'] = 0;
      }
    }
   
    if (fieldType === 'number' && fieldName !== 'Countdown') {
      newFormData[fieldName] = Number(value) || 0;
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
        <div className="modal-header">
          {modalTitle}
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form" id="record-form">
            {(schema?.fields || []).map(field => {
              let inputValue = formData[field.name] ?? '';

              if (field.type === 'date' && inputValue) {
                try {
                  inputValue = new Date(inputValue).toISOString().slice(0, 10);
                } catch (e) {
                  console.error("Invalid date value:", inputValue);
                  inputValue = '';
                }
              }

              // Make the Countdown input read-only
              const isCountdown = field.name === 'Countdown';

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
                      readOnly={isCountdown} // ✅ Make the countdown field non-editable
                      style={isCountdown ? { backgroundColor: '#f0f0f0' } : {}} // Optional: style to show it's read-only
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
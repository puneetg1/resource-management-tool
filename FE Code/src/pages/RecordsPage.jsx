import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import RecordModal from './RecordModal';
import Pagination from './Pagination';
import ConfirmationModal from './ConfirmationModal';
import './RecordsPage.css';
import {
  getRecords, getRecordsCount, createRecord, updateRecord, deleteRecord, importFromJSONFile, exportToExcel
} from '../utils/api';

const displaySchema = {
  fields: [
    { "name": "fullName", "label": "Name" }, { "name": "% Allocation", "label": "Allocation %" }, { "name": "Project", "label": "Project" }, { "name": "Open Air ID", "label": "Open Air ID" }, { "name": "Job Title", "label": "Job Title" }, { "name": "Stream", "label": "Stream" }, { "name": "Contract / Perm", "label": "Contract / Perm" }, { "name": "Resource End date", "label": "End Date" ,  "type": "date" }, { "name": "Countdown", "label": "Countdown" }
  ]
};
const formSchema = {
  fields: [
    { "name": "First name", "label": "First Name" }, { "name": "Last name", "label": "Last Name" }, { "name": "Line Manager", "label": "Line Manager" }, { "name": "% Allocation", "label": "Allocation %" }, { "name": "Project", "label": "Project" }, { "name": "Open Air ID", "label": "Open Air ID (comma-separated)" }, { "name": "Location", "label": "Location" }, { "name": "Stream", "label": "Stream" }, { "name": "Tech Skills", "label": "Tech Skills (comma-separated)" }, { "name": "Job Title", "label": "Job Title" }, { "name": "Contract / Perm", "label": "Contract / Perm" }, { "name": "Billable", "label": "Billable" }, { "name": "Resource End date", "label": "End Date", "type": "date" }, { "name": "Countdown", "label": "Countdown" }, { "name": "Notes", "label": "Notes" }
  ]
};

const initialFilters = {
  Project: '', Stream: '', allocationStatus: '', expiringStatus: '', 'Contract / Perm': '',
};

const createFiltersFromParams = (params) => {
  const newFilters = { ...initialFilters };
  for (const [key, value] of params.entries()) { if (key in initialFilters) newFilters[key] = value; }
  return newFilters;
};

function buildEmptyRecord() {
  const emptyRecord = {};
  formSchema.fields.forEach(field => { emptyRecord[field.name] = field.type === 'number' ? 0 : ""; });
  return emptyRecord;
}

export default function RecordsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState(() => createFiltersFromParams(new URLSearchParams(location.search)));
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'First name', direction: 'ascending' });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, recordId: null });
  const [refetchIndex, setRefetchIndex] = useState(0);
  const triggerRefetch = () => setRefetchIndex(i => i + 1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.toString()) {
      const urlFilters = createFiltersFromParams(params);
      if (JSON.stringify(filters) !== JSON.stringify(urlFilters)) {
        setFilters(urlFilters);
        setCurrentPage(1);
        navigate('/records', { replace: true });
        return; 
      }
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [recordsData, countData] = await Promise.all([
          getRecords(currentPage, recordsPerPage, filters, sortConfig),
          getRecordsCount(filters)
        ]);
        setRecords(recordsData);
        setTotalRecords(countData);
      } catch (err) {
        setError(err.message);
        toast.error(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [filters, currentPage, recordsPerPage, sortConfig, refetchIndex, location.search, navigate]);
  
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const columns = useMemo(() => (displaySchema.fields.map(f => f.name)), []);
  const columnLabels = useMemo(() => { const labels = {}; displaySchema.fields.forEach(f => { labels[f.name] = f.label || f.name; }); return labels; }, []);

  const handleSort = (key) => { setCurrentPage(1); let direction = 'ascending'; if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; } setSortConfig({ key, direction }); };
  const getCountdownColor = (days) => { if (days == null) return ''; if (days <= 30) return 'countdown-red'; if (days <= 90) return 'countdown-orange'; return 'countdown-green'; };
  
  function handleFilterChange(e) { const { name, value } = e.target; setCurrentPage(1); setFilters(prevFilters => ({ ...prevFilters, [name]: value, })); }
  function clearFilters() { setCurrentPage(1); setFilters(initialFilters); }

  async function handleExportExcel() { 
    toast.info("Generating Excel file..."); 
    try { const blob = await exportToExcel(filters); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "employees.xlsx"; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url); } catch (err) { toast.error(`Export failed: ${err.message}`); }
  }

  async function handleFileImport(file) { 
    if (!file) return; 
    try { const result = await importFromJSONFile(file); toast.success(`${result.message}`); triggerRefetch(); } catch (err) { toast.error(`Import failed: ${err.message}`); }
  }

  async function handleSaveRecord(recordFromModal) {
    try {
      const payload = { ...recordFromModal };

      // --- START: Data Preparation ---

      // 1. Handle array fields
      const arrayFields = ["Tech Skills", "Open Air ID"];
      arrayFields.forEach(f => {
        const value = payload[f];
        if (value != null && typeof value !== 'object') {
          payload[f] = String(value).split(',').map(i => i.trim()).filter(Boolean);
        } else if (!Array.isArray(value)) {
          payload[f] = [];
        }
      });

      // 2. Handle numeric fields
      const numericFields = ["% Allocation", "Countdown"];
      numericFields.forEach(field => {
        const value = payload[field];
        if (value === "" || value == null) {
          payload[field] = 0;
        } else {
          payload[field] = Number(value);
        }
      });
      
      // 3. Handle date fields
      if (payload["Resource End date"] === "") {
        payload["Resource End date"] = null;
      }
      
      // --- END: Data Preparation ---

      if (payload._id) {
        console.log(payload)
        await updateRecord(payload._id, payload);
        toast.success("Record updated");
      } else {
        console.log(payload)
        await createRecord(payload);
        toast.success("Record created");
      }
      handleCloseModal();
      triggerRefetch();
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
  }

  const performDelete = async () => {
    const id = deleteConfirmation.recordId;
    if (!id) return;
    try {
      await deleteRecord(id);
      toast.success("Record deleted.");
      setDeleteConfirmation({ isOpen: false, recordId: null });
      if (records.length === 1 && currentPage > 1) {
        setCurrentPage(c => c - 1);
      } else {
        triggerRefetch();
      }
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
      setDeleteConfirmation({ isOpen: false, recordId: null });
    }
  };
  
  const handleDeleteRecord = (id) => {
    setDeleteConfirmation({ isOpen: true, recordId: id });
  };

  const handleOpenCreateModal = () => { setCurrentRecord(buildEmptyRecord()); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentRecord(null); };
  
  const handleOpenEditModal = (recordToEdit) => {
    const cleaned = { ...recordToEdit };
    ["Tech Skills", "Open Air ID"].forEach(f => {
      const value = cleaned[f];
      if (Array.isArray(value)) {
        cleaned[f] = value.join(', ');
      } else if (value != null) {
        cleaned[f] = String(value);
      } else {
        cleaned[f] = '';
      }
    });
    setCurrentRecord(cleaned);
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Resource Editor</h2>
        <div className="records-toolbar">
          <button onClick={handleExportExcel} className="btn">Export Excel</button>
          <button onClick={handleOpenCreateModal} className="btn">Create New Employee</button>
          <label className="btn primary"> Import JSON <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => handleFileImport(e.target.files?.[0])} /> </label>
        </div>
      </div>
      
      <div className="filters-container">
        <input type="text" name="Project" className="filter-input" placeholder="Filter by Project..." value={filters.Project} onChange={handleFilterChange} />
        <select name="Stream" className="filter-input" value={filters.Stream} onChange={handleFilterChange}><option value="">All Streams</option><option value="QA">QA</option><option value="Backend">Backend</option><option value="Frontend">Frontend</option></select>
        <select name="allocationStatus" className="filter-input" value={filters.allocationStatus} onChange={handleFilterChange}><option value="">All Allocations</option><option value="partial">Partially Allocated</option><option value="full">Fully Allocated</option></select>
        <select name="Contract / Perm" className="filter-input" value={filters['Contract / Perm']} onChange={handleFilterChange}><option value="">All Types</option><option value="P">Permanent</option><option value="C">Contract</option></select>
        <button onClick={clearFilters} className="btn">Clear Filters</button>
      </div>
      
      <div className="table-container">
        <table className="table table-wrap">
          <thead>
            <tr>
              {columns.map(c => (<th key={c} onClick={() => handleSort(c)} style={{cursor: 'pointer'}}>{columnLabels[c]}{sortConfig.key === c && (<span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>)}</th>))}
              <th style={{cursor: 'default'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length + 1}><div className="loader-container"><div className="loader"></div></div></td></tr>
            ) : error ? (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>Error: {error}</td></tr>
            ) : records.length > 0 ? (
              records.map(r => (
                <tr key={r._id}>
                  {columns.map(c => (
                    <td key={c}>
                      {(() => {
                        if (c === 'Countdown') return (<span className={getCountdownColor(r[c])}>{r[c] != null ? `${r[c]} days` : ''}</span>);
                        if (c === 'Resource End date' && r[c]) return new Date(r[c]).toLocaleDateString();
                        if (c === 'fullName') return `${r['First name'] || ''} ${r['Last name'] || ''}`;
                        
                        if (c === 'Open Air ID' && Array.isArray(r[c])) {
                          return r[c].map((id, index) => (
                            <div key={index}>{id}</div>
                          ));
                        }

                        if (Array.isArray(r[c])) return r[c].join(', ');
                        return String(r[c] ?? '');
                      })()}
                    </td>
                  ))}
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleOpenEditModal(r)} className="btn" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg></button>
                      <button onClick={() => handleDeleteRecord(r._id)} className="btn danger" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' , paddingTop:"25px" }}>
            <label htmlFor="recordsPerPage">Items per page:</label>
            <select id="recordsPerPage" value={recordsPerPage} onChange={(e) => { setCurrentPage(1); setRecordsPerPage(Number(e.target.value)); }} className="btn" style={{padding: '7px'}}>
              <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </div>
          <Pagination recordsPerPage={recordsPerPage} totalRecords={totalRecords} paginate={setCurrentPage} currentPage={currentPage} />
        </div>
      )}

      {isModalOpen && <RecordModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRecord} record={currentRecord} schema={formSchema} />}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, recordId: null })}
        onConfirm={performDelete}
        title="Confirm Deletion"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this record? This action cannot be undone.</p>
      </ConfirmationModal>
    </Layout>
  );
}
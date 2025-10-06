

// import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom'; // ✅ Import hooks for URL interaction
// import Layout from '../components/Layout';
// import RecordModal from './RecordModal';
// import Pagination from './Pagination';
// import './RecordsPage.css';
// import {
//   getRecords, getRecordsCount, createRecord, updateRecord, deleteRecord, importFromJSONFile, exportToExcel
// } from '../utils/api';

// // --- Schemas are unchanged ---
// const displaySchema = {
//   fields: [
//     { "name": "fullName", "label": "Name", "type": "text" },
//     { "name": "% Allocation", "label": "Allocation %", "type": "number" },
//     { "name": "Project", "label": "Project", "type": "text" },
//     { "name": "Open Air ID", "label": "Open Air ID", "type": "text" },
//     { "name": "Job Title", "label": "Job Title", "type": "text" },
//     { "name": "Stream", "label": "Stream", "type": "text" },
//     { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
//     { "name": "Resource End date", "label": "End Date", "type": "date" },
//     { "name": "Countdown", "label": "Countdown", "type": "number" }
//   ]
// };

// const formSchema = {
//   fields: [
//     { "name": "First name", "label": "First Name", "type": "text" },
//     { "name": "Last name", "label": "Last Name", "type": "text" },
//     { "name": "Line Manager", "label": "Line Manager", "type": "text" },
//     { "name": "% Allocation", "label": "Allocation %", "type": "number" },
//     { "name": "Project", "label": "Project", "type": "text" },
//     { "name": "Open Air ID", "label": "Open Air ID (comma-separated)", "type": "text" },
//     { "name": "Location", "label": "Location", "type": "text" },
//     { "name": "Stream", "label": "Stream", "type": "text" },
//     { "name": "Tech Skills", "label": "Tech Skills (comma-separated)", "type": "text" },
//     { "name": "Job Title", "label": "Job Title", "type": "text" },
//     { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
//     { "name": "Billable", "label": "Billable", "type": "text" },
//     { "name": "Resource End date", "label": "End Date", "type": "date" },
//     { "name": "Countdown", "label": "Countdown", "type": "number" },
//     { "name": "Notes", "label": "Notes", "type": "text" }
//   ]
// };

// function buildEmptyRecord() {
//   const emptyRecord = {};
//   formSchema.fields.forEach(field => {
//     if (field.name === 'Open Air ID' || field.name === 'Tech Skills') {
//       emptyRecord[field.name] = "";
//     } else if (field.type === 'number') {
//       emptyRecord[field.name] = 0;
//     } else {
//       emptyRecord[field.name] = "";
//     }
//   });
//   return emptyRecord;
// }

// export default function RecordsPage() {
//   const location = useLocation(); // ✅ Get location object for reading URL
//   const navigate = useNavigate(); // ✅ Get navigate function for cleaning URL
  
//   const [records, setRecords] = useState([]);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentRecord, setCurrentRecord] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [recordsPerPage, setRecordsPerPage] = useState(10);
//   const [filters, setFilters] = useState({
//     Project: '',
//     Stream: '',
//     allocationRange: '',
//     'Contract / Perm': '',
//   });
//   const [sortConfig, setSortConfig] = useState({ key: 'First name', direction: 'ascending' });

//   const isInitialMount = useRef(true);

//   // ✅ NEW: This effect reads filters from the URL when you navigate from the dashboard
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const projectFilter = params.get('Project');
//     const streamFilter = params.get('Stream');
    
//     const newFilters = {};
//     if (projectFilter) newFilters.Project = projectFilter;
//     if (streamFilter) newFilters.Stream = streamFilter;

//     if (Object.keys(newFilters).length > 0) {
//       setFilters(prev => ({ ...prev, ...newFilters }));
//       // Clean the URL so the filter doesn't stick on a manual refresh
//       navigate('/records', { replace: true });
//     }
//   }, [location.search, navigate]);

//   const fetchAllData = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const [recordsData, countData] = await Promise.all([
//         getRecords(currentPage, recordsPerPage, filters, sortConfig),
//         getRecordsCount(filters)
//       ]);
//       setRecords(recordsData);
//       setTotalRecords(countData);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [currentPage, recordsPerPage, filters, sortConfig]);

//   useEffect(() => {
//     fetchAllData();
//   }, [fetchAllData]);

//   // Effects for resetting pagination correctly
//   useEffect(() => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }
//     setCurrentPage(1);
//   }, [filters]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [recordsPerPage]);

//   const columns = useMemo(() => (displaySchema.fields.map(f => f.name)), []);
//   const columnLabels = useMemo(() => {
//     const labels = {};
//     displaySchema.fields.forEach(f => { labels[f.name] = f.label || f.name; });
//     return labels;
//   }, []);

//   const handleSort = (key) => {
//     let direction = 'ascending';
//     if (sortConfig.key === key && sortConfig.direction === 'ascending') {
//       direction = 'descending';
//     }
//     setSortConfig({ key, direction });
//   };

//   const getCountdownColor = (days) => {
//     if (days === null || days === undefined) return '';
//     if (days <= 30) return 'countdown-red';
//     if (days <= 90) return 'countdown-orange';
//     return 'countdown-green';
//   };
  
//   function handleFilterChange(e) {
//     const { name, value } = e.target;
//     setFilters(prevFilters => ({
//       ...prevFilters,
//       [name]: value,
//     }));
//   }

//   async function handleExportExcel() {
//     try {
//       const blob = await exportToExcel(filters);
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "employees.xlsx";
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       alert(`Export failed: ${err.message}`);
//     }
//   }

//   async function handleFileImport(file) {
//     if (!file) return;
//     try {
//       const result = await importFromJSONFile(file);
//       const successMessage = `${result.message}\nCreated: ${result.created_count}\nUpdated: ${result.updated_count}`;
//       alert(successMessage);
//       fetchAllData();
//     } catch (err) {
//       alert(`Import failed: ${err.message}`);
//     }
//   }

//   async function handleSaveRecord(recordFromModal) {
//     try {
//       const payload = { ...recordFromModal };
//       const arrayFields = ["Tech Skills", "Open Air ID"];
//       const dateFields = ["Resource End date"];

//       arrayFields.forEach(fieldName => {
//         if (typeof payload[fieldName] === 'string') {
//           payload[fieldName] = payload[fieldName]
//             .split(',')
//             .map(item => String(item).trim())
//             .filter(item => item);
//         }
//       });

//       dateFields.forEach(fieldName => {
//         if (payload[fieldName] === "") {
//           payload[fieldName] = null;
//         }
//       });

//       if (payload._id) {
//         await updateRecord(payload._id, payload);
//       } else {
//         await createRecord(payload);
//       }

//       await fetchAllData();
//       handleCloseModal();

//     } catch (err) {
//       alert(`Error saving record: ${err.message}`);
//     }
//   }

//   async function handleDeleteRecord(id) {
//     if (window.confirm('Are you sure you want to delete this record?')) {
//       try {
//         await deleteRecord(id);
//         await fetchAllData();
//       } catch (err) {
//         alert(`Error deleting record: ${err.message}`);
//       }
//     }
//   }

//   function handleOpenCreateModal() {
//     setCurrentRecord(buildEmptyRecord());
//     setIsModalOpen(true);
//   }

//   function handleOpenEditModal(recordToEdit) {
//     const cleanedRecord = JSON.parse(JSON.stringify(recordToEdit));
//     const arrayFields = ["Tech Skills", "Open Air ID"];

//     arrayFields.forEach(fieldName => {
//       const value = cleanedRecord[fieldName];
//       if (Array.isArray(value)) {
//         cleanedRecord[fieldName] = value.join(', ');
//       } else if (value !== null && value !== undefined) {
//         cleanedRecord[fieldName] = String(value);
//       } else {
//         cleanedRecord[fieldName] = "";
//       }
//     });

//     setCurrentRecord(cleanedRecord);
//     setIsModalOpen(true);
//   }

//   function handleCloseModal() {
//     setIsModalOpen(false);
//     setCurrentRecord(null);
//   }

//   return (
//     <Layout>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//         <h2 style={{ margin: 0 }}>Resource Editor</h2>
//         <div className="records-toolbar">
//           <button onClick={handleExportExcel} className="btn">Export Excel</button>
//           <button onClick={handleOpenCreateModal} className="btn">Create New Employee</button>
//           <label className="btn primary"> Import JSON <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => handleFileImport(e.target.files?.[0])} /> </label>
//         </div>
//       </div>
      
//       <div className="filters-container">
//         <input
//           type="text"
//           name="Project"
//           className="filter-input"
//           placeholder="Filter by Project..."
//           value={filters.Project}
//           onChange={handleFilterChange}
//         />
//         <select
//           name="Stream"
//           className="filter-input"
//           value={filters.Stream}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Streams</option>
//           <option value="QA">QA</option>
//           <option value="Backend">Backend</option>
//           <option value="Frontend">Frontend</option>
//         </select>
//         <select
//           name="allocationRange"
//           className="filter-input"
//           value={filters.allocationRange}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Allocations</option>
//           <option value="0-25">0% - 25%</option>
//           <option value="25-50">25% - 50%</option>
//           <option value="50-75">50% - 75%</option>
//           <option value="75-100">75% - 100%</option>
//         </select>
//         <select
//           name="Contract / Perm"
//           className="filter-input"
//           value={filters['Contract / Perm']}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Types</option>
//           <option value="P">Permanent</option>
//           <option value="C">Contract</option>
//         </select>
//       </div>
      
//       <div className="table-container">
//         <table className="table table-wrap">
//           <thead>
//             <tr>
//               {columns.map(c => (
//                 <th key={c} onClick={() => handleSort(c)} style={{cursor: 'pointer'}}>
//                   {columnLabels[c]}
//                   {sortConfig.key === c && (
//                     <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
//                   )}
//                 </th>
//               ))}
//               <th style={{cursor: 'default'}}>Actions</th>
//             </tr>
//           </thead>
          
//           <tbody>
//             {isLoading ? (
//               <tr>
//                 <td colSpan={columns.length + 1}>
//                   <div className="loader-container">
//                     <div className="loader"></div>
//                   </div>
//                 </td>
//               </tr>
//             ) : error ? (
//               <tr>
//                 <td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>
//                   Error: {error}
//                 </td>
//               </tr>
//             ) : records.length > 0 ? (
//               records.map(r => (
//                 <tr key={r._id}>
//                   {columns.map(c => (
//                     <td key={c}>
//                       {(() => {
//                         if (c === 'Countdown') {
//                           return (
//                             <span className={getCountdownColor(r[c])}>
//                               {r[c] !== null && r[c] !== undefined ? `${r[c]} days` : ''}
//                             </span>
//                           );
//                         }
//                         if (c === 'Resource End date' && r[c]) {
//                           return new Date(r[c]).toLocaleDateString();
//                         }
//                         if (c === 'Open Air ID' && Array.isArray(r[c])) {
//                           return r[c].map(id => (
//                             <div key={id}>{id}</div>
//                           ));
//                         }
//                         if (c === 'fullName') {
//                           return `${r['First name'] || ''} ${r['Last name'] || ''}`;
//                         }
//                         if (Array.isArray(r[c])) {
//                           return r[c].join(', ');
//                         }
//                         return String(r[c] ?? '');
//                       })()}
//                     </td>
//                   ))}
//                   <td>
//                     <div className="action-buttons">
//                       <button onClick={() => handleOpenEditModal(r)} className="btn" title="Edit">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//                           <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
//                         </svg>
//                       </button>
//                       <button onClick={() => handleDeleteRecord(r._id)} className="btn danger" title="Delete">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//                           <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
//                           <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
//                         </svg>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
//                   No employees found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {!isLoading && !error && totalRecords > 0 && (
//         <div className="pagination-controls" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <label htmlFor="recordsPerPage">Items per page:</label>
//             <select id="recordsPerPage" value={recordsPerPage} onChange={(e) => setRecordsPerPage(Number(e.target.value))} className="btn" style={{padding: '7px'}}>
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={25}>25</option>
//               <option value={50}>50</option>
//             </select>
//           </div>
//           <Pagination recordsPerPage={recordsPerPage} totalRecords={totalRecords} paginate={setCurrentPage} currentPage={currentPage} />
//         </div>
//       )}

//       {isModalOpen && <RecordModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRecord} record={currentRecord} schema={formSchema} />}
//     </Layout>
//   );
// }


// import { useEffect, useMemo, useState, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import Layout from '../components/Layout';
// import RecordModal from './RecordModal';
// import Pagination from './Pagination';
// import './RecordsPage.css';
// import {
//   getRecords, getRecordsCount, createRecord, updateRecord, deleteRecord, importFromJSONFile, exportToExcel
// } from '../utils/api';

// // --- Schemas are unchanged ---
// const displaySchema = {
//   fields: [
//     { "name": "fullName", "label": "Name", "type": "text" },
//     { "name": "% Allocation", "label": "Allocation %", "type": "number" },
//     { "name": "Project", "label": "Project", "type": "text" },
//     { "name": "Open Air ID", "label": "Open Air ID", "type": "text" },
//     { "name": "Job Title", "label": "Job Title", "type": "text" },
//     { "name": "Stream", "label": "Stream", "type": "text" },
//     { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
//     { "name": "Resource End date", "label": "End Date", "type": "date" },
//     { "name": "Countdown", "label": "Countdown", "type": "number" }
//   ]
// };

// const formSchema = {
//   fields: [
//     { "name": "First name", "label": "First Name", "type": "text" },
//     { "name": "Last name", "label": "Last Name", "type": "text" },
//     { "name": "Line Manager", "label": "Line Manager", "type": "text" },
//     { "name": "% Allocation", "label": "Allocation %", "type": "number" },
//     { "name": "Project", "label": "Project", "type": "text" },
//     { "name": "Open Air ID", "label": "Open Air ID (comma-separated)", "type": "text" },
//     { "name": "Location", "label": "Location", "type": "text" },
//     { "name": "Stream", "label": "Stream", "type": "text" },
//     { "name": "Tech Skills", "label": "Tech Skills (comma-separated)", "type": "text" },
//     { "name": "Job Title", "label": "Job Title", "type": "text" },
//     { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
//     { "name": "Billable", "label": "Billable", "type": "text" },
//     { "name": "Resource End date", "label": "End Date", "type": "date" },
//     { "name": "Countdown", "label": "Countdown", "type": "number" },
//     { "name": "Notes", "label": "Notes", "type": "text" }
//   ]
// };

// function buildEmptyRecord() {
//   const emptyRecord = {};
//   formSchema.fields.forEach(field => {
//     if (field.name === 'Open Air ID' || field.name === 'Tech Skills') {
//       emptyRecord[field.name] = "";
//     } else if (field.type === 'number') {
//       emptyRecord[field.name] = 0;
//     } else {
//       emptyRecord[field.name] = "";
//     }
//   });
//   return emptyRecord;
// }

// export default function RecordsPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   const [records, setRecords] = useState([]);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentRecord, setCurrentRecord] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [recordsPerPage, setRecordsPerPage] = useState(10);
//   const [filters, setFilters] = useState({
//     Project: '',
//     Stream: '',
//     allocationRange: '',
//     'Contract / Perm': '',
//   });
//   const [sortConfig, setSortConfig] = useState({ key: 'First name', direction: 'ascending' });

//   const isInitialMount = useRef(true);

//   // This effect for reading URL filters is correct and unchanged
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const projectFilter = params.get('Project');
//     const streamFilter = params.get('Stream');
    
//     const newFilters = {};
//     if (projectFilter) newFilters.Project = projectFilter;
//     if (streamFilter) newFilters.Stream = streamFilter;

//     if (Object.keys(newFilters).length > 0) {
//       setFilters(prev => ({ ...prev, ...newFilters }));
//       navigate('/records', { replace: true });
//     }
//   }, [location.search, navigate]);

//   // ✅ --- MAJOR CHANGE HERE ---
//   // We removed `useCallback` and defined the fetch function directly inside the main `useEffect`.
//   // This is the modern, safer way to handle data fetching with multiple dependencies.
//   useEffect(() => {
//     const fetchAllData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
//         // Both functions are now guaranteed to receive the most current 'filters' state
//         const [recordsData, countData] = await Promise.all([
//           getRecords(currentPage, recordsPerPage, filters, sortConfig),
//           getRecordsCount(filters)
//         ]);
//         setRecords(recordsData);
//         setTotalRecords(countData);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchAllData();
//   // The effect now correctly depends on all the values it uses.
//   }, [currentPage, recordsPerPage, filters, sortConfig]);


//   // Effects for resetting pagination are correct and unchanged
//   useEffect(() => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }
//     setCurrentPage(1);
//   }, [filters]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [recordsPerPage]);

//   const columns = useMemo(() => (displaySchema.fields.map(f => f.name)), []);
//   const columnLabels = useMemo(() => {
//     const labels = {};
//     displaySchema.fields.forEach(f => { labels[f.name] = f.label || f.name; });
//     return labels;
//   }, []);

//   const handleSort = (key) => {
//     let direction = 'ascending';
//     if (sortConfig.key === key && sortConfig.direction === 'ascending') {
//       direction = 'descending';
//     }
//     setSortConfig({ key, direction });
//   };

//   const getCountdownColor = (days) => {
//     if (days === null || days === undefined) return '';
//     if (days <= 30) return 'countdown-red';
//     if (days <= 90) return 'countdown-orange';
//     return 'countdown-green';
//   };
  
//   function handleFilterChange(e) {
//     const { name, value } = e.target;
//     setFilters(prevFilters => ({
//       ...prevFilters,
//       [name]: value,
//     }));
//   }

//   async function handleExportExcel() {
//     try {
//       const blob = await exportToExcel(filters);
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "employees.xlsx";
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       alert(`Export failed: ${err.message}`);
//     }
//   }

//   async function handleFileImport(file) {
//     if (!file) return;
//     try {
//       const result = await importFromJSONFile(file);
//       const successMessage = `${result.message}\nCreated: ${result.created_count}\nUpdated: ${result.updated_count}`;
//       alert(successMessage);
//       // We don't need to manually call fetchAllData anymore, the state change will trigger the useEffect
//     } catch (err) {
//       alert(`Import failed: ${err.message}`);
//     }
//   }

//   async function handleSaveRecord(recordFromModal) {
//     try {
//       const payload = { ...recordFromModal };
//       const arrayFields = ["Tech Skills", "Open Air ID"];
//       const dateFields = ["Resource End date"];

//       arrayFields.forEach(fieldName => {
//         if (typeof payload[fieldName] === 'string') {
//           payload[fieldName] = payload[fieldName]
//             .split(',')
//             .map(item => String(item).trim())
//             .filter(item => item);
//         }
//       });

//       dateFields.forEach(fieldName => {
//         if (payload[fieldName] === "") {
//           payload[fieldName] = null;
//         }
//       });

//       if (payload._id) {
//         await updateRecord(payload._id, payload);
//       } else {
//         await createRecord(payload);
//       }
      
     
//       handleCloseModal();
//     } catch (err) {
//       alert(`Error saving record: ${err.message}`);
//     }
//   }

//   async function handleDeleteRecord(id) {
//     if (window.confirm('Are you sure you want to delete this record?')) {
//       try {
//         await deleteRecord(id);
//         // The change in totalRecords will trigger a re-fetch if needed.
//         // To be safe, we can manually trigger a refetch by resetting a piece of state.
//         // A simple way is to refetch by briefly changing the page.
//         if (records.length === 1 && currentPage > 1) {
//             setCurrentPage(currentPage - 1);
//         } else {
//             // Re-fetch data for the current page
//             const [recordsData, countData] = await Promise.all([
//                 getRecords(currentPage, recordsPerPage, filters, sortConfig),
//                 getRecordsCount(filters)
//             ]);
//             setRecords(recordsData);
//             setTotalRecords(countData);
//         }
//       } catch (err) {
//         alert(`Error deleting record: ${err.message}`);
//       }
//     }
//   }

//   function handleOpenCreateModal() {
//     setCurrentRecord(buildEmptyRecord());
//     setIsModalOpen(true);
//   }

//   function handleOpenEditModal(recordToEdit) {
//     const cleanedRecord = JSON.parse(JSON.stringify(recordToEdit));
//     const arrayFields = ["Tech Skills", "Open Air ID"];

//     arrayFields.forEach(fieldName => {
//       const value = cleanedRecord[fieldName];
//       if (Array.isArray(value)) {
//         cleanedRecord[fieldName] = value.join(', ');
//       } else if (value !== null && value !== undefined) {
//         cleanedRecord[fieldName] = String(value);
//       } else {
//         cleanedRecord[fieldName] = "";
//       }
//     });

//     setCurrentRecord(cleanedRecord);
//     setIsModalOpen(true);
//   }

//   function handleCloseModal() {
//     setIsModalOpen(false);
//     setCurrentRecord(null);
//   }

//   return (
//     <Layout>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//         <h2 style={{ margin: 0 }}>Resource Editor</h2>
//         <div className="records-toolbar">
//           <button onClick={handleExportExcel} className="btn">Export Excel</button>
//           <button onClick={handleOpenCreateModal} className="btn">Create New Employee</button>
//           <label className="btn primary"> Import JSON <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => handleFileImport(e.target.files?.[0])} /> </label>
//         </div>
//       </div>
      
//       <div className="filters-container">
//         <input
//           type="text"
//           name="Project"
//           className="filter-input"
//           placeholder="Filter by Project..."
//           value={filters.Project}
//           onChange={handleFilterChange}
//         />
//         <select
//           name="Stream"
//           className="filter-input"
//           value={filters.Stream}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Streams</option>
//           <option value="QA">QA</option>
//           <option value="Backend">Backend</option>
//           <option value="Frontend">Frontend</option>
//         </select>
//         <select
//           name="allocationRange"
//           className="filter-input"
//           value={filters.allocationRange}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Allocations</option>
//           <option value="0-25">0% - 25%</option>
//           <option value="25-50">25% - 50%</option>
//           <option value="50-75">50% - 75%</option>
//           <option value="75-100">75% - 100%</option>
//         </select>
//         <select
//           name="Contract / Perm"
//           className="filter-input"
//           value={filters['Contract / Perm']}
//           onChange={handleFilterChange}
//         >
//           <option value="">All Types</option>
//           <option value="P">Permanent</option>
//           <option value="C">Contract</option>
//         </select>
//       </div>
      
//       <div className="table-container">
//         <table className="table table-wrap">
//           <thead>
//             <tr>
//               {columns.map(c => (
//                 <th key={c} onClick={() => handleSort(c)} style={{cursor: 'pointer'}}>
//                   {columnLabels[c]}
//                   {sortConfig.key === c && (
//                     <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
//                   )}
//                 </th>
//               ))}
//               <th style={{cursor: 'default'}}>Actions</th>
//             </tr>
//           </thead>
          
//           <tbody>
//             {isLoading ? (
//               <tr>
//                 <td colSpan={columns.length + 1}>
//                   <div className="loader-container">
//                     <div className="loader"></div>
//                   </div>
//                 </td>
//               </tr>
//             ) : error ? (
//               <tr>
//                 <td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>
//                   Error: {error}
//                 </td>
//               </tr>
//             ) : records.length > 0 ? (
//               records.map(r => (
//                 <tr key={r._id}>
//                   {columns.map(c => (
//                     <td key={c}>
//                       {(() => {
//                         if (c === 'Countdown') {
//                           return (
//                             <span className={getCountdownColor(r[c])}>
//                               {r[c] !== null && r[c] !== undefined ? `${r[c]} days` : ''}
//                             </span>
//                           );
//                         }
//                         if (c === 'Resource End date' && r[c]) {
//                           return new Date(r[c]).toLocaleDateString();
//                         }
//                         if (c === 'Open Air ID' && Array.isArray(r[c])) {
//                           return r[c].map(id => (
//                             <div key={id}>{id}</div>
//                           ));
//                         }
//                         if (c === 'fullName') {
//                           return `${r['First name'] || ''} ${r['Last name'] || ''}`;
//                         }
//                         if (Array.isArray(r[c])) {
//                           return r[c].join(', ');
//                         }
//                         return String(r[c] ?? '');
//                       })()}
//                     </td>
//                   ))}
//                   <td>
//                     <div className="action-buttons">
//                       <button onClick={() => handleOpenEditModal(r)} className="btn" title="Edit">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//                           <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
//                         </svg>
//                       </button>
//                       <button onClick={() => handleDeleteRecord(r._id)} className="btn danger" title="Delete">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//                           <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
//                           <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
//                         </svg>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
//                   No employees found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {!isLoading && !error && totalRecords > 0 && (
//         <div className="pagination-controls" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <label htmlFor="recordsPerPage">Items per page:</label>
//             <select id="recordsPerPage" value={recordsPerPage} onChange={(e) => setRecordsPerPage(Number(e.target.value))} className="btn" style={{padding: '7px'}}>
//               <option value={5}>5</option>
//               <option value={10}>10</option>
//               <option value={25}>25</option>
//               <option value={50}>50</option>
//             </select>
//           </div>
//           <Pagination recordsPerPage={recordsPerPage} totalRecords={totalRecords} paginate={setCurrentPage} currentPage={currentPage} />
//         </div>
//       )}

//       {isModalOpen && <RecordModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRecord} record={currentRecord} schema={formSchema} />}
//     </Layout>
//   );
// }


import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import RecordModal from './RecordModal';
import Pagination from './Pagination';
import './RecordsPage.css';
import {
  getRecords, getRecordsCount, createRecord, updateRecord, deleteRecord, importFromJSONFile, exportToExcel
} from '../utils/api';

// --- Schemas are unchanged ---
const displaySchema = {
  fields: [
    { "name": "fullName", "label": "Name", "type": "text" },
    { "name": "% Allocation", "label": "Allocation %", "type": "number" },
    { "name": "Project", "label": "Project", "type": "text" },
    { "name": "Open Air ID", "label": "Open Air ID", "type": "text" },
    { "name": "Job Title", "label": "Job Title", "type": "text" },
    { "name": "Stream", "label": "Stream", "type": "text" },
    { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
    { "name": "Resource End date", "label": "End Date", "type": "date" },
    { "name": "Countdown", "label": "Countdown", "type": "number" }
  ]
};

const formSchema = {
  fields: [
    { "name": "First name", "label": "First Name", "type": "text" },
    { "name": "Last name", "label": "Last Name", "type": "text" },
    { "name": "Line Manager", "label": "Line Manager", "type": "text" },
    { "name": "% Allocation", "label": "Allocation %", "type": "number" },
    { "name": "Project", "label": "Project", "type": "text" },
    { "name": "Open Air ID", "label": "Open Air ID (comma-separated)", "type": "text" },
    { "name": "Location", "label": "Location", "type": "text" },
    { "name": "Stream", "label": "Stream", "type": "text" },
    { "name": "Tech Skills", "label": "Tech Skills (comma-separated)", "type": "text" },
    { "name": "Job Title", "label": "Job Title", "type": "text" },
    { "name": "Contract / Perm", "label": "Contract / Perm", "type": "text" },
    { "name": "Billable", "label": "Billable", "type": "text" },
    { "name": "Resource End date", "label": "End Date", "type": "date" },
    { "name": "Countdown", "label": "Countdown", "type": "number" },
    { "name": "Notes", "label": "Notes", "type": "text" }
  ]
};

function buildEmptyRecord() {
  const emptyRecord = {};
  formSchema.fields.forEach(field => {
    if (field.name === 'Open Air ID' || field.name === 'Tech Skills') {
      emptyRecord[field.name] = "";
    } else if (field.type === 'number') {
      emptyRecord[field.name] = 0;
    } else {
      emptyRecord[field.name] = "";
    }
  });
  return emptyRecord;
}

export default function RecordsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    Project: '',
    Stream: '',
    allocationRange: '',
    'Contract / Perm': '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'First name', direction: 'ascending' });

  const isInitialMount = useRef(true);

  // This effect handles incoming filters from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.toString()) { // Only run if there are params in the URL
      const projectFilter = params.get('Project');
      const streamFilter = params.get('Stream');

      const newFilters = {};
      if (projectFilter) newFilters.Project = projectFilter;
      if (streamFilter) newFilters.Stream = streamFilter;

      setFilters(prev => ({ ...prev, ...newFilters }));
      // Clean the URL so the filter doesn't re-apply on a simple page refresh
      navigate('/records', { replace: true });
    }
  }, [location.search, navigate]);

  // This is now the ONLY effect responsible for fetching data
  useEffect(() => {
    // ✅ FIX: This guard clause prevents the initial, unfiltered fetch
    // if we are expecting a filter to arrive from the URL.
    if (isInitialMount.current) {
        const params = new URLSearchParams(location.search);
        if (params.has('Project') || params.has('Stream')) {
            isInitialMount.current = false; // Mark initial mount as handled
            return; // Exit early and wait for the filter state to update
        }
    }
    isInitialMount.current = false; // Mark initial mount as handled for subsequent renders

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [currentPage, recordsPerPage, filters, sortConfig]);
  
  // This effect correctly resets the page to 1 when filters or page size change
  useEffect(() => {
    if (!isInitialMount.current) {
      setCurrentPage(1);
    }
  }, [filters, recordsPerPage]);
  
  const columns = useMemo(() => (displaySchema.fields.map(f => f.name)), []);
  const columnLabels = useMemo(() => {
    const labels = {};
    displaySchema.fields.forEach(f => { labels[f.name] = f.label || f.name; });
    return labels;
  }, []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getCountdownColor = (days) => {
    if (days === null || days === undefined) return '';
    if (days <= 30) return 'countdown-red';
    if (days <= 90) return 'countdown-orange';
    return 'countdown-green';
  };
  
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  }

  const fetchAllData = async () => {
      setIsLoading(true);
      try {
          const [recordsData, countData] = await Promise.all([ getRecords(currentPage, recordsPerPage, filters, sortConfig), getRecordsCount(filters) ]);
          setRecords(recordsData);
          setTotalRecords(countData);
      } catch (error) {
          setError(error.message);
      } finally {
          setIsLoading(false);
      }
  };

  async function handleExportExcel() {
    try {
      const blob = await exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  }

  async function handleFileImport(file) {
    if (!file) return;
    try {
      const result = await importFromJSONFile(file);
      const successMessage = `${result.message}\nCreated: ${result.created_count}\nUpdated: ${result.updated_count}`;
      alert(successMessage);
      fetchAllData();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  }

  async function handleSaveRecord(recordFromModal) {
    try {
      const payload = { ...recordFromModal };
      const arrayFields = ["Tech Skills", "Open Air ID"];
      const dateFields = ["Resource End date"];

      arrayFields.forEach(fieldName => {
        if (typeof payload[fieldName] === 'string') {
          payload[fieldName] = payload[fieldName]
            .split(',')
            .map(item => String(item).trim())
            .filter(item => item);
        }
      });

      dateFields.forEach(fieldName => {
        if (payload[fieldName] === "") {
          payload[fieldName] = null;
        }
      });

      if (payload._id) {
        await updateRecord(payload._id, payload);
      } else {
        await createRecord(payload);
      }
      handleCloseModal();
      fetchAllData();
    } catch (err) {
      alert(`Error saving record: ${err.message}`);
    }
  }

  async function handleDeleteRecord(id) {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteRecord(id);
        if (records.length === 1 && currentPage > 1) {
            setCurrentPage(c => c - 1);
        } else {
            fetchAllData();
        }
      } catch (err) {
        alert(`Error deleting record: ${err.message}`);
      }
    }
  }

  function handleOpenCreateModal() {
    setCurrentRecord(buildEmptyRecord());
    setIsModalOpen(true);
  }

  function handleOpenEditModal(recordToEdit) {
    const cleanedRecord = JSON.parse(JSON.stringify(recordToEdit));
    const arrayFields = ["Tech Skills", "Open Air ID"];

    arrayFields.forEach(fieldName => {
      const value = cleanedRecord[fieldName];
      if (Array.isArray(value)) {
        cleanedRecord[fieldName] = value.join(', ');
      } else if (value !== null && value !== undefined) {
        cleanedRecord[fieldName] = String(value);
      } else {
        cleanedRecord[fieldName] = "";
      }
    });

    setCurrentRecord(cleanedRecord);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setCurrentRecord(null);
  }

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
        <input
          type="text"
          name="Project"
          className="filter-input"
          placeholder="Filter by Project..."
          value={filters.Project}
          onChange={handleFilterChange}
        />
        <select
          name="Stream"
          className="filter-input"
          value={filters.Stream}
          onChange={handleFilterChange}
        >
          <option value="">All Streams</option>
          <option value="QA">QA</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
        </select>
        <select
          name="allocationRange"
          className="filter-input"
          value={filters.allocationRange}
          onChange={handleFilterChange}
        >
          <option value="">All Allocations</option>
          <option value="0-25">0% - 25%</option>
          <option value="25-50">25% - 50%</option>
          <option value="50-75">50% - 75%</option>
          <option value="75-100">75% - 100%</option>
        </select>
        <select
          name="Contract / Perm"
          className="filter-input"
          value={filters['Contract / Perm']}
          onChange={handleFilterChange}
        >
          <option value="">All Types</option>
          <option value="P">Permanent</option>
          <option value="C">Contract</option>
        </select>
      </div>
      
      <div className="table-container">
        <table className="table table-wrap">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c} onClick={() => handleSort(c)} style={{cursor: 'pointer'}}>
                  {columnLabels[c]}
                  {sortConfig.key === c && (
                    <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
              <th style={{cursor: 'default'}}>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="loader-container">
                    <div className="loader"></div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>
                  Error: {error}
                </td>
              </tr>
            ) : records.length > 0 ? (
              records.map(r => (
                <tr key={r._id}>
                  {columns.map(c => (
                    <td key={c}>
                      {(() => {
                        if (c === 'Countdown') {
                          return (
                            <span className={getCountdownColor(r[c])}>
                              {r[c] !== null && r[c] !== undefined ? `${r[c]} days` : ''}
                            </span>
                          );
                        }
                        if (c === 'Resource End date' && r[c]) {
                          return new Date(r[c]).toLocaleDateString();
                        }
                        if (c === 'Open Air ID' && Array.isArray(r[c])) {
                          return r[c].map(id => (
                            <div key={id}>{id}</div>
                          ));
                        }
                        if (c === 'fullName') {
                          return `${r['First name'] || ''} ${r['Last name'] || ''}`;
                        }
                        if (Array.isArray(r[c])) {
                          return r[c].join(', ');
                        }
                        return String(r[c] ?? '');
                      })()}
                    </td>
                  ))}
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleOpenEditModal(r)} className="btn" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteRecord(r._id)} className="btn danger" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && totalRecords > 0 && (
        <div className="pagination-controls" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' , paddingTop:"25px" }}>
            <label htmlFor="recordsPerPage">Items per page:</label>
            <select id="recordsPerPage" value={recordsPerPage} onChange={(e) => setRecordsPerPage(Number(e.target.value))} className="btn" style={{padding: '7px'}}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <Pagination recordsPerPage={recordsPerPage} totalRecords={totalRecords} paginate={setCurrentPage} currentPage={currentPage} />
        </div>
      )}

      {isModalOpen && <RecordModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveRecord} record={currentRecord} schema={formSchema} />}
    </Layout>
  );
}
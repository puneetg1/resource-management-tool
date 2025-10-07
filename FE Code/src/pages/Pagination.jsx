


import React from 'react';
import './Pagination.css';

const Pagination = ({ recordsPerPage, totalRecords, paginate, currentPage }) => {
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  
  if (totalPages <= 1) {
    return null;
  }
  
  const maxPageNumbersToShow = 6; 
  let startPage, endPage;

  if (totalPages <= maxPageNumbersToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const halfWindow = Math.floor(maxPageNumbersToShow / 2);
    if (currentPage <= halfWindow) {
      startPage = 1;
      endPage = maxPageNumbersToShow;
    } else if (currentPage + halfWindow >= totalPages) {
      startPage = totalPages - maxPageNumbersToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - halfWindow + 1;
      endPage = currentPage + halfWindow; 
    }
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className="pagination">
        <li className="page-item">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="page-link">
            Previous
          </button>
        </li>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <button onClick={() => paginate(number)} className="page-link">
              {number}
            </button>
          </li>
        ))}
        <li className="page-item">
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="page-link">
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;


const API_BASE_URL = "http://localhost:8000"; // Your FastAPI server URL


export async function getRecords(page = 1, limit = 10, filters = {}, sortConfig = {}) {
  const params = new URLSearchParams({
    skip: (page - 1) * limit,
    limit: limit,
    // ✅ Add sorting parameters to the request
    sortBy: sortConfig.key || 'First name',
    sortDirection: sortConfig.direction || 'ascending',
  });

  // Add filter values to the parameters if they are not empty
  for (const key in filters) {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  }

  const response = await fetch(`${API_BASE_URL}/employees?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch records');
  }
  return response.json();
}

/**
 * Fetches the total count of records based on the current filters.
 */
export async function getRecordsCount(filters = {}) {
  const params = new URLSearchParams();

  for (const key in filters) {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  }
  
  const response = await fetch(`${API_BASE_URL}/employees/count?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch record count');
  }
  const data = await response.json();
  return data.total;
}

/**
 * Creates a new record.
 */
export async function createRecord(recordData) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create record');
  }
  return response.json();
}

/**
 * Updates an existing record.
 */
export async function updateRecord(id, recordData) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update record');
  }
  return response.json();
}

/**
 * Deletes a record by its ID.
 */
export async function deleteRecord(id) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete record');
  }
  return response.json();
}

/**
 * Uploads a JSON file to the bulk import endpoint.
 */
export async function importFromJSONFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/employees/bulk-import-file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to import records from file');
  }
  return response.json();
}



export async function exportToExcel(filters = {}) {
  const params = new URLSearchParams();

  for (const key in filters) {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  }

  const response = await fetch(`${API_BASE_URL}/employees/export-excel?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to export records');
  }

  // ✅ Return a blob for download
  return response.blob();
}



export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/dashboard-summary`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch dashboard data');
  }
  return response.json();
}
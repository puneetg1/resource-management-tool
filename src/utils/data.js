import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

const STORAGE_KEY = 'app_records'
const SCHEMA_STORAGE_KEY = 'app_schema'
const SCHEMA_URL = '/input-data/schema.json'

export async function loadSchema() {
  // First try to load from localStorage (user-created schema)
  const storedSchema = localStorage.getItem(SCHEMA_STORAGE_KEY)
  if (storedSchema) {
    try {
      return JSON.parse(storedSchema)
    } catch (e) {
      console.warn('Failed to parse stored schema, falling back to default')
    }
  }
  
  // Fallback to default schema from public folder
  try {
    const res = await fetch(SCHEMA_URL)
    if (!res.ok) throw new Error('Schema not found')
    return await res.json()
  } catch (e) {
    return {
      title: 'Default Schema',
      fields: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'amount', label: 'Amount', type: 'number' },
        { name: 'category', label: 'Category', type: 'text' }
      ]
    }
  }
}

export function saveSchema(schema) {
  localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema))
}

export function clearSchema() {
  localStorage.removeItem(SCHEMA_STORAGE_KEY)
}

function readRaw() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function writeRaw(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function readAllRecords() {
  return readRaw()
}

export function readRecordById(id) {
  return readRaw().find(r => r.id === id)
}

export function createRecord(data) {
  const list = readRaw()
  const rec = { id: uuidv4(), ...data }
  list.push(rec)
  writeRaw(list)
  return rec
}

export function updateRecord(id, data) {
  const list = readRaw()
  const idx = list.findIndex(r => r.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...data, id }
    writeRaw(list)
    return list[idx]
  }
  return null
}

export function deleteRecord(id) {
  const list = readRaw().filter(r => r.id !== id)
  writeRaw(list)
}

export function exportToJSON(filename = 'records.json') {
  const data = readRaw()
  downloadFile(data, filename, 'json')
}

export function exportToExcel(filename = 'records.xlsx') {
  const data = readRaw()
  downloadFile(data, filename, 'excel')
}

export async function importFromJSONFile(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('Invalid JSON format')
  writeRaw(data)
}

export async function importFromExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)
  writeRaw(data)
}

export async function importDataWithSchema(data, schema) {
  // Save the schema first
  saveSchema(schema)
  
  // Transform data according to schema mapping
  const transformedData = data.map(record => {
    const transformedRecord = { id: uuidv4() }
    
    schema.fields.forEach(field => {
      const originalValue = record[field.label] // field.label contains the original field name
      let transformedValue = originalValue
      
      // Type conversion based on schema
      switch (field.type) {
        case 'number':
          transformedValue = Number(originalValue) || 0
          break
        case 'boolean':
          transformedValue = Boolean(originalValue)
          break
        case 'date':
          transformedValue = originalValue ? new Date(originalValue).toISOString() : null
          break
        case 'array':
          transformedValue = Array.isArray(originalValue) ? originalValue : [originalValue]
          break
        default:
          transformedValue = String(originalValue || '')
      }
      
      transformedRecord[field.name] = transformedValue
    })
    
    return transformedRecord
  })
  
  writeRaw(transformedData)
  return transformedData
}

export function downloadFile(data, filename, format = 'json') {
  let blob, mimeType
  
  if (format === 'json') {
    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  } else if (format === 'excel') {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } else {
    throw new Error('Unsupported format')
  }
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}



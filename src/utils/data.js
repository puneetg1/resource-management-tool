import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

const STORAGE_KEY = 'app_records'
const SCHEMA_URL = '/input-data/schema.json'

export async function loadSchema() {
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

function readRaw() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function writeRaw(list) {
  // Ensure every record has a unique ID if it doesn't already
  const listWithIds = list.map(item => ({ id: item.id || uuidv4(), ...item }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listWithIds));
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
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToExcel(filename = 'records.xlsx') {
  const data = readRaw()
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records')
  XLSX.writeFile(workbook, filename)
}

export async function importFromJSONFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  // Check if the data is an object with a 'resources' key that is an array
  if (data && Array.isArray(data.resources)) {
    // If yes, use the array from inside the 'resources' property
    writeRaw(data.resources);
  } else if (Array.isArray(data)) {
    // Also handle the original case where the file is just an array
    writeRaw(data);
  } else {
    // If neither is true, the format is invalid
    throw new Error("Invalid JSON format: File must be an array, or an object with a 'resources' key containing an array.");
  }
}

export async function importFromExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)
  writeRaw(data)
}
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Auth } from '../utils/auth'
import Layout from '../components/Layout'
import { loadSchema, readRecordById, updateRecord } from '../utils/data'

export default function EditRecordPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [schema, setSchema] = useState(null)
  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      navigate('/login')
      return
    }
    async function boot() {
      const s = await loadSchema()
      setSchema(s)
      const r = readRecordById(id)
      setRecord(r)
    }
    boot()
  }, [id, navigate])

  function onSubmit(e) {
    e.preventDefault()
    updateRecord(record.id, record)
    navigate('/records')
  }

  if (!schema || !record) return null

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Edit Record</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {(schema?.fields || []).map(field => (
          <div key={field.name} style={{ display: 'grid', gap: 4 }}>
            <label>{field.label || field.name}</label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={record[field.name] ?? ''}
              onChange={(e) => setRecord({ ...record, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
              style={inputStyle}
            />
          </div>
        ))}
        <div>
          <button type="submit" style={buttonStyle}>Save</button>
        </div>
      </form>
    </Layout>
  )
}

const inputStyle = { padding: '8px 10px', borderRadius: 6, border: '1px solid #374151', background: '#0b1222', color: '#e2e8f0' }
const buttonStyle = { background: '#38bdf8', color: '#111827', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }



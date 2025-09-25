import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Auth } from '../utils/auth'
import Layout from '../components/Layout'
import './DashboardPage.css'
import { loadSchema, readAllRecords, downloadFile } from '../utils/data'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  Brush,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'
]

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'area', label: 'Area Chart', icon: '📉' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'scatter', label: 'Scatter Plot', icon: '⚪' },
  { value: 'radar', label: 'Radar Chart', icon: '🕸️' },
  { value: 'treemap', label: 'Tree Map', icon: '🌳' },
  { value: 'funnel', label: 'Funnel Chart', icon: '🔻' }
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [schema, setSchema] = useState(null)
  const [records, setRecords] = useState([])
  const [selectedChartType, setSelectedChartType] = useState('bar')
  const [selectedField, setSelectedField] = useState('')
  const [selectedGroupBy, setSelectedGroupBy] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('charts')
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState({ field: '', direction: 'asc' })
  const [pageSize, setPageSize] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardLayout, setDashboardLayout] = useState('grid')
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [chartSettings, setChartSettings] = useState({
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animation: true
  })

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      navigate('/login')
      return
    }
    async function boot() {
      setIsLoading(true)
      const s = await loadSchema()
      setSchema(s)
      const allRecords = readAllRecords()
      setRecords(allRecords)
      
      // Set default selections
      if (s?.fields?.length > 0) {
        const numericFields = s.fields.filter(f => f.type === 'number')
        const textFields = s.fields.filter(f => f.type === 'text')
        
        if (numericFields.length > 0) {
          setSelectedField(numericFields[0].name)
        }
        if (textFields.length > 0) {
          setSelectedGroupBy(textFields[0].name)
        }
      }
      setIsLoading(false)
    }
    boot()
  }, [navigate])

  // Advanced data processing
  const numericFields = useMemo(() => (schema?.fields || []).filter(f => f.type === 'number'), [schema])
  const textFields = useMemo(() => (schema?.fields || []).filter(f => f.type === 'text'), [schema])
  const dateFields = useMemo(() => (schema?.fields || []).filter(f => f.type === 'date'), [schema])
  const arrayFields = useMemo(() => (schema?.fields || []).filter(f => f.type === 'array'), [schema])

  // Advanced filtering and search
  const processedRecords = useMemo(() => {
    let result = [...records]

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter(record => 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply field filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        result = result.filter(record => 
          String(record[field] || '').toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      result = result.filter(record => {
        const dateFields = schema?.fields?.filter(f => f.type === 'date') || []
        return dateFields.some(field => {
          const recordDate = new Date(record[field.name])
          return recordDate >= dateRange.start && recordDate <= dateRange.end
        })
      })
    }

    return result
  }, [records, searchTerm, filters, dateRange, schema])

  // Advanced chart data generation
  const chartData = useMemo(() => {
    if (!selectedField || !selectedGroupBy || processedRecords.length === 0) return []
    
    const grouped = {}
    processedRecords.forEach(record => {
      const groupValue = String(record[selectedGroupBy] || 'Unknown')
      const fieldValue = Number(record[selectedField] || 0)
      
      if (!grouped[groupValue]) {
        grouped[groupValue] = { 
          name: groupValue, 
          value: 0, 
          count: 0,
          avg: 0,
          min: fieldValue,
          max: fieldValue
        }
      }
      grouped[groupValue].value += fieldValue
      grouped[groupValue].count += 1
      grouped[groupValue].min = Math.min(grouped[groupValue].min, fieldValue)
      grouped[groupValue].max = Math.max(grouped[groupValue].max, fieldValue)
    })
    
    // Calculate averages
    Object.values(grouped).forEach(group => {
      group.avg = group.value / group.count
    })
    
    return Object.values(grouped).sort((a, b) => b.value - a.value)
  }, [processedRecords, selectedField, selectedGroupBy])

  // Advanced statistics
  const statistics = useMemo(() => {
    const totalRecords = processedRecords.length
    const numericStats = {}
    const textStats = {}
    
    numericFields.forEach(field => {
      const values = processedRecords.map(r => Number(r[field.name] || 0)).filter(v => !isNaN(v))
      if (values.length > 0) {
        numericStats[field.name] = {
          sum: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
          min: Math.min(...values),
          max: Math.max(...values),
          stdDev: Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / values.length)
        }
      }
    })

    textFields.forEach(field => {
      const values = processedRecords.map(r => String(r[field.name] || '')).filter(v => v.trim())
      const uniqueValues = new Set(values)
      textStats[field.name] = {
        total: values.length,
        unique: uniqueValues.size,
        mostCommon: values.reduce((a, b, i, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, '')
      }
    })
    
    return { totalRecords, numericStats, textStats }
  }, [processedRecords, numericFields, textFields])

  // Pagination
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return processedRecords.slice(start, end)
  }, [processedRecords, currentPage, pageSize])

  const totalPages = Math.ceil(processedRecords.length / pageSize)

  // Advanced chart rendering
  const renderAdvancedChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Select fields and ensure data is loaded to view charts</p>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="tooltip-value" style={{ color: entry.color }}>
                {entry.name}: {entry.value.toLocaleString()}
              </p>
            ))}
            <p className="tooltip-details">
              Count: {payload[0]?.payload?.count || 0} | 
              Avg: {(payload[0]?.payload?.avg || 0).toFixed(2)}
            </p>
          </div>
        )
      }
      return null
    }

    switch (selectedChartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
            <Bar 
              dataKey="value" 
              name={selectedField} 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine y={chartData.reduce((a, b) => a + b.value, 0) / chartData.length} stroke="#ef4444" strokeDasharray="5 5" />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              name={selectedField} 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Brush dataKey="name" height={30} stroke="#3b82f6" />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey="value" 
              name={selectedField} 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              fill="#3b82f6"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
          </PieChart>
        )
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {chartSettings.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis dataKey="value" stroke="#6b7280" fontSize={12} />
            {chartSettings.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {chartSettings.showLegend && <Legend />}
            <Scatter dataKey="value" fill="#3b82f6" />
          </ScatterChart>
        )
      case 'radar':
        return (
          <RadarChart data={chartData.slice(0, 6)} width={400} height={300}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            {chartSettings.showTooltip && <Tooltip />}
          </RadarChart>
        )
      case 'treemap':
        return (
          <Treemap
            width={400}
            height={300}
            data={chartData}
            dataKey="value"
            ratio={4/3}
            stroke="#fff"
            fill="#3b82f6"
          >
            {chartSettings.showTooltip && <Tooltip />}
          </Treemap>
        )
      case 'funnel':
        return (
          <FunnelChart width={400} height={300}>
            <Funnel
              dataKey="value"
              data={chartData}
              isAnimationActive={chartSettings.animation}
            >
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
            {chartSettings.showTooltip && <Tooltip />}
          </FunnelChart>
        )
      default:
        return <BarChart {...commonProps}><Bar dataKey="value" fill="#3b82f6" /></BarChart>
    }
  }

  // Export functions
  const handleExport = useCallback((format) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `dashboard_export_${timestamp}.${format}`
    downloadFile(processedRecords, filename, format)
  }, [processedRecords])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (isLoading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="production-dashboard">
        {/* Advanced Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              <span className="title-icon">📊</span>
              Advanced Analytics Dashboard
            </h1>
            <div className="dashboard-meta">
              <span className="schema-badge">{schema?.title || 'Loading...'}</span>
              <span className="record-count">{statistics.totalRecords.toLocaleString()} records</span>
              <span className="last-updated">Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="header-actions">
            <div className="action-group">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-outline ${showFilters ? 'active' : ''}`}
              >
                🔍 Filters
              </button>
              <button 
                onClick={() => setViewMode(viewMode === 'charts' ? 'table' : 'charts')}
                className="btn btn-outline"
              >
                {viewMode === 'charts' ? '📋 Table' : '📊 Charts'}
              </button>
            </div>
            <div className="action-group">
              <button onClick={() => handleExport('json')} className="btn btn-outline">
                📄 Export JSON
              </button>
              <button onClick={() => handleExport('excel')} className="btn btn-outline">
                📊 Export Excel
              </button>
              <button onClick={handlePrint} className="btn btn-outline">
                🖨️ Print
              </button>
            </div>
            <button onClick={() => navigate('/records')} className="btn btn-primary">
              ➕ Manage Data
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Advanced Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="close-filters"
              >
                ✕
              </button>
            </div>
            <div className="filters-content">
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label>Chart Type</label>
                <div className="chart-type-selector">
                  {CHART_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedChartType(type.value)}
                      className={`chart-type-btn ${selectedChartType === type.value ? 'active' : ''}`}
                    >
                      <span className="chart-icon">{type.icon}</span>
                      <span className="chart-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Value Field</label>
                <select 
                  value={selectedField} 
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="filter-select"
                >
                  {numericFields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.label || field.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Group By</label>
                <select 
                  value={selectedGroupBy} 
                  onChange={(e) => setSelectedGroupBy(e.target.value)}
                  className="filter-select"
                >
                  {textFields.map(field => (
                    <option key={field.name} value={field.name}>
                      {field.label || field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Chart Settings</label>
                <div className="chart-settings">
                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={chartSettings.showGrid}
                      onChange={(e) => setChartSettings(prev => ({ ...prev, showGrid: e.target.checked }))}
                    />
                    Show Grid
                  </label>
                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={chartSettings.showLegend}
                      onChange={(e) => setChartSettings(prev => ({ ...prev, showLegend: e.target.checked }))}
                    />
                    Show Legend
                  </label>
                  <label className="setting-item">
                    <input
                      type="checkbox"
                      checked={chartSettings.showTooltip}
                      onChange={(e) => setChartSettings(prev => ({ ...prev, showTooltip: e.target.checked }))}
                    />
                    Show Tooltip
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{statistics.totalRecords.toLocaleString()}</h3>
              <p>Total Records</p>
              <div className="stat-trend">
                <span className="trend-indicator">↗️</span>
                <span>Active Dataset</span>
              </div>
            </div>
          </div>
          
          {Object.entries(statistics.numericStats).map(([fieldName, stats]) => (
            <div key={fieldName} className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>{stats.sum.toLocaleString()}</h3>
                <p>{fieldName} (Total)</p>
                <div className="stat-details">
                  <div className="detail-row">
                    <span>Avg: {stats.avg.toFixed(2)}</span>
                    <span>Median: {stats.median.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Range: {stats.min} - {stats.max}</span>
                    <span>Std Dev: {stats.stdDev.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {Object.entries(statistics.textStats).map(([fieldName, stats]) => (
            <div key={fieldName} className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>{stats.unique}</h3>
                <p>{fieldName} (Unique)</p>
                <div className="stat-details">
                  <div className="detail-row">
                    <span>Total: {stats.total}</span>
                    <span>Most Common: {stats.mostCommon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        {viewMode === 'charts' ? (
          <div className="charts-section">
            <div className="chart-container">
              <div className="chart-header">
                <h3>
                  {CHART_TYPES.find(t => t.value === selectedChartType)?.icon} 
                  {CHART_TYPES.find(t => t.value === selectedChartType)?.label}: {selectedField} by {selectedGroupBy}
                </h3>
                <div className="chart-controls">
                  <span className="data-points">{chartData.length} data points</span>
                </div>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={500}>
                  {renderAdvancedChart()}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="table-section">
            <div className="table-container">
              <div className="table-header">
                <h3>Data Table ({processedRecords.length} records)</h3>
                <div className="table-controls">
                  <select 
                    value={pageSize} 
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="page-size-select"
                  >
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={200}>200 per page</option>
                  </select>
                </div>
              </div>
              
              <div className="table-wrapper">
                <table className="advanced-table">
                  <thead>
                    <tr>
                      <th className="select-column">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === paginatedRecords.length && paginatedRecords.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords(new Set(paginatedRecords.map(r => r.id)))
                            } else {
                              setSelectedRecords(new Set())
                            }
                          }}
                        />
                      </th>
                      {schema?.fields?.map(field => (
                        <th key={field.name} className="sortable">
                          {field.label || field.name}
                          <div className="sort-controls">
                            <button 
                              onClick={() => setSortBy({ field: field.name, direction: 'asc' })}
                              className={`sort-btn ${sortBy.field === field.name && sortBy.direction === 'asc' ? 'active' : ''}`}
                            >
                              ↑
                            </button>
                            <button 
                              onClick={() => setSortBy({ field: field.name, direction: 'desc' })}
                              className={`sort-btn ${sortBy.field === field.name && sortBy.direction === 'desc' ? 'active' : ''}`}
                            >
                              ↓
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record, index) => (
                      <tr key={record.id || index} className={selectedRecords.has(record.id) ? 'selected' : ''}>
                        <td className="select-column">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRecords)
                              if (e.target.checked) {
                                newSelected.add(record.id)
                              } else {
                                newSelected.delete(record.id)
                              }
                              setSelectedRecords(newSelected)
                            }}
                          />
                        </td>
                        {schema?.fields?.map(field => (
                          <td key={field.name}>
                            {field.type === 'array' ? 
                              <div className="array-cell">
                                {JSON.stringify(record[field.name])}
                              </div> : 
                              <div className="cell-content">
                                {String(record[field.name] || '')}
                              </div>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedRecords.length)} of {processedRecords.length} records
                </div>
                <div className="pagination-controls">
                  <button 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ⏮️ First
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ⬅️ Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next ➡️
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Last ⏭️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
// src/pages/ChartTestPage.jsx

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Hardcoded data that we know is in the correct format.
const testData = [
  { name: 'Project A', value: 45 },
  { name: 'Project B', value: 78 },
  { name: 'Project C', value: 30 },
  { name: 'Project D', value: 65 },
  { name: 'Project E', value: 55 },
];

export default function ChartTestPage() {
  return (
    <div style={{ padding: '50px' }}>
      <h1>Chart Library Test Page</h1>
      <p>If you can see the chart below, the `recharts` library is working correctly.</p>
      <p>The problem is likely in your global CSS or a parent component like `Layout.jsx`.</p>
      
      {/* We are creating a parent container with a GUARANTEED size.
        This removes all doubt about component sizing issues.
      */}
      <div style={{ width: '100%', height: '500px', border: '2px solid red', marginTop: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={testData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
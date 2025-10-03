'use client';

export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#FFC107' }}>MKG Desktop App - Test Page</h1>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        ✅ Tauri is working correctly!
      </p>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3>Environment Info:</h3>
        <p>Platform: Desktop (Tauri)</p>
        <p>Framework: Next.js 14</p>
        <p>UI: Material-UI + Tailwind CSS</p>
      </div>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Test Interaction
      </button>
    </div>
  );
}
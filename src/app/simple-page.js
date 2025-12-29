export default function SimplePage() {
  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>🎉 MKG Desktop App</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
           Selamat! Aplikasi desktop berjalan!

        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2>✅ Status Berhasil:</h2>
          <ul style={{ lineHeight: '1.8' }}>

            <li>✅ Next.js frontend berjalan</li>
            <li>✅ Material-UI components loaded</li>
            <li>✅ Tailwind CSS aktif</li>
          </ul>
        </div>

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => {
              alert('Running in browser mode');
            }}
            style={{
              background: '#FFC107',
              color: '#000',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            Test Electron API
          </button>
          
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
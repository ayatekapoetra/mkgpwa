const LoadingPage = () => {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 6, borderRadius: 8, background: 'linear-gradient(90deg, #dbeafe, #bfdbfe, #dbeafe)', animation: 'pulse 1.2s ease-in-out infinite' }} />
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;

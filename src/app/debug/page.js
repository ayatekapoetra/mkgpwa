export default function DebugPage() {
  return (
    <div>
      <h1>Debug Page</h1>
      <p>If you can see this, the basic routing works.</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}
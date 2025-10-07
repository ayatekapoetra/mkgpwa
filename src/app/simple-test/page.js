export default function SimpleTest() {
  return (
    <div>
      <h1>Simple Test</h1>
      <p>This is a simple test page outside dashboard layout.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}
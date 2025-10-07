'use client';

import React from 'react';

export default function TestDashboardPage() {
  return (
    <div>
      <h1>Test Dashboard Page</h1>
      <p>This page tests the dashboard layout routing.</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}
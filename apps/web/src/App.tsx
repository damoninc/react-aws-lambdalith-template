import { useEffect, useState } from 'react';
import type { HealthResponse } from '@starter/shared';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  return (
    <main>
      <h1>React + AWS Lambdalith</h1>
      <p>One repo. One frontend. One Lambda handling all API routes.</p>
      <pre>
        {error
          ? `API error: ${error}`
          : health
            ? JSON.stringify(health, null, 2)
            : 'Checking /api/health...'}
      </pre>
    </main>
  );
}

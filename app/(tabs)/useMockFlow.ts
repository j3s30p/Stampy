import { useEffect, useState } from 'react';
import { getMockFlow } from './mockFlow';

export type MockFlow = Awaited<ReturnType<typeof getMockFlow>>;

export function useMockFlow() {
  const [flow, setFlow] = useState<MockFlow | null>(null);

  useEffect(() => {
    let mounted = true;

    void getMockFlow().then((nextFlow) => {
      if (mounted) {
        setFlow(nextFlow);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return flow;
}

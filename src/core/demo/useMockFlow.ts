import { useCallback, useEffect, useState } from 'react';
import { collectMockCandidate, getMockFlow, subscribeMockFlow } from './mockFlow';

export type MockFlow = Awaited<ReturnType<typeof getMockFlow>>;

export function useMockFlow() {
  const [flow, setFlow] = useState<MockFlow | null>(null);

  const refresh = useCallback(async () => {
    setFlow(await getMockFlow());
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshIfMounted = () => {
      void getMockFlow().then((nextFlow) => {
        if (mounted) {
          setFlow(nextFlow);
        }
      });
    };

    refreshIfMounted();
    const unsubscribe = subscribeMockFlow(refresh);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refresh]);

  const collectCandidate = useCallback(async () => {
    setFlow(await collectMockCandidate());
  }, []);

  return { flow, collectCandidate };
}

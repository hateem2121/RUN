import { useEffect, useState } from "react";
import { webGLContextPool } from "../lib/webgl-context-pool";

export interface UseWebGLSlotResult {
  canRender3D: boolean;
}

/**
 * Hook to coordinate WebGL context allocation based on viewport intersection.
 * Ensures that simultaneous active 3D contexts never exceed device limits.
 */
export function useWebGLSlot(elementId: string, isIntersecting: boolean): UseWebGLSlotResult {
  const [canRender3D, setCanRender3D] = useState<boolean>(() =>
    isIntersecting ? webGLContextPool.claimSlot(elementId) : false,
  );

  useEffect(() => {
    // Listen for slot grant/revocation from the pool
    const unsubscribe = webGLContextPool.subscribe(elementId, (canRender) => {
      setCanRender3D(canRender);
    });

    if (isIntersecting) {
      const granted = webGLContextPool.claimSlot(elementId);
      setCanRender3D(granted);
    } else {
      webGLContextPool.releaseSlot(elementId);
      setCanRender3D(false);
    }

    return () => {
      unsubscribe();
      webGLContextPool.releaseSlot(elementId);
    };
  }, [elementId, isIntersecting]);

  return { canRender3D };
}

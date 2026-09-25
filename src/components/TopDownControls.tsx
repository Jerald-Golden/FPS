import { ReactNode, createContext, useContext, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface TopDownContextValue {
  enabled: boolean;
  isTopDown: boolean;
  target: React.MutableRefObject<THREE.Vector3>;
}

export const TopDownContext = createContext<TopDownContextValue>({
  enabled: false,
  isTopDown: false,
  target: { current: new THREE.Vector3(0, 0, 0) },
});

export const isTopDown = TopDownContext;
export const isTopDownContext = TopDownContext;
export const IsTopDownContext = TopDownContext;
export const TopDownTargetContext = TopDownContext;

export function useTopDown(): TopDownContextValue {
  return useContext(TopDownContext);
}

export function useIsTopDown(): boolean {
  return useContext(TopDownContext).enabled;
}

export function useTopDownTarget(): React.MutableRefObject<THREE.Vector3> {
  return useContext(TopDownContext).target;
}

interface TopDownControlsProps {
  children?: ReactNode;
  enabled?: boolean;
}

export function TopDownControls({ children, enabled = true }: TopDownControlsProps) {
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const contextValue = useMemo<TopDownContextValue>(
    () => ({
      enabled,
      isTopDown: enabled,
      target: targetPosRef,
    }),
    [enabled]
  );

  return (
    <TopDownContext.Provider value={contextValue}>
      {children}
    </TopDownContext.Provider>
  );
}

export default TopDownControls;

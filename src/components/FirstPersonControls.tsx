import { ReactNode, createContext, useContext, useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface FirstPersonContextValue {
  enabled: boolean;
  isFirstPerson: boolean;
  target: React.MutableRefObject<THREE.Vector3>;
}

export const FirstPersonContext = createContext<FirstPersonContextValue>({
  enabled: false,
  isFirstPerson: false,
  target: { current: new THREE.Vector3(0, 1.7, 0) },
});

export const isFirstPerson = FirstPersonContext;
export const isFirstPersonContext = FirstPersonContext;
export const IsFirstPersonContext = FirstPersonContext;
export const FirstPersonTargetContext = FirstPersonContext;

export function useFirstPerson(): FirstPersonContextValue {
  return useContext(FirstPersonContext);
}

export function useIsFirstPerson(): boolean {
  return useContext(FirstPersonContext).enabled;
}

export function useFirstPersonTarget(): React.MutableRefObject<THREE.Vector3> {
  return useContext(FirstPersonContext).target;
}

interface FirstPersonControlsProps {
  children?: ReactNode;
  enabled?: boolean;
}

export function FirstPersonControls({ children, enabled = true }: FirstPersonControlsProps) {
  const headPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.7, 0));

  const contextValue = useMemo<FirstPersonContextValue>(
    () => ({
      enabled,
      isFirstPerson: enabled,
      target: headPosRef,
    }),
    [enabled]
  );

  return (
    <FirstPersonContext.Provider value={contextValue}>
      {children}
    </FirstPersonContext.Provider>
  );
}

export default FirstPersonControls;

import { ReactNode, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface ThirdPersonContextValue {
  enabled: boolean;
  isThirdPerson: boolean;
  target: React.MutableRefObject<THREE.Vector3>;
}

export const ThirdPersonContext = createContext<ThirdPersonContextValue>({
  enabled: false,
  isThirdPerson: false,
  target: { current: new THREE.Vector3(0, 2.15, 0) },
});

export const isThirdPerson = ThirdPersonContext;
export const isThirdPersonContext = ThirdPersonContext;
export const IsThirdPersonContext = ThirdPersonContext;
export const ThirdPersonTargetContext = ThirdPersonContext;

export function useThirdPerson(): ThirdPersonContextValue {
  return useContext(ThirdPersonContext);
}

export function useIsThirdPerson(): boolean {
  return useContext(ThirdPersonContext).enabled;
}

export function useThirdPersonTarget(): React.MutableRefObject<THREE.Vector3> {
  return useContext(ThirdPersonContext).target;
}

interface ThirdPersonControlsProps {
  children?: ReactNode;
  enabled?: boolean;
  minDistance?: number;
  maxDistance?: number;
  initialDistance?: number;
  sensitivity?: number;
}

export function ThirdPersonControls({
  children,
  enabled = true,
  minDistance = 1.2,
  maxDistance = 16.0,
  initialDistance = 4.5,
  sensitivity = 0.0025,
}: ThirdPersonControlsProps) {
  const { camera, gl, scene } = useThree();

  // Head target position in world space
  const headPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.15, 0));
  const lookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.15, 0));

  // Single unified context value providing both enabled state and target ref
  const contextValue = useMemo<ThirdPersonContextValue>(
    () => ({
      enabled,
      isThirdPerson: enabled,
      target: headPosRef,
    }),
    [enabled]
  );

  // Track initialization
  const isInitializedRef = useRef<boolean>(false);

  // Spherical coordinates
  // radius: distance from head to camera
  const radiusRef = useRef<number>(initialDistance);
  const targetRadiusRef = useRef<number>(initialDistance);

  // phi: elevation / polar angle (from Y-up, clamped so camera doesn't clip below ground or flip)
  const phiRef = useRef<number>(Math.PI / 3); // ~60 degrees from zenith
  // theta: azimuth / horizontal rotation angle
  const thetaRef = useRef<number>(0);

  // Track pointer lock status & exit cooldown to avoid browser rate limit errors
  const isLockedRef = useRef<boolean>(false);
  const lastUnlockTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Temp vectors to prevent allocation inside useFrame
  const tempHeadVec = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;

    // Safely request pointer lock with cooldown check and promise catch
    const requestLockSafely = () => {
      if (document.pointerLockElement === dom) return;

      const now = Date.now();
      const timeSinceUnlock = now - lastUnlockTimeRef.current;
      // Browsers enforce ~1.25s cooldown after exiting pointer lock
      if (timeSinceUnlock < 1300) {
        return;
      }

      try {
        const result = dom.requestPointerLock?.();
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(() => {
            // Silently ignore browser cooldown / rejection errors
          });
        }
      } catch {
        // Silently catch any synchronous DOMException
      }
    };

    const handleClick = () => {
      requestLockSafely();
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      requestLockSafely();
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    // Track lock/unlock events and note timestamp when user exits lock
    const handlePointerLockChange = () => {
      const isNowLocked = document.pointerLockElement === dom;
      if (isLockedRef.current && !isNowLocked) {
        // Exited lock - begin browser cooldown period
        lastUnlockTimeRef.current = Date.now();
      }
      isLockedRef.current = isNowLocked;
    };

    // Prevent unhandled errors if browser rejects lock request
    const handlePointerLockError = () => {
      isLockedRef.current = false;
      lastUnlockTimeRef.current = Date.now();
    };

    // Mouse movement handler: active when pointer is locked or while mouse is dragged
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === dom || isLockedRef.current) {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;

        thetaRef.current -= movementX * sensitivity;
        phiRef.current = THREE.MathUtils.clamp(
          phiRef.current - movementY * sensitivity,
          0.08,
          Math.PI / 2 - 0.03
        );
      } else if (isDraggingRef.current) {
        const dx = e.clientX - lastPointerRef.current.x;
        const dy = e.clientY - lastPointerRef.current.y;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };

        thetaRef.current -= dx * (sensitivity * 1.5);
        phiRef.current = THREE.MathUtils.clamp(
          phiRef.current - dy * (sensitivity * 1.5),
          0.08,
          Math.PI / 2 - 0.03
        );
      }
    };

    // Zooming in/out adjusts the spherical radius
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // deltaY < 0 -> zoom in (make sphere smaller)
      // deltaY > 0 -> zoom out (make sphere bigger)
      const zoomSpeed = 0.0035;
      targetRadiusRef.current = THREE.MathUtils.clamp(
        targetRadiusRef.current + e.deltaY * zoomSpeed,
        minDistance,
        maxDistance
      );
    };

    dom.addEventListener('click', handleClick);
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    document.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      document.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('wheel', handleWheel);

      if (document.pointerLockElement === dom) {
        try {
          document.exitPointerLock?.();
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, gl.domElement, minDistance, maxDistance, sensitivity]);

  useFrame((_, delta) => {
    if (!enabled) return;

    // 1. Locate head position: check scene if not explicitly updated via context
    const headObj = scene.getObjectByName('character-head');
    if (headObj) {
      headObj.getWorldPosition(tempHeadVec.current);
      headPosRef.current.copy(tempHeadVec.current);
    }

    const head = headPosRef.current;

    // On initial run, smoothly pull camera from wherever it was in space to the sphere
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lookAtRef.current.copy(head);

      const offset = camera.position.clone().sub(head);
      const dist = offset.length();
      if (dist > 0.1) {
        const p = Math.acos(THREE.MathUtils.clamp(offset.y / dist, -1, 1));
        const t = Math.atan2(offset.x, offset.z);
        phiRef.current = THREE.MathUtils.clamp(p, 0.08, Math.PI / 2 - 0.03);
        thetaRef.current = t;
        // If camera starts further away, start radius from that distance and smoothly pull in
        if (dist > targetRadiusRef.current) {
          radiusRef.current = dist;
        }
      }
    }

    // 2. Smoothly animate spherical radius (handles zoom as well as initial transition from far away)
    radiusRef.current = THREE.MathUtils.lerp(
      radiusRef.current,
      targetRadiusRef.current,
      Math.min(1, delta * 8)
    );
    const radius = radiusRef.current;

    // 3. Smoothly follow head with lookAt target
    lookAtRef.current.lerp(head, Math.min(1, delta * 20));
    const smoothHead = lookAtRef.current;

    // 4. Calculate camera position strictly on the spherical shell around the head
    const phi = phiRef.current;
    const theta = thetaRef.current;

    const targetX = smoothHead.x + radius * Math.sin(phi) * Math.sin(theta);
    const targetY = smoothHead.y + radius * Math.cos(phi);
    const targetZ = smoothHead.z + radius * Math.sin(phi) * Math.cos(theta);

    // Set camera position directly on the sphere surface.
    // Distance from smoothHead is mathematically guaranteed to equal `radius`,
    // completely eliminating inward chord cutting when rotating fast.
    camera.position.set(targetX, targetY, targetZ);

    // 5. Keep the camera focused on the character's head
    camera.lookAt(smoothHead);
  });

  return (
    <ThirdPersonContext.Provider value={contextValue}>
      {children}
    </ThirdPersonContext.Provider>
  );
}

export default ThirdPersonControls;

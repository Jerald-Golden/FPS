import { ReactNode, useRef, useState, createContext, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';

export interface CharacterControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  isGrounded: boolean;
}

const defaultControlsState: CharacterControlsState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  isGrounded: true,
};

export const CharacterControlsContext = createContext<CharacterControlsState>(defaultControlsState);

export function useCharacterControlsContext() {
  const context = useContext(CharacterControlsContext);
  return context;
}

// Convenient alias hook
export const useCharacterState = useCharacterControlsContext;

interface CharacterControlsProps {
  children?: ReactNode;
  position?: [number, number, number];
}

const MOVE_SPEED = 5;
const JUMP_FORCE = 6.2;
const moveVector = new THREE.Vector3();
const rayDirection = { x: 0, y: -1, z: 0 };

export function CharacterControls({ children, position = [0, 1.5, 0] }: CharacterControlsProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { rapier, world } = useRapier();
  const [, get] = useKeyboardControls();
  const prevJumpRef = useRef(false);

  const [controlsState, setControlsState] = useState<CharacterControlsState>(defaultControlsState);
  const controlsRef = useRef<CharacterControlsState>(defaultControlsState);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    // Use get() from drei useKeyboardControls
    const { forward, backward, left, right, jump } = get();

    // Trigger jump only on press (not hold)
    const jumpPressed = Boolean(jump) && !prevJumpRef.current;
    prevJumpRef.current = Boolean(jump);

    moveVector.set(0, 0, 0);

    if (forward) moveVector.z -= 1;
    if (backward) moveVector.z += 1;
    if (left) moveVector.x -= 1;
    if (right) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize().multiplyScalar(MOVE_SPEED);
    }

    // Cast downward ray from character center to check if firmly on the ground
    // Center to bottom of capsule is 0.85 (0.55 halfHeight + 0.3 radius)
    let isGrounded = false;
    const origin = rigidBodyRef.current.translation();
    const ray = new rapier.Ray(origin, rayDirection);
    const hit = world.castRay(
      ray,
      0.90,
      true,
      undefined,
      undefined,
      undefined,
      rigidBodyRef.current
    );

    if (hit && hit.timeOfImpact <= 0.88) {
      isGrounded = true;
    }

    const currentVel = rigidBodyRef.current.linvel();
    let yVel = currentVel.y;

    // Jump only when grounded and jump key is freshly pressed
    if (jumpPressed && isGrounded) {
      yVel = JUMP_FORCE;
    }

    rigidBodyRef.current.setLinvel(
      {
        x: moveVector.x,
        y: yVel,
        z: moveVector.z,
      },
      true
    );

    // Update context state when any control or grounded state changes
    const f = Boolean(forward);
    const b = Boolean(backward);
    const l = Boolean(left);
    const r = Boolean(right);
    const j = Boolean(jump);

    if (
      controlsRef.current.forward !== f ||
      controlsRef.current.backward !== b ||
      controlsRef.current.left !== l ||
      controlsRef.current.right !== r ||
      controlsRef.current.jump !== j ||
      controlsRef.current.isGrounded !== isGrounded
    ) {
      const nextState: CharacterControlsState = {
        forward: f,
        backward: b,
        left: l,
        right: r,
        jump: j,
        isGrounded,
      };
      controlsRef.current = nextState;
      setControlsState(nextState);
    }
  });

  return (
    <CharacterControlsContext.Provider value={controlsState}>
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        mass={75}
        gravityScale={1.8}
        linearDamping={0.5}
        lockRotations
        colliders={false}
        friction={0.8}
        restitution={0.0}
      >
        <CapsuleCollider args={[0.55, 0.3]} />
        {children}
      </RigidBody>
    </CharacterControlsContext.Provider>
  );
}

export default CharacterControls;

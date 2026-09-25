import { ReactNode, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import * as THREE from 'three';

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
  });

  return (
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
  );
}

export default CharacterControls;

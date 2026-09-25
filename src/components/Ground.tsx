import { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

export function Ground() {
  const gridTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Base Grey Tone (Unreal Engine developer greybox standard)
    ctx.fillStyle = '#7a818c';
    ctx.fillRect(0, 0, size, size);

    // 2. Subtle 2x2 quadrant alternation (classic UE prototype checker shade)
    ctx.fillStyle = '#727984';
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

    // 3. Minor Sub-grid lines (10x10 subdivisions)
    const subdivisions = 10;
    const step = size / subdivisions;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5a616d';
    ctx.beginPath();
    for (let i = 1; i < subdivisions; i++) {
      const pos = i * step;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
    }
    ctx.stroke();

    // 4. Center division lines
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3e4450';
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // 5. Major Outer Border (bold grid boundaries)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#282c35';
    ctx.strokeRect(0, 0, size, size);

    // 6. Corner accents
    ctx.fillStyle = '#282c35';
    const cornerSize = 10;
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillRect(size - cornerSize, 0, cornerSize, cornerSize);
    ctx.fillRect(0, size - cornerSize, cornerSize, cornerSize);
    ctx.fillRect(size - cornerSize, size - cornerSize, cornerSize, cornerSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(250, 250);
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          map={gridTexture}
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 250 half-width x 1 half-height x 250 half-depth box positioned so the top aligns with y = 0 */}
      <CuboidCollider args={[250, 1, 250]} position={[0, -1, 0]} />
    </RigidBody>
  );
}

export default Ground;

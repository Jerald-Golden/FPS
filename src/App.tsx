import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls, KeyboardControlsEntry, Sky, OrbitControls } from '@react-three/drei';
import { Ground } from './components/Ground';
import { Character } from './components/Character';
import { CharacterControls } from './components/CharacterControls';
import { FirstPersonControls } from './components/FirstPersonControls';
import { ThirdPersonControls } from './components/ThirdPersonControls';
import { TopDownControls } from './components/TopDownControls';

enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
}

export default function App() {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Backquote' || e.key === '`') {
        setDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const keyboardMap = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [
      { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
      { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
      { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
      { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
      { name: Controls.jump, keys: ['Space'] },
    ],
    []
  );

  return (
    <div className="relative w-screen h-screen bg-slate-950 select-none overflow-hidden">
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows
          camera={{ position: [0, 3, 8], fov: 50, near: 0.1, far: 2000 }}
          gl={{ antialias: true }}
        >
          <Sky
            sunPosition={[100, 20, 100]}
            turbidity={8}
            rayleigh={2}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[20, 35, 20]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-15, 12, -15]} intensity={0.4} />

          <Suspense fallback={null}>
            <Physics debug={debug} gravity={[0, -9.81, 0]}>
              <Ground />
              <FirstPersonControls enabled={false}>
                <ThirdPersonControls enabled={true}>
                  <TopDownControls enabled={false}>
                    <CharacterControls helper={debug}>
                      <Character />
                    </CharacterControls>
                  </TopDownControls>
                </ThirdPersonControls>
              </FirstPersonControls>
            </Physics>
          </Suspense>

          <OrbitControls enabled={false} maxPolarAngle={Math.PI / 2 - 0.01} minDistance={1} maxDistance={600} />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

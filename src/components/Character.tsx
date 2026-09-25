export function Character() {
  return (
    <group>
      {/* Torso/body capsule aligned with collider base */}
      <mesh castShadow receiveShadow position={[0, -0.225, 0]}>
        <capsuleGeometry args={[0.3, 0.65, 16, 32]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Floating sphere representing the head */}
      <mesh name="character-head" castShadow receiveShadow position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.25} metalness={0.3} />
      </mesh>
    </group>
  );
}

export default Character;

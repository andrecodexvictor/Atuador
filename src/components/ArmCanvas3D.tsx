import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { robotState, notifyRobot, useRobotState } from '../lib/robotState';
import { serialService } from '../lib/serial';

// Constants
const C_ACCENT = '#3B82F6';
const C_JOINT = '#3F3F46';
const C_HOVER = '#60A5FA';
const C_ROBOT = '#1D4ED8';
const L0 = 0.42;
const L1 = 1.30;
const L2 = 1.00;
const L3 = 0.75;
const LG = 0.52;

function RobotHierarchy({ draggingId, setDraggingId }: { draggingId: number, setDraggingId: (id: number) => void }) {
  const state = useRobotState();
  const rotorRad = THREE.MathUtils.degToRad(state.rotorAngle);
  // Default joints[0] is 70. In 3D (Y up, X right), an angle of 70 deg from right (X axis) is 70 deg rotation on Z axis.
  const j1Rad = THREE.MathUtils.degToRad(state.joints[0]);
  const j2Rad = THREE.MathUtils.degToRad(state.joints[1] - 90);
  const j3Rad = THREE.MathUtils.degToRad(state.joints[2] - 90);

  const materials = {
    base: new THREE.MeshStandardMaterial({ color: '#27272A', metalness: 0.8, roughness: 0.2 }),
    arm: new THREE.MeshStandardMaterial({ color: C_ROBOT, metalness: 0.5, roughness: 0.3 }),
    joint: new THREE.MeshStandardMaterial({ color: C_JOINT, metalness: 0.9, roughness: 0.1 }),
    jointHover: new THREE.MeshStandardMaterial({ color: C_HOVER, metalness: 0.9, roughness: 0.1, emissive: C_HOVER, emissiveIntensity: 0.4 }),
    gripper: new THREE.MeshStandardMaterial({ color: '#71717A', metalness: 0.6, roughness: 0.4 }),
  };

  const handlePointerDown = (id: number) => (e: any) => {
    e.stopPropagation();
    if (state.connected) {
      setDraggingId(id);
      startDrag(id, e.clientX, e.clientY);
      if (e.target && e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
      }
    }
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Base */}
      <mesh material={materials.base} position={[0, L0/2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, L0, 32]} />
      </mesh>

      {/* Rotor Group */}
      <group position={[0, L0, 0]} rotation={[0, -rotorRad, 0]}>
        {/* J1 Hub / Rotor Base (Draggable ID 0) */}
        <mesh 
          material={draggingId === 0 ? materials.jointHover : materials.joint} 
          castShadow receiveShadow
          onPointerDown={handlePointerDown(0)}
        >
          <sphereGeometry args={[0.2, 32, 32]} />
        </mesh>

        {/* J1 Rotation */}
        <group rotation={[0, 0, j1Rad]}>
          {/* Arm 1 */}
          <mesh material={materials.arm} position={[L1/2, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.08, 0.1, L1, 16]} />
          </mesh>

          {/* J2 Hub (Draggable ID 1) */}
          <group position={[L1, 0, 0]}>
            <mesh 
              material={draggingId === 1 ? materials.jointHover : materials.joint} 
              castShadow receiveShadow
              onPointerDown={handlePointerDown(1)}
            >
              <sphereGeometry args={[0.16, 32, 32]} />
            </mesh>

            {/* J2 Rotation */}
            <group rotation={[0, 0, j2Rad]}>
              {/* Arm 2 */}
              <mesh material={materials.arm} position={[L2/2, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
                <cylinderGeometry args={[0.07, 0.08, L2, 16]} />
              </mesh>

              {/* J3 Hub (Draggable ID 2) */}
              <group position={[L2, 0, 0]}>
                <mesh 
                  material={draggingId === 2 ? materials.jointHover : materials.joint} 
                  castShadow receiveShadow
                  onPointerDown={handlePointerDown(2)}
                >
                  <sphereGeometry args={[0.13, 32, 32]} />
                </mesh>

                {/* J3 Rotation */}
                <group rotation={[0, 0, j3Rad]}>
                  {/* Arm 3 */}
                  <mesh material={materials.arm} position={[L3/2, 0, 0]} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.05, 0.06, L3, 16]} />
                  </mesh>

                  {/* Gripper Base (Draggable ID 3 for joints array, wait, there are only 3 joints but gripper can be double clicked) */}
                  <group position={[L3, 0, 0]}>
                    <mesh 
                      material={draggingId === 3 ? materials.jointHover : materials.joint} 
                      castShadow receiveShadow
                      onPointerDown={handlePointerDown(3)}
                    >
                      <boxGeometry args={[0.1, 0.2, 0.2]} />
                    </mesh>

                    {/* Gripper Fingers */}
                    <group position={[LG/2 + 0.05, 0, 0]}>
                      {/* Top Finger or Left Finger */}
                      <mesh material={materials.gripper} position={[0, state.gripperOpen ? 0.12 : 0.03, 0]} castShadow receiveShadow>
                        <boxGeometry args={[LG, 0.04, 0.06]} />
                      </mesh>
                      {/* Bottom Finger or Right Finger */}
                      <mesh material={materials.gripper} position={[0, state.gripperOpen ? -0.12 : -0.03, 0]} castShadow receiveShadow>
                        <boxGeometry args={[LG, 0.04, 0.06]} />
                      </mesh>
                    </group>

                    {/* Invisible Hitbox for Gripper Double Click */}
                    <mesh 
                      visible={false} 
                      position={[LG/2, 0, 0]} 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (state.connected) {
                          robotState.gripperOpen = !robotState.gripperOpen;
                          serialService.usb(`GRIPPER state=${robotState.gripperOpen ? "OPEN" : "CLOSE"}`);
                          notifyRobot();
                        }
                      }}
                    >
                      <boxGeometry args={[LG + 0.2, 0.4, 0.4]} />
                    </mesh>

                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Scene() {
  const [draggingId, setDraggingId] = useState<number>(-1);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handlePointerUp = () => {
      setDraggingId(-1);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const handlePointerMove = (e: any) => {
    if (draggingId === -1) return;
    
    // Simulate drag via simple screen delta for now.
    // Three.js pointer events don't easily give purely screen deltas unless tracked manually,
    // so we handle it more globally in the container. 
    // Wait, let's track dragging in the DOM overlay to keep it robust and familiar.
  };

  return (
    <>
      <color attach="background" args={['#111114']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <Environment preset="city" />
      
      <Grid 
        renderOrder={-1} 
        position={[0, 0, 0]} 
        infiniteGrid 
        fadeDistance={20} 
        fadeStrength={5}
        cellSize={1} 
        sectionSize={5} 
        sectionColor="#27272A" 
        cellColor="#1A1A1E" 
      />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={10} blur={2} far={4} />

      <RobotHierarchy draggingId={draggingId} setDraggingId={setDraggingId} />
      
      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        enabled={draggingId === -1}
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 + 0.1}
        maxDistance={15}
        minDistance={2}
      />
    </>
  );
}

export function ArmCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ id: -1, lastX: 0, lastY: 0 });
  const [isDisconnected, setIsDisconnected] = useState(!robotState.connected);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDisconnected(!robotState.connected);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.id === -1) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    if (dragRef.current.id === 0) { // Rotor
      robotState.rotorAngle = robotState.clampRotor(robotState.rotorAngle + dx * 0.5);
      serialService.usb(`ROTOR angle=${robotState.rotorAngle.toFixed(1)}`);
      notifyRobot();
    } else if (dragRef.current.id >= 1 && dragRef.current.id <= 3) { // Joints
      const i = dragRef.current.id - 1;
      robotState.joints[i] = robotState.clampJoint(robotState.joints[i] - dy * 0.4);
      serialService.usb(`JOINT${i + 1} angle=${robotState.joints[i].toFixed(1)}`);
      notifyRobot();
    }
  };

  const TelemetryHUD = () => {
    const state = useRobotState();
    return (
      <>
        {/* 3D UI Overlay */}
        <div className="absolute top-5 left-5 flex flex-col gap-2.5 pointer-events-none select-none">
          <div className="bg-[#141417]/80 backdrop-blur-md border border-[#3F3F46]/50 p-3 rounded-lg w-[160px]">
            <div className="text-[11px] font-semibold text-[#71717A] mb-2 uppercase tracking-[0.05em]">
              Joint Angles
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-[#A1A1AA]">Base (Rotor)</span>
              <span className="text-[#F4F4F5] font-mono text-[11px]">{state.rotorAngle.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-[#A1A1AA]">Shoulder</span>
              <span className="text-[#F4F4F5] font-mono text-[11px]">{state.joints[0].toFixed(1)}°</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-[#A1A1AA]">Elbow</span>
              <span className="text-[#F4F4F5] font-mono text-[11px]">{state.joints[1].toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-[#A1A1AA]">Wrist</span>
              <span className="text-[#F4F4F5] font-mono text-[11px]">{state.joints[2].toFixed(1)}°</span>
            </div>
          </div>

          <div className="bg-[#141417]/80 backdrop-blur-md border border-[#3F3F46]/50 p-3 rounded-lg w-[160px]">
            <div className="text-[11px] font-semibold text-[#71717A] mb-2 uppercase tracking-[0.05em]">
              End Effector
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-[#A1A1AA]">Gripper</span>
              <span className={`font-mono text-[11px] ${state.gripperOpen ? 'text-[#10B981]' : 'text-[#FACC15]'}`}>
                {state.gripperOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-[#A1A1AA]">Connection</span>
              <span className={`font-mono text-[11px] ${serialService.mockMode ? 'text-[#FACC15]' : 'text-[#3B82F6]'}`}>
                {serialService.mockMode ? 'SIMULATED' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 right-5 text-[#3B82F6] font-mono text-xs pointer-events-none">
          LIVE FEED // CAM_01_REAR
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[#71717A] text-[11px] font-sans pointer-events-none text-center">
          Drag nodes to move | Double click GRIPPER to toggle<br/>Click and drag background to rotate camera
        </div>

        {!state.connected && (
          <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <span className="text-[#FACC15] font-bold text-xl mb-4 font-mono">⚠ Aguardando Conexão USB...</span>
            <span className="text-[#A1A1AA] text-sm">Conecte fisicamente ou use 'Simular USB' no painel</span>
          </div>
        )}

        {state.recording && (
          <div className="absolute inset-0 border-4 border-[#EF4444] pointer-events-none z-20"></div>
        )}
      </>
    );
  };

  return (
    <div 
      className="relative w-full flex-1 rounded-xl overflow-hidden shadow-lg flex flex-col"
      ref={containerRef}
      onPointerMove={handleGlobalPointerMove}
    >
      <Canvas 
        shadows 
        camera={{ position: [2.5, 2.5, 3.5], fov: 45 }}
      >
        <Scene />
      </Canvas>
      
      <DragHandler dragRef={dragRef} />
      <TelemetryHUD />
    </div>
  );
}

// A helper to let the DOM overlay know when dragging starts/stops from R3F
function DragHandler({ dragRef }: { dragRef: React.MutableRefObject<any> }) {
  useEffect(() => {
    const onStart = (e: CustomEvent) => {
      dragRef.current.id = e.detail.id;
      // Mouse coordinates are captured for delta
      dragRef.current.lastX = e.detail.x;
      dragRef.current.lastY = e.detail.y;
    };
    const onStop = () => {
      dragRef.current.id = -1;
    };
    window.addEventListener('robot-drag-start', onStart as EventListener);
    window.addEventListener('pointerup', onStop);
    return () => {
      window.removeEventListener('robot-drag-start', onStart as EventListener);
      window.removeEventListener('pointerup', onStop);
    };
  }, [dragRef]);
  return null;
}

// Add custom event dispatched from Scene pointer down
export const startDrag = (id: number, x: number, y: number) => {
  window.dispatchEvent(new CustomEvent('robot-drag-start', { detail: { id, x, y } }));
};

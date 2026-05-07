import { useState, useEffect } from 'react';

export class RobotState {
  rotorAngle = 0;
  joints: [number, number, number] = [70, 50, 40];
  gripperOpen = true;
  connected = false;
  recording = false;

  static readonly ROTOR_MIN = -180;
  static readonly ROTOR_MAX = 180;
  static readonly JOINT_MIN = 0;
  static readonly JOINT_MAX = 160;

  static readonly L0 = 42;
  static readonly L1 = 130;
  static readonly L2 = 100;
  static readonly L3 = 75;
  static readonly LG = 52;

  clampRotor(a: number) { return Math.max(RobotState.ROTOR_MIN, Math.min(RobotState.ROTOR_MAX, a)); }
  clampJoint(a: number) { return Math.max(RobotState.JOINT_MIN, Math.min(RobotState.JOINT_MAX, a)); }
  rotorValid(a: number) { return a >= RobotState.ROTOR_MIN && a <= RobotState.ROTOR_MAX; }
  jointValid(a: number) { return a >= RobotState.JOINT_MIN && a <= RobotState.JOINT_MAX; }
}

export const robotState = new RobotState();

type Listener = () => void;
const listeners = new Set<Listener>();

export function useRobotState() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return robotState;
}

export function notifyRobot() {
  listeners.forEach(l => l());
}

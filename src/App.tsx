/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TopBar } from './components/TopBar';
import { SidePanel } from './components/SidePanel';
import { ArmCanvas3D } from './components/ArmCanvas3D';

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col bg-[#0A0A0B] text-[#D4D4D8] overflow-hidden">
      <TopBar />
      <main className="flex-1 grid grid-cols-[1fr_300px] gap-[20px] p-[20px] overflow-hidden">
        <div className="bg-[#111114] border border-[#27272A] rounded-xl overflow-hidden relative flex flex-col shadow-lg">
           <ArmCanvas3D />
        </div>
        <SidePanel />
      </main>
    </div>
  );
}

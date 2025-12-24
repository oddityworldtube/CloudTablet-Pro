
import React, { useState, useEffect } from 'react';
import DesktopView from './components/DesktopView';
import MobileController from './components/MobileController';
import { DeviceRole } from './types';

const App: React.FC = () => {
  const [role, setRole] = useState<DeviceRole | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (joinId) {
      setRole('mobile');
      setPeerId(joinId);
    } else if (isMobile) {
      setRole('mobile');
    }
  }, []);

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="space-y-2">
            <div className="inline-block p-3 bg-blue-500/10 rounded-2xl mb-4">
               <i className="fas fa-layer-group text-4xl text-blue-500"></i>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              CloudTablet Pro
            </h1>
            <p className="text-slate-400 text-lg">Next-Gen Wireless Drawing Interface</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <button
              onClick={() => setRole('desktop')}
              className="group p-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-3xl transition-all duration-300 flex items-center gap-6 text-left shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-desktop text-2xl text-blue-400"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Start Host (PC)</h3>
                <p className="text-sm text-slate-500">Create a workspace to receive input.</p>
              </div>
            </button>

            <button
              onClick={() => setRole('mobile')}
              className="group p-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition-all duration-300 flex items-center gap-6 text-left shadow-xl"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="fas fa-mobile-alt text-2xl text-emerald-400"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold">Connect Tablet</h3>
                <p className="text-sm text-slate-500">Use this device as the controller.</p>
              </div>
            </button>
          </div>
          
          <div className="pt-12 border-t border-slate-900 flex justify-between items-center opacity-50">
            <span className="text-xs uppercase tracking-widest font-bold">Enterprise Grade</span>
            <div className="flex gap-4">
               <i className="fab fa-apple"></i>
               <i className="fab fa-windows"></i>
               <i className="fab fa-android"></i>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return role === 'desktop' ? <DesktopView /> : <MobileController initialPeerId={peerId} />;
};

export default App;

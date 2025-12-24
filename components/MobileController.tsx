
import React, { useRef, useState, useEffect } from 'react';
import { SyncMessage, RemoteCommand } from '../types';

declare var Peer: any;

interface MobileControllerProps {
  initialPeerId?: string | null;
}

const MobileController: React.FC<MobileControllerProps> = ({ initialPeerId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackpadRef = useRef<HTMLDivElement>(null);
  const [peer, setPeer] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [targetId, setTargetId] = useState(initialPeerId || "");
  const [isConnected, setIsConnected] = useState(false);
  const [hasStream, setHasStream] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on('open', () => {
      setPeer(newPeer);
      if (initialPeerId) connectTo(initialPeerId, newPeer);
    });
    newPeer.on('call', (call: any) => {
      call.answer();
      call.on('stream', (stream: MediaStream) => {
        if (videoRef.current) { videoRef.current.srcObject = stream; setHasStream(true); }
      });
    });
    return () => newPeer.destroy();
  }, []);

  const connectTo = (id: string, p: any = peer) => {
    const connection = p.connect(id);
    connection.on('open', () => { setConn(connection); setIsConnected(true); });
    connection.on('close', () => setIsConnected(false));
  };

  const sendCommand = (type: RemoteCommand['type'], payload: any = {}) => {
    if (conn) conn.send({ type: 'COMMAND', payload: { type, payload } });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isConnected || e.buttons !== 1) return;
    
    // Calculate Delta (Relative movement)
    const dx = (e.clientX - lastPos.x);
    const dy = (e.clientY - lastPos.y);
    
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      sendCommand('MOUSE_MOVE_RELATIVE', { dx, dy });
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-10">
        <div className="w-full max-w-sm space-y-8">
           <div className="text-center">
             <h2 className="text-3xl font-black text-white italic">REMOTE PAD</h2>
             <p className="text-slate-500 text-sm">Link with Host ID to control OS</p>
           </div>
           <input type="text" placeholder="SERVER ID" className="w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center text-2xl font-mono text-blue-400 uppercase" value={targetId} onChange={(e) => setTargetId(e.target.value.toUpperCase())} />
           <button onClick={() => connectTo(targetId)} className="w-full bg-blue-600 py-6 rounded-3xl font-black uppercase text-white shadow-2xl">Connect Device</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans select-none overflow-hidden touch-none">
      {/* Stream Display */}
      <div className="h-[35vh] relative bg-slate-950 border-b border-slate-800">
         <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${hasStream ? 'opacity-100' : 'opacity-10'}`} />
         {!hasStream && (
           <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-slate-700 font-black tracking-[0.3em] uppercase italic">Visualizing Remote...</span>
           </div>
         )}
      </div>

      {/* Trackpad Area */}
      <div 
        ref={trackpadRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="flex-1 bg-slate-900/50 m-4 rounded-[3rem] border-2 border-slate-800/50 flex flex-col items-center justify-center active:border-blue-500/30 transition-colors"
      >
         <div className="text-slate-800 font-black uppercase tracking-[1em] text-[10px] mb-8 pointer-events-none">Trackpad Surface</div>
         
         {/* Mouse Buttons Bar */}
         <div className="absolute bottom-10 left-10 right-10 h-24 flex gap-4">
            <button 
              onPointerDown={(e) => { e.stopPropagation(); sendCommand('MOUSE_CLICK'); }} 
              className="flex-1 bg-slate-800 rounded-3xl active:bg-blue-600 flex flex-col items-center justify-center gap-2"
            >
               <i className="fas fa-mouse-pointer text-slate-500"></i>
               <span className="text-[8px] font-black uppercase text-slate-400">Left Click</span>
            </button>
            <button 
              onPointerDown={(e) => { e.stopPropagation(); sendCommand('MOUSE_RCLICK'); }} 
              className="flex-1 bg-slate-800 rounded-3xl active:bg-purple-600 flex flex-col items-center justify-center gap-2"
            >
               <i className="fas fa-ellipsis-v text-slate-500"></i>
               <span className="text-[8px] font-black uppercase text-slate-400">Right Click</span>
            </button>
         </div>
      </div>

      {/* Keyboard Trigger */}
      <div className="p-4 pt-0 h-20">
         <button onClick={() => { const t = prompt("Input:"); if(t) sendCommand('KEY_PRESS', t); }} className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center gap-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">
            <i className="fas fa-keyboard text-blue-500"></i>
            Open System Keyboard
         </button>
      </div>
    </div>
  );
};

export default MobileController;

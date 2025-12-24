
import React, { useRef, useState, useEffect } from 'react';
import { SyncMessage, RemoteCommand, StrokePoint } from '../types';

declare var Peer: any;

interface MobileControllerProps {
  initialPeerId?: string | null;
}

const MobileController: React.FC<MobileControllerProps> = ({ initialPeerId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [peer, setPeer] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [targetId, setTargetId] = useState(initialPeerId || "");
  
  // Settings
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState<'mouse' | 'draw'>('mouse');
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on('open', () => {
      setPeer(newPeer);
      if (initialPeerId) connectTo(initialPeerId, newPeer);
    });
    newPeer.on('call', (call: any) => {
      call.answer();
      call.on('stream', (stream: MediaStream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    });
    return () => newPeer.destroy();
  }, []);

  const connectTo = (id: string, p: any = peer) => {
    const connection = p.connect(id);
    connection.on('open', () => { setConn(connection); setIsConnected(true); });
  };

  const handlePointer = (e: React.PointerEvent) => {
    if (!conn || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Direct Mapping to Mouse
    conn.send({ 
      type: 'COMMAND', 
      payload: { type: 'MOUSE_MOVE_ABS', payload: { x, y } } 
    });

    if (mode === 'draw' && (e.buttons === 1 || e.pointerType === 'pen')) {
      const stroke: StrokePoint = { x, y, pressure: e.pressure || 0.5, color, size: brushSize, isDrawing: e.type !== 'pointerdown' };
      conn.send({ type: 'STROKE', payload: stroke });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double Tap -> Right Click
      conn?.send({ type: 'COMMAND', payload: { type: 'MOUSE_RCLICK' } });
    } else {
      // Single Tap -> Left Click
      conn?.send({ type: 'COMMAND', payload: { type: 'MOUSE_CLICK' } });
    }
    setLastTap(now);
  };

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 space-y-6">
        <h1 className="text-4xl font-black text-white italic tracking-tighter">PAIR DEVICE</h1>
        <input 
          type="text" 
          placeholder="ENTER HOST ID" 
          className="w-full max-w-xs bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center text-blue-400 font-mono"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value.toUpperCase())}
        />
        <button onClick={() => connectTo(targetId)} className="w-full max-w-xs bg-blue-600 py-6 rounded-3xl font-black text-white uppercase tracking-widest shadow-2xl">Start Session</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden touch-none select-none">
      {/* Main Slate Area */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        onTouchStart={handleTouchStart}
        className="relative flex-1 bg-slate-900 cursor-crosshair"
      >
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />
        
        {/* Mode Indicator */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-widest">
          Mode: {mode}
        </div>
      </div>

      {/* Floating Pro Toolbar */}
      <div className="absolute bottom-10 left-6 right-6 h-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center px-4 gap-4 shadow-2xl">
        <button 
          onClick={() => setMode(mode === 'mouse' ? 'draw' : 'mouse')}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
        >
          <i className={`fas ${mode === 'draw' ? 'fa-pen-nib' : 'fa-mouse-pointer'}`}></i>
        </button>

        <div className="h-8 w-px bg-white/10 mx-2"></div>

        {/* Colors */}
        <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar">
           {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
             <button 
                key={c}
                onClick={() => { setColor(c); setMode('draw'); }}
                className={`min-w-[40px] h-10 rounded-xl border-2 transition-transform active:scale-90 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
             />
           ))}
        </div>

        <div className="h-8 w-px bg-white/10 mx-2"></div>

        {/* Actions */}
        <button onClick={() => conn?.send({ type: 'CLEAR' })} className="w-12 h-12 bg-slate-800 rounded-2xl text-slate-400 hover:text-white">
          <i className="fas fa-trash-alt"></i>
        </button>
        <button onClick={() => { const t = prompt("Text:"); if(t) conn?.send({ type: 'COMMAND', payload: { type: 'KEY_PRESS', payload: t } }); }} className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl">
          <i className="fas fa-keyboard"></i>
        </button>
      </div>

      {/* Brush Size Slider (Vertical) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-12 bg-slate-900/80 backdrop-blur-lg rounded-full border border-white/10 p-2 flex flex-col items-center gap-4 py-6">
         <span className="text-[8px] font-black text-slate-500 uppercase">Size</span>
         <input 
           type="range" 
           min="1" max="50" 
           value={brushSize} 
           onChange={(e) => setBrushSize(parseInt(e.target.value))}
           className="h-40 accent-blue-500" 
           style={{ appearance: 'slider-vertical' } as any}
         />
         <span className="text-[10px] font-mono text-white">{brushSize}</span>
      </div>
    </div>
  );
};

export default MobileController;

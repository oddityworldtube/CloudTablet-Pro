
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

    // استقبال مكالمة الفيديو (بث الشاشة) من الكمبيوتر
    newPeer.on('call', (call: any) => {
      console.log("Receiving screen stream...");
      call.answer(); // الرد على المكالمة بدون كاميرا موبايل
      call.on('stream', (stream: MediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play error:", e));
        }
      });
    });

    return () => newPeer.destroy();
  }, []);

  const connectTo = (id: string, p: any = peer) => {
    const connection = p.connect(id);
    connection.on('open', () => { 
      setConn(connection); 
      setIsConnected(true); 
    });
  };

  const handlePointer = (e: React.PointerEvent) => {
    if (!conn || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // إرسال إحداثيات الماوس المباشرة (Absolute Mapping)
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
    // إيماءة الضغط المزدوج للكليك يمين
    if (now - lastTap < 300) {
      conn?.send({ type: 'COMMAND', payload: { type: 'MOUSE_RCLICK' } });
    } else {
      // ضغطة عادية للكليك شمال
      conn?.send({ type: 'COMMAND', payload: { type: 'MOUSE_CLICK' } });
    }
    setLastTap(now);
  };

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center animate-bounce">
          <i className="fas fa-link text-3xl text-blue-500"></i>
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter text-center">CONNECT TO PC</h1>
        <input 
          type="text" 
          placeholder="ENTER HOST ID" 
          className="w-full max-w-xs bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center text-blue-400 font-mono text-xl"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value.toUpperCase())}
        />
        <button onClick={() => connectTo(targetId)} className="w-full max-w-xs bg-blue-600 py-6 rounded-3xl font-black text-white uppercase tracking-widest shadow-2xl active:scale-95 transition-transform">Pair Now</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden touch-none select-none">
      {/* منطقة التفاعل والبث */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        onTouchStart={handleTouchStart}
        className="relative flex-1 bg-slate-900 overflow-hidden"
      >
        {/* شاشة الكمبيوتر تظهر هنا */}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" 
        />
        
        {/* وضع الرسم فوق الشاشة */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white font-black uppercase tracking-widest z-10">
          <i className={`fas ${mode === 'draw' ? 'fa-pen-nib text-blue-400' : 'fa-mouse-pointer'} mr-2`}></i>
          {mode === 'draw' ? 'DRAWING ACTIVE' : 'MOUSE CONTROL'}
        </div>
      </div>

      {/* شريط الأدوات الاحترافي */}
      <div className="absolute bottom-8 left-4 right-4 h-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center px-4 gap-3 shadow-2xl z-20">
        <button 
          onClick={() => setMode(mode === 'mouse' ? 'draw' : 'mouse')}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${mode === 'draw' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'bg-slate-800 text-slate-500'}`}
        >
          <i className={`fas ${mode === 'draw' ? 'fa-pen-nib' : 'fa-mouse-pointer'}`}></i>
        </button>

        <div className="h-8 w-px bg-white/10 mx-1"></div>

        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2">
           {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
             <button 
                key={c}
                onClick={() => { setColor(c); setMode('draw'); }}
                className={`min-w-[36px] h-9 rounded-xl border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                style={{ backgroundColor: c }}
             />
           ))}
        </div>

        <div className="h-8 w-px bg-white/10 mx-1"></div>

        <button onClick={() => conn?.send({ type: 'CLEAR' })} className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl active:bg-red-500 active:text-white transition-colors">
          <i className="fas fa-eraser"></i>
        </button>
        
        <button onClick={() => { const t = prompt("Quick Type:"); if(t) conn?.send({ type: 'COMMAND', payload: { type: 'KEY_PRESS', payload: t } }); }} className="w-12 h-12 bg-slate-800 text-slate-300 rounded-xl">
          <i className="fas fa-keyboard"></i>
        </button>
      </div>

      {/* التحكم في حجم القلم */}
      <div className="absolute right-4 top-1/4 h-1/2 w-10 bg-slate-900/60 backdrop-blur-md rounded-full border border-white/10 p-2 flex flex-col items-center justify-between py-6 z-20">
         <i className="fas fa-plus text-[8px] text-slate-500"></i>
         <input 
           type="range" 
           min="1" max="50" 
           value={brushSize} 
           onChange={(e) => setBrushSize(parseInt(e.target.value))}
           className="h-32 accent-blue-500" 
           style={{ appearance: 'slider-vertical' } as any}
         />
         <i className="fas fa-minus text-[8px] text-slate-500"></i>
      </div>
    </div>
  );
};

export default MobileController;

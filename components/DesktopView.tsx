
import React, { useRef, useEffect, useState } from 'react';
import { SyncMessage, StrokePoint } from '../types';

declare var Peer: any;
declare var QRCode: any;

const DesktopView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>("");
  const [mobileConn, setMobileConn] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<'disconnected' | 'connected'>('disconnected');

  // إعداد الرسم
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const connectToLocalBridge = () => {
    const socket = new WebSocket('ws://localhost:8080');
    socket.onopen = () => setBridgeStatus('connected');
    socket.onclose = () => {
      setBridgeStatus('disconnected');
      setTimeout(connectToLocalBridge, 3000);
    };
    setWs(socket);
  };

  useEffect(() => {
    connectToLocalBridge();
    const newPeer = new Peer();
    newPeer.on('open', (id: string) => {
      setMyId(id);
      generateQRCode(id);
    });

    newPeer.on('connection', (connection: any) => {
      setMobileConn(connection);
      connection.on('data', (data: SyncMessage) => {
        handleIncomingData(data);
      });
    });

    return () => {
      newPeer.destroy();
      ws?.close();
    };
  }, [ws?.readyState]);

  const handleIncomingData = (msg: SyncMessage) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (msg.type === 'COMMAND') {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg.payload));
      }
    } else if (msg.type === 'STROKE' && ctx && canvas) {
      const point = msg.payload as StrokePoint;
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      if (!point.isDrawing) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.size;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (msg.type === 'CLEAR') {
      ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
    }
  };

  const generateQRCode = (id: string) => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      new QRCode(qrRef.current, {
        text: `${window.location.origin}${window.location.pathname}?join=${id}`,
        width: 150, height: 150, colorDark: "#ffffff", colorLight: "#0f172a"
      });
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: 60 } as any
      });
      if (mobileConn) peer.call(mobileConn.peer, stream);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* Drawing Overlay */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* Admin Panel (Semi-transparent) */}
      <div className="absolute top-6 left-6 z-20 flex gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex items-center gap-6">
           <div ref={qrRef} className="bg-white p-2 rounded-xl"></div>
           <div className="space-y-1">
              <h1 className="text-white font-black italic tracking-tighter">CLOUD TABLET <span className="text-blue-500">PRO</span></h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bridgeStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{bridgeStatus === 'connected' ? 'OS Link Active' : 'Bridge Offline'}</span>
              </div>
              <button onClick={startScreenShare} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg transition-all">MIRROR SCREEN</button>
           </div>
        </div>
      </div>
      
      {/* Background Guide */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
         <i className="fas fa- lawsuit-alt text-[20vw] text-white"></i>
      </div>
    </div>
  );
};

export default DesktopView;

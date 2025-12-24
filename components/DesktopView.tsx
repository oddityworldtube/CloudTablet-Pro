
import React, { useRef, useEffect, useState } from 'react';
import { SyncMessage, RemoteCommand } from '../types';

declare var Peer: any;
declare var QRCode: any;

const DesktopView: React.FC = () => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>("");
  const [mobileConn, setMobileConn] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastCommand, setLastCommand] = useState<string>("Ready for connection...");

  // 1. إعداد الـ WebSocket للربط مع الجسر المحلي (Node.js)
  const connectToLocalBridge = () => {
    setBridgeStatus('connecting');
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      setBridgeStatus('connected');
      setLastCommand("SYSTEM BRIDGE ACTIVE: Control is LIVE");
    };

    socket.onclose = () => {
      setBridgeStatus('disconnected');
      setTimeout(connectToLocalBridge, 3000); // إعادة محاولة الاتصال تلقائياً
    };

    socket.onerror = () => setBridgeStatus('disconnected');
    setWs(socket);
  };

  useEffect(() => {
    // الاتصال بالجسر فور فتح الصفحة
    connectToLocalBridge();

    const newPeer = new Peer();
    newPeer.on('open', (id: string) => {
      setMyId(id);
      setPeer(newPeer);
      generateQRCode(id);
    });

    newPeer.on('connection', (connection: any) => {
      setMobileConn(connection);
      setLastCommand("Mobile Device Paired!");
      connection.on('data', (data: SyncMessage) => {
        if (data.type === 'COMMAND') {
          setLastCommand(`Executing: ${data.payload.type}`);
          // إرسال الأمر فوراً للجسر عبر WebSocket
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data.payload));
          }
        }
      });
    });

    return () => {
      newPeer.destroy();
      ws?.close();
    };
  }, [ws?.readyState]);

  const generateQRCode = (id: string) => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      new QRCode(qrRef.current, {
        text: `${window.location.origin}${window.location.pathname}?join=${id}`,
        width: 180, height: 180, colorDark: "#ffffff", colorLight: "#0f172a"
      });
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: 60 } as any
      });
      if (mobileConn && peer) {
        peer.call(mobileConn.peer, stream);
        setIsStreaming(true);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 h-full max-h-[850px]">
        
        {/* Mobile Connection */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">1. Device Pairing</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Scan with your mobile</p>
          </div>
          
          <div className="bg-white p-4 rounded-3xl shadow-[0_0_60px_rgba(59,130,246,0.15)]" ref={qrRef}></div>
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 w-full">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Peer ID</p>
            <p className="text-blue-400 font-mono font-bold">{myId || "---"}</p>
          </div>

          <button onClick={startScreenShare} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
            {isStreaming ? 'STREAMING ACTIVE' : 'START FULL BROADCAST'}
          </button>
        </div>

        {/* Windows OS Bridge Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col space-y-8">
           <div className="space-y-1 text-center">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">2. OS Status</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Windows System Link</p>
           </div>

           <div className={`flex-1 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center justify-center p-8 text-center space-y-6 ${bridgeStatus === 'connected' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950 border-slate-800 animate-pulse'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${bridgeStatus === 'connected' ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-600'}`}>
                <i className={`fas ${bridgeStatus === 'connected' ? 'fa-check' : 'fa-link'}`}></i>
              </div>
              
              <div className="space-y-2">
                <h3 className={`text-xl font-black uppercase italic ${bridgeStatus === 'connected' ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {bridgeStatus === 'connected' ? 'BRIDGE ACTIVE' : 'WAITING FOR NODE.JS'}
                </h3>
                <p className="text-slate-500 font-mono text-[10px] max-w-[200px] leading-relaxed">
                  {lastCommand}
                </p>
              </div>

              {bridgeStatus !== 'connected' && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                   <p className="text-[9px] text-orange-400 font-bold uppercase leading-relaxed">
                     <i className="fas fa-exclamation-triangle mr-2"></i>
                     Ensure bridge.js is running in terminal
                   </p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Latency</p>
                <p className="text-emerald-500 font-mono text-xs">~2ms (Local)</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-[8px] text-slate-600 font-black uppercase mb-1">Protocol</p>
                <p className="text-blue-400 font-mono text-xs">WebSockets</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopView;

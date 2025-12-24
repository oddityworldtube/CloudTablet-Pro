
import React, { useRef, useEffect, useState } from 'react';
import { SyncMessage, RemoteCommand } from '../types';

declare var Peer: any;
declare var QRCode: any;

const DesktopView: React.FC = () => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>("");
  const [mobileConn, setMobileConn] = useState<any>(null);
  const [bridgeConn, setBridgeConn] = useState<any>(null);
  const [bridgeId, setBridgeId] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("Waiting for connections...");

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on('open', (id: string) => {
      setMyId(id);
      setPeer(newPeer);
      generateQRCode(id);
    });

    newPeer.on('connection', (connection: any) => {
      // التحقق مما إذا كان المتصل هو الموبايل
      setMobileConn(connection);
      setLastCommand("Mobile Connected!");
      connection.on('data', (data: SyncMessage) => handleIncomingData(data));
    });

    return () => newPeer.destroy();
  }, []);

  const connectToBridge = () => {
    if (!peer || !bridgeId) return;
    const conn = peer.connect(bridgeId);
    conn.on('open', () => {
      setBridgeConn(conn);
      setLastCommand("Link established with Windows OS Bridge!");
    });
    conn.on('error', (err: any) => {
      setLastCommand("Bridge Connection Failed. Check ID.");
    });
  };

  const generateQRCode = (id: string) => {
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      new QRCode(qrRef.current, {
        text: `${window.location.origin}${window.location.pathname}?join=${id}`,
        width: 180, height: 180, colorDark: "#ffffff", colorLight: "#0f172a"
      });
    }
  };

  const handleIncomingData = (msg: SyncMessage) => {
    if (msg.type === 'COMMAND') {
      const cmd = msg.payload as RemoteCommand;
      setLastCommand(`Relaying: ${cmd.type}`);
      
      // التمرير الفعلي للجسر
      if (bridgeConn && bridgeConn.open) {
        bridgeConn.send(msg);
      }
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
        
        {/* Mobile Link Panel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">1. Mobile Link</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Scan to connect controller</p>
          </div>
          
          <div className="bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.1)]" ref={qrRef}></div>
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 w-full flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Public ID</span>
            <span className="text-blue-400 font-mono font-bold text-sm">{myId || "Generating..."}</span>
          </div>

          <button onClick={startScreenShare} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-900/20">
            {isStreaming ? 'STREAMING ACTIVE' : 'BROADCAST SCREEN'}
          </button>
        </div>

        {/* Windows OS Bridge Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col space-y-8">
           <div className="space-y-1 text-center">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">2. OS Bridge</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connect to your terminal script</p>
           </div>

           <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Paste Bridge ID from Terminal" 
                  className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center font-mono text-emerald-400 focus:border-emerald-500/50 outline-none"
                  value={bridgeId}
                  onChange={(e) => setBridgeId(e.target.value)}
                />
                {bridgeConn?.open && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>}
              </div>

              <button 
                onClick={connectToBridge}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${bridgeConn?.open ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {bridgeConn?.open ? 'BRIDGE CONNECTED' : 'LINK TO TERMINAL BRIDGE'}
              </button>
           </div>

           <div className="flex-1 bg-slate-950 rounded-[2rem] border border-slate-800/50 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                <i className={`fas ${bridgeConn?.open ? 'fa-bolt text-emerald-500' : 'fa-terminal text-slate-700'} text-3xl`}></i>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">Current Signal Status</p>
                <p className="text-white font-mono text-xs">{lastCommand}</p>
              </div>
           </div>

           <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-[10px] text-blue-400/70 leading-relaxed text-center italic">
                The terminal ID usually starts with "REAL_OS_BRIDGE_..."
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopView;

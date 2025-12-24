
import React, { useRef, useEffect, useState } from 'react';
import { SyncMessage, RemoteCommand } from '../types';

declare var Peer: any;
declare var QRCode: any;

const DesktopView: React.FC = () => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [peer, setPeer] = useState<any>(null);
  const [myId, setMyId] = useState<string>("");
  const [conn, setConn] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("Ready...");

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on('open', (id: string) => {
      setMyId(id);
      setPeer(newPeer);
      generateQRCode(id);
    });

    newPeer.on('connection', (connection: any) => {
      setConn(connection);
      connection.on('data', (data: SyncMessage) => handleIncomingData(data));
    });

    return () => newPeer.destroy();
  }, []);

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
      setLastCommand(`${cmd.type}: ${JSON.stringify(cmd.payload)}`);
      
      // Send to local bridge if needed (via WebSocket)
      // This is where the magic happens when running the local script
    }
    if (msg.type === 'BRIDGE_STATUS') {
      setBridgeConnected(msg.payload);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: 60 } as any
      });
      if (conn && peer) {
        peer.call(conn.peer, stream);
        setIsStreaming(true);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 h-full max-h-[800px]">
        {/* Left Side: Connection & Instructions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center space-y-6">
          <h2 className="text-3xl font-black text-white tracking-tight">SYSTEM BRIDGE</h2>
          <div className="bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)]" ref={qrRef}></div>
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 w-full flex justify-between items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase">ID</span>
            <span className="text-blue-400 font-mono font-bold">{myId || "..."}</span>
          </div>
          <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase ${bridgeConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
            {bridgeConnected ? '● REAL OS CONTROL ACTIVE' : '○ BROWSER ONLY MODE'}
          </div>
        </div>

        {/* Right Side: Status & Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 flex flex-col space-y-6">
           <div className="flex-1 bg-slate-950 rounded-[2rem] border border-slate-800 p-6 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live Signals</span>
              </div>
              <div className="h-full flex flex-col items-center justify-center text-center">
                 <i className={`fas ${isStreaming ? 'fa-video text-blue-500' : 'fa-desktop text-slate-800'} text-6xl mb-4`}></i>
                 <p className="text-slate-400 font-mono text-sm max-w-[200px] break-all">{lastCommand}</p>
              </div>
           </div>

           <div className="space-y-3">
              <button onClick={startScreenShare} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all">
                {isStreaming ? 'STREAMING ACTIVE' : 'START SCREEN SHARE'}
              </button>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                 <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   <i className="fas fa-info-circle mr-2"></i>
                   To control Windows apps (Start, Chrome, Games), you must run the <b>Desktop Bridge</b> script on this PC.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopView;

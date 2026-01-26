
import React, { useState, useRef, useEffect } from 'react';
import { AppData } from '../types';
import { generateStudioReport } from '../services/geminiService';
import { Send, User, Loader2, Crown } from 'lucide-react';

interface AIConsultantProps {
  data: AppData;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

// Custom Heraldic Bot Icon: Two lions and a crown in the middle
const HeraldicBotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
    {/* Left Lion Silhouette */}
    <path d="M4 18c0-2 1-4 3-4s3 2 3 4M6 10c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z" />
    {/* Right Lion Silhouette */}
    <path d="M20 18c0-2-1-4-3-4s-3 2-3 4M18 10c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
    {/* Center Crown */}
    <path d="M9 7l3-3 3 3v4H9V7z" className="fill-amber-500/20" />
    <circle cx="12" cy="12" r="1.5" className="fill-amber-500" />
  </svg>
);

const AIConsultant: React.FC<AIConsultantProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: "Bienvenido al centro de inteligencia de Lovely's. Soy tu Asistente Virtual Lovelys. He procesado la información de las 30 salas y estoy listo para brindarte un análisis estratégico de alto nivel." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const response = await generateStudioReport(data, userMsg);
    setMessages(prev => [...prev, { role: 'ai', content: response || "Lo lamento, no he podido procesar tu solicitud en este momento. Por favor, intenta de nuevo." }]);
    setIsLoading(false);
  };

  const quickPrompts = [
    "Análisis de Tokens por Plataforma",
    "Modelos con mejor desempeño Q1 vs Q2",
    "Reporte de facturación estimada",
    "Identificar riesgos de inasistencia"
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-in slide-in-from-bottom-4 duration-500 bg-slate-950">
      <header className="mb-8 flex items-end justify-between border-b border-amber-900/30 pb-6">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-4 tracking-tighter uppercase italic">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200">
              Asistente Virtual Lovelys
            </span>
          </h2>
          <p className="text-amber-500/60 font-bold text-[10px] tracking-[0.3em] uppercase mt-2">Inteligencia Artificial • Análisis de Élite • Lovely's Studio</p>
        </div>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-amber-950/30 border border-amber-500/20 rounded-full">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Sistema Operativo</span>
        </div>
      </header>

      <div className="flex-1 bg-black rounded-[2.5rem] shadow-2xl border border-amber-900/20 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-950/10 via-black to-black">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 border-amber-400 text-black' 
                    : 'bg-black border-amber-900/50 text-amber-500'
                }`}>
                  {msg.role === 'user' ? <User size={20} strokeWidth={2.5} /> : <HeraldicBotIcon />}
                </div>
                <div className={`p-6 rounded-[2rem] shadow-xl text-sm whitespace-pre-wrap leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-black font-bold border-amber-400 rounded-tr-none' 
                    : 'bg-slate-900/50 text-slate-200 border-amber-900/30 rounded-tl-none backdrop-blur-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-black border border-amber-500/30 flex items-center justify-center animate-pulse">
                  <HeraldicBotIcon />
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-900/30 border border-amber-900/20 flex items-center gap-4">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-amber-500/50 text-[10px] font-black uppercase tracking-widest italic"> Lovelys está analizando el estudio...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-amber-900/20 bg-black/80 backdrop-blur-md">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="shrink-0 px-4 py-2 rounded-xl border border-amber-900/30 text-[10px] font-black uppercase tracking-widest text-amber-500/60 hover:bg-amber-500 hover:text-black hover:border-amber-400 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu consulta estratégica aquí..."
              className="w-full pl-6 pr-16 py-5 bg-slate-900/50 border border-amber-900/30 rounded-2xl text-white placeholder-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-slate-900 transition-all shadow-inner font-medium"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-2.5 p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 text-black rounded-xl hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-30 transition-all shadow-lg shadow-amber-900/20"
            >
              <Send size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultant;

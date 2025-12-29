
import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  Sparkles, 
  History, 
  Trophy,
  Dices,
  Volume2,
  VolumeX,
  Loader2,
  BrainCircuit,
  Copy,
  Check,
  Zap,
  RefreshCw,
  AlertCircle,
  Gauge,
  Volume1,
  Sun,
  Coins,
  ExternalLink,
  ScrollText,
  Timer,
  Heart,
  Coffee,
  MessageSquareHeart
} from 'lucide-react';
import { Tab, LottoResult, LotteryType, PastResult } from './types';
import { generateLottoNumbers, soundPlayer, LOTTERY_CONFIGS, getBallColor } from './constants';
import { geminiService } from './services/geminiService';
import Ball from './components/Ball';
import LottoMachine from './components/LottoMachine';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.RANDOM);
  const [lotteryType, setLotteryType] = useState<LotteryType>(LotteryType.KR_LOTTO);
  const [history, setHistory] = useState<LottoResult[]>([]);
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [currentBonus, setCurrentBonus] = useState<number | undefined>(undefined);
  const [isDrawing, setIsDrawing] = useState(false);
  const [aiFortune, setAiFortune] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [drawingMessage, setDrawingMessage] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [roundNumber, setRoundNumber] = useState(1185);
  const [copied, setCopied] = useState(false);
  const [machineTurbulence, setMachineTurbulence] = useState(5);
  const [machineSpeed, setMachineSpeed] = useState(1.0);
  const [drawDuration, setDrawDuration] = useState(3);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [isNightMode, setIsNightMode] = useState(() => {
    const saved = localStorage.getItem('lotto-ai-theme');
    return saved ? saved === 'night' : false;
  });
  
  const [pastResults, setPastResults] = useState<PastResult[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  const SAJU_URL = "https://example-saju-site.com";
  const DONATE_URL = "https://ko-fi.com/karincat#instant-signup-modal";

  useEffect(() => {
    localStorage.setItem('lotto-ai-theme', isNightMode ? 'night' : 'gold');
  }, [isNightMode]);

  const fetchOfficialHistory = useCallback(async () => {
    setLoadingPast(true);
    try {
      const results = await geminiService.getLatestOfficialResults(lotteryType);
      setPastResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPast(false);
    }
  }, [lotteryType]);

  useEffect(() => {
    fetchOfficialHistory();
  }, [fetchOfficialHistory]);

  useEffect(() => {
    soundPlayer.setVolume(soundEnabled ? soundVolume : 0);
  }, [soundEnabled, soundVolume]);

  const saveResult = (numbers: number[], type: LottoResult['type'], options: { bonus?: number, message?: string, analysis?: string }) => {
    const newResult: LottoResult = {
      id: Date.now().toString(),
      numbers,
      bonusNumber: options.bonus,
      date: new Date().toLocaleString(),
      type,
      lotteryType,
      round: roundNumber,
      message: options.message,
      analysis: options.analysis
    };
    setHistory(prev => [newResult, ...prev].slice(0, 50));
    setRoundNumber(r => r + 1);
  };

  const handleCopyNumbers = () => {
    if (currentNumbers.length === 0) return;
    const config = LOTTERY_CONFIGS[lotteryType];
    const bonusText = currentBonus !== undefined ? ` + [${config.bonusName || 'Bonus'}: ${currentBonus}]` : '';
    const fortuneText = aiFortune ? `\nFortune: "${aiFortune}"` : '';
    const textToCopy = `[${config.name}] RD #${roundNumber - 1}\nNumbers: ${currentNumbers.join(', ')}${bonusText}${fortuneText}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const runDrawSequence = useCallback(async (callback: () => void, message: string = "Computing...") => {
    setIsDrawing(true);
    setDrawingMessage(message);
    setCurrentNumbers([]);
    setCurrentBonus(undefined);
    setCopied(false);

    const duration = drawDuration * 1000;
    const startTime = Date.now();
    
    const playTenseStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (soundEnabled) {
        soundPlayer.playHeartbeat(progress);
      }

      if (progress < 1) {
        const nextTick = (400 - (progress * 350)) / machineSpeed; 
        setTimeout(playTenseStep, Math.max(50, nextTick));
      } else {
        if (soundEnabled) soundPlayer.playReveal();
        callback();
      }
    };

    playTenseStep();
  }, [soundEnabled, machineSpeed, drawDuration]);

  const handleDrawRandom = () => {
    if (isDrawing || activeTab === Tab.HISTORY) return;
    setAiFortune("");
    setAiAnalysis("");
    
    runDrawSequence(() => {
      const { main, bonus } = generateLottoNumbers(lotteryType);
      setCurrentNumbers(main);
      setCurrentBonus(bonus);
      setIsDrawing(false);
      if (soundEnabled) soundPlayer.playSuccess();
      saveResult(main, 'random', { bonus });
    }, "Rolling the dice...");
  };

  const handleDrawAI = async () => {
    if (isDrawing || activeTab === Tab.HISTORY) return;
    setAiFortune("");
    setAiAnalysis("");
    
    runDrawSequence(async () => {
      try {
        const data = await geminiService.getLuckyNumbers(lotteryType, pastResults);
        setCurrentNumbers(data.numbers);
        setCurrentBonus(data.bonus);
        setAiFortune(data.fortune);
        setAiAnalysis(data.analysis);
        setIsDrawing(false);
        if (soundEnabled) soundPlayer.playSuccess();
        saveResult(data.numbers, 'ai', { bonus: data.bonus, message: data.fortune, analysis: data.analysis });
      } catch (e) {
        setIsDrawing(false);
        setAiFortune("Sync error. Try again.");
      }
    }, "Consulting the Oracle...");
  };

  const config = LOTTERY_CONFIGS[lotteryType];

  const DonateBanner = () => (
    <div className={`w-full p-6 rounded-3xl border shadow-sm flex flex-col items-center text-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500
      ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-rose-100 shadow-rose-900/5'}`}>
      <div className={`p-3 rounded-full ${isNightMode ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
        <MessageSquareHeart className={`w-6 h-6 ${isNightMode ? 'text-rose-400' : 'text-rose-500'}`} />
      </div>
      <div>
        <h4 className={`text-[12px] font-black uppercase tracking-tight mb-1 ${isNightMode ? 'text-slate-200' : 'text-rose-900'}`}>Enjoying Lotto AI?</h4>
        <p className={`text-[10px] leading-relaxed ${isNightMode ? 'text-slate-500' : 'text-rose-400'}`}>개발자에게 커피 한 잔 선물하고<br/>생생한 사용 후기를 남겨주세요!</p>
      </div>
      <a 
        href={DONATE_URL} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95
          ${isNightMode ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}
      >
        <Coffee className="w-4 h-4" />
        Donate & Review
      </a>
    </div>
  );

  const SajuLinkSection = () => (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`w-full p-8 rounded-[3rem] shadow-xl border relative overflow-hidden transition-colors ${isNightMode ? 'bg-indigo-950/20 border-indigo-900/30 shadow-black' : 'bg-amber-900/90 border-amber-800 shadow-amber-900/10'}`}>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-amber-400" />
          <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.1em]">
            {aiAnalysis ? "Quantum Oracle Logic" : "Spiritual Synchronicity"}
          </h3>
        </div>
        
        {aiAnalysis ? (
          <p className={`text-[12px] leading-relaxed font-medium italic text-amber-50 mb-6`}>
            {aiAnalysis}
          </p>
        ) : (
          <p className={`text-[12px] leading-relaxed font-medium italic text-amber-50 mb-6`}>
            번호가 생성되었습니다. 오늘의 기운과 이 번호들의 합이 어떨지 사주 기운을 통해 확인해보세요.
          </p>
        )}
        
        <a 
          href={SAJU_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-between w-full px-5 py-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group
            ${isNightMode ? 'bg-indigo-600/20 border-indigo-50/30 hover:bg-indigo-600/30 shadow-lg shadow-indigo-950/50' : 'bg-amber-100/20 border-white/20 hover:bg-amber-100/30 shadow-lg shadow-amber-950/20'}`}
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
              <ScrollText className={`w-5 h-5 ${isNightMode ? 'text-indigo-400' : 'text-amber-300'}`} />
            </span>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">나의 오늘 사주 기운 확인</span>
          </div>
          <ExternalLink className={`w-4 h-4 text-white/50 group-hover:text-white transition-colors`} />
        </a>
      </div>
      
      {/* 번호 생성 후에만 보이는 기부 유도 */}
      <DonateBanner />
    </div>
  );

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto overflow-hidden shadow-2xl relative border-x transition-colors duration-500 ${isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#FFF9E5] border-amber-200'}`}>
      <header className={`px-4 py-3 border-b flex items-center justify-between shrink-0 z-50 sticky top-0 transition-colors duration-500 ${isNightMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 'bg-amber-100/90 backdrop-blur-md border-amber-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transform -rotate-3 ${isNightMode ? 'bg-indigo-600' : 'bg-amber-500'}`}>
            <Trophy className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-sm font-black leading-none ${isNightMode ? 'text-white' : 'text-amber-900'}`}>LOTTO AI</h1>
            <span className={`text-[8px] font-bold uppercase tracking-[0.1em] ${isNightMode ? 'text-indigo-500' : 'text-amber-600'}`}>Quantum Oracle</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <a 
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-1.5 rounded-lg transition-all animate-pulse hover:animate-none ${isNightMode ? 'text-rose-400 bg-slate-800 hover:bg-slate-700' : 'text-rose-500 bg-amber-200/50 hover:bg-amber-200'}`}
            title="Donate & Review"
          >
            <Heart className="w-4 h-4 fill-current" />
          </a>
          <button 
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-1.5 rounded-lg transition-all ${isNightMode ? 'text-amber-400 bg-slate-800' : 'text-amber-700 bg-amber-200/50'}`}
          >
            {isNightMode ? <Sun className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg transition-all ${soundEnabled ? (isNightMode ? 'text-indigo-400 bg-slate-800' : 'text-amber-600 bg-amber-200/50') : (isNightMode ? 'text-slate-600 bg-slate-800' : 'text-amber-300 bg-amber-100')}`}
          >
            {soundEnabled ? (soundVolume > 0.6 ? <Volume2 className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />) : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className={`backdrop-blur-md px-4 py-2 border-b flex gap-2 overflow-x-auto no-scrollbar z-40 shrink-0 sticky top-[57px] transition-colors duration-500 ${isNightMode ? 'bg-slate-900/60 border-slate-800' : 'bg-amber-50/80 border-amber-100'}`}>
        {(Object.keys(LOTTERY_CONFIGS) as LotteryType[]).map((type) => (
          <button
            key={type}
            onClick={() => {
              if (isDrawing) return;
              setLotteryType(type);
              setCurrentNumbers([]);
              setCurrentBonus(undefined);
              setAiFortune("");
              setAiAnalysis("");
              setCopied(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all border uppercase tracking-wider
              ${lotteryType === type 
                ? (isNightMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-amber-600 border-amber-700 text-white shadow-md') 
                : (isNightMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500' : 'bg-white border-amber-200 text-amber-500 hover:border-amber-400')}
            `}
          >
            {LOTTERY_CONFIGS[type].name}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-6 pb-40 no-scrollbar relative">
        {activeTab !== Tab.HISTORY ? (
          <div className="w-full space-y-8">
            <div className="flex flex-col gap-4">
               <div className="text-center pt-2">
                 <h2 className={`text-lg font-black uppercase tracking-tighter ${isNightMode ? 'text-slate-200' : 'text-amber-900'}`}>
                   {config.name}
                 </h2>
               </div>

               <LottoMachine 
                 isDrawing={isDrawing} 
                 turbulence={machineTurbulence} 
                 speedMultiplier={machineSpeed}
                 soundEnabled={soundEnabled}
                 isDarkMode={isNightMode}
               />
               
               <div className={`px-5 py-4 border rounded-3xl shadow-sm mx-auto w-full space-y-4 transition-colors ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100 shadow-amber-900/5'}`}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-500' : 'text-amber-400'}`}>Mix</span>
                        </div>
                        <span className={`text-[9px] font-black ${isNightMode ? 'text-indigo-500' : 'text-amber-600'}`}>{machineTurbulence}</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="1"
                        value={machineTurbulence}
                        onChange={(e) => setMachineTurbulence(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isNightMode ? 'bg-slate-800 accent-indigo-600' : 'bg-amber-50 accent-amber-600'}`}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-2.5 h-2.5 text-blue-500" />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-500' : 'text-amber-400'}`}>Speed</span>
                        </div>
                        <span className={`text-[9px] font-black ${isNightMode ? 'text-indigo-500' : 'text-amber-600'}`}>{machineSpeed.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="3.0" step="0.1"
                        value={machineSpeed}
                        onChange={(e) => setMachineSpeed(parseFloat(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isNightMode ? 'bg-slate-800 accent-indigo-600' : 'bg-amber-50 accent-amber-600'}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Timer className="w-2.5 h-2.5 text-rose-500" />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-500' : 'text-amber-400'}`}>Time</span>
                        </div>
                        <span className={`text-[9px] font-black ${isNightMode ? 'text-indigo-500' : 'text-amber-600'}`}>{drawDuration}s</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" step="1"
                        value={drawDuration}
                        onChange={(e) => setDrawDuration(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isNightMode ? 'bg-slate-800 accent-indigo-600' : 'bg-amber-50 accent-amber-600'}`}
                      />
                    </div>
                  </div>

                  <div className={`flex flex-col gap-2 border-t pt-3 ${isNightMode ? 'border-slate-800' : 'border-amber-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {soundVolume === 0 || !soundEnabled ? <VolumeX className={`w-2.5 h-2.5 ${isNightMode ? 'text-slate-600' : 'text-amber-300'}`} /> : <Volume2 className={`w-2.5 h-2.5 ${isNightMode ? 'text-indigo-500' : 'text-amber-500'}`} />}
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-500' : 'text-amber-400'}`}>SFX Volume</span>
                      </div>
                      <span className={`text-[9px] font-black ${isNightMode ? 'text-indigo-500' : 'text-amber-600'}`}>{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={soundVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSoundVolume(val);
                        if (val > 0) setSoundEnabled(true);
                      }}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isNightMode ? 'bg-slate-800 accent-indigo-600' : 'bg-amber-50 accent-amber-600'}`}
                    />
                  </div>
               </div>
            </div>

            <div className={`w-full rounded-[2.5rem] p-8 shadow-xl border flex flex-col items-center justify-center relative overflow-hidden min-h-[180px] transition-colors mt-16 ${isNightMode ? 'bg-slate-900 border-slate-800 shadow-indigo-900/20' : 'bg-white border-amber-200 shadow-amber-200/20'}`}>
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-40 animate-pulse ${isNightMode ? 'via-indigo-600' : 'via-amber-500'}`} />
              
              {currentNumbers.length > 0 && !isDrawing && (
                <div className="absolute top-4 right-6 flex items-center gap-1.5 z-10">
                  <button 
                    onClick={handleCopyNumbers}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase active:scale-95 shadow-sm ${isNightMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-900' : 'bg-amber-50 border-amber-100 text-amber-700 hover:text-amber-900 hover:border-amber-300'}`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              {currentNumbers.length > 0 ? (
                <div className="flex flex-nowrap justify-center gap-2.5 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full overflow-x-auto no-scrollbar py-4">
                  {currentNumbers.map(n => (
                    <Ball key={n} number={n} size="md" />
                  ))}
                  {currentBonus !== undefined && (
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className={`w-[2px] h-10 rounded-full mx-1.5 ${isNightMode ? 'bg-slate-800' : 'bg-amber-100'}`} />
                      <Ball number={currentBonus} size="md" isSpecial={true} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className={`p-5 rounded-full transition-all ${isDrawing ? 'scale-110 rotate-12' : (isNightMode ? 'bg-slate-800' : 'bg-amber-50')}`}>
                    {isDrawing ? <Loader2 className={`w-10 h-10 animate-spin ${isNightMode ? 'text-indigo-500' : 'text-amber-500'}`} /> : <Dices className={`w-10 h-10 ${isNightMode ? 'text-slate-700' : 'text-amber-200'}`} />}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-600' : 'text-amber-300'}`}>{isDrawing ? drawingMessage : 'Ready to Draw Luck'}</p>
                </div>
              )}

              {aiFortune && !isDrawing && (
                <div className={`mt-6 px-5 py-3 rounded-2xl w-full border shadow-inner ${isNightMode ? 'bg-indigo-900/20 border-indigo-900/30' : 'bg-amber-50 border-amber-100/50'}`}>
                  <p className={`text-[11px] text-center font-black italic ${isNightMode ? 'text-indigo-300' : 'text-amber-800'}`}>
                    "{aiFortune}"
                  </p>
                </div>
              )}
            </div>

            {currentNumbers.length > 0 && !isDrawing && <SajuLinkSection />}

            <div className={`rounded-2xl p-5 border shadow-sm group transition-colors ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isNightMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                    <AlertCircle className={`w-4 h-4 ${isNightMode ? 'text-emerald-500' : 'text-emerald-600'}`} />
                  </div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${isNightMode ? 'text-slate-500' : 'text-amber-500'}`}>Latest Official Winning</h3>
                </div>
                <button onClick={fetchOfficialHistory} disabled={loadingPast} className={`p-1.5 transition-colors ${isNightMode ? 'text-slate-600 hover:text-indigo-400' : 'text-amber-300 hover:text-amber-600'}`}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPast ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {pastResults.length > 0 ? (
                  pastResults.slice(0, 2).map((pr, idx) => (
                    <div key={idx} className={`flex flex-col gap-2 pb-3 border-b last:border-0 last:pb-0 ${isNightMode ? 'border-slate-800' : 'border-amber-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-black uppercase ${isNightMode ? 'text-slate-400' : 'text-amber-800'}`}>RD {pr.round}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{pr.date}</span>
                      </div>
                      <div className="flex flex-nowrap gap-1.5 overflow-x-auto no-scrollbar">
                        {pr.numbers.map((n, i) => (
                          <div key={i} className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white ${getBallColor(n)}`}>
                            {n}
                          </div>
                        ))}
                        {pr.bonus !== undefined && (
                          <>
                            <div className={`w-[1px] h-5 self-center mx-1 shrink-0 ${isNightMode ? 'bg-slate-800' : 'bg-amber-100'}`} />
                            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-rose-600 ring-1 ${isNightMode ? 'ring-rose-900' : 'ring-rose-100'}`}>
                              {pr.bonus}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : !loadingPast && (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isNightMode ? 'text-slate-700' : 'text-amber-200'}`}>Syncing records...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-black uppercase tracking-tighter ${isNightMode ? 'text-slate-100' : 'text-amber-900'}`}>Prediction Vault</h2>
              <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest ${isNightMode ? 'bg-slate-900' : 'bg-amber-600'}`}>{history.length} Logs</div>
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-10">
                <History className={`w-8 h-8 mb-2 ${isNightMode ? 'opacity-10' : 'opacity-20 text-amber-200'}`} />
                <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${isNightMode ? 'opacity-20' : 'opacity-30 text-amber-300'}`}>Archive Empty</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1 pb-20">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl shadow-sm border transition-all cursor-pointer group
                      ${expandedHistoryId === item.id 
                        ? (isNightMode ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-900/50' : 'bg-white border-amber-400 ring-1 ring-amber-100') 
                        : (isNightMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-amber-100 hover:border-amber-300')}`}
                    onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md w-fit uppercase tracking-widest
                          ${item.type === 'ai' ? 'bg-indigo-600 text-white' : (isNightMode ? 'bg-slate-800 text-slate-500' : 'bg-amber-100 text-amber-600')}`}>
                          {item.type === 'ai' ? 'Oracle' : 'Random'}
                        </span>
                        <h4 className={`text-[10px] font-black uppercase tracking-tight ${isNightMode ? 'text-slate-300' : 'text-amber-900'}`}>
                           {LOTTERY_CONFIGS[item.lotteryType].name}
                        </h4>
                      </div>
                      <div className="text-right">
                         <div className={`text-[9px] font-black tracking-tighter uppercase ${isNightMode ? 'text-slate-400' : 'text-amber-800'}`}>RD {item.round}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-nowrap gap-1.5 mb-1 overflow-x-auto no-scrollbar py-1">
                      {item.numbers.map(n => (
                        <Ball key={n} number={n} size="sm" />
                      ))}
                      {item.bonusNumber !== undefined && (
                        <>
                          <div className={`w-[1px] h-4 self-center mx-0.5 shrink-0 ${isNightMode ? 'bg-slate-800' : 'bg-amber-100'}`} />
                          <Ball number={item.bonusNumber} size="sm" isSpecial={true} />
                        </>
                      )}
                    </div>

                    {expandedHistoryId === item.id && (
                      <div className={`mt-3 pt-3 border-t space-y-3 animate-in fade-in slide-in-from-top-1 ${isNightMode ? 'border-slate-800' : 'border-amber-50'}`}>
                        {item.type === 'ai' && (
                          <>
                            <p className={`text-[9px] font-black italic text-center ${isNightMode ? 'text-indigo-400' : 'text-amber-700'}`}>"{item.message}"</p>
                            <p className={`text-[10px] leading-relaxed italic ${isNightMode ? 'text-slate-500' : 'text-amber-500'}`}>{item.analysis}</p>
                          </>
                        )}
                        
                        <a 
                          href={SAJU_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all hover:bg-opacity-80
                            ${isNightMode ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ScrollText className="w-3 h-3" />
                          오늘의 기운 확인하기
                          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Vault 하단에도 후원 링크 추가 */}
                <div className="pt-4">
                  <DonateBanner />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {activeTab !== Tab.HISTORY && (
        <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[340px] z-50 animate-in slide-in-from-bottom-6">
          <div className={`backdrop-blur-xl p-1.5 rounded-2xl border shadow-2xl grid grid-cols-2 gap-2 transition-colors duration-500 ${isNightMode ? 'bg-slate-900/90 border-slate-800 shadow-black' : 'bg-amber-100/80 border-amber-200/50 shadow-amber-900/5'}`}>
            <button
              onClick={handleDrawRandom}
              disabled={isDrawing}
              className={`
                col-span-1 py-2.5 rounded-xl font-black text-[9px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 uppercase tracking-wider border
                ${isDrawing 
                  ? (isNightMode ? 'bg-slate-800 text-slate-600 border-slate-700' : 'bg-amber-50 text-amber-300 border-amber-100') 
                  : (isNightMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 active:bg-slate-900' : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50 active:bg-amber-100')}
              `}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isDrawing && drawingMessage.includes("Dice") ? 'animate-spin' : ''}`} />
              Random
            </button>

            <button
              onClick={handleDrawAI}
              disabled={isDrawing}
              className={`
                col-span-1 py-2.5 rounded-xl font-black text-[9px] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-wider relative overflow-hidden shadow-lg
                ${isDrawing 
                  ? 'bg-indigo-600 text-indigo-200 animate-pulse' 
                  : (isNightMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-amber-600 text-white hover:bg-amber-700')}
              `}
            >
              <Sparkles className={`w-3.5 h-3.5 relative z-10 ${isDrawing && drawingMessage.includes("Oracle") ? 'animate-pulse' : (isNightMode ? 'text-indigo-200' : 'text-amber-200')}`} />
              <span className="relative z-10">AI Oracle</span>
            </button>
          </div>
        </div>
      )}

      <nav className={`shrink-0 border-t px-4 py-2 pb-5 flex justify-around items-center z-50 shadow-sm sticky bottom-0 transition-colors duration-500 ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100'}`}>
        <NavButton 
          active={activeTab === Tab.RANDOM} 
          isDarkMode={isNightMode}
          onClick={() => {
            setActiveTab(Tab.RANDOM);
            setExpandedHistoryId(null);
          }} 
          icon={<Dices />} 
          label="Draw" 
        />
        <NavButton 
          active={activeTab === Tab.AI} 
          isDarkMode={isNightMode}
          onClick={() => {
            setActiveTab(Tab.AI);
            setExpandedHistoryId(null);
          }} 
          icon={<Sparkles />} 
          label="Oracle" 
        />
        <NavButton 
          active={activeTab === Tab.HISTORY} 
          isDarkMode={isNightMode}
          onClick={() => setActiveTab(Tab.HISTORY)} 
          icon={<History />} 
          label="Vault" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, isDarkMode: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ 
  active, isDarkMode, onClick, icon, label 
}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all duration-300 min-w-[70px]
      ${active 
        ? (isDarkMode ? 'text-indigo-400 bg-indigo-500/10 scale-105' : 'text-amber-700 bg-amber-500/10 scale-105') 
        : (isDarkMode ? 'text-slate-600 hover:text-slate-400' : 'text-amber-300 hover:text-amber-500')}`}
  >
    {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}` })}
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;

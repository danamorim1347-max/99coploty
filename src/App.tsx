import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sliders, 
  Trash2, 
  HelpCircle, 
  DollarSign, 
  MapPin, 
  Clock, 
  Info, 
  Download, 
  FileCode,
  Smartphone,
  Vibrate,
  History,
  CheckCircle,
  Copy,
  Plus,
  Play,
  Flame,
  Layout,
  Eye,
  Settings,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Upload,
  X,
  Gauge,
  Percent,
  Compass
} from "lucide-react";
import { androidFiles } from "./data/androidFiles";

// Structured types for simulated rides
interface SimulatedRide {
  id: number;
  val: number;
  dist: number;
  time: number;
  region: string;
  searchDistance: number;
  rPerKm: number;
  rPerHour: number;
  fuelCost: number;
  netProfit: number;
  score: number;
  ratingStars: string;
  ratingText: string;
  classification: "EXCELENTE" | "ACEITAVEL" | "RUIM";
  isAccepted: boolean; // Driver toggleable action
  timeStr: string;
  isSimulatedOcr?: boolean;
}

export default function App() {
  // Navigation tabs for the web mockup
  const [activeTab, setActiveTab] = useState<"analisar" | "dashboard" | "historico" | "ajustes" | "codigo">("analisar");
  
  // Selected Kotlin/XML file from our native visualizer companion
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);

  // Core smart calculation inputs (driver state)
  const [inputValor, setInputValor] = useState<string>("48,50");
  const [inputDistance, setInputDistance] = useState<string>("12,4");
  const [inputTime, setInputTime] = useState<string>("22");
  const [inputRegion, setInputRegion] = useState<string>("Zona Sul (Itaim Bibi)");
  const [inputSearchDistance, setInputSearchDistance] = useState<string>("1,2");

  // Fuel & Optimization target settings
  const [minGood, setMinGood] = useState<number>(2.20);
  const [minMedium, setMinMedium] = useState<number>(1.50);
  const [minHour, setMinHour] = useState<number>(45.00);
  const [kmPerLitre, setKmPerLitre] = useState<number>(10.0);
  const [fuelPrice, setFuelPrice] = useState<number>(5.50);
  const [desiredAcceptRate, setDesiredAcceptRate] = useState<number>(75);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);

  // Draggable Floating Overlay trigger state
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [overlayPosition, setOverlayPosition] = useState({ x: 20, y: 150 });

  // OCR state machine (simulating local ML Kit algorithm feedback)
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "success">("idle");
  const [activeSimulatedTemplate, setActiveSimulatedTemplate] = useState<string | null>(null);

  // Alert & feedback notifications
  const [toast, setToast] = useState<{ show: boolean; icon: string; message: string }>({
    show: false,
    icon: "🚦",
    message: ""
  });
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Preloaded mock database history for beautiful dashboard state
  const [history, setHistory] = useState<SimulatedRide[]>([]);

  // Local key-value database state loaders
  useEffect(() => {
    const savedGood = localStorage.getItem("copilot_km_good");
    const savedMedium = localStorage.getItem("copilot_km_medium");
    const savedHour = localStorage.getItem("copilot_hour");
    const savedKmL = localStorage.getItem("copilot_km_per_litre");
    const savedFuel = localStorage.getItem("copilot_fuel_price");
    const savedAcceptRate = localStorage.getItem("copilot_accept_rate");
    const savedVibrate = localStorage.getItem("copilot_vibrate");
    const savedHistoryStr = localStorage.getItem("copilot_rides_history");

    if (savedGood) setMinGood(parseFloat(savedGood));
    if (savedMedium) setMinMedium(parseFloat(savedMedium));
    if (savedHour) setMinHour(parseFloat(savedHour));
    if (savedKmL) setKmPerLitre(parseFloat(savedKmL));
    if (savedFuel) setFuelPrice(parseFloat(savedFuel));
    if (savedAcceptRate) setDesiredAcceptRate(parseInt(savedAcceptRate));
    if (savedVibrate) setVibrateEnabled(savedVibrate === "true");

    if (savedHistoryStr) {
      try {
        setHistory(JSON.parse(savedHistoryStr));
      } catch (e) {
        loadPredefinedHistory();
      }
    } else {
      loadPredefinedHistory();
    }
  }, []);

  // Preloads the history with beautiful sample data so dashboard displays immediately
  const loadPredefinedHistory = () => {
    const defaultHistory: SimulatedRide[] = [
      {
        id: Date.now() - 40000000,
        val: 78.50,
        dist: 22.0,
        time: 38,
        region: "Aeroporto de Congonhas",
        searchDistance: 1.5,
        rPerKm: 78.50 / (22.0 + 1.5),
        rPerHour: 78.50 / (38 / 60),
        fuelCost: ((22.0 + 1.5) / 10.0) * 5.50,
        netProfit: 78.50 - (((22.0 + 1.5) / 10.0) * 5.50),
        score: 93,
        ratingStars: "⭐⭐⭐⭐⭐",
        ratingText: "Vale muito a pena!",
        classification: "EXCELENTE",
        isAccepted: true,
        timeStr: "11:24"
      },
      {
        id: Date.now() - 30000000,
        val: 18.00,
        dist: 4.8,
        time: 14,
        region: "Vila Olimpia",
        searchDistance: 0.8,
        rPerKm: 18.00 / (4.8 + 0.8),
        rPerHour: 18.00 / (14 / 60),
        fuelCost: ((4.8 + 0.8) / 10.0) * 5.50,
        netProfit: 18.00 - (((4.8 + 0.8) / 10.0) * 5.50),
        score: 79,
        ratingStars: "⭐⭐⭐⭐",
        ratingText: "Excelente oportunidade!",
        classification: "ACEITAVEL",
        isAccepted: true,
        timeStr: "10:15"
      },
      {
        id: Date.now() - 20000000,
        val: 14.20,
        dist: 9.3,
        time: 28,
        region: "Grajau (Via Marginal)",
        searchDistance: 2.1,
        rPerKm: 14.20 / (9.3 + 2.1),
        rPerHour: 14.20 / (28 / 60),
        fuelCost: ((9.3 + 2.1) / 10.0) * 5.50,
        netProfit: 14.20 - (((9.3 + 2.1) / 10.0) * 5.50),
        score: 28,
        ratingStars: "⭐",
        ratingText: "Recuse imediatamente. Prejuízo!",
        classification: "RUIM",
        isAccepted: false,
        timeStr: "09:42"
      }
    ];
    setHistory(defaultHistory);
    localStorage.setItem("copilot_rides_history", JSON.stringify(defaultHistory));
  };

  // Toast trigger helper
  const triggerToast = (icon: string, message: string) => {
    setToast({ show: true, icon, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Safe float parsing helper
  const parseCurrencyInput = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Numeric parameters calculated on state change
  const valNum = parseCurrencyInput(inputValor);
  const distNum = parseCurrencyInput(inputDistance);
  const timeNum = parseCurrencyInput(inputTime);
  const searchDistNum = parseCurrencyInput(inputSearchDistance);

  const canAnalyzeComp = valNum > 0 && distNum > 0 && timeNum > 0;
  
  // R$/km factoring in pickup distance (search distance)
  const rPerKm = canAnalyzeComp ? valNum / (distNum + searchDistNum) : 0;
  const rPerHour = canAnalyzeComp ? valNum / (timeNum / 60) : 0;

  // Fuel operational computations
  const totalKmToDrive = distNum + searchDistNum;
  const fuelCost = kmPerLitre > 0 ? (totalKmToDrive / kmPerLitre) * fuelPrice : 0;
  const netProfit = canAnalyzeComp ? Math.max(0, valNum - fuelCost) : 0;

  // Custom 0-100 scoring algorithm (matching Kotlin spec)
  const calculateDisplayScore = (): number => {
    if (!canAnalyzeComp) return 0;
    let points = 0;

    // 1. R$/km rate score component (Max 45 points)
    const ratioKm = rPerKm / minGood;
    points += Math.min(45, ratioKm * 40);
    if (rPerKm >= minGood) points += 5;

    // 2. Earnings per hour rate component (Max 35 points)
    const ratioHour = rPerHour / minHour;
    points += Math.min(35, ratioHour * 30);
    if (rPerHour >= minHour) points += 5;

    // 3. Search distance component (Max 10 points)
    if (searchDistNum <= 1.0) points += 10;
    else if (searchDistNum <= 2.0) points += 7;
    else if (searchDistNum <= 3.0) points += 4;

    // 4. Net margin factor (Max 10 points)
    const profitMargin = valNum > 0 ? netProfit / valNum : 0;
    points += Math.min(10, profitMargin * 12);

    return Math.min(100, Math.max(0, Math.round(points)));
  };

  const calculatedScore = calculateDisplayScore();

  // Score description classification triggers
  const getScoreFeedbackDetails = (score: number) => {
    if (score >= 90) return { stars: "⭐⭐⭐⭐⭐", feedback: "Excelente! Recuse nada aqui.", classification: "EXCELENTE" as const };
    if (score >= 75) return { stars: "⭐⭐⭐⭐", feedback: "Ótima oportunidade!", classification: "EXCELENTE" as const };
    if (score >= 60) return { stars: "⭐⭐⭐", feedback: "Razoável. Bom aceitar.", classification: "ACEITAVEL" as const };
    if (score >= 45) return { stars: "⭐⭐", feedback: "Risco alto. Avalie o trânsito.", classification: "ACEITAVEL" as const };
    return { stars: "⭐", feedback: "Não compensa. Margem baixíssima!", classification: "RUIM" as const };
  };

  const activeFeedback = getScoreFeedbackDetails(calculatedScore);

  // Executing the main calculation trigger and saving into SQLite Room-mock
  const handleAnalyzeAndSave = () => {
    if (!canAnalyzeComp) {
      triggerToast("⚠️", "Preencha os campos para calcular a rota!");
      return;
    }

    if (vibrateEnabled) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      if (navigator.vibrate) {
        navigator.vibrate(calculatedScore >= 70 ? [100, 50, 100] : 300);
      }
    }

    // Insert into mock Room db
    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newRide: SimulatedRide = {
      id: Date.now(),
      val: valNum,
      dist: distNum,
      time: timeNum,
      region: inputRegion.trim() || "Zona Principal",
      searchDistance: searchDistNum,
      rPerKm,
      rPerHour,
      fuelCost,
      netProfit,
      score: calculatedScore,
      ratingStars: activeFeedback.stars,
      ratingText: activeFeedback.feedback,
      classification: activeFeedback.classification,
      isAccepted: calculatedScore >= 60, // Auto accepted heuristics on highly graded rides
      timeStr
    };

    const updated = [newRide, ...history].slice(0, 15);
    setHistory(updated);
    localStorage.setItem("copilot_rides_history", JSON.stringify(updated));

    triggerToast(
      calculatedScore >= 60 ? "🟢" : calculatedScore >= 45 ? "🟡" : "🔴",
      `Copilot Nota ${calculatedScore}/100: ${activeFeedback.classification === "EXCELENTE" ? "Excelente Corrida!" : activeFeedback.classification === "ACEITAVEL" ? "Corrida Razoável" : "Prejuízo! Melhor Recusar."}`
    );
  };

  // Simulates ML Kit local OCR reading from mock 99 offers
  const triggerSimulatedOcr = (type: "vip" | "medium" | "ruim") => {
    setOcrStatus("reading");
    setActiveSimulatedTemplate(type);
    
    // Simulate reading timeline feedback
    setTimeout(() => {
      if (type === "vip") {
        setInputValor("68,00");
        setInputDistance("14,8");
        setInputTime("25");
        setInputRegion("Aeroporto de Guarulhos");
        setInputSearchDistance("0,9");
      } else if (type === "medium") {
        setInputValor("22,50");
        setInputDistance("8,2");
        setInputTime("20");
        setInputRegion("Shopping Ibirapuera");
        setInputSearchDistance("1,5");
      } else {
        setInputValor("13,40");
        setInputDistance("10,5");
        setInputTime("31");
        setInputRegion("Vila Nova Cachoeirinha");
        setInputSearchDistance("2,8");
      }
      setOcrStatus("success");
      triggerToast("🎯", "OCR local com ML Kit parseado com sucesso!");
      
      // Auto analyze after ocr success
      setTimeout(() => {
        setOcrStatus("idle");
        setActiveSimulatedTemplate(null);
      }, 1000);
    }, 1200);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("copilot_rides_history");
    triggerToast("🗑️", "Histórico local do Room limpo com sucesso!");
  };

  // Allows drivers to toggle accepted/refused status of an evaluated ride to show real-time changes on dashboard
  const toggleRideAccepted = (id: number) => {
    const updated = history.map((item) => {
      if (item.id === id) {
        const nextState = !item.isAccepted;
        return { 
          ...item, 
          isAccepted: nextState,
          netProfit: nextState ? item.val - item.fuelCost : 0 // Refused rides earn 0 final profit
        };
      }
      return item;
    });
    setHistory(updated);
    localStorage.setItem("copilot_rides_history", JSON.stringify(updated));
    triggerToast("🔄", "Mapeamento aceito/recusado atualizado. Dashboard recalculado!");
  };

  // Dashboard Aggregates based on accepted historical listings
  const totalAcceptedRides = history.filter((r) => r.isAccepted).length;
  const totalRefusedRides = history.filter((r) => !r.isAccepted).length;
  const totalGainsRaw = history.filter((r) => r.isAccepted).reduce((acc, curr) => acc + curr.val, 0);
  const totalNetGains = history.filter((r) => r.isAccepted).reduce((acc, curr) => acc + curr.netProfit, 0);
  
  const avgKmGainRate = totalAcceptedRides > 0 
    ? history.filter((r) => r.isAccepted).reduce((acc, curr) => acc + curr.rPerKm, 0) / totalAcceptedRides 
    : 0;

  const currentAcceptanceRateCalculated = history.length > 0
    ? Math.round((totalAcceptedRides / history.length) * 100)
    : 0;

  // Best Region calculation heuristic
  const getBestProfitRegion = () => {
    if (history.length === 0) return "Nenhuma registrada";
    const counts: { [key: string]: number } = {};
    history.filter(r => r.isAccepted).forEach((r) => {
      counts[r.region] = (counts[r.region] || 0) + r.netProfit;
    });
    let best = "Zona Central";
    let maxVal = 0;
    Object.keys(counts).forEach((key) => {
      if (counts[key] > maxVal) {
        maxVal = counts[key];
        best = key;
      }
    });
    return best;
  };

  const bestRegionCalculated = getBestProfitRegion();

  const handleCopyFilesSource = (index: number, codeStr: string) => {
    setCopiedIndex(index);
    navigator.clipboard.writeText(codeStr);
    setTimeout(() => setCopiedIndex(null), 2500);
    triggerToast("📋", `${androidFiles[index].name} copiado para a área de transferência!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased flex flex-col selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-amber-500/10 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      {/* Floating Interactive Draggable Overlay Simulator */}
      {showOverlay && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ x: window.innerWidth > 1024 ? 800 : 20, y: 140 }}
          className="fixed z-50 p-[1px] rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500/50 to-slate-800 shadow-2xl cursor-grab active:cursor-grabbing w-72 backdrop-blur-md"
        >
          <div className="bg-slate-950/90 rounded-[15px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl animate-pulse">🚦</span>
                <div>
                  <h4 className="text-xs font-black text-amber-450 uppercase tracking-tight">99 Copilot Overlay</h4>
                  <p className="text-[7.5px] text-slate-400 font-mono">Permissão SYSTEM_ALERT_WINDOW</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOverlay(false)}
                className="p-1 hover:text-rose-400 text-slate-500 rounded-lg hover:bg-slate-900 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Simulated Live Offer data container */}
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1 shrink-0">
                {canAnalyzeComp 
                  ? calculatedScore >= 75 ? "🟢" : calculatedScore >= 50 ? "🟡" : "🔴"
                  : "⚪"
                }
              </span>
              <div className="flex-grow flex flex-col">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-white font-mono">
                    {canAnalyzeComp ? `R$ ${valNum.toFixed(2)}` : "Aguardando..."}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {canAnalyzeComp ? `${distNum} km` : ""}
                  </span>
                </div>
                {canAnalyzeComp && (
                  <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium leading-none">
                    Destino: {inputRegion}
                  </p>
                )}
                
                {/* Score badge & fuel calculation inside draggable overlay */}
                {canAnalyzeComp ? (
                  <div className="flex flex-col gap-1.5 mt-2.5 pt-2 border-t border-slate-900/60">
                    <div className="flex justify-between items-center bg-slate-900/60 rounded-lg px-2 py-1 border border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400">PONTUAÇÃO CO-PILOTO</span>
                      <span className="text-[10px] font-extrabold text-amber-400 font-mono">
                        {calculatedScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-center text-[8.5px]">
                      <div className="bg-slate-905 p-1 rounded border border-slate-900">
                        <span className="text-slate-500 block">R$/KM FINAL</span>
                        <span className="font-extrabold font-mono text-slate-200">R$ {rPerKm.toFixed(2)}/km</span>
                      </div>
                      <div className="bg-slate-905 p-1 rounded border border-slate-900">
                        <span className="text-slate-500 block">LUCRO ESTIMADO</span>
                        <span className="font-extrabold font-mono text-emerald-400">R$ {netProfit.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className={`text-[9px] font-bold text-center mt-1 uppercase ${
                      calculatedScore >= 75 ? "text-emerald-400" : calculatedScore >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {calculatedScore >= 75 ? "💡 ACEITAR DE IMEDIATO" : calculatedScore >= 50 ? "🔔 DETALHES OK. ANALISE" : "❌ RECUSAR. DÁ PREJUÍZO!"}
                    </p>
                  </div>
                ) : (
                  <p className="text-[9.5px] text-slate-500 leading-normal mt-1.5">
                    Digite valores no smartphone ao lado ou simule OCR da mala direta para disparar o cálculo do overlay !
                  </p>
                )}
              </div>
            </div>

            <div className="text-[7.5px] text-center text-slate-500 border-t border-slate-900/40 pt-1.5 select-none uppercase tracking-wider font-mono">
              🖱️ Arraste-me para qualquer lugar da tela
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Companion Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-450 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-450/20">
              99
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                99 Copilot Assistant
                <span className="text-[10px] bg-amber-450/15 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-400/20">
                  Nativo Android (Kotlin)
                </span>
              </h1>
              <p className="text-xs text-slate-400">Simulador de tela flutuante, leitura local OCR e painel de controle MVVM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer ${
                showOverlay 
                  ? "bg-amber-400/10 border-amber-400/40 text-amber-300" 
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
              }`}
            >
              <Layout size={13} />
              <span>{showOverlay ? "Ocultar Overlay" : "Exibir Overlay Flutuante"}</span>
            </button>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs text-slate-400 select-none shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Room SQLite Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Interface */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        
        {/* Left column (7 Columns on desktop): Features list, explanation of native code downloads */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main explanation card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
            
            <span className="text-[9.5px] font-extrabold text-amber-450 uppercase tracking-widest bg-amber-400/10 border border-amber-450/20 rounded-full px-2.5 py-1 inline-block mb-3.5 leading-none">
              Inovação para Motoristas Parceiros 🇧🇷
            </span>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              Analisador de Viagens Instantâneo e Autônomo
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              O <strong>99 Copilot</strong> é um assistente completo desenvolvido em Kotlin nativo para Android. Ele usa canais de <strong>Acessibilidade</strong> no Android para ler instantaneamente o valor das ofertas que entram no dispositivo da 99, calculando ganho por km, custo do combustível e faturamento líquido real para dar ao motorista uma recomendação segura em forma de semáforo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6">
              <div className="bg-slate-950/70 border border-slate-900/80 p-3.5 rounded-xl flex items-start gap-2.5">
                <span className="text-emerald-400 text-xl">🟢</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Excellent Grade</h4>
                  <p className="text-[10px] text-slate-450 mt-1">Gera nota maior que 75. Excelente faturamento líquido. Aceite sem medo.</p>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-900/80 p-3.5 rounded-xl flex items-start gap-2.5">
                <span className="text-amber-400 text-xl">🟡</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Acceptable Grade</h4>
                  <p className="text-[10px] text-slate-450 mt-1">Entre meta amarela e verde. Razoável. O motorista decide com base no trânsito.</p>
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-900/80 p-3.5 rounded-xl flex items-start gap-2.5">
                <span className="text-rose-400 text-xl">🔴</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Unrecommended</h4>
                  <p className="text-[10px] text-slate-450 mt-1">Dá prejuízo após descontar despesas de combustível por litro. Recuse.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Native code visualizer companion tabs */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-900 gap-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileCode size={18} className="text-amber-450" />
                  Visualizador de Scripts Nativos (NFC/Room)
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Veja a lógica real em Kotlin utilizada no projeto do Android Studio</p>
              </div>
              
              <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
                {androidFiles.map((f, i) => (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFileIndex(i)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                      selectedFileIndex === i
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-900 text-[11px] text-slate-350 leading-relaxed">
                <strong>Localização:</strong> <span className="font-mono text-amber-300 text-[10px]">{androidFiles[selectedFileIndex].path}</span>
                <p className="mt-1 text-slate-400 font-medium">{androidFiles[selectedFileIndex].description}</p>
              </div>

              {/* Native view code snippet */}
              <div className="relative rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden group">
                <button
                  onClick={() => handleCopyFilesSource(selectedFileIndex, androidFiles[selectedFileIndex].content)}
                  className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-wider flex items-center gap-1.5 transition uppercase hover:scale-101 cursor-pointer"
                >
                  {copiedIndex === selectedFileIndex ? (
                    <>
                      <CheckCircle size={10} className="text-emerald-400" />
                      COPIADO!
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      COPIAR
                    </>
                  )}
                </button>
                <div className="p-5 font-mono text-[10px] text-slate-400 max-h-[380px] overflow-y-auto select-text scrollbar-thin leading-relaxed">
                  <pre className="whitespace-pre">{androidFiles[selectedFileIndex].content}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Quick installation steps for users */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Compass size={18} className="text-amber-450" />
              Diretrizes de Implantação e Recursos Nativos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/40 border border-slate-905 p-4 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Serviço de Acessibilidade 🚦
                </h4>
                <p className="text-[11px] text-slate-400">
                  O arquivo <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded text-[10px]">AnalysisService.kt</code> implementa o crawler de tela local. Ele lê os layouts do celular procurando strings de preços e distâncias pelo app oficial da 99 sem simular toques, mantendo a integridade de termos de uso.
                </p>
              </div>

              <div className="bg-slate-950/40 border border-slate-905 p-4 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Vantagens do Banco Offline Room 💾
                </h4>
                <p className="text-[11px] text-slate-400">
                  A persistência ocorre instantaneamente no SQLite nativo via Room Database. Sem uso de nuvem ou APIs remotas externas de alto consumo de dados móveis, garantindo estabilidade e baixo nível de bateria mesmo rodando no trânsito.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Right column (5 Columns on desktop): Golden tactile smartphone preview mockup */}
        <section className="lg:col-span-5 flex flex-col items-center">
          
          <div className="w-full max-w-[340px] mb-3 text-center lg:text-left flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Smartphone size={12} className="text-amber-400" />
              99 Copilot Simulador
            </span>
            <span className="text-[9.5px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              Full Stack Mockup
            </span>
          </div>

          {/* Interactive tactile smartphone frame */}
          <div 
            className={`relative w-full max-w-[340px] h-[590px] bg-slate-950 rounded-[44px] border-[10px] border-slate-900 shadow-2xl overflow-hidden transition-transform duration-100 ${
              isShaking ? "animate-vibrate scale-[0.985] bg-amber-500/10" : ""
            }`}
          >
            {/* Speaker & notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-900 rounded-full z-45 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
              <div className="w-8 h-1 bg-slate-800 rounded mx-3" />
            </div>

            {/* Simulated Android Status bar */}
            <div className="h-8 px-6 pt-2 bg-slate-950 text-slate-500 text-[9px] font-mono flex justify-between items-center z-30 select-none border-b border-slate-900/60">
              <span className="font-bold">12:30</span>
              <div className="flex items-center gap-1.5">
                <Vibrate size={11} className={vibrateEnabled ? "text-amber-400" : "text-slate-700"} />
                <span className="text-[8px] font-extrabold text-slate-400">99 OK</span>
                <span className="border border-slate-800 rounded px-1 py-0.2 text-[7.5px] text-slate-400">92%</span>
              </div>
            </div>

            {/* Smartphone core viewport screen */}
            <div className="relative h-[calc(100%-32px-56px)] bg-slate-950 text-slate-200 overflow-y-auto p-4 flex flex-col scrollbar-thin">
              
              <AnimatePresence mode="wait">
                
                {/* 1. ANALISI CALCULATION TAB SCREEN */}
                {activeTab === "analisar" && (
                  <motion.div
                    key="analisar"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-4 flex-grow"
                  >
                    {/* Header in smartphone */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                      <div>
                        <h3 className="font-extrabold text-xs text-white">99 Copilot Assistant</h3>
                        <p className="text-[7.5px] text-slate-500 font-mono">Simulador de Ofertas de Corrida</p>
                      </div>
                      <span className="text-[8.5px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">
                        MONITORANDO
                      </span>
                    </div>

                    {/* Predefined ML Kit OCR click triggers */}
                    <div className="flex flex-col gap-2 bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl">
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        📸 Simular detecção OCR (ML Kit Local):
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => triggerSimulatedOcr("vip")}
                          className={`px-1 py-2 rounded-lg text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                            activeSimulatedTemplate === "vip" 
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                              : "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          🔥 R$ 68,00 VIP
                        </button>
                        <button
                          onClick={() => triggerSimulatedOcr("medium")}
                          className={`px-1 py-2 rounded-lg text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                            activeSimulatedTemplate === "medium" 
                              ? "bg-amber-500/20 border-amber-400 text-amber-300"
                              : "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          🚗 R$ 22,50 OK
                        </button>
                        <button
                          onClick={() => triggerSimulatedOcr("ruim")}
                          className={`px-1 py-2 rounded-lg text-[8.5px] font-extrabold border transition-all cursor-pointer ${
                            activeSimulatedTemplate === "ruim" 
                              ? "bg-red-500/20 border-red-400 text-rose-300"
                              : "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          ⚠️ R$ 13,40 Ruim
                        </button>
                      </div>
                    </div>

                    {/* OCR active simulated scanner status */}
                    {ocrStatus === "reading" && (
                      <div className="bg-amber-400/10 border border-amber-450/20 rounded-xl p-3 text-center flex flex-col gap-1 items-center justify-center">
                        <span className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        <span className="text-[9.5px] font-bold text-amber-300 uppercase tracking-widest mt-1">Lendo tela com ML Kit...</span>
                      </div>
                    )}

                    {/* Display card results dashboard */}
                    {canAnalyzeComp && ocrStatus !== "reading" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-3.5 border text-center relative overflow-hidden ${
                          calculatedScore >= 75
                            ? "bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/5"
                            : calculatedScore >= 50
                            ? "bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/5"
                            : "bg-red-950/30 border-red-500/50 shadow-md shadow-red-500/5"
                        }`}
                      >
                        {/* Rating Star Badge */}
                        <div className="flex items-center justify-center gap-1 animate-pulse">
                          <span className="text-xl">{calculatedScore >= 75 ? "🟢" : calculatedScore >= 50 ? "🟡" : "🔴"}</span>
                          <span className="text-xs font-black text-slate-300">{activeFeedback.stars}</span>
                        </div>
                        <h4 className={`text-sm font-black tracking-tight mt-1 uppercase ${
                          calculatedScore >= 75 ? "text-emerald-400" : calculatedScore >= 50 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          Nota {calculatedScore}/100 • {calculatedScore >= 75 ? "EXCELENTE" : calculatedScore >= 50 ? "MÉDIA" : "PREJUÍZO!"}
                        </h4>

                        <p className="text-[9.5px] text-slate-350 italic mt-0.5 font-medium leading-normal">
                          &ldquo;{activeFeedback.feedback}&rdquo;
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                          <div className="bg-black/40 border border-slate-900 rounded-xl p-2 flex flex-col">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase">Faturamento por Km</span>
                            <span className="text-xs font-black text-slate-100 mt-0.5">R$ {rPerKm.toFixed(2)}/km</span>
                          </div>
                          <div className="bg-black/40 border border-slate-900 rounded-xl p-2 flex flex-col">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase">Lucro Líquido Real</span>
                            <span className="text-xs font-black text-emerald-450 mt-0.5">R$ {netProfit.toFixed(2)}</span>
                          </div>
                          <div className="bg-black/40 border border-slate-900 rounded-xl p-2 flex flex-col col-span-2 text-center">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Gasto Estimado de Combustível</span>
                            <span className="text-xs font-black text-slate-200 mt-0.5">R$ {fuelCost.toFixed(2)} (<span className="text-amber-400 font-bold">{(distNum + searchDistNum).toFixed(1)}km</span> totais)</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      ocrStatus !== "reading" && (
                        <div className="bg-slate-900/40 border border-slate-900/70 p-5 rounded-2xl text-center text-slate-500 flex flex-col gap-2 items-center justify-center">
                          <span className="text-2xl opacity-40">🚦</span>
                          <p className="text-[10px] font-medium leading-normal">
                            O semáforo flutuante avalia automaticamente preenchendo os dados abaixo!
                          </p>
                        </div>
                      )
                    )}

                    {/* Numeric analysis dashboard fields */}
                    <div className="bg-slate-900/60 border border-slate-900 p-3.5 rounded-2xl flex flex-col gap-2.5">
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <DollarSign size={9} className="text-amber-400" />
                            Valor (R$)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inputValor}
                            onChange={(e) => setInputValor(e.target.value)}
                            placeholder="Ex: 25,00"
                            className="bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <MapPin size={9} className="text-amber-400" />
                            Corrida (km)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inputDistance}
                            onChange={(e) => setInputDistance(e.target.value)}
                            placeholder="Ex: 8.5"
                            className="bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock size={9} className="text-amber-400" />
                            Tempo (min)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputTime}
                            onChange={(e) => setInputTime(e.target.value)}
                            placeholder="Ex: 20"
                            className="bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Plus size={10} className="text-amber-400" />
                            Busca (km)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inputSearchDistance}
                            onChange={(e) => setInputSearchDistance(e.target.value)}
                            placeholder="Ex: 1,5"
                            className="bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                          Bairro / Região Do Destino:
                        </label>
                        <input
                          type="text"
                          value={inputRegion}
                          onChange={(e) => setInputRegion(e.target.value)}
                          placeholder="Ex: Pinheiros"
                          className="bg-slate-950 border border-slate-850 px-2.5 py-2 rounded-xl text-xs font-extrabold text-white focus:outline-none focus:border-amber-450"
                        />
                      </div>

                      {/* Interactive save CTA button */}
                      <button
                        onClick={handleAnalyzeAndSave}
                        className="w-full bg-amber-450 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase py-2.5 rounded-xl mt-1 tracking-wider transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-md"
                      >
                        SIMULAR MONITORAMENTO 🚦
                      </button>

                    </div>
                  </motion.div>
                )}

                {/* 2. STATS & ANALYTICAL DASHBOARD TAB SCREEN */}
                {activeTab === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-3.5 flex-grow"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                      <div>
                        <h3 className="font-extrabold text-xs text-white">Painel Operacional</h3>
                        <p className="text-[7.5px] text-slate-500 font-mono">SQLite Room Database Histórico</p>
                      </div>
                      <span className="text-[8px] bg-amber-400/10 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/20">
                        HOJE
                      </span>
                    </div>

                    {/* Numeric aggregator metrics tiles */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-xl flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Lucro Líquido Real</span>
                        <span className="text-sm font-black text-emerald-450 font-mono">R$ {totalNetGains.toFixed(2)}</span>
                        <span className="text-[7px] text-slate-450">Descontados Combustíveis</span>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-xl flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Ganho Médio / Km</span>
                        <span className="text-sm font-black text-slate-100 font-mono">R$ {avgKmGainRate.toFixed(2)}/km</span>
                        <span className="text-[7px] text-slate-450 font-medium">Meta ideal: R$ {minGood.toFixed(2)}</span>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-xl flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Taxa de Aceitação</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-sm font-black font-mono ${
                            currentAcceptanceRateCalculated >= desiredAcceptRate ? "text-emerald-400" : "text-amber-400"
                          }`}>{currentAcceptanceRateCalculated}%</span>
                          <span className="text-[7.5px] text-slate-400 mt-0.5">Meta: {desiredAcceptRate}%</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-900 p-2.5 rounded-xl flex flex-col gap-0.5 select-none">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Melhor Região/Bairro</span>
                        <span className="text-xs font-black text-amber-300 truncate mt-0.5">{bestRegionCalculated}</span>
                        <span className="text-[7px] text-slate-450">Maior rentabilidade líquida</span>
                      </div>
                    </div>

                    {/* Simple Custom SVG Revenue progression chart */}
                    <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 flex flex-col gap-2">
                      <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-widest block">
                        Rendimento Líquido Diário Estimado (R$):
                      </span>
                      
                      <div className="h-20 flex items-end justify-between px-1.5 pt-4 gap-2.5">
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div className="w-full bg-slate-800 rounded-md h-[25%] transition-all" />
                          <span className="text-[7.5px] font-bold text-slate-500 font-mono leading-none">SEG</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div className="w-full bg-slate-800 rounded-md h-[40%] transition-all" />
                          <span className="text-[7.5px] font-bold text-slate-500 font-mono leading-none">TER</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div className="w-full bg-slate-800 rounded-md h-[50%] transition-all" />
                          <span className="text-[7.5px] font-bold text-slate-500 font-mono leading-none">QUA</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div className="w-full bg-slate-800 rounded-md h-[75%] transition-all" />
                          <span className="text-[7.5px] font-bold text-slate-500 font-mono leading-none">QUI</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                          <div className="w-full bg-amber-400 rounded-md h-[95%] transition-all shadow shadow-amber-400/10 animate-pulse" />
                          <span className="text-[7.5px] font-extrabold text-amber-300 font-mono leading-none">HOJE</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational report feedback */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 flex items-start gap-2 text-slate-350">
                      <TrendingUp size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-[9px] leading-relaxed">
                        Seu ganho médio por Km de <strong className="text-white">R$ {avgKmGainRate.toFixed(2)}/km</strong> é {avgKmGainRate >= minGood ? "superior" : "inferior"} à meta green configurada. Ao utilizar o Copilot, a lucratividade mensal estimada aumenta em até <strong className="text-emerald-400 font-bold">28%</strong> reduzindo desgaste mecânico desnecessário!
                      </p>
                    </div>

                  </motion.div>
                )}

                {/* 3. DETAILED LOCAL HISTÓRICO TAB WITH INTERACTIVE DECISION TOGGLE */}
                {activeTab === "historico" && (
                  <motion.div
                    key="historico"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-3 flex-grow"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                      <div className="flex items-center gap-2">
                        <History size={13} className="text-amber-450" />
                        <h3 className="font-extrabold text-xs text-white">Histórico Room DB</h3>
                      </div>
                      
                      {history.length > 0 && (
                        <button
                          onClick={handleClearHistory}
                          className="text-[8.5px] text-rose-400 font-black flex items-center gap-1 hover:underline cursor-pointer bg-slate-900 px-2 py-1 rounded"
                        >
                          <Trash2 size={10} />
                          Limpar Room
                        </button>
                      )}
                    </div>

                    <div className="text-[8px] bg-amber-400/10 border border-amber-400/20 text-amber-300 p-2 rounded-lg font-semibold leading-relaxed">
                      💡 <strong>Dica do Dashboard:</strong> Clique na ação (<strong>Aceitou/Recusou</strong>) das viagens abaixo para alterná-las e recalcular seu lucro real!
                    </div>

                    <div className="flex-grow overflow-y-auto max-h-[300px] flex flex-col gap-2.5 pr-0.5 scrollbar-thin">
                      {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 flex flex-col gap-2 items-center justify-center">
                          <span className="text-2xl opacity-40">⏳</span>
                          <p className="text-[10px] font-medium leading-normal">
                            Histórico do banco está vazio.<br />As simulações persistirão aqui!
                          </p>
                        </div>
                      ) : (
                        history.map((record) => (
                          <div
                            key={record.id}
                            className="bg-slate-900/50 border border-slate-900 px-3 py-2.5 rounded-xl flex items-center justify-between gap-1.5"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-black text-white leading-none">
                                  R$ {record.val.toFixed(2)}
                                </span>
                                <span className="text-[8px] font-mono font-extrabold text-amber-450 bg-amber-450/5 border border-amber-450/15 px-1 rounded">
                                  Score {record.score}
                                </span>
                              </div>
                              <span className="text-[8px] text-slate-500 font-medium truncate">
                                {record.dist}km (+{record.searchDistance}km busca) • {record.region}
                              </span>
                              <span className="text-[8.5px] text-slate-350 leading-none mt-1">
                                R$ {record.rPerKm.toFixed(2)}/km • Lucro líq:{" "}
                                <strong className="text-emerald-400 font-mono">
                                  R$ {record.netProfit.toFixed(2)}
                                </strong>
                              </span>
                            </div>

                            {/* Toggables interactive driver action buttons */}
                            <button
                              onClick={() => toggleRideAccepted(record.id)}
                              className={`text-[8.5px] font-black px-2 py-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                record.isAccepted
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              }`}
                            >
                              {record.isAccepted ? "ACEITOU" : "RECUSOU"}
                            </button>

                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 4. ADVANCED USER PREFERENCES CONFIG SCREEN */}
                {activeTab === "ajustes" && (
                  <motion.div
                    key="ajustes"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-4 flex-grow"
                  >
                    <div className="flex items-center pb-2 border-b border-slate-900 gap-2">
                      <Sliders size={13} className="text-amber-450" />
                      <h3 className="font-extrabold text-xs text-white">Objetivos Operacionais</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                      
                      {/* Vehicle km/l rating config */}
                      <div className="flex flex-col gap-1 inline-block">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                          Consumo do Carro (km/L):
                        </label>
                        <input
                          type="number"
                          value={kmPerLitre}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1.0;
                            setKmPerLitre(val);
                            localStorage.setItem("copilot_km_per_litre", val.toString());
                          }}
                          className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                        />
                      </div>

                      {/* Gas Price config */}
                      <div className="flex flex-col gap-1 inline-block">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                          Preço do Combustível (R$/L):
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={fuelPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.1;
                            setFuelPrice(val);
                            localStorage.setItem("copilot_fuel_price", val.toString());
                          }}
                          className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-450 font-mono"
                        />
                      </div>

                      {/* Minimum Threshold Km rate Good trigger */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-350">🟢 Meta Excelente / km</span>
                          <span className="font-mono text-emerald-400 bg-emerald-500/5 px-1.5 rounded border border-emerald-500/10 py-0.2">
                            R$ {minGood.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.2"
                          max="4.0"
                          step="0.10"
                          value={minGood}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val >= minMedium) {
                              setMinGood(val);
                              localStorage.setItem("copilot_km_good", val.toString());
                            } else {
                              triggerToast("⚠️", "A meta excelente deve ser igual ou superior à aceitável.");
                            }
                          }}
                          className="w-full accent-amber-450 h-1 rounded"
                        />
                      </div>

                      {/* Minimum Threshold Km rate Medium range */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-350">🟡 Meta Aceitável / km</span>
                          <span className="font-mono text-amber-300 bg-amber-500/5 px-1.5 rounded border border-amber-500/10 py-0.2">
                            R$ {minMedium.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="3.0"
                          step="0.10"
                          value={minMedium}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val <= minGood) {
                              setMinMedium(val);
                              localStorage.setItem("copilot_km_medium", val.toString());
                            } else {
                              triggerToast("⚠️", "A meta aceitável deve ser menor ou igual à excelente.");
                            }
                          }}
                          className="w-full accent-amber-450 h-1 rounded"
                        />
                      </div>

                      {/* Hour rate config target */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-350">⏱️ Faturamento Alvo / Hora</span>
                          <span className="font-mono text-amber-300 bg-amber-500/5 px-1.5 rounded border border-amber-500/10 py-0.2">
                            R$ {minHour.toFixed(1)}/h
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="5"
                          value={minHour}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMinHour(val);
                            localStorage.setItem("copilot_hour", val.toString());
                          }}
                          className="w-full accent-amber-450 h-1 rounded"
                        />
                      </div>

                      {/* Desired Acceptance Rate config slider */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-350">📈 Meta de Aceitação desejada</span>
                          <span className="font-mono text-amber-300 bg-amber-500/5 px-1.5 rounded border border-amber-500/10 py-0.2">
                            {desiredAcceptRate}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="95"
                          step="5"
                          value={desiredAcceptRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setDesiredAcceptRate(val);
                            localStorage.setItem("copilot_accept_rate", val.toString());
                          }}
                          className="w-full accent-amber-450 h-1 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-xl mt-1 text-[9.5px]">
                        <div>
                          <strong>Vibrar na análise</strong>
                          <p className="text-[7.5px] text-slate-500">Feedback físico no celular</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                          <input 
                            type="checkbox" 
                            checked={vibrateEnabled}
                            onChange={() => {
                              setVibrateEnabled(!vibrateEnabled);
                              localStorage.setItem("copilot_vibrate", (!vibrateEnabled).toString());
                              if (!vibrateEnabled && navigator.vibrate) {
                                navigator.vibrate(100);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400 peer-checked:after:bg-slate-950"></div>
                        </label>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 5. APP DEPLOY & STANDALONE FILE INFO SCREEN */}
                {activeTab === "codigo" && (
                  <motion.div
                    key="codigo"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="flex flex-col gap-3 flex-grow text-slate-300 text-[10px]"
                  >
                    <div className="flex items-center pb-2 border-b border-slate-900 gap-2">
                      <HelpCircle size={14} className="text-amber-450" />
                      <h3 className="font-extrabold text-xs text-white">Empacotar para Celular</h3>
                    </div>

                    <div className="flex flex-col gap-2.5 leading-relaxed overflow-y-auto max-h-[350px]">
                      <p>
                        O 99 Copilot foi projetado para rodar offline e ocupar pouca bateria com o motorista dirigindo:
                      </p>
                      
                      <ol className="list-decimal pl-4 flex flex-col gap-2.5 text-slate-400">
                        <li>
                          Baixe o arquivo standalone clicando em <strong>BAIXAR INDEX.HTML</strong> no tutorial do painel lateral.
                        </li>
                        <li>
                          Instale no celular qualquer compilador Web-to-APK (como WebToAPK do Android).
                        </li>
                        <li>
                          Importe o index.html, digite "99 Copilot" de nome e gere seu APK instalável sem custos!
                        </li>
                      </ol>

                      <div className="mt-3 bg-amber-400/5 border border-amber-400/20 p-2.5 rounded-xl text-amber-300 flex gap-2">
                        <Info size={13} className="shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong>Compilado Localizado:</strong> O dashboard nativo em Kotlin também pode ser sincronizado editando os arquivos expostos ao lado!
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* Bottom Smartphone Live Tab navigation */}
            <nav className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 py-2.5 px-2 flex justify-around select-none border-b rounded-b-[44px]">
              <button
                onClick={() => setActiveTab("analisar")}
                className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  activeTab === "analisar" ? "text-amber-450 scale-[1.03]" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <Smartphone size={13} />
                <span className="text-[7.5px] font-black uppercase tracking-wider">Cálculo</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  activeTab === "dashboard" ? "text-amber-450 scale-[1.03]" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <Percent size={13} />
                <span className="text-[7.5px] font-black uppercase tracking-wider">Painel</span>
              </button>

              <button
                onClick={() => setActiveTab("historico")}
                className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  activeTab === "historico" ? "text-amber-450 scale-[1.03]" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <History size={13} />
                <span className="text-[7.5px] font-black uppercase tracking-wider">History</span>
              </button>

              <button
                onClick={() => setActiveTab("ajustes")}
                className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  activeTab === "ajustes" ? "text-amber-450 scale-[1.03]" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <Sliders size={13} />
                <span className="text-[7.5px] font-black uppercase tracking-wider">Metas</span>
              </button>

              <button
                onClick={() => setActiveTab("codigo")}
                className={`flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  activeTab === "codigo" ? "text-amber-450 scale-[1.03]" : "text-slate-600 hover:text-slate-400"
                }`}
              >
                <HelpCircle size={13} />
                <span className="text-[7.5px] font-black uppercase tracking-wider">Como Usar</span>
              </button>
            </nav>

          </div>

        </section>

      </main>

      {/* Toast Alert module inside App interface overlay layer */}
      <div 
        className={`fixed z-50 bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 backdrop-blur-md py-2.5 px-5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none transition-all duration-300 ${
          toast.show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <span className="text-base leading-none">{toast.icon}</span>
        <span className="text-xs font-black text-white">{toast.message}</span>
      </div>

      {/* Footer System Branding & Release labels */}
      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-[10px] select-none uppercase tracking-wide">
        <p>© 2026 99 Copilot Assistant • Design Responsivo & Sincronização Room Database</p>
        <p className="mt-1">Nativo Android Kotlin (MVVM) • Todos os Termos de Uso Protegidos</p>
      </footer>

    </div>
  );
}

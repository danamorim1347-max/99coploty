/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone, 
  Settings, 
  FileCode, 
  Check, 
  Copy, 
  Sliders, 
  ShieldAlert, 
  Volume2, 
  Info,
  Layers, 
  Play, 
  X, 
  HelpCircle,
  Code,
  CheckCircle,
  Eye,
  TrendingUp,
  MapPin,
  Compass,
  AlertTriangle,
  Folder,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Moon,
  Sun
} from "lucide-react";
import { androidFiles } from "./data/androidFiles";

// Definindo Interface para a Corrida do Simulador
interface RidePreset {
  id: string;
  name: string;
  value: number;
  distance: number;
  duration: number;
  origin: string;
  destination: string;
  rawText: string;
}

export default function App() {
  // Seletor de Modo de Visualização Principal: 'combo' (PC Integrado) ou 'apk' (Celular em Tela Cheia)
  const [viewMode, setViewMode] = useState<"combo" | "apk">("combo");
  // Aba selecionada no modo APK
  const [apkTab, setApkTab] = useState<"dashboard" | "settings" | "simulator" | "code" | "help">("dashboard");

  // Auto-detectar se é tela pequena (mobile) na inicialização para entrar direto no modo APK
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024) {
        setViewMode("apk");
      }
    }
  }, []);

  // --- STATE DO SIMULADOR ---
  const [minKmGood, setMinKmGood] = useState<number>(3.0);
  const [minKmMedium, setMinKmMedium] = useState<number>(2.0);
  const [minHour, setMinHour] = useState<number>(50.0);
  const [isVibrateEnabled, setIsVibrateEnabled] = useState<boolean>(true);
  const [isOverlayEnabled, setIsOverlayEnabled] = useState<boolean>(true);
  
  // Permissões Simuladas do Telefone
  const [accessibilityPermitted, setAccessibilityPermitted] = useState<boolean>(true);
  const [overlayPermitted, setOverlayPermitted] = useState<boolean>(true);

  // Estados de Visualização Internos do Telefone
  // 'gigu_dashboard' | 'gigu_settings' | 'app_99'
  const [phoneScreen, setPhoneScreen] = useState<string>("gigu_dashboard");
  
  // Estado para aba selecionada no painel de Configurar Metas do Telefone
  const [tempKmGood, setTempKmGood] = useState<string>("3.0");
  const [tempKmMedium, setTempKmMedium] = useState<string>("2.0");
  const [tempHour, setTempHour] = useState<string>("50.0");
  
  // Corrida Ativa no Simulador 99
  const [activeRide, setActiveRide] = useState<RidePreset | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  
  // Controle do Overlay Flutuante do Semáforo
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [overlayData, setOverlayData] = useState<{
    value: number;
    distance: number;
    duration: number;
    valuePerKm: number;
    valuePerHour: number;
    classification: "GOOD" | "MEDIUM" | "BAD";
    emoji: string;
  } | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<number>(5); // 5 segundos
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

  // --- STATE DO CODE EXPLORER ---
  const [selectedFile, setSelectedFile] = useState<typeof androidFiles[0]>(androidFiles[0]);
  const [copiedFileId, setCopiedFileId] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "app": true,
    "app/src": true,
    "app/src/main": true,
    "app/src/main/java": true,
    "app/src/main/res": true,
    "app/src/main/res/layout": true,
  });

  // Presets de corridas da 99 para simulação rápida
  const ridePresets: RidePreset[] = [
    {
      id: "ride_good",
      name: "Excelente (Verde 🟢)",
      value: 22.50,
      distance: 4.5,
      duration: 12,
      origin: "Jardins, Al. Lorena 1400",
      destination: "Av. Paulista, Shopping Cidade São Paulo",
      rawText: "99Oferta!\nCorrida para você:\nValor: R$ 22,50\nDistância: 4.5 km\nTempo estimado: 12 min\nAceitar?"
    },
    {
      id: "ride_medium",
      name: "Aceitável (Amarelo 🟡)",
      value: 14.80,
      distance: 6.2,
      duration: 15,
      origin: "Vila Olímpia, R. Funchal",
      destination: "Pinheiros, R. dos Pinheiros 800",
      rawText: "99 Oferta de Viagem\nMotorista Parceiro\nFaturamento: R$ 14,80\nDistância completa: 6,2km\nTempo estimado de percurso: 15minutos"
    },
    {
      id: "ride_bad",
      name: "Prejuízo (Vermelho 🔴)",
      value: 9.20,
      distance: 11.5,
      duration: 25,
      origin: "Moema, Av. Ibirapuera",
      destination: "Ipiranga, R. Silva Bueno",
      rawText: "Oferta Recusável - 99\nViagem individual\nR$9,20 no total\nPercurso aproximado de 11.5km\nDuração prevista: 25 minutos"
    },
    {
      id: "ride_short",
      name: "Curta & Excelente (Verde 🟢)",
      value: 12.00,
      distance: 1.8,
      duration: 6,
      origin: "Consolação, Metrô",
      destination: "Bela Vista, R. Augusta 450",
      rawText: "Popup 99\nR$ 12,00\n1.8 km\n6 min"
    }
  ];

  // Sincronizar inputs temporários quando abre configurações
  useEffect(() => {
    if (phoneScreen === "gigu_settings") {
      setTempKmGood(minKmGood.toString());
      setTempKmMedium(minKmMedium.toString());
      setTempHour(minHour.toString());
    }
  }, [phoneScreen]);

  // Função para lidar com o trigger de análise quando uma corrida aparece na 99
  const triggerRideAnalysis = (ride: { value: number; distance: number; duration: number; rawText: string }) => {
    // 1. Simular o parseador Regex idêntico ao Kotlin
    const parsedValue = ride.value;
    const parsedDistance = ride.distance;
    const parsedDuration = ride.duration;

    const valPerKm = parsedDistance > 0 ? parsedValue / parsedDistance : 0;
    const valPerHour = parsedDuration > 0 ? parsedValue / (parsedDuration / 60) : 0;

    // Classificação conforme limites
    let classification: "GOOD" | "MEDIUM" | "BAD" = "BAD";
    let emoji = "🔴";

    if (valPerKm >= minKmGood && valPerHour >= minHour) {
      classification = "GOOD";
      emoji = "🟢";
    } else if (valPerKm >= minKmMedium) {
      classification = "MEDIUM";
      emoji = "🟡";
    } else {
      classification = "BAD";
      emoji = "🔴";
    }

    // Configura dados do overlay flutuante
    setOverlayData({
      value: parsedValue,
      distance: parsedDistance,
      duration: parsedDuration,
      valuePerKm: valPerKm,
      valuePerHour: valPerHour,
      classification,
      emoji
    });

    // Vibrar se ativo
    if (isVibrateEnabled) {
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 400);
    }

    // Mostrar overlay se permissões estão ok
    if (accessibilityPermitted && overlayPermitted && isOverlayEnabled) {
      setShowOverlay(true);
      setTimeLeft(5);

      // Limpar timers anteriores se existirem
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Inicia contagem regressiva visual
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);

      // Auto ocultar após 5 segundos
      timerRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 5000);
    }
  };

  // Disparar Preset selecionado
  const handleSelectPreset = (preset: RidePreset) => {
    setActiveRide(preset);
    setCustomText(preset.rawText);
    triggerRideAnalysis(preset);
  };

  // Processar texto customizado inserido pelo motorista
  const handleProcessCustomText = () => {
    if (!customText.trim()) return;

    // Regexes idênticas ao Kotlin no AnalysisService:
    // 1. Preço: R$ XX.XX
    const priceRegex = /R\$\s*(\d+[,.]\d{2})/;
    // 2. Distância: XX.X km
    const distRegex = /(\d+[,.]?\d*)\s*(?:km|KM)/;
    // 3. Tempo: XX min
    const timeRegex = /(\d+)\s*(?:min|minutos)/;

    const priceMatch = customText.match(priceRegex);
    const distMatch = customText.match(distRegex);
    const timeMatch = customText.match(timeRegex);

    let val = 12.50;
    let dst = 4.2;
    let tme = 10;

    if (priceMatch) {
      val = parseFloat(priceMatch[1].replace(",", "."));
    }
    if (distMatch) {
      dst = parseFloat(distMatch[1].replace(",", "."));
    }
    if (timeMatch) {
      tme = parseInt(timeMatch[1], 10);
    }

    const customRide: RidePreset = {
      id: "custom_ride",
      name: "Texto Bruto Capturado",
      value: val,
      distance: dst,
      duration: tme,
      origin: "Origem Detectada no App",
      destination: "Destino Detectado no App",
      rawText: customText
    };

    setActiveRide(customRide);
    triggerRideAnalysis(customRide);
  };

  // Salvar configurações no simulador
  const handleSaveSettings = () => {
    const kmGood = parseFloat(tempKmGood) || 3.0;
    const kmMedium = parseFloat(tempKmMedium) || 2.0;
    const hour = parseFloat(tempHour) || 50.0;

    if (kmMedium > kmGood) {
      alert("Alerta: O valor aceitável (amarelo) não deve ser maior que o valor excelente (verde)!");
      return;
    }

    setMinKmGood(kmGood);
    setMinKmMedium(kmMedium);
    setMinHour(hour);
    setPhoneScreen("gigu_dashboard");
  };

  // Copiar código do arquivo selecionado
  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFileId(true);
    setTimeout(() => setCopiedFileId(false), 2000);
  };

  // Formatar código Kotlin de forma legível (com highlight básico manual de regexes)
  const renderCodeSnippet = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Highlight simples de palavras-chave
      let formattedLine = line
        .replace(/(package|import|class|interface|data class|enum class|override fun|fun|private lateinit var|private var|val|var|return|if|else|when|try|catch|get\(\)|set\(\))(\s+)/g, '<span class="text-amber-400 font-semibold">$1</span>$2')
        .replace(/(override|private|public|internal|inline|get|set)(\s+)/g, '<span class="text-amber-400 font-semibold">$1</span>$2')
        .replace(/("[^"]*")/g, '<span class="text-green-400">$1</span>')
        .replace(/(\/\/.*)/g, '<span class="text-zinc-650 italic">$1</span>');

      return (
        <div key={i} className="table-row">
          <span className="table-cell text-right text-zinc-600 pr-4 select-none text-xs w-8 border-r border-zinc-900 mr-2">{i + 1}</span>
          <span className="table-cell pl-4 text-zinc-350 whitespace-pre font-mono text-xs" dangerouslySetInnerHTML={{ __html: formattedLine }}></span>
        </div>
      );
    });
  };

  // Toggle expansão das pastas de código
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Componente de pasta no explorer
  const FolderNode = ({ name, path, childrenCount, root = false }: { name: string, path: string, childrenCount?: number, root?: boolean }) => {
    const isExpanded = expandedFolders[path];
    return (
      <div 
        onClick={() => toggleFolder(path)}
        className="flex items-center gap-1.5 py-1.5 px-2.5 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-300 font-sans text-xs select-none transition"
        style={{ paddingLeft: root ? "8px" : `${(path.split('/').length) * 10}px` }}
      >
        <ChevronRight size={14} className={`text-zinc-500 transition-transform ${isExpanded ? "rotate-90 text-zinc-300" : ""}`} />
        <Folder size={14} className="text-amber-500 fill-amber-950/40 border border-amber-500/20" />
        <span className="font-medium">{name}</span>
        {childrenCount !== undefined && <span className="text-[10px] text-zinc-500 font-mono">({childrenCount})</span>}
      </div>
    );
  };

  if (viewMode === "apk") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-24">
        {/* HEADER */}
        <header className="bg-zinc-950/90 border-b border-zinc-900 backdrop-blur-md sticky top-0 z-40 px-5 py-4 shrink-0">
          <div className="max-w-md mx-auto flex justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚦</span>
              <div>
                <h1 className="text-sm font-black text-white leading-none">99 Ride Analyzer</h1>
                <span className="text-[9px] text-amber-505 font-bold font-mono tracking-wider">APK BUILD v2.4</span>
              </div>
            </div>
            
            {/* Toggle de retorno */}
            <button
              onClick={() => setViewMode("combo")}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-805 text-[10px] font-bold text-zinc-300 rounded-xl hover:text-white transition flex items-center gap-1 cursor-pointer select-none"
            >
              <Layers size={10} />
              <span>Modo PC</span>
            </button>
          </div>
        </header>

        {/* CONTAINER CONTEÚDO */}
        <div className="flex-1 overflow-y-auto">
          {/* PAINEL (DASHBOARD TAB) */}
          {apkTab === "dashboard" && (
            <div className="max-w-md mx-auto p-4 flex flex-col gap-5">
              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-3xl shadow-lg">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Status de Monitoramento</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    ● AUTO-READ MOCK
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 font-bold">
                    APK READY
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-3xl flex gap-3 text-xs text-zinc-400 leading-relaxed">
                <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-500 mb-1 text-sm">Aviso de Empacotamento Web (WebToAPK):</h4>
                  Você instalou ou empacotou com o APK Creator (<strong>com.apkcreator.frankwebstudio</strong>). <br /><br />
                  Esta versão funciona como um excelente <strong>Painel e Simulador de bolso</strong>. <br /><br />
                  Para que o sensor de semáforo leia o app da 99 original de forma <strong>100% automática</strong>, é necessário compilar como código Kotlin nativo. Baixe o código completo na aba <strong>Código</strong> abaixo!
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-3xl">
                <h3 className="font-bold text-xs text-zinc-300 mb-3.5 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={13} className="text-amber-500" />
                  Metas Ativas do Filtrador
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-950 p-3 rounded-2xl text-center border border-zinc-850">
                    <p className="text-[9px] text-zinc-500 mb-1">🟢 Excelente</p>
                    <p className="text-xs font-black font-mono text-green-400">≥ R$ {minKmGood.toFixed(1)}/k</p>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-2xl text-center border border-zinc-850">
                    <p className="text-[9px] text-zinc-500 mb-1">🟡 Aceitável</p>
                    <p className="text-xs font-black font-mono text-yellow-500">≥ R$ {minKmMedium.toFixed(1)}/k</p>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-2xl text-center border border-zinc-850">
                    <p className="text-[9px] text-zinc-500 mb-1">⏱️ Ganhos/h</p>
                    <p className="text-xs font-black font-mono text-zinc-150">≥ R$ {minHour.toFixed(0)}/h</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-3xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-zinc-200">Efeitos Táteis / Vibração</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">Sinalizar fisicamente novas corridas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isVibrateEnabled}
                    onChange={() => setIsVibrateEnabled(!isVibrateEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-zinc-850 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-300 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
                </label>
              </div>
            </div>
          )}

          {/* METAS (SETTINGS TAB) */}
          {apkTab === "settings" && (
            <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-3xl shadow-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-850">Configurar Filtros</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase">Meta Verde Excelente (🟢 R$/km)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={tempKmGood}
                    onChange={(e) => setTempKmGood(e.target.value)}
                    className="w-full text-xs p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl text-white font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase">Meta Média Amarela (🟡 R$/km)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={tempKmMedium}
                    onChange={(e) => setTempKmMedium(e.target.value)}
                    className="w-full text-xs p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl text-white font-mono focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase">Meta de Retorno por Hora (R$/h)</label>
                  <input 
                    type="number" 
                    step="5"
                    value={tempHour}
                    onChange={(e) => setTempHour(e.target.value)}
                    className="w-full text-xs p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl text-white font-mono focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                  <input 
                    type="checkbox" 
                    id="checkVibrateApk"
                    checked={isVibrateEnabled}
                    onChange={() => setIsVibrateEnabled(!isVibrateEnabled)}
                    className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="checkVibrateApk" className="text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                    Vibrar ao receber nova corrida
                  </label>
                </div>

                <button
                  onClick={() => {
                    const kmGood = parseFloat(tempKmGood) || 3.0;
                    const kmMedium = parseFloat(tempKmMedium) || 2.0;
                    const hour = parseFloat(tempHour) || 50.0;
                    if (kmMedium > kmGood) {
                      alert("O valor excelente deve ser maior que o aceitável.");
                      return;
                    }
                    setMinKmGood(kmGood);
                    setMinKmMedium(kmMedium);
                    setMinHour(hour);
                    setApkTab("dashboard");
                    alert("Metas atualizadas com sucesso neste dispositivo!");
                  }}
                  className="w-full bg-amber-500 text-black py-4 rounded-2xl text-xs font-black cursor-pointer select-none"
                >
                  GRAVAR METAS
                </button>
              </div>
            </div>
          )}

          {/* SIMULADOR (SIMULATOR TAB) */}
          {apkTab === "simulator" && (
            <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
              <div className="relative w-full h-[250px] rounded-3xl border border-zinc-850 overflow-hidden bg-zinc-950 select-none">
                <div className="bg-[#FF5500] text-slate-950 px-3.5 py-1.5 flex justify-between items-center">
                  <span className="font-extrabold text-[9px] uppercase">99 Driver PRO</span>
                  <span className="text-[8px] bg-white px-2 py-0.5 rounded-full font-black">ONLINE</span>
                </div>
                
                <div className="absolute inset-0 top-7 bg-[#151518] flex items-center justify-center">
                  <Compass className="text-amber-500 animate-spin text-opacity-15" size={24} style={{ animationDuration: '8s' }} />
                  
                  {/* Floating Overlay semáforo rating */}
                  {showOverlay && overlayData && (
                    <div className={`absolute z-30 top-1.5 left-2 right-2 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl ${
                      overlayData.classification === "GOOD" ? "ring-1 ring-green-500/25" : overlayData.classification === "MEDIUM" ? "ring-1 ring-yellow-500/25" : "ring-1 ring-red-500/25"
                    }`}>
                      <div className="flex gap-2">
                        <span className="text-2xl animate-bounce">{overlayData.emoji}</span>
                        <div className="flex-1">
                          <p className="text-xs font-black text-white flex justify-between leading-none">
                            <span>R$ {overlayData.value.toFixed(2)}</span>
                            <button onClick={() => setShowOverlay(false)} className="text-zinc-500 text-[10px]">✕</button>
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                            {overlayData.distance}km • {overlayData.duration}min
                          </p>
                          <div className="text-[11px] font-bold text-amber-400 mt-1">
                            R$ {overlayData.valuePerKm.toFixed(2)}/km • R${overlayData.valuePerHour.toFixed(0)}/h
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRide && (
                    <div className="absolute bottom-1.5 left-2 right-2 bg-zinc-900 rounded-2xl p-3 border border-zinc-800 shadow-2xl flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[8px] font-black bg-[#FF5500]/10 text-[#FF5500] px-1.5 py-0.5 rounded">99Pop</span>
                          <span className="font-black text-white ml-1.5">R$ {activeRide.value.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{activeRide.distance}km • {activeRide.duration}m</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button onClick={() => { setActiveRide(null); setShowOverlay(false); }} className="bg-zinc-800 text-zinc-400 text-[10px] py-1.5 rounded-xl font-bold">Recusar</button>
                        <button onClick={() => { alert("Simulado: Chamada aceita no telefone!"); setActiveRide(null); setShowOverlay(false); }} className="bg-amber-400 text-black text-[10px] py-1.5 rounded-xl font-black">Aceitar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Presets and custom text triggers below */}
              <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-3xl flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Escolha um preset:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ridePresets.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`text-[10px] p-2.5 rounded-xl border text-left truncate transition cursor-pointer ${
                        activeRide?.id === p.id ? "bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold" : "bg-zinc-950 border-zinc-850 text-zinc-400"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-905 p-4 border border-zinc-850 rounded-3xl flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">Passe um texto do app da 99:</span>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Se copiar logs de corrida no zap de outros motoristas cole aqui..."
                  rows={2}
                  className="text-xs p-3 bg-zinc-950 border border-zinc-850 rounded-xl font-mono text-zinc-200 resize-none focus:outline-hidden"
                />
                <button
                  onClick={handleProcessCustomText}
                  className="w-full bg-amber-500 text-black hover:bg-amber-600 text-xs font-black py-2.5 rounded-xl transition cursor-pointer select-none"
                >
                  ANALISAR TEXTO
                </button>
              </div>
            </div>
          )}

          {/* CÓDIGO FONTE KOTLIN (CODE TAB) */}
          {apkTab === "code" && (
            <div className="max-w-md mx-auto p-4 flex flex-col gap-4 h-[calc(100vh-180px)] overflow-hidden">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 shrink-0">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code size={14} className="text-amber-500" />
                  <span>Código de Acessibilidade Kotlin</span>
                </h4>
                <button
                  onClick={handleCopyCode}
                  className={`text-[10px] py-1 px-3 rounded-xl font-black transition cursor-pointer ${
                    copiedFileId ? "bg-green-500/10 text-green-400" : "bg-white text-black"
                  }`}
                >
                  {copiedFileId ? "Copiado!" : "Copiar"}
                </button>
              </div>

              <div className="shrink-0 flex flex-col gap-1.5">
                <select
                  value={selectedFile.name}
                  onChange={(e) => {
                    const chosen = androidFiles.find(f => f.name === e.target.value);
                    if (chosen) setSelectedFile(chosen);
                  }}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-xs font-bold text-amber-500 cursor-pointer"
                >
                  {androidFiles.map((file) => (
                    <option key={file.name} value={file.name} className="font-mono text-xs text-zinc-350 bg-zinc-955">
                      {file.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-900/40 p-3 rounded-2xl text-[10px] text-zinc-500 shrink-0 select-none">
                <p className="font-semibold text-zinc-400">{selectedFile.path}</p>
                <p className="mt-1">{selectedFile.description}</p>
              </div>

              <div className="flex-1 overflow-auto p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-[9px] select-text">
                <div className="table min-w-full">
                  {renderCodeSnippet(selectedFile.content)}
                </div>
              </div>
            </div>
          )}

          {/* AJUDA (HELP TAB) */}
          {apkTab === "help" && (
            <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
              <div className="bg-zinc-900/60 p-5 border border-zinc-850 rounded-3xl flex flex-col gap-4 text-xs text-zinc-350 leading-relaxed shadow-lg">
                <div>
                  <h4 className="font-black text-amber-500 text-sm flex items-center gap-1.5 mb-1.5">🚀 Como rastrear o App 99 real de verdade?</h4>
                  <p>
                    Ferramentas de converter sites em APK (como o FrankWebStudio WebView wrapper) criam apenas uma casca de navegador. <br /><br />
                    Para o sistema **interceptar de verdade** a tela do app da 99 e rodar por cima de tudo em formato de faturamento automático, você precisa criar o seu app nativo em Kotlin usando o <strong>Android Studio</strong> no seu computador. Os 10 códigos-fonte necessários estão completamente criados e organizados na aba <strong>Código</strong>!
                  </p>
                </div>
                
                <div className="border-t border-zinc-850/60 pt-4">
                  <h4 className="font-black text-white text-xs mb-2">Instruções para o Android Studio:</h4>
                  <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-zinc-400 text-[11px]">
                    <li>Inicie um projeto livre no Android Studio (Empty Views Activity - Kotlin);</li>
                    <li>Defina o ID do pacote como <code>com.gigu.clone99</code>;</li>
                    <li>Copie o código de cada arquivo listado na aba <strong>Código</strong> para o respectivo local indicado pelas tarjas de caminho do arquivo;</li>
                    <li>Clique em <strong>Build &gt; Build APK(s)</strong> no menu superior para gerar o `.apk` real e instale no celular!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 py-3.5 px-4 z-50 flex justify-around items-center select-none shadow-2xl">
          <button onClick={() => setApkTab("dashboard")} className={`flex flex-col items-center gap-1 transition-all ${apkTab === "dashboard" ? "text-amber-400 scale-110" : "text-zinc-500"}`}>
            <Sliders size={16} />
            <span className="text-[9px] font-extrabold uppercase select-none leading-none mt-0.5">Painel</span>
          </button>
          <button onClick={() => setApkTab("settings")} className={`flex flex-col items-center gap-1 transition-all ${apkTab === "settings" ? "text-amber-400 scale-110" : "text-zinc-500"}`}>
            <Settings size={16} />
            <span className="text-[9px] font-extrabold uppercase select-none leading-none mt-0.5">Metas</span>
          </button>
          <button onClick={() => setApkTab("simulator")} className={`flex flex-col items-center gap-1 transition-all ${apkTab === "simulator" ? "text-amber-400 scale-110" : "text-zinc-500"}`}>
            <Smartphone size={16} />
            <span className="text-[9px] font-extrabold uppercase select-none leading-none mt-0.5">Simu</span>
          </button>
          <button onClick={() => setApkTab("code")} className={`flex flex-col items-center gap-1 transition-all ${apkTab === "code" ? "text-amber-400 scale-110" : "text-zinc-500"}`}>
            <FileCode size={16} />
            <span className="text-[9px] font-extrabold uppercase select-none leading-none mt-0.5">Código</span>
          </button>
          <button onClick={() => setApkTab("help")} className={`flex flex-col items-center gap-1 transition-all ${apkTab === "help" ? "text-amber-400 scale-110" : "text-zinc-500"}`}>
            <HelpCircle size={16} />
            <span className="text-[9px] font-extrabold uppercase select-none leading-none mt-0.5">Ajuda</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans">
      
      {/* HEADER PRINCIPAL DO SYSTEM ADAPTIVE HUB */}
      <header className="bg-zinc-950/80 border-b border-zinc-900 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                99 GigU Clone Hub
                <span className="text-amber-500 font-light text-xs uppercase tracking-widest ml-2">Android Pro v2.4</span>
              </h1>
              <p className="text-xs text-zinc-500 leading-normal">
                Simulador de Acessibilidade e Gerador de Código Inteligente para motoristas de aplicativos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
            {/* Seletor de Modo de Visualização */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-2xl shrink-0">
              <button
                onClick={() => setViewMode("combo")}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer select-none ${
                  viewMode === "combo" ? "bg-amber-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers size={11} />
                <span>Modo PC</span>
              </button>
              <button
                onClick={() => setViewMode("apk")}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer select-none ${
                  viewMode === "apk" ? "bg-amber-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone size={11} />
                <span>Modo APK (Mobile)</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full ${accessibilityPermitted && overlayPermitted ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-[11px] font-semibold text-zinc-300">
                {accessibilityPermitted && overlayPermitted ? "SERVIÇO ATIVO" : "SERVIÇO INATIVO"}
              </span>
            </div>
            
            <a 
              href="#instructions" 
              className="bg-white text-black px-6 py-2.5 rounded-full text-xs font-black shadow-xl hover:bg-zinc-100 transition whitespace-nowrap"
            >
              GUIA COMPLETO
            </a>
          </div>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* COLUNA ESQUERDA: SIMULADOR DE SMARTPHONE (4 COLUNAS) */}
        <section className="lg:col-span-5 flex flex-col items-center">
          
          {/* BOTÕES DE NAVEGAÇÃO DE TELA DO SMARTPHONE */}
          <div className="w-full max-w-[340px] mb-4 bg-zinc-900/50 p-1.5 rounded-full border border-zinc-850 flex gap-1">
            <button
              onClick={() => { setPhoneScreen("gigu_dashboard"); setActiveRide(null); setShowOverlay(false); }}
              className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-full transition-all cursor-pointer ${
                phoneScreen === "gigu_dashboard" || phoneScreen === "gigu_settings"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              App GigU Clone
            </button>
            <button
              onClick={() => { setPhoneScreen("app_99"); setActiveRide(null); setShowOverlay(false); }}
              className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-full transition-all cursor-pointer ${
                phoneScreen === "app_99"
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              App da 99 (Simulado)
            </button>
          </div>

          {/* TELEFONE INTERATIVO MOCKUP */}
          <div 
            ref={phoneScreenRef}
            className={`relative w-full max-w-[344px] h-[640px] bg-zinc-950 rounded-[48px] border-[12px] border-zinc-900 shadow-2xl overflow-hidden transition-transform duration-300 ${
              isVibrating ? "animate-vibrate border-red-500/40" : ""
            }`}
          >
            {/* Notch da Câmera do Celular */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-full z-50 flex items-center justify-center border border-zinc-800/40">
              <div className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800"></div>
            </div>

            {/* BARRA DE STATUS DO ANDROID */}
            <div className="h-9 px-6 pt-2 bg-zinc-950 text-zinc-400 text-[10px] font-mono flex justify-between items-center z-40 select-none border-b border-zinc-900">
              <span>16:48</span>
              <div className="flex items-center gap-1.5">
                <Volume2 size={10} className={isVibrateEnabled ? "text-amber-500" : "text-zinc-650"} />
                <span className="text-[9px] font-semibold text-zinc-500">5G</span>
                <span className="border border-zinc-800 rounded px-1.5 py-0.5 text-[8px] leading-none text-zinc-500">82%</span>
              </div>
            </div>

            {/* CONTEÚDO DAS TELAS DO TELEFONE */}
            <div className="relative h-[calc(100%-36px)] bg-zinc-950 text-zinc-200 overflow-y-auto">
              
              {/* SCREEN CARD: GIGU CLONE APP - DASHBOARD */}
              {phoneScreen === "gigu_dashboard" && (
                <div className="p-4 flex flex-col gap-4 bg-zinc-950 min-h-full font-sans">
                  
                  {/* Header do App dentro do Android */}
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                    <span className="text-2xl">🚦</span>
                    <div>
                      <h3 className="font-bold text-sm text-white leading-tight">99 Ride Analyzer</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">Compartimentado GigU</p>
                    </div>
                  </div>

                  {/* Estado do Serviço no Android */}
                  <div className="bg-zinc-900/65 border border-zinc-800/80 p-4 rounded-3xl shadow-md">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status do Serviço</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        accessibilityPermitted && overlayPermitted
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {accessibilityPermitted && overlayPermitted ? "● ATIVO (Monitorando)" : "● INATIVO"}
                      </span>
                      
                      <div className="bg-zinc-950 px-2.5 py-1 rounded-lg text-[9px] font-mono text-zinc-400 border border-zinc-800 font-semibold">
                        Service Ativo
                      </div>
                    </div>
                  </div>

                  {/* Ativação de Permissões Críticas */}
                  <div className="bg-zinc-900/65 border border-zinc-800/80 p-4 rounded-3xl shadow-md flex flex-col gap-2.5">
                    <h4 className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-amber-500" />
                      Permissões Necessárias
                    </h4>
                    <p className="text-[11px] text-zinc-450 leading-relaxed">
                      Requerido para interceptar a tela da 99 Driver e renderizar os sinais do Semáforo.
                    </p>

                    <button
                      onClick={() => setAccessibilityPermitted(!accessibilityPermitted)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-between border transition cursor-pointer select-none ${
                        accessibilityPermitted 
                          ? "bg-zinc-900 border-green-500/30 text-green-400 hover:bg-zinc-900/80" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <div className={`w-1.5 h-1.5 rounded-full ${accessibilityPermitted ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`}></div>
                        <span>Acessibilidade</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-850">
                        {accessibilityPermitted ? "Ativado" : "Permitir"}
                      </span>
                    </button>

                    <button
                      onClick={() => setOverlayPermitted(!overlayPermitted)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-between border transition cursor-pointer select-none ${
                        overlayPermitted 
                          ? "bg-zinc-900 border-green-500/30 text-green-400 hover:bg-zinc-900/80" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <div className={`w-1.5 h-1.5 rounded-full ${overlayPermitted ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`}></div>
                        <span>Janela Flutuante</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-850">
                        {overlayPermitted ? "Permitido" : "Permitir"}
                      </span>
                    </button>
                  </div>

                  {/* Metas Atuais no Celular */}
                  <div className="bg-zinc-900/65 border border-zinc-800/80 p-4 rounded-3xl shadow-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                        <Sliders size={13} className="text-amber-500" />
                        Metas de Ganhos
                      </h4>
                      <button
                        onClick={() => setPhoneScreen("gigu_settings")}
                        className="text-[11px] font-bold text-amber-500 hover:text-amber-400 transition"
                      >
                        Configurar
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-zinc-950 p-2.5 rounded-2xl text-center border border-zinc-850">
                        <p className="text-[9px] text-zinc-500 mb-0.5">🟢 Excelente</p>
                        <p className="text-xs font-bold font-mono text-green-400">≥ R${minKmGood.toFixed(1)}/k</p>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-2xl text-center border border-zinc-850">
                        <p className="text-[9px] text-zinc-500 mb-0.5">🟡 Aceitável</p>
                        <p className="text-xs font-bold font-mono text-yellow-500">≥ R${minKmMedium.toFixed(1)}/k</p>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-2xl text-center border border-zinc-850">
                        <p className="text-[9px] text-zinc-500 mb-0.5">⏱️ Ganhos/h</p>
                        <p className="text-xs font-bold font-mono text-zinc-100">≥ R${minHour.toFixed(0)}/h</p>
                      </div>
                    </div>
                  </div>

                  {/* Switch do Overlay principal */}
                  <div className="bg-zinc-900/65 border border-zinc-800/80 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-200">Ativar Overlay</h4>
                      <p className="text-[10px] text-zinc-500">Mostra o semáforo na tela</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isOverlayEnabled}
                        onChange={() => setIsOverlayEnabled(!isOverlayEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-300 after:border-zinc-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-black"></div>
                    </label>
                  </div>

                  {/* Informações adicionais do motorista */}
                  <div className="bg-amber-500/5 p-4 rounded-3xl border border-amber-500/10 text-[11px] text-zinc-400 leading-relaxed flex gap-2.5">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-500">Nota de Segurança:</p>
                      O GigU não realiza gestos nem aceita corridas de forma automática. Opera puramente em modo passivo, garantindo total conformidade legal contra bloqueios.
                    </div>
                  </div>

                </div>
              )}

              {/* SCREEN CARD: GIGU CLONE APP - SETTINGS CONTAINER */}
              {phoneScreen === "gigu_settings" && (
                <div className="p-4 flex flex-col gap-4 bg-zinc-950 min-h-full font-sans">
                  
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                    <button 
                      onClick={() => setPhoneScreen("gigu_dashboard")}
                      className="text-xs text-amber-500 font-bold hover:underline"
                    >
                      ← Voltar
                    </button>
                    <h3 className="font-bold text-sm text-white">Configurar Metas</h3>
                  </div>

                  <div className="bg-zinc-900/65 border border-zinc-805 p-4 rounded-3xl shadow-md flex flex-col gap-4">
                    
                    {/* Input excelente */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Excelente (🟢 Verde) - R$/km
                      </label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={tempKmGood}
                        onChange={(e) => setTempKmGood(e.target.value)}
                        className="w-full text-sm p-3 bg-zinc-950 border border-zinc-850 rounded-2xl text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                        placeholder="Ex: 3.0"
                      />
                    </div>

                    {/* Input intermediario */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Aceitável (🟡 Amarelo) - R$/km
                      </label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={tempKmMedium}
                        onChange={(e) => setTempKmMedium(e.target.value)}
                        className="w-full text-sm p-3 bg-zinc-950 border border-zinc-850 rounded-2xl text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                        placeholder="Ex: 2.0"
                      />
                    </div>

                    {/* Input faturamento por hora */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Faturamento mínimo por hora (R$/h)
                      </label>
                      <input 
                        type="number" 
                        step="5"
                        value={tempHour}
                        onChange={(e) => setTempHour(e.target.value)}
                        className="w-full text-sm p-3 bg-zinc-950 border border-zinc-850 rounded-2xl text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                        placeholder="Ex: 50.0"
                      />
                    </div>

                    {/* Checkbox vibração */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                      <input 
                        type="checkbox" 
                        id="checkVibrate"
                        checked={isVibrateEnabled}
                        onChange={() => setIsVibrateEnabled(!isVibrateEnabled)}
                        className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="checkVibrate" className="text-xs font-semibold text-zinc-300 cursor-pointer select-none">
                        Vibrar ao receber nova corrida
                      </label>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="w-full mt-2 bg-amber-500 text-black font-black py-3 rounded-2xl text-xs hover:bg-amber-600 transition shadow-lg shadow-amber-500/10 cursor-pointer select-none"
                    >
                      SALVAR METAS
                    </button>
                  </div>

                </div>
              )}

              {/* SCREEN CARD: 99 APP SIMULATOR */}
              {phoneScreen === "app_99" && (
                <div className="relative h-full bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none border-t border-zinc-900">
                  
                  {/* Banner do topo do Aplicativo da 99 */}
                  <div className="bg-[#FF5500] text-slate-950 px-4 py-2.5 flex items-center justify-between shadow-md">
                    <span className="font-extrabold text-[10px] tracking-wider uppercase">99 Driver PRO</span>
                    <span className="text-[9px] bg-white px-2 py-0.5 rounded-full font-black border border-black/10">ONLINE</span>
                  </div>

                  {/* MAPA SIMULADO EM BACKGROUND */}
                  <div className="flex-1 relative overflow-hidden bg-[#18181b] flex items-center justify-center p-4">
                    {/* Desenho do mapa simulado usando gradientes e divs CSS */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none">
                      <div className="absolute w-[1px] h-full bg-zinc-700 left-1/3"></div>
                      <div className="absolute w-[1px] h-full bg-zinc-700 left-2/3"></div>
                      <div className="absolute h-[1px] w-full bg-zinc-700 top-1/4"></div>
                      <div className="absolute h-[1px] w-full bg-zinc-700 top-3/4"></div>
                      <div className="absolute h-[1px] w-full bg-zinc-700 top-1/2 rotate-45 scale-150"></div>
                    </div>

                    {/* Ícone sutil de localização GPS */}
                    <div className="z-10 flex flex-col items-center">
                      <Compass className="text-amber-500 animate-spin" size={32} style={{ animationDuration: '6s' }} />
                      <span className="text-[10px] text-zinc-500 mt-1.5 font-mono">Simulador Ativo</span>
                    </div>

                    {/* OFERTA DE CORRIDA 99 DA TELA */}
                    {activeRide && (
                      <div className="absolute bottom-2 left-2 right-2 bg-zinc-900 text-zinc-100 rounded-3xl p-4 shadow-2xl border border-zinc-800 z-20 flex flex-col gap-2.5">
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-black bg-[#FF5500]/20 text-[#FF5500] px-2 py-0.5 rounded-full border border-[#FF5500]/35 uppercase font-mono">
                              99Pop Viagem
                            </span>
                            <div className="text-xl font-black text-white leading-none mt-2">
                              R$ {activeRide.value.toFixed(2).replace(".", ",")}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-zinc-100">{activeRide.distance} km</p>
                            <p className="text-[10px] text-zinc-400 font-medium">{activeRide.duration} min</p>
                          </div>
                        </div>

                        {/* Rota (Origem/Destino) */}
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-500/50"></span>
                            <p className="text-[10px] text-zinc-350 font-bold truncate">A: {activeRide.origin}</p>
                          </div>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50"></span>
                            <p className="text-[10px] text-zinc-350 font-bold truncate font-sans">B: {activeRide.destination}</p>
                          </div>
                        </div>

                        {/* Botão Oficial sem cliques automáticos */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button 
                            onClick={() => { setActiveRide(null); setShowOverlay(false); }}
                            className="bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 font-bold py-2.5 rounded-2xl text-xs transition border border-zinc-700/50 cursor-pointer select-none"
                          >
                            Recusar
                          </button>
                          <button 
                            onClick={() => { alert("Simulação: Viagem Aceita pelo Motorista manualmente!"); setActiveRide(null); setShowOverlay(false); }}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-2xl text-xs transition cursor-pointer select-none"
                          >
                            Aceitar
                          </button>
                        </div>

                      </div>
                    )}

                    {/* Caso não tenha nenhuma corrida rodando, mostrar instrução para disparar */}
                    {!activeRide && (
                      <div className="absolute inset-0 bg-zinc-950/85 p-6 flex flex-col justify-center items-center text-center z-10">
                        <span className="text-3xl mb-3 animate-pulse">📲</span>
                        <h4 className="font-bold text-sm text-white">Nenhuma corrida ativa</h4>
                        <p className="text-[11px] text-zinc-500 mt-1.5 max-w-[200px] leading-relaxed">
                          Escolha um dos presets abaixo do telefone para injetar uma corrida simulada na tela da 99!
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* OVERLAY SEMÁFORO FLUTUANTE DA GIGU (GIGU OVERLAY) EM OUTROS APPS */}
              <AnimatePresence>
                {showOverlay && overlayData && (
                  <motion.div
                    drag
                    dragConstraints={phoneScreenRef}
                    dragElastic={0.1}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute z-50 top-18 left-4 right-4 pointer-events-auto rounded-3xl p-4 shadow-2xl border cursor-grab active:cursor-grabbing bg-zinc-900 border-zinc-800 ${
                      overlayData.classification === "GOOD"
                        ? "shadow-green-500/5 ring-1 ring-green-500/20"
                        : overlayData.classification === "MEDIUM"
                        ? "shadow-yellow-500/5 ring-1 ring-yellow-500/20"
                        : "shadow-red-500/5 ring-1 ring-red-500/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      
                      {/* Emoji do Semáforo */}
                      <div className="self-center flex flex-col items-center">
                        <span className="text-3.5xl select-none leading-none animate-bounce" style={{ animationDuration: '2s' }}>
                          {overlayData.emoji}
                        </span>
                        
                        {/* Indicador visual de faturamento */}
                        <span className={`text-[8px] font-mono font-extrabold mt-2 tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          overlayData.classification === "GOOD"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : overlayData.classification === "MEDIUM"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {overlayData.classification}
                        </span>
                      </div>

                      {/* Métricas formatadas e calculadas */}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="text-base font-black text-white flex justify-between items-center leading-tight">
                          <span>R$ {overlayData.value.toFixed(2).replace(".", ",")}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }}
                            className="p-1 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                          >
                            <X size={12} className="text-zinc-500 hover:text-white" />
                          </button>
                        </div>
                        
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {overlayData.distance} km • {overlayData.duration} min
                        </p>

                        <div className="mt-2 flex flex-col text-[12px] font-bold">
                          <span className={`${
                            overlayData.classification === "GOOD" 
                              ? "text-green-400" 
                              : overlayData.classification === "MEDIUM" 
                              ? "text-yellow-500" 
                              : "text-red-400"
                          }`}>
                            R$ {overlayData.valuePerKm.toFixed(2).replace(".", ",")} / km
                          </span>
                          <span className="text-zinc-500 text-[11px] font-medium font-mono">
                            R$ {overlayData.valuePerHour.toFixed(0)} / hora
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Progress Bar de Contagem Regressiva Visual de 5s */}
                    <div className="w-full bg-zinc-950 h-1 rounded-full mt-3 overflow-hidden border border-zinc-900">
                      <div 
                        className={`h-full transition-all ${
                          overlayData.classification === "GOOD"
                            ? "bg-green-500"
                            : overlayData.classification === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(timeLeft / 5) * 100}%` }}
                      ></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

          {/* PAINEL DE DISPARO DE CORRIDAS (CONTROLES DO SIMULADOR) */}
          <div className="w-full max-w-[340px] mt-4 flex flex-col gap-3.5 bg-zinc-900 border border-zinc-850 p-4 rounded-3xl shadow-sm">
            
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <span className="text-lg">📲</span>
              <h4 className="font-bold text-xs text-zinc-200">Disparador de Corridas</h4>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Acione uma corrida pré-definida ou digite um log de texto para ver o overlay computar instantaneamente.
            </p>

            {/* Grid de Presets */}
            <div className="grid grid-cols-2 gap-2">
              {ridePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3 rounded-2xl border text-[11px] font-medium transition cursor-pointer select-none ${
                    activeRide?.id === preset.id
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5"
                      : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-805"
                  }`}
                >
                  <p className="font-bold text-zinc-200 truncate">{preset.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-1 font-mono">R$ {preset.value.toFixed(1)} • {preset.distance}km</p>
                </button>
              ))}
            </div>

            {/* Custom Log Text Input */}
            <div className="flex flex-col gap-1.5 mt-1 border-t border-zinc-800 pb-3">
              <label className="text-[11px] font-bold text-zinc-400 mt-2">
                Simular Texto do Aplicativo da 99:
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Exemplo: Corrida enviada valor R$ 18,50, percurso total de 5.2 km com duracao de 15 min..."
                rows={2}
                className="w-full text-xs p-3 bg-zinc-950 border border-zinc-850 rounded-2xl text-zinc-100 placeholder:text-zinc-650 focus:outline-hidden focus:border-zinc-800 font-mono resize-none transition"
              />
              <button
                onClick={handleProcessCustomText}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-black py-2.5 rounded-2xl transition cursor-pointer select-none"
              >
                DISPARAR TEXTO PERSONALIZADO
              </button>
            </div>

          </div>

        </section>

        {/* COLUNA DIREITA: EXPLORER AND ANDROID KOTLIN CODE HUB (7 COLUNAS) */}
        <section className="lg:col-span-7 bg-zinc-900 border border-zinc-850 rounded-3xl overflow-hidden flex flex-col h-[810px] shadow-sm">
          
          {/* Header do Explorer */}
          <div className="bg-zinc-900/60 border-b border-zinc-850 px-5 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-amber-500" />
              <div>
                <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5 font-sans leading-tight">
                  Painel de Código Kotlin Android
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">
                  Geração fiel dos arquivos para colar no seu projeto Android Studio
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer select-none ${
                copiedFileId 
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {copiedFileId ? <Check size={14} className="animate-pulse" /> : <Copy size={14} />}
              <span>{copiedFileId ? "COPIADO!" : "COPIAR ARQUIVO"}</span>
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            
            {/* Folder Tree Sidebar */}
            <div className="w-56 bg-zinc-950/40 border-r border-zinc-850 p-3 overflow-y-auto select-none flex flex-col gap-1 shrink-0">
              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-2">
                Arquivos do Projeto
              </div>

              {/* Root folder app */}
              <FolderNode name="app" path="app" />
              {expandedFolders["app"] && (
                <>
                  <FolderNode name="src" path="app/src" />
                  {expandedFolders["app/src"] && (
                    <>
                      <FolderNode name="main" path="app/src/main" />
                      {expandedFolders["app/src/main"] && (
                        <>
                          <FolderNode name="java (Kotlin)" path="app/src/main/java" childrenCount={4} />
                          {expandedFolders["app/src/main/java"] && (
                            <div className="flex flex-col gap-0.5 mb-1.5">
                              {androidFiles.filter(f => f.name.endsWith('.kt')).map((file) => (
                                <div
                                  key={file.name}
                                  onClick={() => setSelectedFile(file)}
                                  className={`flex items-center gap-1.5 py-1.5 px-3 ml-7 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-400 font-mono text-[11px] transition ${
                                    selectedFile.name === file.name ? "bg-zinc-900 font-bold text-amber-400 border-l-2 border-amber-500 pl-2" : ""
                                  }`}
                                >
                                  <FileCode size={12} className="text-orange-400" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <FolderNode name="res (Styles/Layout)" path="app/src/main/res" childrenCount={4} />
                          {expandedFolders["app/src/main/res"] && (
                            <>
                              <FolderNode name="layout" path="app/src/main/res/layout" />
                              {expandedFolders["app/src/main/res/layout"] && (
                                <div className="flex flex-col gap-0.5 mb-1.5">
                                  {androidFiles.filter(f => f.path.includes('/layout/')).map((file) => (
                                    <div
                                      key={file.name}
                                      onClick={() => setSelectedFile(file)}
                                      className={`flex items-center gap-1.5 py-1.5 px-3 ml-7 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-400 font-mono text-[11px] transition ${
                                        selectedFile.name === file.name ? "bg-zinc-900 font-bold text-amber-400 border-l-2 border-amber-500 pl-2" : ""
                                      }`}
                                    >
                                      <FileCode size={12} className="text-amber-500" />
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <FolderNode name="xml (Config)" path="app/src/main/res/xml" />
                              {expandedFolders["app/src/main/res/xml"] && (
                                <div className="flex flex-col gap-0.5 mb-1.5">
                                  {androidFiles.filter(f => f.path.includes('/xml/')).map((file) => (
                                    <div
                                      key={file.name}
                                      onClick={() => setSelectedFile(file)}
                                      className={`flex items-center gap-1.5 py-1.5 px-3 ml-7 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-400 font-mono text-[11px] transition ${
                                        selectedFile.name === file.name ? "bg-zinc-900 font-bold text-amber-400 border-l-2 border-amber-500 pl-2" : ""
                                      }`}
                                    >
                                      <FileCode size={12} className="text-amber-500" />
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <FolderNode name="values" path="app/src/main/res/values" />
                              {expandedFolders["app/src/main/res/values"] && (
                                <div className="flex flex-col gap-0.5 mb-1.5">
                                  {androidFiles.filter(f => f.path.includes('/values/')).map((file) => (
                                    <div
                                      key={file.name}
                                      onClick={() => setSelectedFile(file)}
                                      className={`flex items-center gap-1.5 py-1.5 px-3 ml-7 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-400 font-mono text-[11px] transition ${
                                        selectedFile.name === file.name ? "bg-zinc-900 font-bold text-amber-400 border-l-2 border-amber-500 pl-2" : ""
                                      }`}
                                    >
                                      <FileCode size={12} className="text-pink-400" />
                                      <span className="truncate">{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Manifest extra */}
                          <div
                            onClick={() => setSelectedFile(androidFiles.find(f => f.name === "AndroidManifest.xml")!)}
                            className={`flex items-center gap-1.5 py-1.5 px-2.5 ml-3 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-300 font-sans text-xs transition ${
                              selectedFile.name === "AndroidManifest.xml" ? "bg-zinc-900 font-bold text-amber-400 border-l-2 border-amber-500 pl-2" : ""
                            }`}
                          >
                            <FileCode size={13} className="text-purple-400" />
                            <span>AndroidManifest.xml</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

            </div>

            {/* Code Editor and Detail Body */}
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
              
              {/* Arquivo Ativo Detail */}
              <div className="p-4 bg-zinc-900/40 border-b border-zinc-850 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/25">
                    {selectedFile.path}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    {selectedFile.language.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                  {selectedFile.description}
                </p>
              </div>

              {/* Code Container view */}
              <div className="flex-1 overflow-auto p-4 bg-zinc-950/80 font-mono line-clamp-none select-text">
                <div className="table min-w-full">
                  {renderCodeSnippet(selectedFile.content)}
                </div>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* GUIA DE INSTRUÇÕES E EXPLICATIÇÃO DETALHADA */}
      <section id="instructions" className="bg-zinc-900/30 border-t border-zinc-900 px-6 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-850">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Como Importar para o Android</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Crie um novo projeto no Android Studio com o template <strong>"Empty Views Activity"</strong> (usando Kotlin). Defina o pacote padrão como <code>com.gigu.clone99</code>. Copie todos os arquivos listados no Code Explorer do painel direito seguindo rigorosamente as pastas e arquivos estabelecidos.
            </p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-850">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Lógica de Cálculo do Semáforo</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              O aplicativo extrai o valor líquido da corrida, remove símbolos (R$) e computa as métricas de faturamento em tempo real: <br />
              <strong className="text-white">R$/km</strong> = Valor / Distância. <br />
              <strong className="text-white">R$/hora</strong> = Valor / (Tempo em min / 60). <br />
              Se as metas de Km E Horas forem simultaneamente compridas, a corrida é classificada como excelente (🟢 Verde).
            </p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-850">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚨</span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Políticas e Bloqueio</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Este aplicativo <strong>não possui rotina de auto-cliques nem aceita viagens sozinho</strong>. O serviço de acessibilidade opera estritamente no modo de leitura (Read-Only) passiva da tela. Isso respeita estritamente os termos de segurança da plataforma da 99, evitando quaisquer riscos de banimentos.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 99 GigU Clone - Desenvolvido com carinho para motoristas autônomos.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-zinc-600 font-mono">Status: Compilando Perfeitamente 🟢</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

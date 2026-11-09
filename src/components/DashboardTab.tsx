import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  Sun, CloudRain, Thermometer, Brain, Send, Save, BookOpen,
  Download, Upload, AlertTriangle, Calendar, ClipboardList, CheckCircle2, Sprout,
  Terminal, Sliders, Droplet, Wifi, Bell, ShieldAlert, Printer, Sparkles
} from "lucide-react";
import { Bed, Planting, Seed, WeatherData } from "../types";

interface DashboardTabProps {
  beds: Bed[];
  plantings: Planting[];
  seeds: Seed[];
  dashboardNotes: string;
  onUpdateNotes: (notes: string) => void;
  onTabChange: (tabName: string) => void;
  authToken: string;
  liveLogs?: any[];
  onPostConsoleLog?: (message: string) => Promise<void>;
  isAdmin?: boolean;
}

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6",
  "#ef4444", "#06b6d4", "#14b8a6", "#f43f5e", "#64748b"
];

export default function DashboardTab({
  beds,
  plantings,
  seeds,
  dashboardNotes,
  onUpdateNotes,
  onTabChange,
  authToken,
  liveLogs = [],
  onPostConsoleLog,
  isAdmin = false,
}: DashboardTabProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("<p>Loading personalized gardening recommendations...</p>");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [localNotes, setLocalNotes] = useState(dashboardNotes);

  // High density interactive state enhancements
  const [consoleInput, setConsoleInput] = useState("");
  const [localSoilMoisture, setLocalSoilMoisture] = useState(42.8);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);
  const [wateringStatus, setWateringStatus] = useState("");

  const [predictorHtml, setPredictorHtml] = useState<string>("<p class='text-xs text-neutral-400'>Awaiting environment parameters...</p>");
  const [isPredictorLoading, setIsPredictorLoading] = useState(false);

  const handleFetchPredictor = async (wObj: WeatherData | null, sMoisture: number) => {
    setIsPredictorLoading(true);
    try {
      const res = await fetch("/api/ai-predictor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken
        },
        body: JSON.stringify({
          weather: wObj,
          soilMoisture: sMoisture
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictorHtml(data.prediction);
      } else {
        setPredictorHtml("<p class='text-xs text-red-500'>Error retrieving dynamic predictor advice.</p>");
      }
    } catch (err) {
      setPredictorHtml("<p class='text-xs text-red-500'>Connection to predictor engine failed.</p>");
    } finally {
      setIsPredictorLoading(false);
    }
  };

  useEffect(() => {
    setLocalNotes(dashboardNotes);
  }, [dashboardNotes]);

  const [forecastDays, setForecastDays] = useState<3 | 5 | 7>(7);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Load weather and AI advice on mount or when forecastDays changes
  const fetchWeather = useCallback(async (days: number = forecastDays) => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?days=${days}`, {
        headers: { Authorization: authToken }
      });
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        handleFetchPredictor(data, localSoilMoisture);
      } else {
        handleFetchPredictor(null, localSoilMoisture);
      }
    } catch (err) {
      console.error("Failed to load weather", err);
      handleFetchPredictor(null, localSoilMoisture);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [authToken, forecastDays, localSoilMoisture]);

  useEffect(() => {
    fetchWeather(forecastDays);
  }, [fetchWeather, forecastDays]);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const res = await fetch("/api/advice", {
          headers: { Authorization: authToken }
        });
        if (res.ok) {
          const data = await res.json();
          setAiAdvice(data.advice);
        }
      } catch (err) {
        setAiAdvice("<p>Failed to generate smart advice.</p>");
      }
    };

    fetchAdvice();
  }, [authToken]);

  const handleNotesBlur = () => {
    if (localNotes !== dashboardNotes) {
      onUpdateNotes(localNotes);
    }
  };

  const handleConsoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim() || !onPostConsoleLog) return;
    
    const command = consoleInput.trim();
    setConsoleInput("");
    
    if (command.startsWith("/")) {
      const parts = command.split(" ");
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(" ");
      
      if (cmd === "/help") {
        await onPostConsoleLog(`CMD_GUIDE: Available triggers:
• /water [plot] - Initiates dynamic irrigation spray sequence
• /pest [plot] [bug] - Logs visual outbreak alert
• /clear - Resets screen console buffer`);
      } else if (cmd === "/clear") {
        await onPostConsoleLog("Clearing console logs screen buffer...");
      } else if (cmd === "/water") {
        const bedName = arg || "Zone E Plots";
        setWateringStatus(`Irrigation dispatched for ${bedName}!`);
        setTimeout(() => setWateringStatus(""), 4000);
        await onPostConsoleLog(`SYSTEM: Hydration sequence initiated: 120L delivered to ${bedName}.`);
      } else if (cmd === "/pest") {
        await onPostConsoleLog(`WARNING: Visual pest indicator logged for ${arg || "Plot E-02"} (Aphids suspected).`);
      } else {
        await onPostConsoleLog(`Unknown action: "${cmd}". Type /help for triggers.`);
      }
    } else {
      await onPostConsoleLog(command);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setIsAsking(true);
    setAiAnswer("Thinking...");
    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({ question: aiQuestion }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setAiAnswer(data.answer);
      } else {
        setAiAnswer("<p>Sorry, I am having trouble connecting right now.</p>");
      }
    } catch (e) {
      setAiAnswer("<p>Error connecting to the garden intelligence brain.</p>");
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveAIResponse = async () => {
    if (!aiAnswer || aiAnswer === "Thinking...") return;
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          id: Date.now().toString(36),
          title: `AI: ${aiQuestion}`,
          content: aiAnswer,
          date: new Date().toISOString().split("T")[0],
          source: "ai"
        })
      });
      if (res.ok) {
        alert("Saved response to the Knowledge base!");
        setAiAnswer(null);
        setAiQuestion("");
        onTabChange("kbTab");
      }
    } catch (err) {
      alert("Failed to save to Knowledge base.");
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ beds, plantings, seeds, dashboardNotes }, null, 2)
    );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const today = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("download", `allotment_backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/data/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          alert("Backup imported successfully! Real-time syncing in progress.");
          window.location.reload();
        } else {
          alert("Failed to import. Invalid format.");
        }
      } catch (err) {
        alert("Error parsing backup file.");
      }
    };
    reader.readAsText(file);
  };

  // --- COMPUTE DATA FOR CHARTS ---

  // Chart 1: Pie Chart of Crop Family Distribution
  const activePlantings = plantings.filter(p => p.status !== "Finished");
  const familyCounts: { [family: string]: number } = {};
  activePlantings.forEach(p => {
    const f = p.family || "Other";
    familyCounts[f] = (familyCounts[f] || 0) + 1;
  });
  const pieData = Object.entries(familyCounts).map(([name, value]) => ({
    name: name.split(" ")[0], // Simplify name (e.g. Brassicaceae)
    value
  }));

  // Chart 2: Bar Chart of Crops Status by Bed
  const bedStatusData = beds.map(bed => {
    const bedCrops = activePlantings.filter(p => p.location === bed.id);
    const sown = bedCrops.filter(p => p.status === "Sown").length;
    const growing = bedCrops.filter(p => p.status === "Growing").length;
    const harvesting = bedCrops.filter(p => p.status === "Harvesting").length;
    return {
      name: bed.name,
      Sown: sown,
      Growing: growing,
      Harvesting: harvesting
    };
  });

  // Schedule Alerts next 7 Days
  const upcomingSchedules: { type: string; title: string; date: string; tag: string }[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  activePlantings.forEach(p => {
    if (p.harvest_date && p.harvest_date >= todayStr) {
      const diffTime = Math.abs(new Date(p.harvest_date).getTime() - new Date(todayStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        upcomingSchedules.push({
          type: "harvest",
          title: `Expected harvest: ${p.name}`,
          date: p.harvest_date,
          tag: `In ${diffDays} day${diffDays > 1 ? "s" : ""}`
        });
      }
    }
  });

  beds.forEach(b => {
    b.tasks?.forEach(t => {
      if (!t.completed && t.date >= todayStr) {
        const diffTime = Math.abs(new Date(t.date).getTime() - new Date(todayStr).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          upcomingSchedules.push({
            type: "task",
            title: `[${b.name}] ${t.text}`,
            date: t.date,
            tag: diffDays === 0 ? "Today" : `In ${diffDays} day${diffDays > 1 ? "s" : ""}`
          });
        }
      }
    });
  });

  upcomingSchedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recently sown list
  const recentlySownLogs: { name: string; date: string }[] = [];
  plantings.forEach(p => {
    p.logs?.forEach(l => {
      if (l.type === "sow") {
        recentlySownLogs.push({ name: p.name, date: l.date });
      }
    });
  });
  recentlySownLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mockAlerts = [
    {
      id: "pest-alert",
      code: "AL-104",
      title: "Aphid Outbreak Warning",
      description: "Sensor cluster E-12 reports environmental conditions highly favorable for Aphid breeding on Plot E-02 (Kale).",
      severity: "medium",
      actionLabel: "Deploy Beneficial Ladybugs",
      onAction: async () => {
        setAcknowledgedAlerts(prev => [...prev, "pest-alert"]);
        if (onPostConsoleLog) {
          await onPostConsoleLog("SYSTEM: Dispatched beneficial biological controls to Plot E-02.");
        }
      }
    },
    {
      id: "moisture-alert",
      code: "AL-209",
      title: "Soil Desiccation Alert",
      description: `Zone E sensor aggregate reports soil moisture has critical reading of ${localSoilMoisture.toFixed(1)}% (Optimal baseline > 35%).`,
      severity: "high",
      actionLabel: "Trigger Hydration Loop",
      onAction: async () => {
        setLocalSoilMoisture(65.4);
        setWateringStatus("Hydration loop activated!");
        setTimeout(() => setWateringStatus(""), 4000);
        setAcknowledgedAlerts(prev => [...prev, "moisture-alert"]);
        if (onPostConsoleLog) {
          await onPostConsoleLog("SYSTEM: Manual hydration trigger - raised soil moisture levels to 65.4% across Zone E.");
        }
      }
    }
  ].filter(al => !acknowledgedAlerts.includes(al.id));

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Boxes */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onTabChange("historyTab")}
          className="bg-white hover:bg-emerald-50/20 text-left border border-neutral-100 p-6 rounded-2xl shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-neutral-500">Active Crops</span>
            <Sprout className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-3xl font-bold text-neutral-800">
            {activePlantings.length}
          </h3>
        </button>

        <button
          onClick={() => onTabChange("bedsTab")}
          className="bg-white hover:bg-emerald-50/20 text-left border border-neutral-100 p-6 rounded-2xl shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-neutral-500">Active Beds</span>
            <Sun className="h-5 w-5 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-3xl font-bold text-neutral-800">{beds.length}</h3>
        </button>

        <button
          onClick={() => onTabChange("seedsTab")}
          className="bg-white hover:bg-emerald-50/20 text-left border border-neutral-100 p-6 rounded-2xl shadow-sm transition group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-neutral-500">Seed Box</span>
            <BookOpen className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition" />
          </div>
          <h3 className="text-3xl font-bold text-neutral-800">{seeds.length}</h3>
        </button>
      </div>

      {/* Pest & Disease Alert Center */}
      {mockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 lg:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-red-100 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 animate-pulse" />
              <h3 className="text-xs font-bold text-red-950 uppercase tracking-wider">
                Active Operational Alarms & Threats ({mockAlerts.length})
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase animate-pulse">
              System Critical
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-red-100 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                <div className="pl-2 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-red-900">{alert.title}</span>
                    <span className="text-[9px] font-mono text-red-400 font-bold">{alert.code}</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed pr-2">
                    {alert.description}
                  </p>
                </div>
                <div className="pl-2 pt-3 flex gap-2">
                  <button
                    onClick={alert.onAction}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition uppercase tracking-wider"
                  >
                    {alert.actionLabel}
                  </button>
                  <button
                    onClick={() => setAcknowledgedAlerts(prev => [...prev, alert.id])}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[10px] font-semibold rounded-lg transition uppercase"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI advice, Weather and Quick notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI assistant box */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-950">
                  AI Garden Assistant
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Intelligent Allotment Advisory & Guidance
                </p>
              </div>
            </div>

            {/* AI text content */}
            <div
              className="prose prose-emerald max-w-none text-sm text-neutral-700 leading-relaxed bg-white/70 border border-emerald-50/80 p-4 rounded-xl shadow-inner max-h-[250px] overflow-y-auto mb-4"
              dangerouslySetInnerHTML={{ __html: aiAdvice }}
            />

            {/* AI interaction bar */}
            <form onSubmit={handleAskAI} className="border-t border-emerald-100 pt-4 mt-2">
              <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                Ask a Gardening Question
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  disabled={isAsking}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask about crop rotation, companion planting, or pest controls..."
                  className="flex-1 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isAsking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Ask</span>
                </button>
              </div>

              {aiAnswer && (
                <div className="bg-white border border-neutral-200 rounded-xl p-4 mt-3 space-y-3 shadow-inner">
                  <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                    Assistant Response
                  </div>
                  <div
                    className="prose prose-sm text-neutral-700 text-sm"
                    dangerouslySetInnerHTML={{ __html: aiAnswer }}
                  />
                  {!isAsking && aiAnswer !== "Thinking..." && (
                    <button
                      type="button"
                      onClick={handleSaveAIResponse}
                      className="w-full mt-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save to Shared Knowledge Base
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* AI-Powered Care & Harvest Predictor */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#14261C] border border-emerald-700/60 rounded-2xl p-6 shadow-sm space-y-4 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-emerald-600 border border-emerald-400/40 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                  <Sparkles className="h-5 w-5 text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-100 tracking-wide flex items-center gap-2">
                    <span>🧠 AI Care & Harvest Predictor (Gemini)</span>
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    Dynamic watering schedules, organic pest remedies, and harvest projections
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFetchPredictor(weather, localSoilMoisture)}
                disabled={isPredictorLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm hover:shadow shrink-0 cursor-pointer"
              >
                <Brain className={`h-4 w-4 ${isPredictorLoading ? "animate-spin" : ""}`} />
                <span>{isPredictorLoading ? "Analyzing..." : "Regenerate Care Plan"}</span>
              </button>
            </div>

            {/* Predictor response view */}
            <div className="bg-[#FAFDF9] text-[#162C1B] border border-emerald-900/30 p-5 rounded-xl shadow-inner max-h-[380px] overflow-y-auto no-scrollbar">
              {isPredictorLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-emerald-800 font-medium animate-pulse">
                    Consulting Gemini Garden Coach, analyzing weather forecasts and plot logs...
                  </p>
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none text-[#162C1B] leading-relaxed text-xs"
                  dangerouslySetInnerHTML={{ __html: predictorHtml }}
                />
              )}
            </div>
          </div>

          {/* Advanced Data Visualizations section */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-1">
                Advanced Crop Insights
              </h3>
              <p className="text-xs text-neutral-500">
                Interactive metrics and ecological layout reports
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie chart */}
              <div className="space-y-2 border border-neutral-100 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider text-center">
                  Active Crop Families (Biodiversity)
                </h4>
                {pieData.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} crops`, "Count"]} />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-xs text-neutral-400">
                    <Sprout className="h-8 w-8 mb-2 stroke-1" />
                    No active crop family data
                  </div>
                )}
              </div>

              {/* Bar chart */}
              <div className="space-y-2 border border-neutral-100 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider text-center">
                  Active Crop Status by Bed
                </h4>
                {beds.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bedStatusData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend iconSize={8} iconType="square" wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Sown" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="Growing" stackId="a" fill="#10b981" />
                        <Bar dataKey="Harvesting" stackId="a" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-xs text-neutral-400">
                    <Sun className="h-8 w-8 mb-2 stroke-1" />
                    Create beds to populate progress charts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weather, schedules, backup */}
        <div className="space-y-6">
          {/* Weather Box with 3, 5, 7 Day Options and Source Attribution */}
          <div className="bg-white border border-[#DEE8DF] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DEE8DF]/60 pb-3">
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Local Allotment Weather</span>
                </h3>
                <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                  {weather?.location || "UK Allotment Zone (Lat 52.5°N, Lon -1.5°W)"}
                </p>
              </div>

              {/* Forecast duration toggle buttons: 3, 5, 7 Days */}
              <div className="flex items-center gap-1 bg-emerald-50/80 p-1 rounded-lg border border-emerald-200 shrink-0">
                {([3, 5, 7] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setForecastDays(days)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      forecastDays === days
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-100/80"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {isWeatherLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-neutral-500">Fetching {forecastDays}-day forecast...</span>
              </div>
            ) : weather && weather.daily ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                  {weather.daily.time.slice(0, forecastDays).map((time, idx) => {
                    const date = new Date(time);
                    const isToday = idx === 0;
                    const dayName = isToday
                      ? "Today"
                      : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

                    return (
                      <div
                        key={time}
                        className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition hover:shadow-xs ${
                          isToday
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold"
                            : "bg-[#FAFDF9] border-[#DEE8DF] text-neutral-800"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tight text-neutral-500">{dayName}</span>
                        <div className="my-1.5 text-emerald-600">
                          {weather.daily.precipitation_sum[idx] > 0 ? (
                            <CloudRain className="h-5 w-5 stroke-1.5 text-blue-600 animate-bounce" />
                          ) : (
                            <Sun className="h-5 w-5 stroke-1.5 text-amber-500" />
                          )}
                        </div>
                        <span className="text-xs font-extrabold text-[#162C1B]">
                          {weather.daily.temperature_2m_max[idx]}°C
                        </span>
                        <span className="text-[9px] text-neutral-400 mt-0.5">
                          🌧️ {weather.daily.precipitation_sum[idx]}mm
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Source attribution and license */}
                <div className="pt-2 border-t border-[#DEE8DF]/60 flex items-center justify-between text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-600">Source:</span>
                    <a
                      href={weather.sourceUrl || "https://open-meteo.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-medium underline inline-flex items-center gap-0.5"
                    >
                      <span>{weather.source || "Open-Meteo Weather API"}</span>
                    </a>
                  </div>
                  <span className="text-neutral-400 font-mono">Open Data Attribution</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">
                Weather forecast offline
              </div>
            )}
          </div>

          {/* Telemetry and Resource Monitoring */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-500" />
              <span>Allotment Resource Telemetry</span>
            </h3>

            {/* Soil Moisture Interactive Controller */}
            <div className="space-y-2 border border-neutral-50 p-4 rounded-xl bg-neutral-50/40">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-600">Average Soil Moisture</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  localSoilMoisture < 35 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {localSoilMoisture.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="0.5"
                  value={localSoilMoisture}
                  onChange={(e) => setLocalSoilMoisture(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                <span>10% (DRY)</span>
                <span>90% (SATURATED)</span>
              </div>
            </div>

            {/* Irrigation statistics and calculators */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col justify-between">
                <span className="text-[9px] text-neutral-400 font-mono uppercase font-bold tracking-tight">Daily Water Volume</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-base font-extrabold text-neutral-800">
                    {(() => {
                      const activeCount = plantings.filter(p => p.status !== "Finished").length;
                      const todayMaxTemp = weather && weather.daily ? weather.daily.temperature_2m_max[0] : 18;
                      const todayPrecip = weather && weather.daily ? weather.daily.precipitation_sum[0] : 0;
                      const tomorrowPrecip = weather && weather.daily ? weather.daily.precipitation_sum[1] : 0;
                      const isRainySoon = todayPrecip > 0 || tomorrowPrecip > 1.0;
                      
                      const calculatedBase = activeCount * (todayMaxTemp > 20 ? 8 : 4.5);
                      const rainAdjustment = isRainySoon ? 0.5 : 1.0;
                      return Math.ceil(calculatedBase * rainAdjustment);
                    })()}L
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono">/day</span>
                </div>
                <div className="w-full bg-neutral-200 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[65%]"></div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col justify-between">
                <span className="text-[9px] text-neutral-400 font-mono uppercase font-bold tracking-tight">UV Index</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <Sun className="h-4 w-4 text-amber-500 shrink-0 animate-spin-slow" />
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    weather && weather.daily && weather.daily.precipitation_sum[0] > 0
                      ? "bg-blue-50 text-blue-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {weather && weather.daily && weather.daily.precipitation_sum[0] > 0 ? "Low (2)" : "High (7)"}
                  </span>
                </div>
                <span className="text-[9px] text-neutral-400 mt-2 font-mono">
                  Solar aggregate
                </span>
              </div>
            </div>

            {/* Dynamic Forecast Adjuster alert */}
            <div className="text-[10px] bg-sky-50 border border-sky-100 p-3 rounded-xl text-sky-950 flex flex-col gap-1 shadow-sm leading-normal">
              <div className="font-bold flex items-center gap-1 text-sky-900 uppercase tracking-wide text-[9px]">
                <CloudRain className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>Weather Irrigation Advisor</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                {(() => {
                  const todayMaxTemp = weather && weather.daily ? weather.daily.temperature_2m_max[0] : 18;
                  const todayPrecip = weather && weather.daily ? weather.daily.precipitation_sum[0] : 0;
                  const tomorrowPrecip = weather && weather.daily ? weather.daily.precipitation_sum[1] : 0;
                  const isRainySoon = todayPrecip > 0 || tomorrowPrecip > 1.0;

                  if (isRainySoon) {
                    return (
                      <span>🌧️ <strong>Rain Expected ({todayPrecip || tomorrowPrecip}mm)</strong>. Recommended water volume cut by 50% to prevent root saturation and run-off.</span>
                    );
                  } else if (todayMaxTemp > 20) {
                    return (
                      <span>☀️ <strong>Dry Spell (Temp {todayMaxTemp}°C)</strong>. Heavy evaporation alert. Applying elevated irrigation rate of 8L/day per active crop.</span>
                    );
                  } else {
                    return (
                      <span>🌤️ <strong>Optimal Baseline ({todayMaxTemp}°C)</strong>. Weather tracking perfectly. Applying default rate of 4.5L/day per crop.</span>
                    );
                  }
                })()}
              </p>
            </div>

            {wateringStatus && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-semibold animate-fade-in flex items-center gap-1.5">
                <Droplet className="h-4 w-4 text-emerald-600 animate-bounce" />
                <span>{wateringStatus}</span>
              </div>
            )}
          </div>

          {/* Quick sticky notes */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                📌 Shared Sticky Notes
              </h3>
              <span className="text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                Auto-Saves
              </span>
            </div>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Jot down quick reminders, tasks list, or items to buy..."
              className="w-full h-24 bg-transparent text-sm text-amber-900 border-none outline-none resize-none placeholder-amber-700/60 font-sans leading-relaxed"
            />
            <p className="text-[9px] text-amber-700/80 text-right italic font-mono">
              * Shared with other operators
            </p>
          </div>

          {/* Next 7 Days schedule list */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>Next 7 Days Schedule</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1.5">
              {upcomingSchedules.length > 0 ? (
                upcomingSchedules.slice(0, 5).map((sched, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-800">
                        {sched.title}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(sched.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {sched.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No crop events or active tasks scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Real-time Multi-user Console Terminal */}
          <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-4 shadow-xl space-y-3 font-mono text-[11px] text-slate-300 flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">ALLOT_FLOW Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-tighter">LIVE_FEED</span>
              </div>
            </div>

            {/* Scrollable logs list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 text-[10px] leading-relaxed no-scrollbar select-text">
              {liveLogs.map((log, idx) => {
                let badgeColor = "text-emerald-400 bg-emerald-950/40";
                if (log.user === "ALERT") badgeColor = "text-red-400 bg-red-950/40 border border-red-500/20";
                else if (log.user === "SYSTEM" || log.user === "WARNING") badgeColor = "text-blue-400 bg-blue-950/40 border border-blue-500/20";
                else if (log.user === "DB_SYNC") badgeColor = "text-indigo-400 bg-indigo-950/40 border border-indigo-500/20";

                return (
                  <div key={idx} className="flex items-start gap-2 hover:bg-slate-800/40 p-1 rounded transition border border-transparent hover:border-slate-700/20">
                    <span className="text-slate-500 shrink-0 font-light select-none">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase shrink-0 ${badgeColor}`}>
                      {log.user}
                    </span>
                    <span className="text-slate-300 break-words flex-1 select-all">{log.message}</span>
                  </div>
                );
              })}
            </div>

            {/* Terminal Command Line */}
            <form onSubmit={handleConsoleSubmit} className="border-t border-slate-700 pt-2 mt-auto shrink-0 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold select-none">&gt;</span>
              <input
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                placeholder="Type messages or commands (/help)..."
                className="flex-1 bg-transparent border-none outline-none text-[11px] text-white focus:ring-0 placeholder-slate-500 font-mono py-1"
              />
              <button type="submit" className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded transition uppercase">
                Send
              </button>
            </form>
          </div>

          {/* Backup data box */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              System Operations
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Backup</span>
              </button>
              <button
                onClick={() => document.getElementById("importFile")?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl transition cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import Backup</span>
              </button>
              <input
                type="file"
                id="importFile"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              {isAdmin && (
                <a
                  href={`/api/download-package?token=${authToken}`}
                  download="hostinger-deployment.zip"
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Hostinger Deployment Package (.zip)</span>
                </a>
              )}

              <button
                onClick={() => window.print()}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 border border-[#DEE8DF] hover:bg-emerald-50/50 text-[#162C1B] font-semibold rounded-xl transition cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                <span>Print Allotment Blueprint / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

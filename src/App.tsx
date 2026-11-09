import React, { useState, useEffect, useCallback } from "react";
import {
  Sprout, Calendar, TrendingUp, MapPin, Activity, Grid, LogOut,
  Cloud, BookOpen, Users, Settings, Radio, ClipboardCheck, BookMarked, Download
} from "lucide-react";
import AuthOverlay from "./components/AuthOverlay";
import DashboardTab from "./components/DashboardTab";
import BedsTab from "./components/BedsTab";
import LogsTab from "./components/LogsTab";
import HistoryTab from "./components/HistoryTab";
import SeedsTab from "./components/SeedsTab";
import CalendarTab from "./components/CalendarTab";
import PlannerTab from "./components/PlannerTab";
import JournalTab from "./components/JournalTab";
import KbTab from "./components/KbTab";
import PWAInstallButton from "./components/PWAInstallButton";
import { Bed, Planting, Seed, BedPlan, Journal, KnowledgeBaseItem } from "./types";

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem("allotment_token"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("allotment_username"));
  const [userRole, setUserRole] = useState<string>(() => {
    const stored = localStorage.getItem("allotment_role");
    if (stored) return stored;
    const u = localStorage.getItem("allotment_username");
    return (u && (u.toLowerCase() === "demo" || u.toLowerCase() === "james" || u.toLowerCase() === "admin")) ? "admin" : "member";
  });
  const [activeTab, setActiveTab] = useState<string>("dashboardTab");

  const isAdmin = userRole === "admin" || (username && (username.toLowerCase() === "demo" || username.toLowerCase() === "james" || username.toLowerCase() === "admin"));

  // Real-time server connection state
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");

  // Application database states
  const [beds, setBeds] = useState<Bed[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [bedPlans, setBedPlans] = useState<BedPlan[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const [dashboardNotes, setDashboardNotes] = useState<string>("");
  const [liveLogs, setLiveLogs] = useState<any[]>(() => {
    const formatTime = (msAgo: number) => {
      return new Date(Date.now() - msAgo).toTimeString().split(" ")[0];
    };
    return [
      { timestamp: formatTime(1000 * 60 * 45), user: "ALERT", message: "Sensor E-12 detected anomaly: Pest signature on Plot E-12.", type: "alert" },
      { timestamp: formatTime(1000 * 60 * 32), user: "DB_SYNC", message: "Real-time replication successful across 4 server nodes.", type: "sync" },
      { timestamp: formatTime(1000 * 60 * 20), user: "SYSTEM", message: "Routine soil density and drainage analysis complete.", type: "system" },
      { timestamp: formatTime(1000 * 60 * 12), user: "J_DALTON", message: "Checked Russian Kale. Preparing harvest container schedules.", type: "user" },
      { timestamp: formatTime(1000 * 60 * 5), user: "S_REED", message: "Marked Plot E-02 status to 'Requires Irrigation' due to high UV.", type: "user" },
      { timestamp: formatTime(1000 * 60 * 1), user: "SYSTEM", message: "Automated hydration sequence standby.", type: "system" }
    ];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Authentication Handlers
  const handleAuthSuccess = (newToken: string, newUsername: string, newRole?: string) => {
    const effectiveRole = newRole || ((newUsername.toLowerCase() === "demo" || newUsername.toLowerCase() === "james" || newUsername.toLowerCase() === "admin") ? "admin" : "member");
    localStorage.setItem("allotment_token", newToken);
    localStorage.setItem("allotment_username", newUsername);
    localStorage.setItem("allotment_role", effectiveRole);
    setToken(newToken);
    setUsername(newUsername);
    setUserRole(effectiveRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("allotment_token");
    localStorage.removeItem("allotment_username");
    localStorage.removeItem("allotment_role");
    setToken(null);
    setUsername(null);
    setUserRole("member");
    // Reset data
    setBeds([]);
    setPlantings([]);
    setSeeds([]);
    setBedPlans([]);
    setJournals([]);
    setKnowledgeBase([]);
    setDashboardNotes("");
  };

  // Local offline queue state
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => {
    try {
      const q = JSON.parse(localStorage.getItem("allotment_offline_queue") || "[]");
      return Array.isArray(q) ? q.length : 0;
    } catch {
      return 0;
    }
  });

  // Fetch all allotment data with local storage backup
  const fetchAllAllotmentData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/data", {
        headers: {
          "Authorization": token,
        },
      });

      if (response.status === 401) {
        handleLogout();
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch allotment data bundle.");
      }

      const res = await response.json();
      setBeds(res.beds || []);
      setPlantings(res.plantings || []);
      setSeeds(res.seeds || []);
      setBedPlans(res.bedPlans || []);
      setJournals(res.journals || []);
      setKnowledgeBase(res.knowledgeBase || []);
      setDashboardNotes(res.dashboardNotes || "");

      // Save offline snapshot for low-connectivity/offline use
      localStorage.setItem("allotment_cache", JSON.stringify(res));
    } catch (err) {
      console.warn("Using offline cached allotment data:", err);
      // Load offline cache if network is down
      try {
        const cached = localStorage.getItem("allotment_cache");
        if (cached) {
          const res = JSON.parse(cached);
          setBeds(res.beds || []);
          setPlantings(res.plantings || []);
          setSeeds(res.seeds || []);
          setBedPlans(res.bedPlans || []);
          setJournals(res.journals || []);
          setKnowledgeBase(res.knowledgeBase || []);
          setDashboardNotes(res.dashboardNotes || "");
        }
      } catch (e) {
        console.error("Cache read error:", e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Flush offline mutation queue once connection is restored
  const flushOfflineQueue = useCallback(async () => {
    if (!token || !navigator.onLine) return;
    try {
      const queueRaw = localStorage.getItem("allotment_offline_queue");
      if (!queueRaw) return;
      const queue = JSON.parse(queueRaw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining: any[] = [];
      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: {
              "Content-Type": "application/json",
              "Authorization": token
            },
            body: item.body ? JSON.stringify(item.body) : undefined
          });
          if (!res.ok && res.status !== 404) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem("allotment_offline_queue", JSON.stringify(remaining));
      setOfflineQueueCount(remaining.length);

      if (remaining.length === 0) {
        fetchAllAllotmentData();
      }
    } catch (err) {
      console.error("Offline flush error:", err);
    }
  }, [token, fetchAllAllotmentData]);

  // Real-time synchronization stream client (SSE)
  useEffect(() => {
    if (!token) {
      setSyncStatus("disconnected");
      return;
    }

    setSyncStatus("connecting");
    const eventSource = new EventSource(`/api/sync/events`);

    eventSource.onopen = () => {
      setSyncStatus("connected");
      flushOfflineQueue();
    };

    eventSource.onerror = () => {
      setSyncStatus("disconnected");
    };

    // Listen to real-time database mutation triggers
    eventSource.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        const timeStr = new Date().toTimeString().split(" ")[0];

        if (payload.type === "MUTATION") {
          const tableCapitalized = payload.table.charAt(0).toUpperCase() + payload.table.slice(1);
          const actionCapitalized = payload.action.toUpperCase();
          const userUpper = (payload.user || "OPERATOR").toUpperCase();

          setLiveLogs(prev => [
            ...prev,
            {
              timestamp: timeStr,
              user: userUpper,
              message: `DB: ${actionCapitalized} on ${tableCapitalized} ${payload.id ? `(ID: ${payload.id})` : ""}`,
              type: "sync"
            }
          ].slice(-50));

          // Auto sync the client database instantly on external edits from other users
          fetchAllAllotmentData();
        } else if (payload.type === "CONSOLE") {
          const userUpper = (payload.user || "OPERATOR").toUpperCase();
          setLiveLogs(prev => [
            ...prev,
            {
              timestamp: timeStr,
              user: userUpper,
              message: payload.id,
              type: "user"
            }
          ].slice(-50));
        }
      } catch (err) {
        console.error("Sync payload error:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [token, fetchAllAllotmentData, flushOfflineQueue]);

  // Initial loading trigger
  useEffect(() => {
    if (token) {
      fetchAllAllotmentData();
    }
  }, [token, fetchAllAllotmentData]);

  // Online / offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue();
      fetchAllAllotmentData();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushOfflineQueue, fetchAllAllotmentData]);

  // API Call Mutation wrapper with offline queuing & optimistic recovery
  const apiCall = async (url: string, method: string, body?: any) => {
    if (!token) return;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired.");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }

      return response.json();
    } catch (networkError: any) {
      // If network is offline or request timed out, queue mutation locally
      console.warn("Network error during mutation, queueing locally for replay:", networkError.message);
      try {
        const queueRaw = localStorage.getItem("allotment_offline_queue");
        const queue = queueRaw ? JSON.parse(queueRaw) : [];
        queue.push({ url, method, body, timestamp: Date.now() });
        localStorage.setItem("allotment_offline_queue", JSON.stringify(queue));
        setOfflineQueueCount(queue.length);
      } catch (queueErr) {
        console.error("Failed to enqueue offline action:", queueErr);
      }
      return { offline: true, queued: true };
    }
  };

  // Beds Mutators
  const onAddBed = async (bedData: any) => {
    await apiCall("/api/beds", "POST", bedData);
    await fetchAllAllotmentData();
  };

  const onEditBed = async (bedId: string, bedData: any) => {
    await apiCall(`/api/beds/${bedId}`, "PUT", bedData);
    await fetchAllAllotmentData();
  };

  const onDeleteBed = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plot and all associated tasks?")) return;
    await apiCall(`/api/beds/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  const onAddTask = async (bedId: string, task: any) => {
    await apiCall(`/api/beds/${bedId}/tasks`, "POST", task);
    await fetchAllAllotmentData();
  };

  const onToggleTask = async (bedId: string, taskId: string, completed: boolean) => {
    await apiCall(`/api/beds/${bedId}/tasks/${taskId}`, "PUT", { completed });
    await fetchAllAllotmentData();
  };

  const onDeleteTask = async (bedId: string, taskId: string) => {
    await apiCall(`/api/beds/${bedId}/tasks/${taskId}`, "DELETE");
    await fetchAllAllotmentData();
  };

  const onAddProgressLog = async (bedId: string, log: any) => {
    await apiCall(`/api/beds/${bedId}/logs`, "POST", log);
    await fetchAllAllotmentData();
  };

  const onDeleteProgressLog = async (bedId: string, logId: string) => {
    await apiCall(`/api/beds/${bedId}/logs/${logId}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // Planting Mutators
  const onAddPlanting = async (plantingData: any) => {
    await apiCall("/api/plantings", "POST", plantingData);
    await fetchAllAllotmentData();
  };

  const onUpdatePlanting = async (plantingId: string, logData: any) => {
    await apiCall(`/api/plantings/${plantingId}`, "PUT", logData);
    await fetchAllAllotmentData();
  };

  const onDeletePlanting = async (id: string) => {
    if (!confirm("Are you sure you want to remove this crop from history?")) return;
    await apiCall(`/api/plantings/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  const onDeleteLog = async (plantingId: string, logId: string) => {
    if (!confirm("Delete this log entry?")) return;
    await apiCall(`/api/plantings/${plantingId}/logs/${logId}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // Seed Mutators
  const onAddSeed = async (seedData: any) => {
    await apiCall("/api/seeds", "POST", seedData);
    await fetchAllAllotmentData();
  };

  const onEditSeed = async (seedId: string, seedData: any) => {
    await apiCall(`/api/seeds/${seedId}`, "PUT", seedData);
    await fetchAllAllotmentData();
  };

  const onDeleteSeed = async (id: string) => {
    if (!confirm("Delete this seed packet from inventory?")) return;
    await apiCall(`/api/seeds/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // Plan Mutators
  const onAddPlan = async (planData: any) => {
    const exists = bedPlans.find(p => p.id === planData.id);
    if (exists) {
      await apiCall(`/api/plans/${planData.id}`, "PUT", planData);
    } else {
      await apiCall("/api/plans", "POST", planData);
    }
    await fetchAllAllotmentData();
  };

  const onDeletePlan = async (id: string) => {
    if (!confirm("Delete this layout blueprint?")) return;
    await apiCall(`/api/plans/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // Journal Mutators
  const onAddJournal = async (journalData: any) => {
    await apiCall("/api/journals", "POST", journalData);
    await fetchAllAllotmentData();
  };

  const onEditJournal = async (id: string, journalData: any) => {
    await apiCall(`/api/journals/${id}`, "PUT", journalData);
    await fetchAllAllotmentData();
  };

  const onDeleteJournal = async (id: string) => {
    if (!confirm("Remove this diary entry?")) return;
    await apiCall(`/api/journals/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // KB Mutators
  const onAddKbItem = async (item: any) => {
    await apiCall("/api/kb", "POST", item);
    await fetchAllAllotmentData();
  };

  const onDeleteKbItem = async (id: string) => {
    if (!confirm("Delete this guide note from the archive?")) return;
    await apiCall(`/api/kb/${id}`, "DELETE");
    await fetchAllAllotmentData();
  };

  // Notes Mutator
  const onUpdateNotes = async (newNotes: string) => {
    await apiCall("/api/notes", "PUT", { notes: newNotes });
    setDashboardNotes(newNotes);
  };

  // Backup Import/Export triggers
  const onImportBackup = async (fullJsonBackup: any) => {
    await apiCall("/api/data/import", "POST", fullJsonBackup);
    await fetchAllAllotmentData();
  };

  if (!token) {
    return <AuthOverlay onLoginSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F4] text-[#162C1B] font-sans flex flex-col lg:flex-row overflow-hidden h-screen">
      {/* Sidebar - Earthy Forest & Garden Theme */}
      <aside className="hidden lg:flex w-64 bg-[#14261C] flex-col shrink-0 border-r border-emerald-950/40 select-none overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-emerald-900/40 shrink-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-emerald-950/40">
            <Sprout className="h-4 w-4 text-emerald-100" />
          </div>
          <div>
            <span className="text-white font-bold tracking-tight text-sm">ALLOT_FLOW</span>
            <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-900/60 rounded text-emerald-300 border border-emerald-700/40">
              v2.1
            </span>
          </div>
        </div>

        {/* Current logged-in collaborator */}
        <div className="px-6 py-3.5 border-b border-emerald-900/40 bg-emerald-950/30 shrink-0">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {username ? username.substring(0, 2) : "ME"}
            </div>
            <div className="ml-2.5">
              <div className="text-xs font-bold text-emerald-100 truncate max-w-[140px]">{username || "Gardener"}</div>
              <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Operator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto no-scrollbar">
          <div className="text-[9px] uppercase font-bold text-slate-500 px-2.5 mb-2 tracking-widest">
            Main Navigation
          </div>
          
          <button
            onClick={() => setActiveTab("dashboardTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "dashboardTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <Activity className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Operations Center</span>
            </div>
            <span className="text-[9px] font-mono opacity-60">HUD</span>
          </button>

          <button
            onClick={() => setActiveTab("bedsTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "bedsTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Plots & Tasks</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {beds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("logsTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "logsTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <Sprout className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Log Activity</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("historyTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "historyTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <ClipboardCheck className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Active Timeline</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {plantings.filter(p => p.status !== "Finished").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("seedsTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "seedsTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <BookMarked className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Seed Box</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {seeds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("calendarTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "calendarTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Monthly Calendar</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("plannerTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "plannerTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <Grid className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Grid Planner</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
              {bedPlans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("journalTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "journalTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <BookOpen className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Diary & Logs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("kbTab")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors text-xs font-medium rounded ${
              activeTab === "kbTab"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/20 border border-transparent"
            }`}
          >
            <div className="flex items-center">
              <Settings className="h-3.5 w-3.5 mr-2.5 shrink-0" />
              <span>Knowledge Base</span>
            </div>
          </button>

          {/* Collaborators section from Design HTML */}
          <div className="pt-6">
            <div className="text-[9px] uppercase font-bold text-slate-500 px-2.5 mb-2 tracking-widest">
              Collaborators
            </div>
            <div className="space-y-2.5 px-2.5 py-1.5 text-xs text-slate-400">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">JD</div>
                <div className="ml-2">
                  <div className="text-[11px] text-white font-medium leading-none">James Dalton</div>
                  <div className="text-[8px] text-emerald-400 font-mono">● Online</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-white">SR</div>
                <div className="ml-2">
                  <div className="text-[11px] text-white font-medium leading-none">Sarah Reed</div>
                  <div className="text-[8px] text-emerald-400 font-mono">● Editing Plot 04</div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Sync Status operations block */}
        <div className="p-4 border-t border-emerald-900/40 bg-emerald-950/50 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-emerald-300/70 font-mono uppercase tracking-tighter">
            <span>Sync Status</span>
            <span className={syncStatus === "connected" ? "text-emerald-400 font-bold" : syncStatus === "connecting" ? "text-amber-400" : "text-amber-300 font-bold"}>
              {syncStatus === "connected" ? "LIVE SYNCED" : syncStatus === "connecting" ? "CONNECTING" : "OFFLINE READY"}
            </span>
          </div>
          <div className="h-1 bg-emerald-950 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${
              syncStatus === "connected" ? "bg-emerald-500 w-[100%]" : syncStatus === "connecting" ? "bg-amber-500 w-[50%] animate-pulse" : "bg-amber-500 w-[100%]"
            }`}></div>
          </div>
          {offlineQueueCount > 0 && (
            <div className="flex items-center justify-between bg-amber-950/80 border border-amber-800/60 rounded px-2 py-1 text-[9px] text-amber-200">
              <span>Pending sync items:</span>
              <span className="font-bold font-mono bg-amber-800 px-1.5 py-0.2 rounded">{offlineQueueCount}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header / Navigation Bar */}
      <header className="lg:hidden bg-[#14261C] border-b border-emerald-900/40 text-white flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-900/30">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm shadow-emerald-950/40">
              <Sprout className="h-4 w-4 text-emerald-100" />
            </div>
            <span className="font-bold tracking-tight text-sm text-emerald-50">ALLOT_FLOW</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono bg-emerald-950/80 border border-emerald-800/50 px-2 py-1 rounded">
              <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === "connected" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className="text-emerald-200 truncate max-w-[60px]">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-emerald-300 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1.5 p-2 overflow-x-auto select-none no-scrollbar">
          {[
            { id: "dashboardTab", label: "Dashboard", icon: Activity },
            { id: "bedsTab", label: "Plots", icon: MapPin },
            { id: "logsTab", label: "Log", icon: Sprout },
            { id: "historyTab", label: "Timeline", icon: ClipboardCheck },
            { id: "seedsTab", label: "Seed Box", icon: BookMarked },
            { id: "calendarTab", label: "Calendar", icon: Calendar },
            { id: "plannerTab", label: "Planner", icon: Grid },
            { id: "journalTab", label: "Diary", icon: BookOpen },
            { id: "kbTab", label: "Knowledge", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-emerald-800/60 text-emerald-200 border border-emerald-600/50"
                    : "text-emerald-300/80 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Panel Content Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Content Header inside Main */}
        <header className="h-16 bg-white border-b border-[#DEE8DF] flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-xs">
          <div className="flex items-center min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-[#162C1B] truncate">
              {activeTab === "dashboardTab" && "Allotment Dashboard: Real-Time Overview"}
              {activeTab === "bedsTab" && "Plot Layout & Garden Tasks"}
              {activeTab === "logsTab" && "Planting & Sowing Entry Logs"}
              {activeTab === "historyTab" && "Crops Active Growth Timeline"}
              {activeTab === "seedsTab" && "Inventory Seed Box"}
              {activeTab === "calendarTab" && "Garden Monthly Operation Calendar"}
              {activeTab === "plannerTab" && "Garden Plot Grid Blueprint Planner"}
              {activeTab === "journalTab" && "Gardener's Chronicles & Diary"}
              {activeTab === "kbTab" && "Archive Knowledge Base"}
            </h1>
            <span className="hidden sm:inline-block ml-4 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold rounded-full uppercase shrink-0">
              🌿 Garden Zone E
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 text-xs font-semibold text-emerald-900">
            {isAdmin && (
              <a
                href={`/api/download-package?token=${token || ''}`}
                download="hostinger-deployment.zip"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Master User: Download Hostinger Deployment ZIP package"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hostinger ZIP</span>
              </a>
            )}

            <PWAInstallButton />

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{beds.length} Plots</span>
              <span className="text-emerald-300">|</span>
              <span>{plantings.filter(p => p.status !== "Finished").length} Active Crops</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="hidden lg:flex p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-md transition border border-slate-200 hover:border-red-100"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Loading Stripe */}
        {isLoading && (
          <div className="h-0.5 bg-emerald-500 animate-pulse w-full shrink-0" />
        )}

        {/* Content Panel Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto no-scrollbar">
          {activeTab === "dashboardTab" && (
            <DashboardTab
              beds={beds}
              plantings={plantings}
              seeds={seeds}
              dashboardNotes={dashboardNotes}
              onUpdateNotes={onUpdateNotes}
              onTabChange={(tabName) => setActiveTab(tabName)}
              authToken={token!}
              liveLogs={liveLogs}
              isAdmin={isAdmin}
              onPostConsoleLog={async (message) => {
                await fetch("/api/console", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: token!,
                  },
                  body: JSON.stringify({ message })
                });
              }}
            />
          )}

          {activeTab === "bedsTab" && (
            <BedsTab
              beds={beds}
              onAddBed={onAddBed}
              onEditBed={onEditBed}
              onDeleteBed={onDeleteBed}
              onAddTask={onAddTask}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
              onAddProgressLog={onAddProgressLog}
              onDeleteProgressLog={onDeleteProgressLog}
            />
          )}

          {activeTab === "logsTab" && (
            <LogsTab
              beds={beds}
              plantings={plantings}
              seeds={seeds}
              onAddPlanting={onAddPlanting}
              onUpdatePlanting={onUpdatePlanting}
              onTabChange={(tabName) => setActiveTab(tabName)}
            />
          )}

          {activeTab === "historyTab" && (
            <HistoryTab
              beds={beds}
              plantings={plantings}
              seeds={seeds}
              onDeletePlanting={onDeletePlanting}
              onDeleteLog={onDeleteLog}
            />
          )}

          {activeTab === "seedsTab" && (
            <SeedsTab
              seeds={seeds}
              onAddSeed={onAddSeed}
              onEditSeed={onEditSeed}
              onDeleteSeed={onDeleteSeed}
            />
          )}

          {activeTab === "calendarTab" && (
            <CalendarTab
              beds={beds}
              plantings={plantings}
              journals={journals}
            />
          )}

          {activeTab === "plannerTab" && (
            <PlannerTab
              beds={beds}
              bedPlans={bedPlans}
              seeds={seeds}
              onAddPlan={onAddPlan}
              onDeletePlan={onDeletePlan}
              onEditPlan={(plan) => {}}
            />
          )}

          {activeTab === "journalTab" && (
            <JournalTab
              journals={journals}
              onAddJournal={onAddJournal}
              onEditJournal={onEditJournal}
              onDeleteJournal={onDeleteJournal}
            />
          )}

          {activeTab === "kbTab" && (
            <KbTab
              knowledgeBase={knowledgeBase}
              onAddKbItem={onAddKbItem}
              onDeleteKbItem={onDeleteKbItem}
            />
          )}
        </div>

        {/* Footer info matching theme */}
        <footer className="h-8 bg-slate-50 border-t border-slate-200 flex items-center px-6 justify-between shrink-0 text-[10px] text-slate-500 font-mono select-none">
          <div className="flex space-x-6">
            <div>
              <span className="font-bold">GRID:</span> <span>ZONE_E</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold">ENCRYPTION:</span> <span>AES-256-GCM</span>
            </div>
          </div>
          <div>
            BUILD: b829f0a.stable_v2
          </div>
        </footer>
      </main>

      {/* Global Printable Blueprint Area */}
      <div id="print-area" className="hidden print:block p-8 bg-white text-neutral-900 space-y-6">
        <div className="border-b-2 border-neutral-800 pb-3 flex justify-between items-baseline">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Allotment Garden Blueprint & Planner</h1>
            <p className="text-xs text-neutral-500">Official Allotment Tracker community plot maps, task logs, and schedules.</p>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-400">{new Date().toLocaleDateString("en-GB")}</span>
        </div>

        {/* 1. Bed Layout Plans */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 text-emerald-800">1. Plot Layout Grid Blueprints</h2>
          {bedPlans.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No bed layouts designed yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {bedPlans.slice(0, 4).map((plan, pidx) => {
                const bedName = beds.find(b => b.id === plan.bed_id)?.name || "Unknown Bed";
                return (
                  <div key={pidx} className="border border-neutral-300 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase">{bedName}</span>
                      <span className="text-[10px] font-semibold text-neutral-500">{plan.year} Rotation</span>
                    </div>
                    {plan.notes && <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2">{plan.notes}</p>}
                    
                    {/* Micro 4x4 Grid preview */}
                    <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-50 border border-neutral-200 rounded-lg text-[9px] text-center font-bold font-mono">
                      {plan.grid.map((cell, cidx) => (
                        <div key={cidx} className="h-7 border border-neutral-200 flex flex-col items-center justify-center bg-white px-0.5 truncate overflow-hidden">
                          <span className="text-[6px] text-neutral-400 leading-none">#{cidx+1}</span>
                          <span className="truncate max-w-full text-neutral-800 text-[8px] leading-tight">{cell || ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Task Checklist */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 text-emerald-800">2. Pending Maintenance Tasks & Schedules</h2>
          <div className="border border-neutral-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-300 font-bold uppercase text-neutral-700">
                  <th className="p-2 border-r border-neutral-200">Plot Bed Location</th>
                  <th className="p-2 border-r border-neutral-200">Task Details</th>
                  <th className="p-2">Deadline / Schedule</th>
                </tr>
              </thead>
              <tbody>
                {beds.flatMap(b => b.tasks?.map(t => ({ ...t, bedName: b.name })) || []).filter(t => !t.completed).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-neutral-400 italic">No pending tasks recorded for this block.</td>
                  </tr>
                ) : (
                  beds.flatMap(b => b.tasks?.map(t => ({ ...t, bedName: b.name })) || [])
                    .filter(t => !t.completed)
                    .slice(0, 15)
                    .map((t, idx) => (
                      <tr key={idx} className="border-b border-neutral-200 hover:bg-neutral-50">
                        <td className="p-2 border-r border-neutral-200 font-bold">{t.bedName}</td>
                        <td className="p-2 border-r border-neutral-200 text-neutral-600">{t.text}</td>
                        <td className="p-2 text-neutral-500 font-mono">{t.date}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Planting Timeline */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 text-emerald-800">3. Active Allotment Plantings & Sowing Timeline</h2>
          <div className="grid grid-cols-3 gap-3">
            {plantings.filter(p => p.status !== "Finished").length === 0 ? (
              <p className="col-span-3 text-xs text-neutral-400 italic">No active growing crops logged.</p>
            ) : (
              plantings.filter(p => p.status !== "Finished").slice(0, 9).map((p, pIdx) => {
                const sowLog = p.logs?.find(l => l.type === "sow");
                const bedName = p.location === "Seed Trays" ? "Seed Trays" : p.location === "Greenhouse" ? "Greenhouse" : (beds.find(b => b.id === p.location)?.name || p.location);
                return (
                  <div key={pIdx} className="border border-neutral-200 p-2.5 rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline font-bold">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">{p.status}</span>
                    </div>
                    {p.variety && <p className="text-[10px] text-neutral-400 italic font-semibold">"{p.variety}"</p>}
                    <div className="text-[10px] text-neutral-500 space-y-0.5 leading-normal">
                      <div><strong>Bed:</strong> {bedName}</div>
                      <div><strong>Sown Date:</strong> {sowLog ? sowLog.date : "N/A"}</div>
                      {p.harvest_date && <div><strong>Est. Harvest:</strong> {p.harvest_date}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t border-neutral-300 pt-3 text-[9px] text-neutral-400 flex justify-between uppercase font-mono">
          <span>Printed via Allotment Tracker community systems</span>
          <span>Security Token Verified: {token ? "Authenticated" : "Guest"}</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Search, SlidersHorizontal, MapPin, Calendar, Tag, Trash2,
  CalendarCheck, Heart, Trash, Star, Sprout, ArrowRight, BookOpen, Clock
} from "lucide-react";
import { Bed, Planting, Seed } from "../types";

interface HistoryTabProps {
  beds: Bed[];
  plantings: Planting[];
  seeds: Seed[];
  onDeletePlanting: (id: string) => Promise<void>;
  onDeleteLog: (plantingId: string, logId: string) => Promise<void>;
}

export default function HistoryTab({
  beds,
  plantings,
  seeds,
  onDeletePlanting,
  onDeleteLog,
}: HistoryTabProps) {
  // Filter States
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterFamily, setFilterFamily] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterActive, setFilterActive] = useState("all"); // 'all', 'active', 'finished'
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");

  const [expandedPlantingIds, setExpandedPlantingIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const nextSet = new Set(expandedPlantingIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setExpandedPlantingIds(nextSet);
  };

  const getBedName = (id: string) => {
    if (id === "Seed Trays") return "Seed Trays";
    if (id === "Greenhouse") return "Greenhouse";
    const b = beds.find(x => x.id === id);
    return b ? b.name : id;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Run filters
  const filteredPlantings = plantings.filter(p => {
    // Location
    if (filterLocation !== "all" && p.location !== filterLocation) return false;

    // Family
    if (filterFamily !== "all" && p.family !== filterFamily) return false;

    // Status
    if (filterStatus !== "all" && p.status !== filterStatus) return false;

    // Active
    const isFinished = p.status === "Finished";
    if (filterActive === "active" && isFinished) return false;
    if (filterActive === "finished" && !isFinished) return false;

    // Year
    const sowLog = p.logs?.find(l => l.type === "sow");
    const sowYear = sowLog ? new Date(sowLog.date).getFullYear().toString() : "";
    if (filterYear !== "all" && sowYear !== filterYear) return false;

    // Search query
    const sTerm = filterSearch.toLowerCase().trim();
    if (sTerm) {
      const matchName = p.name.toLowerCase().includes(sTerm);
      const matchVariety = p.variety?.toLowerCase().includes(sTerm);
      const matchFamily = p.family?.toLowerCase().includes(sTerm);
      if (!matchName && !matchVariety && !matchFamily) return false;
    }

    return true;
  });

  // Sort plantings (most recently updated first)
  filteredPlantings.sort((a, b) => {
    const aTime = a.logs && a.logs.length > 0 ? new Date(a.logs[0].date).getTime() : 0;
    const bTime = b.logs && b.logs.length > 0 ? new Date(b.logs[0].date).getTime() : 0;
    return bTime - aTime;
  });

  // Group by bed locations
  const locationGroups: { [loc: string]: Planting[] } = {};
  filteredPlantings.forEach(p => {
    const locName = getBedName(p.location);
    if (!locationGroups[locName]) {
      locationGroups[locName] = [];
    }
    locationGroups[locName].push(p);
  });

  // Get distinct years for filter
  const distinctYears = Array.from(
    new Set(
      plantings.flatMap(p => p.logs || [])
        .filter(l => l.type === "sow")
        .map(l => new Date(l.date).getFullYear().toString())
    )
  ).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Filters Box */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-50">
          <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">
            Filter Historic Allotment Records
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Plot / Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Locations</option>
              <option value="Seed Trays">Seed Trays</option>
              <option value="Greenhouse">Greenhouse</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Plant Family
            </label>
            <select
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Families</option>
              <option value="Brassicaceae (Brassica Family)">Brassicaceae</option>
              <option value="Amaryllidaceae (Onion Family)">Onion Family</option>
              <option value="Apiaceae (Carrot Family)">Carrot Family</option>
              <option value="Solanaceae (Nightshade Family)">Nightshade</option>
              <option value="Fabaceae (Legumes)">Legumes</option>
              <option value="Cucurbitaceae (Squash Family)">Squash Family</option>
              <option value="Asteraceae (Daisy Family)">Daisy Family</option>
              <option value="Amaranthaceae (Beet Family)">Beet Family</option>
              <option value="Polygonaceae (Rhubarb)">Rhubarb</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Sowing Year
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Years</option>
              {distinctYears.map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Lifecycle State
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All States</option>
              <option value="active">Active Growing</option>
              <option value="finished">Finished / Cleared</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Crop Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="Sown">Sown</option>
              <option value="Growing">Growing</option>
              <option value="Harvesting">Harvesting</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Keyword Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search crop, variety..."
                className="w-full pl-8 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group List display */}
      <div className="space-y-6">
        {Object.keys(locationGroups).length === 0 ? (
          <div className="text-center py-12 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
            No crops matched the active filters. Keep sowing!
          </div>
        ) : (
          Object.entries(locationGroups).map(([locationName, cropList]) => (
            <div key={locationName} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-150 pb-1 mt-6">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">
                  📍 {locationName}
                </h3>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded-full">
                  {cropList.length} crops
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cropList.map(p => {
                  const isFinished = p.status === "Finished";
                  const isExpanded = expandedPlantingIds.has(p.id);

                  // Seed specs
                  const matchedSeed = p.seed_id ? seeds.find(s => s.id === p.seed_id) : null;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between ${
                        isFinished ? "opacity-65" : ""
                      }`}
                    >
                      <div>
                        {/* Crop Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-neutral-800 text-sm">
                                {p.name}
                              </h4>
                              {p.variety && (
                                <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded font-semibold italic">
                                  "{p.variety}"
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-semibold">
                              Family: {p.family?.replace(/Family/g, "").trim() || "Other"}
                            </span>
                          </div>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === "Sown" ? "bg-blue-50 text-blue-700" : ""
                          } ${
                            p.status === "Growing" ? "bg-emerald-50 text-emerald-700" : ""
                          } ${
                            p.status === "Harvesting" ? "bg-amber-50 text-amber-700 animate-pulse" : ""
                          } ${
                            p.status === "Finished" ? "bg-neutral-100 text-neutral-600" : ""
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Seed Specs details tag */}
                        {matchedSeed && (
                          <div className="mt-2.5 p-2 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-[10px] text-indigo-900 leading-normal flex items-start gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <strong>Seed details:</strong> Germination {matchedSeed.germinate || "N/A"}, Maturity {matchedSeed.maturity ? `${matchedSeed.maturity} days` : "N/A"}
                            </div>
                          </div>
                        )}

                        {p.harvest_date && p.status !== "Finished" && (
                          <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100/40 w-fit flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Estimated Harvest: {formatDate(p.harvest_date)}</span>
                          </div>
                        )}

                        {/* Logs Timeline section */}
                        <div className="mt-4 space-y-2">
                          <button
                            onClick={() => toggleExpand(p.id)}
                            className="w-full text-left py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100/80 text-neutral-700 text-[10px] font-bold rounded-lg flex items-center justify-between border border-neutral-150 transition"
                          >
                            <span>
                              {isExpanded ? "Hide Logs & Timeline" : `Show logs & progress history (${p.logs?.length || 0})`}
                            </span>
                            <span>{isExpanded ? "▲" : "▼"}</span>
                          </button>

                          {isExpanded && (
                            <div className="pl-3 border-l-2 border-emerald-100 space-y-3 pt-2">
                              {p.logs && p.logs.length > 0 ? (
                                p.logs.map(log => {
                                  let logIco = "📝";
                                  let logTypeLabel = "Log";
                                  if (log.type === "sow") { logIco = "🌱"; logTypeLabel = "Sown"; }
                                  if (log.type === "feed") { logIco = "💧"; logTypeLabel = `Fed (${log.fertilizer || "treatment"})`; }
                                  if (log.type === "transplant") { logIco = "🪴"; logTypeLabel = `Transplanted to ${getBedName(log.location || "")}`; }
                                  if (log.type === "harvest") { logIco = "🍅"; logTypeLabel = "Harvested"; }
                                  if (log.type === "finish") { logIco = "🏁"; logTypeLabel = "Cleared / Finished"; }
                                  if (log.type === "checkup") { logIco = "🔍"; logTypeLabel = "Checkup"; }

                                  return (
                                    <div key={log.id} className="relative group text-xs border-b border-neutral-100 pb-2 last:border-none">
                                      <div className="flex items-center justify-between font-bold text-neutral-700 text-[11px]">
                                        <span>
                                          {formatDate(log.date)} - {logIco} {logTypeLabel}
                                        </span>
                                        <button
                                          onClick={() => onDeleteLog(p.id, log.id)}
                                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition duration-150 p-1"
                                          title="Delete entry log"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                      {log.note && (
                                        <p className="text-neutral-500 font-medium mt-1 leading-normal pl-1">
                                          {log.note}
                                        </p>
                                      )}
                                      {log.image_url && (
                                        <img
                                          src={log.image_url}
                                          alt="Progress photo"
                                          className="mt-2 max-h-24 rounded-lg object-cover border border-neutral-150"
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[10px] text-neutral-400 italic">
                                  No logs recorded.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deletions crop row */}
                      <button
                        onClick={() => onDeletePlanting(p.id)}
                        className="w-full mt-4 py-2 border border-red-100 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        <span>Remove Crop</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

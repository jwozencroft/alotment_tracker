import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Sprout, Droplet, Bookmark, CheckSquare, Sun } from "lucide-react";
import { Bed, Planting, Journal } from "../types";

interface CalendarTabProps {
  beds: Bed[];
  plantings: Planting[];
  journals: Journal[];
}

export default function CalendarTab({ beds, plantings, journals }: CalendarTabProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split("T")[0]);

  // Filters
  const [showLifecycle, setShowLifecycle] = useState(true);
  const [showCare, setShowCare] = useState(true);
  const [showHarvests, setShowHarvests] = useState(true);
  const [showBedTasks, setShowBedTasks] = useState(true);
  const [showJournals, setShowJournals] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (offset: number) => {
    const nextDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(nextDate);
  };

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getEventsForDate = (dStr: string) => {
    const evs: { type: "plant" | "care" | "harvest" | "task" | "journal"; title: string; desc: string }[] = [];

    plantings.forEach(p => {
      // Expected harvest date
      if (showHarvests && p.harvest_date === dStr && p.status !== "Finished") {
        evs.push({
          type: "harvest",
          title: `🎯 Harvest: ${p.name}`,
          desc: `Expected harvest of ${p.name} (${p.variety || "no variety"})`
        });
      }

      // Planting logs
      p.logs?.forEach(l => {
        if (l.date === dStr) {
          if (showLifecycle && l.type === "sow") {
            evs.push({
              type: "plant",
              title: `🌱 Sown: ${p.name}`,
              desc: l.note || "Crop sowed in location."
            });
          }
          if (showCare && (l.type === "feed" || l.type === "checkup" || l.type === "transplant")) {
            let actionText = "Checkup";
            if (l.type === "feed") actionText = `Fed (${l.fertilizer || "fertilizer"})`;
            if (l.type === "transplant") actionText = `Moved to ${l.location || "new bed"}`;

            evs.push({
              type: "care",
              title: `💧 Care: ${p.name}`,
              desc: `${actionText} - ${l.note || ""}`
            });
          }
          if (showHarvests && l.type === "harvest") {
            evs.push({
              type: "harvest",
              title: `🍅 Sown: ${p.name} Harvested`,
              desc: l.note || "Successfully harvested crops."
            });
          }
        }
      });
    });

    if (showBedTasks) {
      beds.forEach(b => {
        b.tasks?.forEach(t => {
          if (t.date === dStr) {
            evs.push({
              type: "task",
              title: `⚠️ Task: ${b.name}`,
              desc: `${t.completed ? "[Completed] " : ""}${t.text}`
            });
          }
        });
        b.logs?.forEach(l => {
          if (l.date === dStr) {
            evs.push({
              type: "task",
              title: `📝 Bed Log: ${b.name}`,
              desc: l.note
            });
          }
        });
      });
    }

    if (showJournals) {
      journals.forEach(j => {
        if (j.date === dStr) {
          evs.push({
            type: "journal",
            title: `📖 Diary Entry`,
            desc: j.title + " - " + j.notes
          });
        }
      });
    }

    return evs;
  };

  const getCalendarCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Adjust to Monday start
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { dateStr: string | null; dayNumber: number | null }[] = [];

    // Padding previous month
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: null, dayNumber: null });
    }

    // Current month cells
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dateStr: dStr, dayNumber: i });
    }

    return cells;
  };

  const cells = getCalendarCells();
  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Daily Details card - Now at the Top! */}
      <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Daily Timeline Details
            </h3>
            <h4 className="text-lg font-bold text-neutral-800 mt-0.5">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "Select a day"}
            </h4>
          </div>
          <div className="text-xs text-neutral-500 font-semibold bg-neutral-100 px-3 py-1 rounded-lg">
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'} scheduled
          </div>
        </div>

        <div>
          {selectedDayEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDayEvents.map((ev, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed transition hover:shadow-sm ${
                    ev.type === "plant" ? "bg-emerald-50/40 border-emerald-100 text-emerald-950" : ""
                  } ${
                    ev.type === "care" ? "bg-blue-50/40 border-blue-100 text-blue-950" : ""
                  } ${
                    ev.type === "harvest" ? "bg-amber-50/40 border-amber-100 text-amber-950" : ""
                  } ${
                    ev.type === "task" ? "bg-orange-50/40 border-orange-100 text-orange-950" : ""
                  } ${
                    ev.type === "journal" ? "bg-purple-50/40 border-purple-100 text-purple-950" : ""
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {ev.type === "plant" && <Sprout className="h-4 w-4 text-emerald-600" />}
                    {ev.type === "care" && <Droplet className="h-4 w-4 text-blue-600" />}
                    {ev.type === "harvest" && <Sun className="h-4 w-4 text-amber-600" />}
                    {ev.type === "task" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                    {ev.type === "journal" && <Bookmark className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold mb-0.5 truncate" title={ev.title}>{ev.title}</div>
                    <p className="text-neutral-500 font-medium line-clamp-2" title={ev.desc}>{ev.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-neutral-400 italic">
              No garden activities or expectations logged for this day. Select a day on the calendar below to view its details.
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid - Below the details card */}
      <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-50">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-neutral-800">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 hover:bg-neutral-50 border border-neutral-200 rounded-lg transition"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="px-3 py-1.5 hover:bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-lg text-neutral-600 transition"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 hover:bg-neutral-50 border border-neutral-200 rounded-lg transition"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Categories checklist filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100 font-medium">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showLifecycle}
              onChange={() => setShowLifecycle(!showLifecycle)}
              className="rounded text-emerald-600 focus:ring-emerald-500/20"
            />
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lifecycle
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showCare}
              onChange={() => setShowCare(!showCare)}
              className="rounded text-blue-600 focus:ring-blue-500/20"
            />
            <span className="flex items-center gap-1 text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Care & Water
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showHarvests}
              onChange={() => setShowHarvests(!showHarvests)}
              className="rounded text-amber-600 focus:ring-amber-500/20"
            />
            <span className="flex items-center gap-1 text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Harvests
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showBedTasks}
              onChange={() => setShowBedTasks(!showBedTasks)}
              className="rounded text-orange-600 focus:ring-orange-500/20"
            />
            <span className="flex items-center gap-1 text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Plot Tasks
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showJournals}
              onChange={() => setShowJournals(!showJournals)}
              className="rounded text-purple-600 focus:ring-purple-500/20"
            />
            <span className="flex items-center gap-1 text-purple-800">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Diaries
            </span>
          </label>
        </div>

        {/* Month grid layout */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="text-center font-semibold text-[10px] uppercase tracking-wider text-neutral-400 py-1">
              {day}
            </div>
          ))}

          {/* Cells */}
          {cells.map((cell, idx) => {
            const isToday = cell.dateStr === getTodayString();
            const isSelected = cell.dateStr === selectedDate;
            const events = cell.dateStr ? getEventsForDate(cell.dateStr) : [];

            // Event indicators
            const hasPlant = events.some(e => e.type === "plant");
            const hasCare = events.some(e => e.type === "care");
            const hasHarvest = events.some(e => e.type === "harvest");
            const hasTask = events.some(e => e.type === "task");
            const hasJournal = events.some(e => e.type === "journal");

            return (
              <button
                key={idx}
                disabled={!cell.dayNumber}
                onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                className={`min-h-[64px] border rounded-xl p-1.5 flex flex-col justify-between text-left transition ${
                  !cell.dayNumber
                    ? "bg-neutral-50/50 border-transparent cursor-default"
                    : "bg-white hover:bg-neutral-50 cursor-pointer"
                } ${
                  isToday ? "ring-2 ring-emerald-500/30 border-emerald-500 bg-emerald-50/10" : "border-neutral-150"
                } ${
                  isSelected ? "bg-emerald-50/20 border-emerald-500 text-emerald-900" : ""
                }`}
              >
                {cell.dayNumber && (
                  <>
                    <span className={`text-[11px] font-bold ${
                      isToday ? "text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-lg" : "text-neutral-500"
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {/* Micro dot markers */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasPlant && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {hasCare && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      {hasHarvest && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {hasTask && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                      {hasJournal && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

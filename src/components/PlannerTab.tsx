import React, { useState } from "react";
import { 
  Grid, Calendar, FileText, Image, Trash2, Edit3, MapPin, Eye, CheckCircle, 
  Search, Sparkles, AlertTriangle, Eraser, Sprout, RefreshCw, HelpCircle
} from "lucide-react";
import { Bed, BedPlan, Seed } from "../types";

interface PlannerTabProps {
  beds: Bed[];
  bedPlans: BedPlan[];
  seeds: Seed[];
  onAddPlan: (plan: any) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onEditPlan: (plan: BedPlan) => void;
}

// Normalized Crop Pairing Configs for Allotment Companion Calculations
const SYNERGIES: Record<string, string[]> = {
  tomato: ["basil", "marigold", "lettuce", "spinach"],
  basil: ["tomato"],
  marigold: ["tomato", "potato", "cabbage", "kale"],
  carrot: ["onion", "leek", "lettuce", "radish"],
  onion: ["carrot", "lettuce", "spinach"],
  leek: ["carrot"],
  lettuce: ["tomato", "carrot", "onion", "radish", "strawberry"],
  radish: ["carrot", "lettuce", "spinach"],
  cabbage: ["mint", "spinach"],
  mint: ["cabbage", "kale"],
  kale: ["mint"],
  potato: ["marigold"],
  spinach: ["tomato", "onion", "radish", "cabbage", "strawberry"],
  strawberry: ["lettuce", "spinach"],
};

const CONFLICTS: Record<string, string[]> = {
  tomato: ["potato", "fennel", "cabbage"],
  potato: ["tomato", "sunflower", "onion"],
  fennel: ["tomato"],
  sunflower: ["potato"],
  onion: ["pea", "bean", "garlic", "potato"],
  pea: ["onion", "garlic"],
  bean: ["onion", "garlic"],
  garlic: ["pea", "bean", "onion"],
  cabbage: ["tomato"],
};

// Help explain companion logic simply
const COMPANION_DETAILS: Record<string, string> = {
  "tomato-basil": "Basil repels hornworms, mosquitoes, and improves tomato fruit flavor profile.",
  "tomato-marigold": "Marigold root secretions deter soil nematodes and repel whiteflies on tender stems.",
  "carrot-onion": "Onion smell deters Carrot Rust Fly, while Carrot scent confuses onion thrip pests.",
  "carrot-leek": "Leek protects carrots from rust flies, carrots deter leek moths. Symbiotic pairing.",
  "lettuce-radish": "Radish acts as a trap crop for flea beetles, drawing them away from lettuce leaves.",
  "cabbage-mint": "Mint aromatic oil strongly repels cabbage white butterflies and caterpillars.",
  "potato-marigold": "Marigolds protect root tubers from nematodes and repel Colorado potato beetles.",
  "spinach-strawberry": "Spinach provides natural ground cover shielding soil humidity for shallow strawberry roots.",
  "tomato-potato": "Nightshade competition! They compete for identical soil nutrition and both share early blight.",
  "tomato-fennel": "Fennel acts as an inhibitor, releasing chemicals that severely stunt tomato vine growth.",
  "potato-sunflower": "Sunflowers produce allelopathic chemicals that can stunt adjacent potato tuber sizing.",
  "onion-pea": "Alliums release chemicals that inhibit nitrogen-fixing bacteria on legumes, stunting crop yield.",
  "onion-bean": "Alliums inhibit legumes' root nodule nitrogen fixation, stunting green bean growth.",
  "garlic-pea": "Garlic suppresses root nodule nitrogen production on young pea seedlings.",
  "garlic-bean": "Garlic stunts active pod development by inhibiting legume nitrogen-fixing processes.",
  "cabbage-tomato": "Tomatoes stunt brassica development; brassicas draw heavy water, drying out tomato roots."
};

export default function PlannerTab({
  beds,
  bedPlans,
  seeds,
  onAddPlan,
  onDeletePlan,
  onEditPlan,
}: PlannerTabProps) {
  const [selectedBedId, setSelectedBedId] = useState(beds[0]?.id || "");
  const [year, setYear] = useState(new Date().getFullYear());
  const [grid, setGrid] = useState<(string | null)[]>(Array(16).fill(null));
  const [notes, setNotes] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag and Drop / Palette Interactive States
  const [selectedSeedType, setSelectedSeedType] = useState<string | null>(null);
  const [eraserActive, setEraserActive] = useState(false);
  const [seedSearch, setSeedSearch] = useState("");

  // Default fallback catalog if user's seed box is empty
  const defaultCrops = [
    { type: "Tomatoes", family: "Solanaceae" },
    { type: "Basil", family: "Lamiaceae" },
    { type: "Marigold", family: "Asteraceae" },
    { type: "Potatoes", family: "Solanaceae" },
    { type: "Carrots", family: "Apiaceae" },
    { type: "Onions", family: "Amaryllidaceae" },
    { type: "Lettuce", family: "Asteraceae" },
    { type: "Radish", family: "Brassicaceae" },
    { type: "Cabbage", family: "Brassicaceae" },
    { type: "Mint", family: "Lamiaceae" },
    { type: "Spinach", family: "Amaranthaceae" },
    { type: "Strawberry", family: "Rosaceae" },
  ];

  const availableSeeds = seeds.length > 0 
    ? seeds.map(s => ({ type: s.type, family: s.family }))
    : defaultCrops;

  const filteredSeeds = availableSeeds.filter(s => 
    s.type.toLowerCase().includes(seedSearch.toLowerCase()) ||
    s.family.toLowerCase().includes(seedSearch.toLowerCase())
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > 600) {
          h *= 600 / w;
          w = 600;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        setImageB64(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCellChange = (index: number, val: string | null) => {
    const nextGrid = [...grid];
    nextGrid[index] = val;
    setGrid(nextGrid);
  };

  const handleCellClick = (index: number) => {
    if (eraserActive) {
      handleCellChange(index, null);
    } else if (selectedSeedType) {
      handleCellChange(index, selectedSeedType);
    }
  };

  const handleClearGrid = () => {
    if (window.confirm("Are you sure you want to clear the active grid cells?")) {
      setGrid(Array(16).fill(null));
    }
  };

  const resetForm = () => {
    setGrid(Array(16).fill(null));
    setNotes("");
    setImageB64(null);
    setEditingId(null);
    setSelectedSeedType(null);
    setEraserActive(false);
    const fileInput = document.getElementById("planImageInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) {
      alert("Please select a Bed!");
      return;
    }
    setIsSubmitting(true);

    try {
      const planPayload = {
        id: editingId || Date.now().toString(36),
        bedId: selectedBedId,
        year: Number(year),
        grid,
        notes,
        image_url: imageB64,
      };

      await onAddPlan(planPayload);
      resetForm();
    } catch (err) {
      alert("Failed to save plan design.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (plan: BedPlan) => {
    setEditingId(plan.id);
    setSelectedBedId(plan.bed_id);
    setYear(plan.year);
    setGrid(plan.grid.map(c => c || null));
    setNotes(plan.notes);
    setImageB64(plan.image_url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- COMPANION ALERTS COMPUTATION LOGIC ---

  const getCropKey = (val: string | null): string => {
    if (!val) return "";
    const v = val.toLowerCase().trim();
    if (v.includes("tomato")) return "tomato";
    if (v.includes("potato")) return "potato";
    if (v.includes("basil")) return "basil";
    if (v.includes("marigold")) return "marigold";
    if (v.includes("carrot")) return "carrot";
    if (v.includes("onion")) return "onion";
    if (v.includes("leek")) return "leek";
    if (v.includes("lettuce")) return "lettuce";
    if (v.includes("radish")) return "radish";
    if (v.includes("cabbage")) return "cabbage";
    if (v.includes("mint")) return "mint";
    if (v.includes("kale")) return "kale";
    if (v.includes("spinach")) return "spinach";
    if (v.includes("strawberry")) return "strawberry";
    if (v.includes("garlic")) return "garlic";
    if (v.includes("pea")) return "pea";
    if (v.includes("bean")) return "bean";
    if (v.includes("fennel")) return "fennel";
    if (v.includes("sunflower")) return "sunflower";
    return v;
  };

  const getAdjacentIndices = (idx: number): number[] => {
    const adj = [];
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    if (col > 0) adj.push(idx - 1); // left
    if (col < 3) adj.push(idx + 1); // right
    if (row > 0) adj.push(idx - 4); // up
    if (row < 3) adj.push(idx + 4); // down
    return adj;
  };

  // Evaluate cell metrics
  const cellAnalysis = grid.map((crop, idx) => {
    if (!crop) return { hasSynergy: false, hasConflict: false, synergiesList: [] as string[], conflictsList: [] as string[] };
    
    const key = getCropKey(crop);
    const adjacent = getAdjacentIndices(idx);
    
    const synergiesList: string[] = [];
    const conflictsList: string[] = [];

    adjacent.forEach(adjIdx => {
      const neighborCrop = grid[adjIdx];
      if (neighborCrop) {
        const neighborKey = getCropKey(neighborCrop);
        
        // Check synergy
        if (SYNERGIES[key]?.includes(neighborKey)) {
          synergiesList.push(neighborCrop);
        }
        // Check conflict
        if (CONFLICTS[key]?.includes(neighborKey)) {
          conflictsList.push(neighborCrop);
        }
      }
    });

    return {
      hasSynergy: synergiesList.length > 0,
      hasConflict: conflictsList.length > 0,
      synergiesList,
      conflictsList
    };
  });

  // Compile overall bed synergies and conflicts
  const overallSynergies: { cropA: string; cropB: string; slotA: number; slotB: number; details: string }[] = [];
  const overallConflicts: { cropA: string; cropB: string; slotA: number; slotB: number; details: string }[] = [];

  for (let i = 0; i < 16; i++) {
    const cropA = grid[i];
    if (!cropA) continue;
    const keyA = getCropKey(cropA);
    const adjacent = getAdjacentIndices(i);

    adjacent.forEach(j => {
      // Avoid double logging (only record pairs where i < j)
      if (i < j) {
        const cropB = grid[j];
        if (cropB) {
          const keyB = getCropKey(cropB);

          // Check Synergy
          if (SYNERGIES[keyA]?.includes(keyB)) {
            const detailKey = `${keyA}-${keyB}`;
            const alternateDetailKey = `${keyB}-${keyA}`;
            const details = COMPANION_DETAILS[detailKey] || COMPANION_DETAILS[alternateDetailKey] || "Beneficial companion pairing enhances nutrient distribution or repels pests.";
            overallSynergies.push({
              cropA,
              cropB,
              slotA: i + 1,
              slotB: j + 1,
              details
            });
          }

          // Check Conflict
          if (CONFLICTS[keyA]?.includes(keyB)) {
            const detailKey = `${keyA}-${keyB}`;
            const alternateDetailKey = `${keyB}-${keyA}`;
            const details = COMPANION_DETAILS[detailKey] || COMPANION_DETAILS[alternateDetailKey] || "Compete for identical nutrition levels or attract shared vector pathogens.";
            overallConflicts.push({
              cropA,
              cropB,
              slotA: i + 1,
              slotB: j + 1,
              details
            });
          }
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Printable Area hidden on screen but styled for @media print */}
      <div id="print-area" className="hidden print:block p-8 bg-white text-neutral-900 space-y-6">
        <div className="border-b-2 border-neutral-800 pb-3">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Allotment Garden Blueprint</h1>
          <p className="text-xs text-neutral-500">Official Allotment Tracker Plot Layout and Bed rotation designs.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="border border-neutral-400 p-4 rounded-xl">
            <h3 className="font-bold text-sm uppercase mb-2">Selected Plot Location</h3>
            <p className="text-xs"><strong>Bed ID:</strong> {selectedBedId ? (beds.find(b => b.id === selectedBedId)?.name || selectedBedId) : "Unassigned"}</p>
            <p className="text-xs"><strong>Planning Year:</strong> {year}</p>
            <p className="text-xs mt-2"><strong>Planner Notes:</strong> {notes || "No custom rotation notes added."}</p>
          </div>

          <div className="border border-neutral-400 p-4 rounded-xl flex flex-col items-center justify-center">
            <h3 className="font-bold text-sm uppercase mb-3 text-center">4x4 Crop Coordination Layout</h3>
            <div className="grid grid-cols-4 gap-1.5 w-44 h-44 border border-neutral-300 p-1 bg-neutral-50">
              {grid.map((cellValue, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-neutral-300 flex flex-col items-center justify-center text-[8px] font-bold text-center leading-tight p-0.5"
                >
                  <span className="text-[6px] text-neutral-400">#{idx + 1}</span>
                  <span className="truncate max-w-full text-neutral-800">{cellValue || "Empty"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {overallSynergies.length > 0 && (
          <div className="border border-neutral-300 p-4 rounded-xl">
            <h4 className="font-bold text-xs uppercase text-emerald-800 mb-2">🌿 Identified Companions & Synergies</h4>
            <ul className="list-disc pl-4 text-xs space-y-1">
              {overallSynergies.map((syn, index) => (
                <li key={index}>
                  <strong>Slot {syn.slotA} ({syn.cropA}) & Slot {syn.slotB} ({syn.cropB})</strong>: {syn.details}
                </li>
              ))}
            </ul>
          </div>
        )}

        {overallConflicts.length > 0 && (
          <div className="border border-neutral-300 p-4 rounded-xl">
            <h4 className="font-bold text-xs uppercase text-red-800 mb-2">⚠️ Nutrient Competition & Pest Flags</h4>
            <ul className="list-disc pl-4 text-xs space-y-1">
              {overallConflicts.map((con, index) => (
                <li key={index}>
                  <strong>Slot {con.slotA} ({con.cropA}) & Slot {con.slotB} ({con.cropB})</strong>: {con.details}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-neutral-300 pt-3 text-[9px] text-neutral-400 flex justify-between">
          <span>Printed via Allotment Tracker Intelligence Suite</span>
          <span>Date: {new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Plan Form */}
        <div className="lg:col-span-1 bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-neutral-800 mb-1">
              {editingId ? "✏️ Edit Layout Design" : "🗺️ Draw Bed Design"}
            </h3>
            <p className="text-xs text-neutral-500">
              Map out plant positions & rotation layouts
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Select Plot / Bed
              </label>
              <select
                required
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
              >
                <option value="">-- Choose Bed --</option>
                {beds.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Planning Year
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  required
                  min={2020}
                  max={2050}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Upload Draft Sheet / Photo
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="file"
                  id="planImageInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Companion / Rotation Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record companion plantings, shadow offsets, or fertilizer preps..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-neutral-800"
                />
              </div>
            </div>

            {imageB64 && (
              <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50/50 flex flex-col items-center">
                <img
                  src={imageB64}
                  alt="Draft Plan preview"
                  className="max-h-36 rounded object-contain"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : editingId ? "Update Plan" : "Save Plan Layout"}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel Editing
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Upgraded Drag-and-Drop & Live Companion Planner Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-800 mb-0.5 flex items-center gap-1.5">
                  <Grid className="h-5 w-5 text-emerald-600" />
                  <span>Interactive Drag & Drop Bed Canvas</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Drag seed packets from the Seed Box palette onto the grid, or select a seed packet then click.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={handleClearGrid}
                  className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Reset planner canvas"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Clear Grid</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Grid and Palette Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Draggable Seed Packets Palette Panel */}
              <div className="md:col-span-4 border border-neutral-200 rounded-2xl bg-neutral-50 p-4 space-y-3 flex flex-col h-[340px]">
                <div className="shrink-0 space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    📦 Seed Packet Palette
                  </span>
                  
                  {/* Palette Search filter */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search seeds..."
                      value={seedSearch}
                      onChange={(e) => setSeedSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Packet list box */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {filteredSeeds.length === 0 ? (
                    <div className="text-[11px] text-neutral-400 italic text-center py-8">
                      No matching seeds found in inventory.
                    </div>
                  ) : (
                    filteredSeeds.map((seed, sIdx) => {
                      const isSelected = selectedSeedType === seed.type && !eraserActive;
                      return (
                        <div
                          key={sIdx}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", seed.type);
                            setSelectedSeedType(seed.type);
                            setEraserActive(false);
                          }}
                          onClick={() => {
                            setSelectedSeedType(seed.type);
                            setEraserActive(false);
                          }}
                          className={`p-2 bg-white border rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-emerald-300 hover:shadow-sm transition select-none ${
                            isSelected 
                              ? "border-emerald-500 ring-2 ring-emerald-500/15" 
                              : "border-neutral-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sprout className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <div className="text-xs font-bold text-neutral-800 truncate leading-none mb-0.5">{seed.type}</div>
                              <span className="text-[9px] text-neutral-400 font-medium truncate uppercase">{seed.family.split(" ")[0]}</span>
                            </div>
                          </div>
                          <span className="text-[8px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-400 font-bold shrink-0 uppercase">Drag</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Tool controllers (Eraser and Active Indicator) */}
                <div className="shrink-0 pt-2 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEraserActive(!eraserActive);
                      setSelectedSeedType(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      eraserActive 
                        ? "bg-red-50 border-red-200 text-red-600 ring-2 ring-red-500/15" 
                        : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    <span>Eraser</span>
                  </button>
                </div>
              </div>

              {/* 4x4 Grid Board Canvas */}
              <div className="md:col-span-8 flex flex-col justify-center">
                <div className="grid grid-cols-4 gap-2 bg-neutral-100 p-3.5 border border-neutral-200 rounded-2xl aspect-square max-w-[340px] w-full mx-auto">
                  {grid.map((cellValue, idx) => {
                    const analysis = cellAnalysis[idx];
                    
                    // Style classes based on active companion calculations
                    let cellClasses = "bg-white border-neutral-200 hover:border-emerald-400";
                    let glowIndicator = null;

                    if (analysis.hasConflict) {
                      cellClasses = "bg-red-50/20 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse";
                      glowIndicator = (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white" title="Nutrient conflict flagged!">
                          <AlertTriangle className="h-2 w-2" />
                        </span>
                      );
                    } else if (analysis.hasSynergy) {
                      cellClasses = "bg-emerald-50/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
                      glowIndicator = (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-bounce" title="Synergistic pairing!">
                          <Sparkles className="h-2.5 w-2.5" />
                        </span>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const val = e.dataTransfer.getData("text/plain");
                          if (val) {
                            handleCellChange(idx, val);
                          }
                        }}
                        onClick={() => handleCellClick(idx)}
                        className={`relative rounded-xl p-2 flex flex-col justify-between shadow-sm transition border-2 group cursor-pointer select-none ${cellClasses}`}
                      >
                        {glowIndicator}

                        <span className="text-[8px] text-neutral-400 font-bold self-start font-mono leading-none">
                          SLOT {idx + 1}
                        </span>

                        <div className="flex-1 flex items-center justify-center py-1.5 text-center min-w-0">
                          {cellValue ? (
                            <div className="w-full">
                              <div className="text-xs font-extrabold text-neutral-800 truncate leading-none mb-0.5" title={cellValue}>
                                {cellValue}
                              </div>
                              <span className="text-[8px] text-neutral-400 font-medium truncate block leading-none">
                                {getCropKey(cellValue)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-300 font-medium italic group-hover:text-emerald-300">
                              Empty
                            </span>
                          )}
                        </div>

                        {/* Inline input if user still prefers typing */}
                        <input
                          type="text"
                          value={cellValue || ""}
                          onChange={(e) => handleCellChange(idx, e.target.value || null)}
                          placeholder="Type crop..."
                          onClick={(e) => e.stopPropagation()} // Prevent triggering parent click handler
                          className="w-full border-t border-neutral-100 outline-none text-[8px] font-bold text-center text-neutral-500 pt-1 mt-1 placeholder-neutral-300 bg-transparent focus:text-neutral-800"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Companion Planting Advisor Real-Time Feedback Panel */}
            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  🌿 Live Allotment Companion Advisor
                </h4>
              </div>

              {overallSynergies.length === 0 && overallConflicts.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200/60 p-4 rounded-xl text-center text-xs text-neutral-500 flex flex-col items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-neutral-400 mb-1 stroke-1" />
                  <span>No interactive companions identified. Drop synergistic crops (e.g. Tomatoes adjacent to Basil or Marigolds) to discover synergies! Avoid placing Tomatoes near Potatoes.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Synergies listed */}
                  {overallSynergies.length > 0 && (
                    <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        🍀 Active Synergies & Companions ({overallSynergies.length})
                      </span>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                        {overallSynergies.map((syn, index) => (
                          <div key={index} className="text-xs bg-white border border-emerald-50 p-2.5 rounded-lg">
                            <div className="font-bold text-emerald-950 mb-0.5">
                              Slot {syn.slotA} ({syn.cropA}) ↔ Slot {syn.slotB} ({syn.cropB})
                            </div>
                            <p className="text-[11px] text-neutral-600 leading-normal">
                              {syn.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conflicts listed */}
                  {overallConflicts.length > 0 && (
                    <div className="bg-red-50/40 border border-red-100 p-3.5 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
                        ⚠️ Competition & Disease Outbreaks ({overallConflicts.length})
                      </span>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                        {overallConflicts.map((con, index) => (
                          <div key={index} className="text-xs bg-white border border-red-50 p-2.5 rounded-lg">
                            <div className="font-bold text-red-950 mb-0.5">
                              Slot {con.slotA} ({con.cropA}) ↔ Slot {con.slotB} ({con.cropB})
                            </div>
                            <p className="text-[11px] text-neutral-600 leading-normal">
                              {con.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved designs list */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-800">
            Saved Allotment Layouts
          </h3>
          <p className="text-xs text-neutral-500">
            History of crop rotation maps and bed layouts
          </p>
        </div>

        {bedPlans.length === 0 ? (
          <div className="text-center py-10 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
            No garden layout plans saved yet. Get started by plotting above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bedPlans.map(plan => {
              const bedName = beds.find(b => b.id === plan.bed_id)?.name || "Unknown Bed";
              return (
                <div
                  key={plan.id}
                  className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <h4 className="font-bold text-neutral-800 text-sm">
                          {bedName}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {plan.year} Plan
                      </span>
                    </div>

                    {plan.notes && (
                      <p className="text-xs text-neutral-500 line-clamp-3">
                        {plan.notes}
                      </p>
                    )}

                    {/* Layout micro preview */}
                    <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-50 rounded-lg text-[8px] font-semibold text-neutral-500 text-center">
                      {plan.grid.map((cell, cidx) => (
                        <div
                          key={cidx}
                          className={`h-6 flex items-center justify-center rounded border ${
                            cell
                              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                              : "bg-white border-neutral-150"
                          } overflow-hidden px-0.5 truncate`}
                          title={cell || "Empty slot"}
                        >
                          {cell || ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.image_url && (
                    <img
                      src={plan.image_url}
                      alt="Plan blueprint"
                      className="rounded-xl h-28 w-full object-cover border border-neutral-150"
                    />
                  )}

                  <div className="flex gap-2 pt-2 border-t border-neutral-50 text-xs">
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="flex-1 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 font-semibold rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

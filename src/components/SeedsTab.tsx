import React, { useState } from "react";
import { Plus, Search, Calendar, Tag, Trash2, Edit3, Image, Info, Award, ExternalLink, SlidersHorizontal, CheckCircle } from "lucide-react";
import { Seed } from "../types";

interface SeedsTabProps {
  seeds: Seed[];
  onAddSeed: (seed: any) => Promise<void>;
  onEditSeed: (seedId: string, seedData: any) => Promise<void>;
  onDeleteSeed: (id: string) => Promise<void>;
}

export default function SeedsTab({
  seeds,
  onAddSeed,
  onEditSeed,
  onDeleteSeed,
}: SeedsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");

  // Form States
  const [type, setType] = useState("");
  const [variety, setVariety] = useState("");
  const [family, setFamily] = useState("Other");
  const [months, setMonths] = useState<number[]>([]);
  const [qty, setQty] = useState("");
  const [seedTypeOption, setSeedTypeOption] = useState("");
  const [germinate, setGerminate] = useState("");
  const [maturity, setMaturity] = useState("");
  const [depth, setDepth] = useState("");
  const [light, setLight] = useState("");
  const [expiry, setExpiry] = useState("");
  const [zone, setZone] = useState("");
  const [disease, setDisease] = useState("");
  const [nongmo, setNongmo] = useState(true);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image() as any;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > 400) {
          h *= 400 / w;
          w = 400;
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

  const handleMonthToggle = (monthIndex: number) => {
    const nextMonths = [...months];
    if (nextMonths.includes(monthIndex)) {
      setMonths(nextMonths.filter(m => m !== monthIndex));
    } else {
      setMonths([...nextMonths, monthIndex].sort((a, b) => a - b));
    }
  };

  const resetForm = () => {
    setType("");
    setVariety("");
    setFamily("Other");
    setMonths([]);
    setQty("");
    setSeedTypeOption("");
    setGerminate("");
    setMaturity("");
    setDepth("");
    setLight("");
    setExpiry("");
    setZone("");
    setDisease("");
    setNongmo(true);
    setUrl("");
    setNotes("");
    setImageB64(null);
    setEditingId(null);
    setShowAddForm(false);
    const fileInput = document.getElementById("seedImageInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleEditClick = (seed: Seed) => {
    setEditingId(seed.id);
    setType(seed.type);
    setVariety(seed.variety);
    setFamily(seed.family || "Other");
    setMonths(seed.months || []);
    setQty(seed.qty);
    setSeedTypeOption(seed.seed_type_option || "");
    setGerminate(seed.germinate || "");
    setMaturity(seed.maturity ? seed.maturity.toString() : "");
    setDepth(seed.depth || "");
    setLight(seed.light || "");
    setExpiry(seed.expiry || "");
    setZone(seed.zone || "");
    setDisease(seed.disease || "");
    setNongmo(seed.nongmo);
    setUrl(seed.url || "");
    setNotes(seed.notes || "");
    setImageB64(seed.image_url);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setIsSubmitting(true);

    try {
      const seedPayload = {
        id: editingId || Date.now().toString(36),
        type,
        variety,
        family,
        months,
        qty,
        seed_type_option: seedTypeOption,
        germinate,
        maturity: maturity !== "" ? Number(maturity) : null,
        depth,
        light,
        expiry,
        zone,
        disease,
        nongmo,
        url,
        notes,
        image_url: imageB64,
      };

      if (editingId) {
        await onEditSeed(editingId, seedPayload);
      } else {
        await onAddSeed(seedPayload);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save Seed box entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run filters
  const filteredSeeds = seeds.filter(seed => {
    const sTerm = searchQuery.toLowerCase().trim();
    if (sTerm) {
      const mType = seed.type.toLowerCase().includes(sTerm);
      const mVariety = seed.variety?.toLowerCase().includes(sTerm);
      const mFamily = seed.family?.toLowerCase().includes(sTerm);
      if (!mType && !mVariety && !mFamily) return false;
    }

    if (filterMonth !== "all") {
      const mIdx = Number(filterMonth);
      if (!seed.months?.includes(mIdx)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            📦 Shared Seed Box Inventory
          </h2>
          <p className="text-xs text-neutral-500">
            Digital catalogue of owned seed packets, sowing windows, and genetics
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "View Seed Box" : "Add Seed Packet"}</span>
        </button>
      </div>

      {/* Seed Form Card */}
      {showAddForm && (
        <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-1">
              {editingId ? "✏️ Edit Seed Packet" : "📦 Add to Seed Box"}
            </h3>
            <p className="text-xs text-neutral-500">
              Input sowing seasons, quantity levels, and packet instruction specifics
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Plant Type / Crop
                </label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Tomatoes, Carrots"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Plant Variety
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. Moneymaker, Autumn King"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Plant Family
                </label>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Other">Other / Unknown</option>
                  <option value="Brassicaceae (Brassica Family)">Brassicaceae (Brassica)</option>
                  <option value="Amaryllidaceae (Onion Family)">Amaryllidaceae (Onion)</option>
                  <option value="Apiaceae (Carrot Family)">Apiaceae (Carrot)</option>
                  <option value="Solanaceae (Nightshade Family)">Solanaceae (Nightshade)</option>
                  <option value="Fabaceae (Legumes)">Fabaceae (Legumes)</option>
                  <option value="Cucurbitaceae (Squash Family)">Cucurbitaceae (Squash)</option>
                  <option value="Asteraceae (Daisy Family)">Asteraceae (Daisy)</option>
                  <option value="Amaranthaceae (Beet Family)">Amaranthaceae (Beet)</option>
                  <option value="Polygonaceae (Rhubarb)">Polygonaceae (Rhubarb)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Quantity Left / Pack Size
                </label>
                <input
                  type="text"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="e.g. ~50 seeds, 1/2 pack"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Sowing Windows Multiselect Grid */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Best Months to Sow
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                {monthNames.map((mName, idx) => {
                  const isSelected = months.includes(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleMonthToggle(idx)}
                      className={`py-1 rounded-lg text-xs font-semibold text-center border transition ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Spec Expandable Details */}
            <details className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 group">
              <summary className="text-xs font-bold text-neutral-600 uppercase tracking-wider cursor-pointer outline-none select-none flex items-center justify-between">
                <span>🧬 Optional Technical Instruction Specs</span>
                <span className="text-[10px] text-emerald-600 font-semibold group-open:hidden">
                  (Click to expand)
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold hidden group-open:block">
                  (Close)
                </span>
              </summary>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-neutral-200/60 pt-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Seed Type
                  </label>
                  <select
                    value={seedTypeOption}
                    onChange={(e) => setSeedTypeOption(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">-- Choose Type --</option>
                    <option value="Heirloom">Heirloom</option>
                    <option value="Hybrid (F1)">Hybrid (F1)</option>
                    <option value="Open-pollinated">Open-pollinated</option>
                    <option value="Organic">Organic</option>
                    <option value="GMO">GMO</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="nongmoInput"
                    checked={nongmo}
                    onChange={(e) => setNongmo(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500/10 h-4 w-4"
                  />
                  <label htmlFor="nongmoInput" className="text-xs font-semibold text-neutral-600 cursor-pointer">
                    Verified Non-GMO Genetics
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Days to Germinate
                  </label>
                  <input
                    type="text"
                    value={germinate}
                    onChange={(e) => setGerminate(e.target.value)}
                    placeholder="e.g. 7-14 days"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Days to Maturity
                  </label>
                  <input
                    type="number"
                    value={maturity}
                    onChange={(e) => setMaturity(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Depth / Spacing Spans
                  </label>
                  <input
                    type="text"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder="e.g. 1cm depth, 45cm spacing"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Irrigation / Light Needs
                  </label>
                  <input
                    type="text"
                    value={light}
                    onChange={(e) => setLight(e.target.value)}
                    placeholder="e.g. Damp soil, full sun"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Packet Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Disease Resistance Traits
                  </label>
                  <input
                    type="text"
                    value={disease}
                    onChange={(e) => setDisease(e.target.value)}
                    placeholder="e.g. Blight resistant"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Seed Vendor / Guidelines URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://seed-store.com/guidelines"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Specific seedling notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Compost ratios, damping-off warnings..."
                  className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs h-20 focus:outline-none"
                />
              </div>
            </details>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Packet Photo Upload
                </label>
                <input
                  type="file"
                  id="seedImageInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {imageB64 && (
                <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50 flex items-center justify-center">
                  <img
                    src={imageB64}
                    alt="Seed Packet Cover"
                    className="max-h-24 object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 text-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isSubmitting ? "Saving Packet..." : editingId ? "Update Packet" : "Save Packet to Box"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shared catalogue box listing */}
      {!showAddForm && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center max-w-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search seed type, family, variety..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-neutral-400 shrink-0" />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="all">Sow Month: All</option>
                {monthNames.map((mName, mIdx) => (
                  <option key={mIdx} value={mIdx}>
                    Sow Month: {mName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seeds listing */}
          {filteredSeeds.length === 0 ? (
            <div className="text-center py-12 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
              No seed packets match the selected parameters. Add packets above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSeeds.map(seed => {
                const sowMonthsStr = seed.months && seed.months.length > 0
                  ? seed.months.map(mIdx => monthNames[mIdx]).join(", ")
                  : "N/A";

                return (
                  <div
                    key={seed.id}
                    className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {seed.image_url && (
                        <img
                          src={seed.image_url}
                          alt={seed.type}
                          className="w-full h-32 object-cover rounded-xl border border-neutral-150 mb-3"
                        />
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-neutral-800 text-sm">
                            {seed.type}
                          </h4>
                          {seed.variety && (
                            <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded font-semibold italic">
                              "{seed.variety}"
                            </span>
                          )}
                        </div>
                        {seed.nongmo && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Award className="h-3 w-3" />
                            <span>Non-GMO</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-bold text-neutral-500 mt-2 flex flex-col gap-1 leading-normal">
                        <span>Family: {seed.family?.replace(/Family/g, "").trim() || "Other"}</span>
                        <span>Quantity left: <strong className="text-emerald-700">{seed.qty || "N/A"}</strong></span>
                        <span className="text-emerald-800 bg-emerald-50/50 px-2 py-1 rounded border border-emerald-100/30 w-fit mt-1">
                          Sowing Season: {sowMonthsStr}
                        </span>
                      </div>

                      {/* Technical specifications sub details accordion */}
                      {(seed.seed_type_option || seed.germinate || seed.maturity || seed.depth || seed.light || seed.expiry || seed.disease || seed.url || seed.notes) && (
                        <details className="mt-3.5 text-xs border-t border-neutral-100 pt-3 group/sub text-neutral-600">
                          <summary className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider cursor-pointer outline-none select-none flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Instruction Specs</span>
                          </summary>
                          <div className="grid grid-cols-1 gap-1.5 mt-2 bg-neutral-50/60 p-2.5 rounded-xl text-[10px] leading-relaxed">
                            {seed.seed_type_option && <span><strong>Breed:</strong> {seed.seed_type_option}</span>}
                            {seed.germinate && <span><strong>Germinate:</strong> {seed.germinate}</span>}
                            {seed.maturity && <span><strong>Maturity:</strong> {seed.maturity} Days</span>}
                            {seed.depth && <span><strong>Spacing/Depth:</strong> {seed.depth}</span>}
                            {seed.light && <span><strong>Care:</strong> {seed.light}</span>}
                            {seed.expiry && <span><strong>Expiry:</strong> {new Date(seed.expiry).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>}
                            {seed.disease && <span><strong>Resistance:</strong> {seed.disease}</span>}
                            {seed.notes && <span><strong>Notes:</strong> {seed.notes}</span>}
                            {seed.url && (
                              <a
                                href={seed.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5 mt-1"
                              >
                                <span>Purchase Site</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-neutral-50 text-xs">
                      <button
                        onClick={() => handleEditClick(seed)}
                        className="flex-1 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteSeed(seed.id)}
                        className="py-2 px-3 border border-red-150 hover:bg-red-50 text-red-600 font-semibold rounded-xl flex items-center justify-center transition"
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
      )}
    </div>
  );
}

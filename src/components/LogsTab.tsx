import React, { useState } from "react";
import { Sprout, Calendar, Image, FileText, Settings, Droplet, ArrowRight, CheckCircle } from "lucide-react";
import { Bed, Planting, Seed } from "../types";

interface LogsTabProps {
  beds: Bed[];
  plantings: Planting[];
  seeds: Seed[];
  onAddPlanting: (planting: any) => Promise<void>;
  onUpdatePlanting: (plantingId: string, logData: any) => Promise<void>;
  onTabChange: (tabName: string) => void;
}

export default function LogsTab({
  beds,
  plantings,
  seeds,
  onAddPlanting,
  onUpdatePlanting,
  onTabChange,
}: LogsTabProps) {
  const [logMode, setLogMode] = useState<"new" | "update">("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);

  // New Crop fields
  const [plantName, setPlantName] = useState("");
  const [plantFamily, setPlantFamily] = useState("Other");
  const [plantVariety, setPlantVariety] = useState("");
  const [linkedSeedId, setLinkedSeedId] = useState("");
  const [locationNew, setLocationNew] = useState("Seed Trays");
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");

  // Update Crop fields
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [actionType, setActionType] = useState<"checkup" | "feed" | "transplant" | "harvest" | "finish">("checkup");
  const [updateLocation, setUpdateLocation] = useState("Seed Trays");
  const [fertilizerType, setFertilizerType] = useState("");

  // Compress image on select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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

  // Auto fill details if seed match found
  const handlePlantNameChange = (val: string) => {
    setPlantName(val);
    const match = seeds.find(s => s.type.toLowerCase() === val.toLowerCase());
    if (match) {
      setLinkedSeedId(match.id);
      if (match.family) setPlantFamily(match.family);
      if (match.variety) setPlantVariety(match.variety);
      if (match.maturity) {
        const d = new Date(activityDate);
        d.setDate(d.getDate() + match.maturity);
        setExpectedHarvestDate(d.toISOString().split("T")[0]);
      }
    } else {
      setLinkedSeedId("");
    }
  };

  const handleSeedSelectChange = (id: string) => {
    setLinkedSeedId(id);
    const match = seeds.find(s => s.id === id);
    if (match) {
      setPlantName(match.type);
      if (match.family) setPlantFamily(match.family);
      if (match.variety) setPlantVariety(match.variety);
      if (match.maturity) {
        const d = new Date(activityDate);
        d.setDate(d.getDate() + match.maturity);
        setExpectedHarvestDate(d.toISOString().split("T")[0]);
      }
    }
  };

  const resetForm = () => {
    setNotes("");
    setImageB64(null);
    setPlantName("");
    setPlantFamily("Other");
    setPlantVariety("");
    setLinkedSeedId("");
    setLocationNew("Seed Trays");
    setExpectedHarvestDate("");
    setSelectedPlantId("");
    setActionType("checkup");
    setUpdateLocation("Seed Trays");
    setFertilizerType("");
    setActivityDate(new Date().toISOString().split("T")[0]);
    const fileInput = document.getElementById("logImageInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (logMode === "new") {
        if (!plantName) {
          alert("Plant name is required!");
          setIsSubmitting(false);
          return;
        }

        const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const logId = Date.now().toString(36) + Math.random().toString(36).substring(2);

        const payload = {
          id: newId,
          name: plantName,
          variety: plantVariety,
          family: plantFamily,
          seed_id: linkedSeedId || null,
          location: locationNew,
          harvest_date: expectedHarvestDate || null,
          status: "Sown",
          logs: [
            {
              id: logId,
              date: activityDate,
              type: "sow",
              note: notes,
              image: imageB64,
            }
          ]
        };

        await onAddPlanting(payload);
      } else {
        if (!selectedPlantId) {
          alert("Please select a crop to update!");
          setIsSubmitting(false);
          return;
        }

        const logPayload = {
          actionType,
          date: activityDate,
          note: notes,
          image_url: imageB64,
          fertilizer: actionType === "feed" ? fertilizerType : null,
          location: actionType === "transplant" ? updateLocation : null,
        };

        await onUpdatePlanting(selectedPlantId, logPayload);
      }

      resetForm();
      onTabChange("historyTab");
    } catch (err) {
      alert("Failed to save activity log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCrops = plantings.filter(p => p.status !== "Finished");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            Log Crop Activity
          </h2>
          <p className="text-xs text-neutral-500">
            Keep track of sowing, moving, feeding, or harvesting in the garden
          </p>
        </div>

        {/* Activity log mode selector */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
          <Settings className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              What activity are you logging?
            </label>
            <select
              value={logMode}
              onChange={(e) => {
                setLogMode(e.target.value as "new" | "update");
                resetForm();
              }}
              className="w-full py-1.5 px-3 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="new">🌱 Start New Crop (Sow / Plant)</option>
              <option value="update">📝 Update Existing Crop (Feed, Checkup, Move, Harvest)</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {logMode === "new" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Plant Name / Type
                  </label>
                  <input
                    type="text"
                    required
                    value={plantName}
                    onChange={(e) => handlePlantNameChange(e.target.value)}
                    placeholder="e.g. Tomatoes, Carrots"
                    list="seed-names"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <datalist id="seed-names">
                    {[...new Set(seeds.map(s => s.type))].map(type => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Plant Family
                  </label>
                  <select
                    value={plantFamily}
                    onChange={(e) => setPlantFamily(e.target.value)}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={plantVariety}
                    onChange={(e) => setPlantVariety(e.target.value)}
                    placeholder="e.g. Moneymaker"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Linked Seed Box Item
                  </label>
                  <select
                    value={linkedSeedId}
                    onChange={(e) => handleSeedSelectChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- None / No Seed Packet --</option>
                    {seeds.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.type} {s.variety ? `(${s.variety})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Starting Location
                  </label>
                  <select
                    value={locationNew}
                    onChange={(e) => setLocationNew(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Seed Trays">Seed Trays</option>
                    <option value="Greenhouse">Greenhouse</option>
                    {beds.map(b => (
                      <option key={b.id} value={b.id}>
                        Plot: {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          ) : (
            // UPDATE CROP FIELDS
            <div className="space-y-4 bg-neutral-50 p-4 rounded-xl border border-neutral-150">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                  Select Active Crop
                </label>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Crop --</option>
                  {activeCrops.map(p => {
                    const bedName = p.location === "Seed Trays" || p.location === "Greenhouse"
                      ? p.location
                      : beds.find(b => b.id === p.location)?.name || p.location;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.variety ? `(${p.variety})` : ""} - Location: {bedName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                    Action / Update Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="checkup">🔍 Progress Checkup</option>
                    <option value="feed">💧 Feed / Treatment</option>
                    <option value="transplant">🪴 Transplant / Move</option>
                    <option value="harvest">🍅 Harvested Some</option>
                    <option value="finish">🏁 Mark as Finished/Cleared</option>
                  </select>
                </div>

                {actionType === "transplant" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                      New Location
                    </label>
                    <select
                      value={updateLocation}
                      onChange={(e) => setUpdateLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Seed Trays">Seed Trays</option>
                      <option value="Greenhouse">Greenhouse</option>
                      {beds.map(b => (
                        <option key={b.id} value={b.id}>
                          Plot: {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {actionType === "feed" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                      Treatment / Fertilizer Used
                    </label>
                    <input
                      type="text"
                      value={fertilizerType}
                      onChange={(e) => setFertilizerType(e.target.value)}
                      placeholder="e.g. Comfrey Tea, Seaweed feed"
                      className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMON FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Date of Activity
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Attach Observation Photo
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="file"
                  id="logImageInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Observation / Logging Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="List notes, number of germinated seeds, current health status, etc..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {imageB64 && (
            <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/50 flex flex-col items-center">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase mb-2">Image Preview</span>
              <img
                src={imageB64}
                alt="Compressed upload"
                className="max-h-48 rounded-lg object-contain shadow-sm border border-neutral-200"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSubmitting ? "Saving Activity..." : "Save Activity"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-sm transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

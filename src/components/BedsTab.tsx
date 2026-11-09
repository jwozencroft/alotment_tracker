import React, { useState } from "react";
import { Plus, Trash2, Calendar, ClipboardList, CheckCircle2, Image, MessageSquare, AlertCircle, Edit, Map } from "lucide-react";
import { Bed } from "../types";

interface BedsTabProps {
  beds: Bed[];
  onAddBed: (bed: any) => Promise<void>;
  onEditBed: (bedId: string, bedData: any) => Promise<void>;
  onDeleteBed: (id: string) => Promise<void>;
  onAddTask: (bedId: string, task: any) => Promise<void>;
  onToggleTask: (bedId: string, taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (bedId: string, taskId: string) => Promise<void>;
  onAddProgressLog: (bedId: string, log: any) => Promise<void>;
  onDeleteProgressLog: (bedId: string, logId: string) => Promise<void>;
}

export default function BedsTab({
  beds,
  onAddBed,
  onEditBed,
  onDeleteBed,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddProgressLog,
  onDeleteProgressLog,
}: BedsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);

  // Task inline states
  const [newTaskText, setNewTaskText] = useState<{ [bedId: string]: string }>({});
  const [newTaskDate, setNewTaskDate] = useState<{ [bedId: string]: string }>({});

  // Log inline states
  const [newLogNote, setNewLogNote] = useState<{ [bedId: string]: string }>({});
  const [newLogImageB64, setNewLogImageB64] = useState<{ [bedId: string]: string | null }>({});

  // Accordion toggles
  const [openTasksBeds, setOpenTasksBeds] = useState<Set<string>>(new Set());
  const [openLogsBeds, setOpenLogsBeds] = useState<Set<string>>(new Set());

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isBedForm = true, bedId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image() as any;
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

        if (isBedForm) {
          setImageB64(dataUrl);
        } else if (bedId) {
          setNewLogImageB64(prev => ({ ...prev, [bedId]: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setNotes("");
    setImageB64(null);
    setEditingId(null);
    setShowAddForm(false);
    const fileInput = document.getElementById("bedImageInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleEditClick = (bed: Bed) => {
    setEditingId(bed.id);
    setName(bed.name);
    setDescription(bed.description);
    setNotes(bed.notes);
    setImageB64(bed.image_url);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);

    try {
      if (editingId) {
        await onEditBed(editingId, { name, description, notes, image_url: imageB64 });
      } else {
        const payload = {
          id: Date.now().toString(36),
          name,
          description,
          notes,
          image_url: imageB64,
        };
        await onAddBed(payload);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save Bed layout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTaskSubmit = async (bedId: string) => {
    const text = newTaskText[bedId];
    const date = newTaskDate[bedId];
    if (!text || !date) {
      alert("Please provide both task details and a deadline!");
      return;
    }

    try {
      const taskPayload = {
        id: Date.now().toString(36),
        text,
        date,
      };
      await onAddTask(bedId, taskPayload);
      setNewTaskText(prev => ({ ...prev, [bedId]: "" }));
      setNewTaskDate(prev => ({ ...prev, [bedId]: "" }));
    } catch (err) {
      alert("Failed to add bed task.");
    }
  };

  const handleAddLogSubmit = async (bedId: string) => {
    const note = newLogNote[bedId];
    const img = newLogImageB64[bedId];
    if (!note && !img) {
      alert("Please enter a note or upload an observation image!");
      return;
    }

    try {
      const logPayload = {
        id: Date.now().toString(36),
        date: new Date().toISOString().split("T")[0],
        note: note || "Observation logged.",
        image_url: img || null,
      };
      await onAddProgressLog(bedId, logPayload);
      setNewLogNote(prev => ({ ...prev, [bedId]: "" }));
      setNewLogImageB64(prev => ({ ...prev, [bedId]: null }));
      const fileInput = document.getElementById(`logFile_${bedId}`) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      alert("Failed to save progress log.");
    }
  };

  const toggleSection = (bedId: string, type: "tasks" | "logs") => {
    if (type === "tasks") {
      const next = new Set(openTasksBeds);
      if (next.has(bedId)) next.delete(bedId);
      else next.add(bedId);
      setOpenTasksBeds(next);
    } else {
      const next = new Set(openLogsBeds);
      if (next.has(bedId)) next.delete(bedId);
      else next.add(bedId);
      setOpenLogsBeds(next);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            🟫 Plots, Beds & Layout Tasks
          </h2>
          <p className="text-xs text-neutral-500">
            Create Raised Beds, track structural tasks, and log visual progress observations
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "View Plots List" : "Create Plot / Bed"}</span>
        </button>
      </div>

      {/* Bed Form Card */}
      {showAddForm && (
        <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-1">
              {editingId ? "✏️ Edit Plot / Bed" : "🟫 Create Bed / Plot"}
            </h3>
            <p className="text-xs text-neutral-500">
              Define soil quality, physical boundaries, and solar exposure details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Plot / Bed Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Raised Bed 1, Fruit Cage"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Solar / Soil Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Full sun, loam soil, pH 6.5"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Structural Bed Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include compost treatments, dimensions, or specific crop restrictions..."
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Upload Cover Photo
              </label>
              <input
                type="file"
                id="bedImageInput"
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            {imageB64 && (
              <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50/50 flex flex-col items-center">
                <img
                  src={imageB64}
                  alt="Bed Cover preview"
                  className="max-h-40 rounded-lg object-contain"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2 text-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isSubmitting ? "Saving..." : editingId ? "Update Plot" : "Create Plot"}
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

      {/* Plots grid Display */}
      {!showAddForm && (
        <div>
          {beds.length === 0 ? (
            <div className="text-center py-12 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
              No plots created yet. Create a bed/plot to begin organizing!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {beds.map(bed => {
                const isTasksOpen = openTasksBeds.has(bed.id);
                const isLogsOpen = openLogsBeds.has(bed.id);

                return (
                  <div
                    key={bed.id}
                    className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {bed.image_url && (
                        <img
                          src={bed.image_url}
                          alt={bed.name}
                          className="w-full h-44 object-cover rounded-xl border border-neutral-150 mb-4"
                        />
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-neutral-800 text-base flex items-center gap-1.5">
                            <Map className="h-4 w-4 text-emerald-600" />
                            {bed.name}
                          </h3>
                          {bed.description && (
                            <p className="text-xs text-neutral-500 font-medium mt-0.5">
                              {bed.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditClick(bed)}
                            className="p-1.5 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg transition"
                            title="Edit Bed metadata"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBed(bed.id)}
                            className="p-1.5 border border-red-150 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove Bed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {bed.notes && (
                        <p className="text-xs text-neutral-600 font-medium bg-neutral-50 p-3 rounded-xl border border-neutral-100/50 mt-3 leading-relaxed">
                          <strong>Soil / Sol notes:</strong> {bed.notes}
                        </p>
                      )}

                      {/* Accordion Tasks Section */}
                      <div className="border border-neutral-150 rounded-xl mt-4 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleSection(bed.id, "tasks")}
                          className="w-full bg-neutral-50/50 hover:bg-neutral-100/60 p-3 flex justify-between items-center text-xs font-bold text-neutral-700 border-b border-neutral-150 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4 text-emerald-600" />
                            Action Items ({bed.tasks?.length || 0})
                          </span>
                          <span>{isTasksOpen ? "▲" : "▼"}</span>
                        </button>

                        {isTasksOpen && (
                          <div className="p-3 bg-white space-y-3">
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {bed.tasks && bed.tasks.length > 0 ? (
                                bed.tasks.map(t => (
                                  <div
                                    key={t.id}
                                    className={`flex items-start justify-between gap-3 p-2 bg-neutral-50/50 border border-neutral-100 rounded-lg text-xs ${
                                      t.completed ? "opacity-60 line-through text-neutral-400" : "text-neutral-700"
                                    }`}
                                  >
                                    <label className="flex items-start gap-2 cursor-pointer flex-1 py-0.5">
                                      <input
                                        type="checkbox"
                                        checked={t.completed}
                                        onChange={() => onToggleTask(bed.id, t.id, !t.completed)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500/10 mt-0.5"
                                      />
                                      <div>
                                        <div className="font-semibold">{t.text}</div>
                                        <span className="text-[9px] text-neutral-400 font-bold">
                                          Deadline: {new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </span>
                                      </div>
                                    </label>
                                    <button
                                      onClick={() => onDeleteTask(bed.id, t.id)}
                                      className="p-1 hover:text-red-600 text-neutral-400 transition"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-neutral-400 italic text-center py-2">
                                  No tasks listed.
                                </p>
                              )}
                            </div>

                            {/* Add Task Inline Form */}
                            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">
                                Add Action Item
                              </span>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Mulch compost, fix mesh..."
                                  value={newTaskText[bed.id] || ""}
                                  onChange={(e) => setNewTaskText(prev => ({ ...prev, [bed.id]: e.target.value }))}
                                  className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                                />
                                <input
                                  type="date"
                                  value={newTaskDate[bed.id] || ""}
                                  onChange={(e) => setNewTaskDate(prev => ({ ...prev, [bed.id]: e.target.value }))}
                                  className="px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none shrink-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddTaskSubmit(bed.id)}
                                  className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accordion Progress Logs Section */}
                      <div className="border border-neutral-150 rounded-xl mt-3 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleSection(bed.id, "logs")}
                          className="w-full bg-neutral-50/50 hover:bg-neutral-100/60 p-3 flex justify-between items-center text-xs font-bold text-neutral-700 border-b border-neutral-150 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4 text-emerald-600" />
                            Soil & Progress Logs ({bed.logs?.length || 0})
                          </span>
                          <span>{isLogsOpen ? "▲" : "▼"}</span>
                        </button>

                        {isLogsOpen && (
                          <div className="p-3 bg-white space-y-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {bed.logs && bed.logs.length > 0 ? (
                                bed.logs.map(l => (
                                  <div
                                    key={l.id}
                                    className="p-2.5 bg-neutral-50/50 border border-neutral-100 rounded-lg text-xs flex flex-col gap-2 relative group"
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px] text-neutral-400 font-bold">
                                        {new Date(l.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                      <button
                                        onClick={() => onDeleteProgressLog(bed.id, l.id)}
                                        className="text-neutral-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition duration-150"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <p className="text-neutral-600 leading-normal pl-0.5 font-medium">
                                      {l.note}
                                    </p>
                                    {l.image_url && (
                                      <img
                                        src={l.image_url}
                                        alt="Progress snapshot"
                                        className="rounded-lg max-h-24 w-full object-cover border border-neutral-150"
                                      />
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-neutral-400 italic text-center py-2">
                                  No structural observation logs recorded yet.
                                </p>
                              )}
                            </div>

                            {/* Add progress log form inline */}
                            <div className="pt-2 border-t border-neutral-100 space-y-2">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
                                Log Observation / Treatment
                              </span>
                              <textarea
                                value={newLogNote[bed.id] || ""}
                                onChange={(e) => setNewLogNote(prev => ({ ...prev, [bed.id]: e.target.value }))}
                                placeholder="Soil ph, compost tea treatment observations..."
                                className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  id={`logFile_${bed.id}`}
                                  accept="image/*"
                                  onChange={(e) => handleImageChange(e, false, bed.id)}
                                  className="text-[10px] flex-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-emerald-50 file:text-emerald-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddLogSubmit(bed.id)}
                                  className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                                >
                                  Save Log
                                </button>
                              </div>

                              {newLogImageB64[bed.id] && (
                                <div className="p-1 border border-neutral-200 rounded flex justify-center bg-neutral-50">
                                  <img
                                    src={newLogImageB64[bed.id]!}
                                    alt="Observation preview"
                                    className="max-h-16 rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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

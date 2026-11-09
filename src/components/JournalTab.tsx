import React, { useState } from "react";
import { Plus, Trash2, Edit3, Calendar, FileText, Image, CheckCircle, BookOpen } from "lucide-react";
import { Journal } from "../types";

interface JournalTabProps {
  journals: Journal[];
  onAddJournal: (journal: any) => Promise<void>;
  onEditJournal: (journalId: string, journalData: any) => Promise<void>;
  onDeleteJournal: (id: string) => Promise<void>;
}

export default function JournalTab({
  journals,
  onAddJournal,
  onEditJournal,
  onDeleteJournal,
}: JournalTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [imageB64, setImageB64] = useState<string | null>(null);

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

  const resetForm = () => {
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setImageB64(null);
    setEditingId(null);
    setShowAddForm(false);
    const fileInput = document.getElementById("journalImageInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleEditClick = (journal: Journal) => {
    setEditingId(journal.id);
    setTitle(journal.title);
    setDate(journal.date);
    setNotes(journal.notes);
    setImageB64(journal.image_url);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes) return;
    setIsSubmitting(true);

    try {
      const journalPayload = {
        id: editingId || Date.now().toString(36),
        title,
        date,
        notes,
        image_url: imageB64,
      };

      if (editingId) {
        await onEditJournal(editingId, journalPayload);
      } else {
        await onAddJournal(journalPayload);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save diary entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort journals by date (latest first)
  const sortedJournals = [...journals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            📖 Shared Diary & Journals
          </h2>
          <p className="text-xs text-neutral-500">
            Collaborative diary timelines of weather updates, seasonal events, and accomplishments
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "View Diary" : "Write Diary Entry"}</span>
        </button>
      </div>

      {/* Form Card */}
      {showAddForm && (
        <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-1">
              {editingId ? "✏️ Edit Diary Entry" : "📖 New Diary Entry"}
            </h3>
            <p className="text-xs text-neutral-500">
              Record daily achievements, local temperature alerts, pest challenges, or harvest yields
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Entry Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frost warnings, first strawberry harvest..."
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Entry Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Entry Details
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe today's events, rainfall, tasks completed collaboratively..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm h-36 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Attach Photo
                </label>
                <input
                  type="file"
                  id="journalImageInput"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {imageB64 && (
                <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50 flex items-center justify-center">
                  <img
                    src={imageB64}
                    alt="Diary snapshot"
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
                {isSubmitting ? "Saving Entry..." : editingId ? "Update Entry" : "Save Entry"}
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

      {/* Diary Entries listing */}
      {!showAddForm && (
        <div>
          {sortedJournals.length === 0 ? (
            <div className="text-center py-12 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
              No diary logs have been created yet. Click 'Write Diary Entry' to start recording!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedJournals.map(journal => (
                <div
                  key={journal.id}
                  className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Diary Log</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(journal.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-800 leading-snug">
                      {journal.title}
                    </h3>

                    <p className="text-neutral-600 text-xs font-medium leading-relaxed whitespace-pre-line">
                      {journal.notes}
                    </p>

                    {journal.image_url && (
                      <img
                        src={journal.image_url}
                        alt="Diary visual snap"
                        className="rounded-xl max-h-48 w-full object-cover border border-neutral-150 mt-2"
                      />
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-neutral-50 text-xs">
                    <button
                      onClick={() => handleEditClick(journal)}
                      className="flex-1 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Entry</span>
                    </button>
                    <button
                      onClick={() => onDeleteJournal(journal.id)}
                      className="py-2 px-3 border border-red-150 hover:bg-red-50 text-red-600 font-semibold rounded-xl flex items-center justify-center transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

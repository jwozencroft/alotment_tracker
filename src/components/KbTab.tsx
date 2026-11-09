import React, { useState } from "react";
import { BookOpen, Search, Plus, Calendar, FileText, CheckCircle, Trash2, Eye, Award, ExternalLink } from "lucide-react";
import { KnowledgeBaseItem } from "../types";

interface KbTabProps {
  knowledgeBase: KnowledgeBaseItem[];
  onAddKbItem: (item: any) => Promise<void>;
  onDeleteKbItem: (id: string) => Promise<void>;
}

export default function KbTab({
  knowledgeBase,
  onAddKbItem,
  onDeleteKbItem,
}: KbTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // PDF / Document viewer states
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [viewingDocName, setViewingDocName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileB64(event.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFileB64(null);
    setFileName(null);
    const fileInput = document.getElementById("kbFileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert("Please fill in both title and note content.");
      return;
    }
    setIsSubmitting(true);

    try {
      const kbPayload = {
        id: Date.now().toString(36),
        title,
        content,
        date: new Date().toISOString().split("T")[0],
        source: "user",
        file: fileB64,
        fileName,
      };

      await onAddKbItem(kbPayload);
      resetForm();
    } catch (err) {
      alert("Failed to save to Knowledge base.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = knowledgeBase.filter(item => {
    const sTerm = searchQuery.toLowerCase().trim();
    if (!sTerm) return true;
    return (
      item.title.toLowerCase().includes(sTerm) ||
      item.content.toLowerCase().includes(sTerm)
    );
  });

  const openDocViewer = (url: string, name: string) => {
    setViewingDocUrl(url);
    setViewingDocName(name);
  };

  const closeDocViewer = () => {
    setViewingDocUrl(null);
    setViewingDocName(null);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 mb-1">
            📚 Knowledge Base & Archive
          </h2>
          <p className="text-xs text-neutral-500">
            Digital archive of technical guides, companion charts, and AI-saved advisors
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "View Archive List" : "Add Technical Note"}</span>
        </button>
      </div>

      {/* Form Card */}
      {showAddForm && (
        <div className="bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-1">
              ✍️ Add technical Note to Archive
            </h3>
            <p className="text-xs text-neutral-500">
              Create technical summaries, companion references, or attach companion guide sheets
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Note Title / Topic
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Companion Planting tomatoes with Basil"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Information & Notes (HTML / Markdown supported)
              </label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type technical steps, recipes, or advice notes here..."
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm h-48 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Upload Companion Sheet (PDF / Photo)
              </label>
              <input
                type="file"
                id="kbFileInput"
                accept=".pdf, image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Attach PDFs or companion sheets to save in your digital allotment library
              </span>
            </div>

            {fileName && (
              <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>Selected file: {fileName}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2 text-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isSubmitting ? "Saving..." : "Save to Digital Archive"}
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

      {/* Main Content Area */}
      {!showAddForm && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide, disease, pests controls..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* List display */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white border border-neutral-100 rounded-2xl text-sm text-neutral-400">
              No technical guides found in the archive. Click 'Add Technical Note' to record companion insights!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const isAI = item.source === "ai";
                const isPdf = item.file_url && (item.file_url.startsWith("data:application/pdf") || item.file_name?.endsWith(".pdf"));

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 ${
                      isAI ? "border-indigo-100 bg-indigo-50/10" : "border-neutral-100"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2">
                          {isAI ? (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              🤖 AI Generated
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              ✍️ Manual Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-800 leading-snug">
                        {item.title}
                      </h3>

                      {/* Display content nicely based on HTML or text */}
                      <div
                        className="prose prose-sm text-neutral-600 max-w-none text-xs leading-relaxed max-h-56 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />

                      {/* Document Attachment button */}
                      {item.file_url && (
                        <button
                          onClick={() => openDocViewer(item.file_url!, item.file_name || "Attachment")}
                          className="mt-3 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-neutral-500" />
                          <span>View {isPdf ? "PDF Guidelines" : "Attached Image"}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex pt-3 border-t border-neutral-50 justify-end">
                      <button
                        onClick={() => onDeleteKbItem(item.id)}
                        className="py-1.5 px-3 border border-red-100 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Note</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen PDF Document Viewer Overlay */}
      {viewingDocUrl && (
        <div className="fixed inset-0 bg-neutral-900/95 backdrop-blur-sm flex flex-col z-[60] p-4">
          <div className="flex justify-between items-center bg-neutral-800 text-white px-5 py-3 rounded-t-xl">
            <h3 className="text-sm font-bold truncate">
              📄 Guide Sheet: {viewingDocName}
            </h3>
            <button
              onClick={closeDocViewer}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-lg transition"
            >
              Close Viewer
            </button>
          </div>
          <div className="flex-1 bg-white p-2 rounded-b-xl overflow-hidden flex items-center justify-center">
            {viewingDocUrl.startsWith("data:application/pdf") ? (
              <iframe
                src={viewingDocUrl}
                title="PDF Guideline document"
                className="w-full h-full border-0"
              />
            ) : (
              <img
                src={viewingDocUrl}
                alt="Guideline detail"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

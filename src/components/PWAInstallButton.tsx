import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as standalone PWA, hide install buttons
  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        title="Install Allotment Tracker onto your device"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // Guide iOS Safari users who cannot use beforeinstallprompt
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Add to iPhone/iPad Home Screen"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#14261C] border border-emerald-800 text-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-900 pb-3">
                <h3 className="font-bold text-sm text-emerald-200">Install Allotment Tracker</h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-emerald-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-neutral-200 space-y-3 leading-relaxed">
                <p>To install on your iPhone or iPad for offline allotment access:</p>
                <div className="flex items-center gap-2.5 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-900/50">
                  <Share className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>1. Tap the <strong>Share</strong> icon in the Safari bottom bar.</span>
                </div>
                <div className="flex items-center gap-2.5 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-900/50">
                  <PlusSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

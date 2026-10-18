import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

export const PWAInstallButton = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 rounded-xl border border-sky-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
        <span>Installed</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-sky-500 font-bold text-white shadow-xs hover:bg-sky-600 active:scale-95 transition-all cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
        title="Install SpendWise to home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          }`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-600" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-sky-100">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Install on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold shrink-0">1</span>
                  <p>In Safari, tap the <strong>Share</strong> icon in the bottom menu bar.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold shrink-0">2</span>
                  <p>Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-sky-50/60 rounded-2xl border border-sky-100">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold shrink-0">3</span>
                  <p>Tap <strong>"Add"</strong> in the top right corner.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-sky-500 py-2.5 text-xs font-bold text-white hover:bg-sky-600 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        alert('To install SpendWise:\n- On Chrome/Edge: Click the install icon in the address bar.\n- On Mobile: Tap browser menu and select "Add to Home screen".');
      }}
      className={`flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white text-sky-700 hover:bg-sky-50 font-bold transition cursor-pointer ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      }`}
    >
      <Download className="w-3.5 h-3.5 text-sky-500" />
      <span>Install PWA</span>
    </button>
  );
};

import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, X, ShieldAlert, ArrowRight, Check, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError, loginWithGoogle, loginWithGoogleRedirect, isLoggingIn } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!authError) return null;

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={clearAuthError}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="pr-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {authError.message}
            </h3>
            {authError.code && (
              <span className="inline-block mt-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                code: {authError.code}
              </span>
            )}
          </div>
        </div>

        {authError.details && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 mb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {authError.details}
          </div>
        )}

        {/* If domain issue, show quick copy */}
        {authError.code === 'auth/unauthorized-domain' && (
          <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs">
            <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
              โดเมนปัจจุบันที่ต้องเพิ่มใน Firebase Console:
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-blue-200/60 font-mono text-blue-700 dark:text-blue-300">
              <span className="truncate mr-2">{currentHostname}</span>
              <button
                onClick={handleCopyDomain}
                className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-sans shrink-0 font-medium cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Options to resolve and sign in */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ตัวเลือกในการเข้าสู่ระบบ:
          </p>

          {/* Option 1: Try popup again */}
          <button
            onClick={() => loginWithGoogle()}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <RefreshCw className={`w-4 h-4 ${isLoggingIn ? 'animate-spin' : ''}`} />
              <span>ลองเข้าสู่ระบบใหม่อีกครั้ง (Google Popup)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>

          {/* Option 2: Redirect mode */}
          <button
            onClick={() => loginWithGoogleRedirect()}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium text-sm transition cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>เข้าสู่ระบบด้วย Redirect (เปิดหน้าตรงไม่ง้อป๊อปอัป)</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Option 3: If in iframe or preview, open in new tab */}
          {isIframe && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium text-sm transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>เปิดแอปในแท็บใหม่แยกจาก iframe</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={clearAuthError}
            className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

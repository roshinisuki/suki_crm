"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    setToasts((prev) => {
      // Prevent duplicate stacking by checking if there's already an identical toast visible
      if (prev.some((t) => t.message === message && t.type === type && t.title === title)) {
        return prev;
      }
      
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, message, title };
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
      
      return [...prev, newToast];
    });
  }, [removeToast]);

  const toastMethods = {
    success: (message: string, title?: string) => addToast("success", message, title),
    error: (message: string, title?: string) => addToast("error", message, title),
    warning: (message: string, title?: string) => addToast("warning", message, title),
    info: (message: string, title?: string) => addToast("info", message, title),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-300 animate-toast-slide-in \${
              toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
              toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
              toast.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
              "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
              {toast.title && (
                <h4 className={`text-sm font-bold mb-0.5 \${
                  toast.type === "success" ? "text-emerald-900" :
                  toast.type === "error" ? "text-red-900" :
                  toast.type === "warning" ? "text-amber-900" :
                  "text-blue-900"
                }`}>
                  {toast.title}
                </h4>
              )}
              <p className="text-sm font-medium opacity-90 leading-snug">
                {toast.message}
              </p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-toast-slide-in {
          animation: toastSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}

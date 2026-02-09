import React, { useEffect, useCallback } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import type { Notification } from '../types';

interface NotificationsPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onDeleteNotification,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Benachrichtigungen">
      <button
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Benachrichtigungen schließen"
      />

      <div className="absolute top-20 right-4 md:right-8 lg:right-12 w-[min(420px,calc(100vw-2rem))] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Benachrichtigungen
            </p>
            <p className="text-xs font-bold text-slate-900">
              {unreadCount > 0 ? `${unreadCount} ungelesen` : 'Alles gelesen'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-400"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">
              Keine Benachrichtigungen.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-colors ${
                  n.read
                    ? 'bg-white border-slate-200'
                    : n.type === 'improve'
                      ? 'bg-amber-50 border-amber-200'
                      : n.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : n.type === 'alert'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                      {n.date} • {n.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.read && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {onDeleteNotification && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteNotification(n.id); }}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Benachrichtigung löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white flex justify-end gap-2">
          <button
            onClick={onMarkAllRead}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Check className="w-3 h-3" /> Alles als gelesen
          </button>
        </div>
      </div>
    </div>
  );
};



/**
 * EventNotification Component
 * Real-time on-screen event toast feed.
 * Weather and climate emergence alerts prominently last for 10 seconds on the screen
 * with active countdown timer badges and animated progress meters.
 */

import React, { useEffect, useState, useRef } from 'react';
import { GameEvent } from '../game/types';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  Radio,
} from 'lucide-react';

interface EventNotificationProps {
  events: GameEvent[];
  onDismiss: (id: string) => void;
}

const SingleNotification: React.FC<{
  event: GameEvent;
  onDismiss: (id: string) => void;
}> = ({ event, onDismiss }) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const isClimateAlert =
    event.isClimateAlert ||
    event.id.startsWith('alert_') ||
    event.id.startsWith('watch_') ||
    event.id.startsWith('drill_') ||
    event.title.toLowerCase().includes('climate') ||
    event.title.toLowerCase().includes('weather') ||
    event.title.toLowerCase().includes('hazard');

  // Weather and climate emergence alerts last 10 seconds on screen; regular events 4s
  const durationMs = event.durationMs || (isClimateAlert ? 10000 : 4500);

  const [remainingSec, setRemainingSec] = useState(() => Math.ceil(durationMs / 1000));

  useEffect(() => {
    if (event.persistent) return;

    // Countdown timer for display
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - event.timestamp;
      const left = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setRemainingSec(left);
    }, 200);

    const timer = setTimeout(() => {
      onDismissRef.current(event.id);
    }, durationMs);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(timer);
    };
  }, [event.id, event.timestamp, event.persistent, durationMs]);

  let icon = <Info className="w-4 h-4 text-cyan-400" />;
  let borderClass = 'border-cyan-500/30 bg-slate-950/95 text-cyan-300';
  let progressColor = 'bg-cyan-400';

  if (isClimateAlert) {
    if (event.type === 'critical') {
      icon = <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />;
      borderClass = 'border-red-500/80 bg-red-950/90 text-red-200 shadow-red-500/20 ring-1 ring-red-500/40';
      progressColor = 'bg-red-400';
    } else if (event.type === 'warning') {
      icon = <Radio className="w-5 h-5 text-amber-400 animate-bounce" />;
      borderClass = 'border-amber-500/80 bg-amber-950/90 text-amber-200 shadow-amber-500/20 ring-1 ring-amber-500/40';
      progressColor = 'bg-amber-400';
    } else {
      icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
      borderClass = 'border-emerald-500/80 bg-emerald-950/90 text-emerald-200';
      progressColor = 'bg-emerald-400';
    }
  } else if (event.type === 'positive') {
    icon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
    borderClass = 'border-emerald-500/40 bg-slate-950/95 text-emerald-300';
    progressColor = 'bg-emerald-400';
  } else if (event.type === 'warning') {
    icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
    borderClass = 'border-amber-500/40 bg-slate-950/95 text-amber-300';
    progressColor = 'bg-amber-400';
  } else if (event.type === 'critical') {
    icon = <AlertCircle className="w-4 h-4 text-rose-400" />;
    borderClass = 'border-rose-500/40 bg-slate-950/95 text-rose-300';
    progressColor = 'bg-rose-400';
  }

  return (
    <div
      onClick={() => onDismissRef.current(event.id)}
      className={`relative overflow-hidden p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.01] ${borderClass}`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>

      <div className="flex-1 text-xs pr-2">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-white block truncate">{event.title}</span>
            {isClimateAlert && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/10 uppercase tracking-wider text-amber-300 shrink-0">
                10s Alert
              </span>
            )}
          </div>

          {!event.persistent && (
            <span className="text-[10px] font-mono text-slate-300 flex items-center gap-1 shrink-0 bg-black/40 px-1.5 py-0.5 rounded">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              <span>{remainingSec}s</span>
            </span>
          )}
        </div>

        <span className="text-slate-200 leading-snug block">{event.description}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismissRef.current(event.id);
        }}
        title="Dismiss alert"
        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-black/20 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Countdown progress bar lasting exactly durationMs (10s for climate alerts) */}
      {!event.persistent && (
        <div
          className={`absolute bottom-0 left-0 h-1 w-full ${progressColor} opacity-90`}
          style={{
            animation: `shrinkWidth ${durationMs}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
};

export const EventNotification: React.FC<EventNotificationProps> = ({
  events,
  onDismiss,
}) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Active timestamp sweeper: purges each event after its exact lifetime (10s for climate alerts, 4.5s for normal)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      events.forEach((evt) => {
        if (evt.persistent) return;

        const isClimateAlert =
          evt.isClimateAlert ||
          evt.id.startsWith('alert_') ||
          evt.id.startsWith('watch_') ||
          evt.id.startsWith('drill_') ||
          evt.title.toLowerCase().includes('climate') ||
          evt.title.toLowerCase().includes('weather') ||
          evt.title.toLowerCase().includes('hazard');

        const lifetimeMs = evt.durationMs || (isClimateAlert ? 10000 : 4500);

        if (now - evt.timestamp >= lifetimeMs) {
          onDismissRef.current(evt.id);
        }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        style={{ top: 'calc(var(--hud-height, 86px) + 12px)' }}
        className="absolute right-3 sm:right-5 md:right-76 z-30 flex flex-col gap-2 max-w-sm sm:max-w-md w-full pointer-events-auto select-none"
      >
        {events.slice(-4).map((event) => (
          <SingleNotification key={event.id} event={event} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
};

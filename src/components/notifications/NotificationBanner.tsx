import { AlertEvent } from '@/types/domain';
import { formatCurrency } from '@/lib/calculations';
import { Bell, Check, X, ShieldAlert, TrendingUp } from 'lucide-react';

interface NotificationBannerProps {
  events: AlertEvent[];
  onDismiss: (id: string) => void;
  onViewPosition: (positionId: string) => void;
}

export function NotificationBanner({
  events,
  onDismiss,
  onViewPosition,
}: NotificationBannerProps) {
  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full space-y-3 pointer-events-none">
      {events.slice(0, 3).map((event) => (
        <div
          key={event.id}
          className="pointer-events-auto rounded-2xl bg-zinc-900 border border-emerald-500/40 p-4 shadow-2xl shadow-emerald-950/50 flex flex-col space-y-3 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {event.coinSymbol} Alert Triggered!
                </h4>
                <span className="text-[11px] text-zinc-400">
                  {event.conditionDescription}
                </span>
              </div>
            </div>

            <button
              onClick={() => onDismiss(event.id)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex justify-between items-center font-mono">
            <span className="text-zinc-500">Actual Price:</span>
            <span className="font-bold text-white">
              {formatCurrency(event.actualPrice)}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={() => {
                onViewPosition(event.positionId);
                onDismiss(event.id);
              }}
              className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs text-center transition-colors"
            >
              View Position
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

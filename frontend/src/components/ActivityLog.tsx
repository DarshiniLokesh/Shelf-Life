import { User, ClipboardList, Check, ShoppingBag, Trash2, KeyRound } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  userName: string;
  details: string;
  createdAt: string;
}

interface ActivityLogProps {
  logs: Log[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REGISTER':
        return <User className="h-3.5 w-3.5 text-emerald-400" />;
      case 'LOGIN':
        return <KeyRound className="h-3.5 w-3.5 text-blue-400" />;
      case 'CREATE_ITEM':
        return <ShoppingBag className="h-3.5 w-3.5 text-teal-400" />;
      case 'UPDATE_ITEM':
        return <ClipboardList className="h-3.5 w-3.5 text-amber-400" />;
      case 'USE_ITEM':
        return <Check className="h-3.5 w-3.5 text-emerald-500" />;
      case 'DELETE_ITEM':
        return <Trash2 className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <ClipboardList className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-400" />
          Recent Activity Log
        </h3>
      </div>

      <div className="p-6">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No recent activities.</p>
        ) : (
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950 border border-slate-800/80 shrink-0">
                  {getActionIcon(log.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-300 font-medium leading-relaxed">
                    <span className="font-bold text-white mr-1">{log.userName}</span>
                    {log.details.replace(`Registered new household name: ${log.userName}`, 'registered').replace('Logged in', 'logged in')}
                  </p>
                  <span className="text-slate-500 text-xxs block mt-0.5">{formatTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

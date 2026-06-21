import { useState, useEffect, useCallback } from 'react';
import { useUser, UserProvider } from './components/UserContext';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ActivityLog from './components/ActivityLog';
import { useRealTime } from './hooks/useRealTime';
import { 
  LogOut, ShieldAlert, KeyRound, Copy, Check, 
  ShoppingBag, HelpCircle, RefreshCw 
} from 'lucide-react';

function AppContent() {
  const { user, loading: authLoading, logout } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }

      const logsRes = await fetch('/api/audit-logs', {
        headers: {
          'x-user-id': user.id,
          'x-user-token': user.token,
        }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (e) {
      console.error('Error fetching inventory/logs:', e);
    } finally {
      setLoadingItems(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useRealTime(fetchItems);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user, fetchItems]);

  const copyPinToClipboard = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.token);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-sm font-semibold text-slate-400">Loading your household...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="absolute top-0 left-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-45 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400">
              <ShoppingBag className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">ShelfLife</h1>
              <p className="text-xxs text-emerald-400 font-bold tracking-wider uppercase">Shared Kitchen</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-full text-xxs font-medium text-slate-400">
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Live Sync</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-855 pl-3 pr-1 py-1 rounded-xl">
              <span className="text-xs font-bold text-slate-350">{user.name}</span>
              <button
                onClick={() => setShowPin(!showPin)}
                className={`p-1.5 rounded-lg border hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ${
                  showPin ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent'
                }`}
                title="View household PIN"
              >
                <KeyRound className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {showPin && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Your Impersonation Guardrail PIN</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    This PIN prevents other users from claiming your display name on new devices. 
                    Copy it to log in on other browsers or share it if you are sharing a dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 shrink-0 self-stretch sm:self-auto justify-between">
                <span className="font-mono text-base font-black tracking-widest text-emerald-400 pl-2">
                  {user.token}
                </span>
                <button
                  onClick={copyPinToClipboard}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  {copiedPin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">Overview Dashboard</h2>
              <p className="text-xs text-slate-500">Key metrics for household inventory management</p>
            </div>
            
            {loadingItems ? (
              <div className="h-48 rounded-2xl border border-slate-850 bg-slate-900/10 flex items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-emerald-500" />
              </div>
            ) : (
              <>
                <Dashboard items={items} />
                <ActivityLog logs={logs} />
              </>
            )}

            <div className="hidden lg:flex gap-3 rounded-2xl border border-slate-855 bg-slate-900/10 p-4 text-xs text-slate-500">
              <HelpCircle className="h-4 w-4 shrink-0 text-slate-650" />
              <p>
                <strong>Pro-tip:</strong> When inventory items run low or get fully consumed, remember to mark them 
                as &quot;Used Up&quot; so other housemates know what to buy next!
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">Kitchen Shelf</h2>
              <p className="text-xs text-slate-500">Add, edit, search, and manage household inventory items</p>
            </div>

            {loadingItems ? (
              <div className="h-96 rounded-2xl border border-slate-850 bg-slate-900/10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-emerald-500" />
                  <span className="text-xs text-slate-500">Loading kitchen shelf...</span>
                </div>
              </div>
            ) : (
              <InventoryList items={items} onRefresh={fetchItems} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

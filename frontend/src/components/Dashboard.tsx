import { Calendar, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface User {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  quantityType: string;
  quantityValue: number | null;
  unit: string | null;
  expiryDate: string | null;
  status: string;
  addedBy: User;
  lastTouchedBy: User;
  usedUpBy: User | null;
  updatedAt: string;
}

interface DashboardProps {
  items: Item[];
}

export default function Dashboard({ items }: DashboardProps) {
  const activeItems = items.filter((item) => item.status === 'active');
  const totalActive = activeItems.length;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const threeDaysFromToday = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const expiringSoonItems = activeItems
    .filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      return expiry <= threeDaysFromToday;
    })
    .sort((a, b) => {
      const expiryA = new Date(a.expiryDate!).getTime();
      const expiryB = new Date(b.expiryDate!).getTime();
      return expiryA - expiryB;
    });

  const expiredCount = expiringSoonItems.filter((item) => new Date(item.expiryDate!) < today).length;
  const upcomingExpiryCount = expiringSoonItems.length - expiredCount;

  const getExpiryMessage = (dateStr: string) => {
    const expiry = new Date(dateStr);
    const expiryDateOnly = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const diffTime = expiryDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: `Expired ${absDays} day${absDays > 1 ? 's' : ''} ago`,
        severity: 'danger',
      };
    } else if (diffDays === 0) {
      return { text: 'Expires today', severity: 'critical' };
    } else if (diffDays === 1) {
      return { text: 'Expires tomorrow', severity: 'warning' };
    } else {
      return { text: `Expires in ${diffDays} days`, severity: 'alert' };
    }
  };

  const formatQuantity = (item: Item) => {
    if (item.quantityType === 'boolean') {
      return 'Present';
    }
    const val = item.quantityValue;
    const unitText = item.unit ? ` ${item.unit}` : '';
    return `${val}${unitText}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Active Items</p>
              <h3 className="text-3xl font-bold text-white mt-1">{totalActive}</h3>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 rounded-bl-full" />
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors ${
              expiredCount > 0 
                ? 'bg-rose-500/10 text-rose-450 ring-rose-500/20' 
                : 'bg-slate-800 text-slate-400 ring-slate-700/50'
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Expired Items</p>
              <h3 className={`text-3xl font-bold mt-1 ${expiredCount > 0 ? 'text-rose-400' : 'text-white'}`}>
                {expiredCount}
              </h3>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur-md sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full" />
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors ${
              upcomingExpiryCount > 0 
                ? 'bg-amber-500/10 text-amber-450 ring-amber-500/20' 
                : 'bg-slate-800 text-slate-400 ring-slate-700/50'
            }`}>
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Expiring in 3 Days</p>
              <h3 className={`text-3xl font-bold mt-1 ${upcomingExpiryCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {upcomingExpiryCount}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-400" />
            Expiry Alert Center
          </h3>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
            Next 3 days
          </span>
        </div>

        <div className="p-6">
          {expiringSoonItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3 ring-1 ring-emerald-500/20">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-350">All clear!</p>
              <p className="text-xs text-slate-500 mt-1">No active items are expired or expiring within the next 3 days.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-2">
              {expiringSoonItems.map((item) => {
                const status = getExpiryMessage(item.expiryDate!);
                let badgeClass = 'bg-slate-800 text-slate-400';
                
                if (status.severity === 'danger') {
                  badgeClass = 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
                } else if (status.severity === 'critical') {
                  badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
                } else if (status.severity === 'warning') {
                  badgeClass = 'bg-amber-500/10 text-amber-450 border border-amber-500/20';
                } else if (status.severity === 'alert') {
                  badgeClass = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/10';
                }

                return (
                  <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-slate-900/10 px-2 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-200 truncate">{item.name}</p>
                        <span className="inline-flex items-center rounded-md bg-slate-850 px-2 py-0.5 text-xxs font-medium text-slate-400 border border-slate-800/80">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span>Qty: <span className="font-semibold text-slate-300">{formatQuantity(item)}</span></span>
                        <span className="text-slate-700">•</span>
                        <span>Added by {item.addedBy.name}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

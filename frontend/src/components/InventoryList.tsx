import { useState } from 'react';
import { useUser } from './UserContext';
import { 
  Search, Filter, Check, Edit2, Trash2, Calendar, 
  User, Sparkles, RefreshCw, Archive, ShoppingBag, Eye 
} from 'lucide-react';
import ItemModal from './ItemModal';

interface UserInfo {
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
  addedBy: UserInfo;
  lastTouchedBy: UserInfo;
  usedUpBy: UserInfo | null;
  updatedAt: string;
}

interface InventoryListProps {
  items: Item[];
  onRefresh: () => void;
}

const CATEGORIES = ['Produce', 'Dairy', 'Grain', 'Spice', 'Frozen', 'Other'];

export default function InventoryList({ items, onRefresh }: InventoryListProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  if (!user) return null;

  const tabFilteredItems = items.filter(item => {
    if (activeTab === 'active') {
      return item.status === 'active';
    } else {
      return item.status === 'used';
    }
  });

  const categoryFilteredItems = tabFilteredItems.filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  const finalFilteredItems = categoryFilteredItems.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCategoryCount = (catName: string) => {
    const list = tabFilteredItems.filter(item => searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true);
    if (catName === 'All') return list.length;
    return list.filter(item => item.category === catName).length;
  };

  const handleMarkAsUsed = async (itemId: string) => {
    setLoadingActionId(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-token': user.token,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to mark item as used up.');
      } else {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Could not connect to the server.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setLoadingActionId(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-token': user.token,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete item.');
      } else {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Could not connect to the server.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEditSave = async (payload: any) => {
    if (!editingItem) return false;
    
    try {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-token': user.token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update item.');
      }

      onRefresh();
      return true;
    } catch (e: any) {
      alert(e.message || 'Failed to save edits.');
      return false;
    }
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleAddNewSave = async (payload: any) => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-token': user.token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add item.');
      }

      onRefresh();
      return true;
    } catch (e: any) {
      alert(e.message || 'Failed to create item.');
      return false;
    }
  };

  const formatQuantity = (item: Item) => {
    if (item.quantityType === 'boolean') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
          <Eye className="h-3 w-3" /> Present
        </span>
      );
    }

    const val = item.quantityValue;
    const unitText = item.unit ? ` ${item.unit}` : '';
    const displayStr = `${val}${unitText}`;

    if (item.quantityType === 'weight') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
          {displayStr}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-405">
        {displayStr}
      </span>
    );
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-slate-500 text-xs">No expiry date</span>;

    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDateOnly = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

    const diffTime = expiryDateOnly.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = expiry.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return (
        <span className="text-rose-400 font-semibold text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Expired ({formattedDate})
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="text-red-400 font-bold text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Expires Today
        </span>
      );
    } else if (diffDays === 1) {
      return (
        <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Expires Tomorrow
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="text-yellow-500 font-semibold text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Expires in {diffDays} days ({formattedDate})
        </span>
      );
    }

    return (
      <span className="text-slate-400 text-xs flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5 text-slate-500" /> Expires {formattedDate}
      </span>
    );
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
          <button
            onClick={() => { setActiveTab('active'); setSelectedCategory('All'); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-slate-900 border border-slate-800 text-white shadow-lg'
                : 'text-slate-505 hover:text-slate-300'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Active Shelf
          </button>
          <button
            onClick={() => { setActiveTab('used'); setSelectedCategory('All'); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'used'
                ? 'bg-slate-900 border border-slate-800 text-white shadow-lg'
                : 'text-slate-505 hover:text-slate-300'
            }`}
          >
            <Archive className="h-4 w-4" />
            Used Up History
          </button>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer transition-all w-full sm:w-auto justify-center"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Add Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-200 placeholder-slate-600 text-sm transition-all"
          />
        </div>

        <div className="flex gap-2 items-center text-slate-400 shrink-0">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold mr-1">Filter:</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`py-2 px-4 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            selectedCategory === 'All'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355'
              : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-250'
          }`}
        >
          All ({getCategoryCount('All')})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-2 px-4 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355'
                : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-250'
            }`}
          >
            {cat} ({getCategoryCount(cat)})
          </button>
        ))}
      </div>

      {finalFilteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-800/60 bg-slate-900/10 rounded-2xl p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-855 text-slate-500 mb-3 ring-1 ring-slate-800/80">
            <Archive className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-350">No items found</p>
          <p className="text-xs text-slate-650 mt-1 max-w-xs">
            Try checking the other tab, clearing your filters, or adding a new item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalFilteredItems.map((item) => {
            const isLoading = loadingActionId === item.id;

            return (
              <div 
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700/80 ring-1 ring-white/2"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                    <span className="inline-flex shrink-0 items-center rounded-md bg-slate-850 px-2.5 py-0.5 text-xxs font-semibold text-slate-400 border border-slate-800/80 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Quantity:</span>
                    {formatQuantity(item)}
                  </div>

                  <div className="mt-3 border-t border-slate-800/40 pt-3">
                    {formatExpiry(item.expiryDate)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 text-xxs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3 w-3 shrink-0 text-slate-600" />
                    <span>Added by <span className="font-semibold text-slate-400">{item.addedBy.name}</span></span>
                  </div>
                  
                  {item.lastTouchedBy.id !== item.addedBy.id && (
                    <div className="flex items-center gap-1.5 truncate">
                      <RefreshCw className="h-3 w-3 shrink-0 text-slate-600" />
                      <span>Last updated by <span className="font-semibold text-slate-400">{item.lastTouchedBy.name}</span></span>
                    </div>
                  )}

                  {item.status === 'used' && item.usedUpBy && (
                    <div className="flex items-center gap-1.5 truncate text-emerald-500/80 font-medium bg-emerald-500/5 py-1 px-1.5 rounded-lg border border-emerald-500/10">
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                      <span>Used by <span className="font-bold text-white">{item.usedUpBy.name}</span> on {formatDateTime(item.updatedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2 items-center">
                  {item.status === 'active' ? (
                    <>
                      <button
                        onClick={() => handleMarkAsUsed(item.id)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-350 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" /> Mark Used Up
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        disabled={isLoading}
                        title="Edit entry"
                        className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isLoading}
                    title="Delete entry"
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-rose-500/50 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingItem ? handleEditSave : handleAddNewSave}
        item={editingItem}
      />
    </div>
  );
}

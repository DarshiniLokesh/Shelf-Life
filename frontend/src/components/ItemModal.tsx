import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Hash, Scale, Eye } from 'lucide-react';

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
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
  item?: Item | null;
}

const CATEGORIES = ['Produce', 'Dairy', 'Grain', 'Spice', 'Frozen', 'Other'];

export default function ItemModal({ isOpen, onClose, onSave, item = null }: ItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantityType, setQuantityType] = useState<'count' | 'weight' | 'boolean'>('count');
  const [quantityValue, setQuantityValue] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setCategory(item.category);
        setQuantityType(item.quantityType as any);
        setQuantityValue(item.quantityValue !== null ? item.quantityValue.toString() : '');
        setUnit(item.unit || '');
        if (item.expiryDate) {
          const date = new Date(item.expiryDate);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setExpiryDate(`${yyyy}-${mm}-${dd}`);
        } else {
          setExpiryDate('');
        }
      } else {
        setName('');
        setCategory('Produce');
        setQuantityType('count');
        setQuantityValue('');
        setUnit('');
        setExpiryDate('');
      }
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Item name is required.');
      setSubmitting(false);
      return;
    }

    let parsedValue: number | null = null;
    let finalUnit: string | null = null;

    if (quantityType === 'count') {
      const val = parseFloat(quantityValue);
      if (isNaN(val) || val <= 0) {
        setError('Quantity must be a positive number.');
        setSubmitting(false);
        return;
      }
      parsedValue = val;
      finalUnit = unit.trim() || null;
    } else if (quantityType === 'weight') {
      const val = parseFloat(quantityValue);
      if (isNaN(val) || val <= 0) {
        setError('Weight must be a positive number.');
        setSubmitting(false);
        return;
      }
      if (unit !== 'g' && unit !== 'kg') {
        setError('Weight unit must be either "g" or "kg".');
        setSubmitting(false);
        return;
      }
      parsedValue = val;
      finalUnit = unit;
    } else if (quantityType === 'boolean') {
      parsedValue = null;
      finalUnit = null;
    }

    const payload = {
      name: trimmedName,
      category,
      quantityType,
      quantityValue: parsedValue,
      unit: finalUnit,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
    };

    try {
      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setError('Server rejected the submission. Please check your inputs.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl transition-all ring-1 ring-white/5 z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            {item ? `Edit ${item.name}` : 'Add Inventory Item'}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-350">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-450" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">
              Item Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice, Milk, Eggs"
              disabled={submitting}
              className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-slate-205 placeholder-slate-650 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={submitting}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355 shadow-md shadow-emerald-500/5'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Quantity Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuantityType('count');
                  setUnit('');
                  setQuantityValue(item?.quantityType === 'count' ? item.quantityValue?.toString() || '' : '');
                }}
                disabled={submitting}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border gap-2 transition-all cursor-pointer ${
                  quantityType === 'count'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Hash className="h-5 w-5" />
                <span className="text-xs font-bold">Count</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuantityType('weight');
                  setUnit('g');
                  setQuantityValue(item?.quantityType === 'weight' ? item.quantityValue?.toString() || '' : '');
                }}
                disabled={submitting}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border gap-2 transition-all cursor-pointer ${
                  quantityType === 'weight'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Scale className="h-5 w-5" />
                <span className="text-xs font-bold">Weight</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuantityType('boolean');
                  setQuantityValue('');
                  setUnit('');
                }}
                disabled={submitting}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border gap-2 transition-all cursor-pointer ${
                  quantityType === 'boolean'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-355'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Eye className="h-5 w-5" />
                <span className="text-xs font-bold">Presence Only</span>
              </button>
            </div>
          </div>

          {quantityType !== 'boolean' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  placeholder={quantityType === 'weight' ? 'e.g. 500 or 2' : 'e.g. 4 or 12'}
                  disabled={submitting}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-slate-200 placeholder-slate-650 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Unit</label>
                {quantityType === 'weight' ? (
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    disabled={submitting}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all cursor-pointer"
                  >
                    <option value="g">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. onions, eggs (optional)"
                    disabled={submitting}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-slate-200 placeholder-slate-650 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all"
                  />
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
              <span>Expiry Date</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={submitting}
              className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all cursor-pointer"
            />
          </div>

          <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-2.5 px-5 text-sm font-semibold rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/5 disabled:opacity-50 min-w-[80px] flex items-center justify-center"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : item ? (
                'Save Changes'
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { 
  Search, Filter, Check, Edit2, Trash2, Calendar, 
  User, RefreshCw, Archive, ShoppingBag, Eye, Plus 
} from 'lucide-react-native';
import ItemModal from './ItemModal';
import { API_BASE_URL } from '../config';

interface UserInfo {
  id: string;
  name: string;
}

export interface Item {
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
  user: { id: string; name: string; token: string } | null;
  onRefresh: () => void;
}

const CATEGORIES = ['Produce', 'Dairy', 'Grain', 'Spice', 'Frozen', 'Other'];

export default function InventoryList({ items, user, onRefresh }: InventoryListProps) {
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
      const res = await fetch(`${API_BASE_URL}/api/items/${itemId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-token': user.token,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        Alert.alert('Error', errData.error || 'Failed to mark item as used up.');
      } else {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoadingActionId(itemId);
            try {
              const res = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': user.id,
                  'x-user-token': user.token,
                },
              });

              if (!res.ok) {
                const errData = await res.json();
                Alert.alert('Error', errData.error || 'Failed to delete item.');
              } else {
                onRefresh();
              }
            } catch (e) {
              console.error(e);
              Alert.alert('Network Error', 'Could not connect to the server.');
            } finally {
              setLoadingActionId(null);
            }
          }
        }
      ]
    );
  };

  const handleEditSave = async (payload: any) => {
    if (!editingItem) return false;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${editingItem.id}`, {
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
      Alert.alert('Error', e.message || 'Failed to save edits.');
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
      const res = await fetch(`${API_BASE_URL}/api/items`, {
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
      Alert.alert('Error', e.message || 'Failed to create item.');
      return false;
    }
  };

  const formatQuantity = (item: Item) => {
    if (item.quantityType === 'boolean') {
      return (
        <View style={[styles.qtyBadge, styles.qtyBadgeBoolean]}>
          <Eye size={12} color="#818cf8" style={{ marginRight: 4 }} />
          <Text style={[styles.qtyBadgeText, styles.qtyBadgeTextBoolean]}>Present</Text>
        </View>
      );
    }

    const val = item.quantityValue;
    const unitText = item.unit ? ` ${item.unit}` : '';
    const displayStr = `${val}${unitText}`;

    if (item.quantityType === 'weight') {
      return (
        <View style={[styles.qtyBadge, styles.qtyBadgeWeight]}>
          <Text style={[styles.qtyBadgeText, styles.qtyBadgeTextWeight]}>{displayStr}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.qtyBadge, styles.qtyBadgeCount]}>
        <Text style={[styles.qtyBadgeText, styles.qtyBadgeTextCount]}>{displayStr}</Text>
      </View>
    );
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return <Text style={styles.expiryTextNull}>No expiry date</Text>;

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
        <View style={styles.expiryRow}>
          <Calendar size={13} color="#f87171" style={{ marginRight: 4 }} />
          <Text style={[styles.expiryTextBase, styles.expiryExpired]}>Expired ({formattedDate})</Text>
        </View>
      );
    } else if (diffDays === 0) {
      return (
        <View style={styles.expiryRow}>
          <Calendar size={13} color="#f87171" style={{ marginRight: 4 }} />
          <Text style={[styles.expiryTextBase, styles.expiryExpiresToday]}>Expires Today</Text>
        </View>
      );
    } else if (diffDays === 1) {
      return (
        <View style={styles.expiryRow}>
          <Calendar size={13} color="#fbbf24" style={{ marginRight: 4 }} />
          <Text style={[styles.expiryTextBase, styles.expiryExpiresTomorrow]}>Expires Tomorrow</Text>
        </View>
      );
    } else if (diffDays <= 3) {
      return (
        <View style={styles.expiryRow}>
          <Calendar size={13} color="#eab308" style={{ marginRight: 4 }} />
          <Text style={[styles.expiryTextBase, styles.expiryExpiresSoon]}>Expires in {diffDays} days ({formattedDate})</Text>
        </View>
      );
    }

    return (
      <View style={styles.expiryRow}>
        <Calendar size={13} color="#94a3b8" style={{ marginRight: 4 }} />
        <Text style={[styles.expiryTextBase, styles.expiryNormal]}>Expires {formattedDate}</Text>
      </View>
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
    <View style={styles.container}>
      {/* Tabs and Add Button */}
      <View style={styles.headerActions}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'active' && styles.tabActive]}
            onPress={() => { setActiveTab('active'); setSelectedCategory('All'); }}
          >
            <ShoppingBag size={14} color={activeTab === 'active' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'used' && styles.tabActive]}
            onPress={() => { setActiveTab('used'); setSelectedCategory('All'); }}
          >
            <Archive size={14} color={activeTab === 'used' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'used' && styles.tabTextActive]}>Used</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <Plus size={16} color="#030712" style={{ marginRight: 4 }} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchIcon}>
          <Search size={16} color="#64748b" />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items by name..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterSection}>
        <Filter size={14} color="#94a3b8" style={{ marginRight: 6 }} />
        <Text style={styles.filterLabel}>Filters:</Text>
      </View>

      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.chipContainer} contentContainerStyle={styles.chipContentContainer}>
        <TouchableOpacity 
          style={[styles.chip, selectedCategory === 'All' && styles.chipActive]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[styles.chipText, selectedCategory === 'All' && styles.chipTextActive]}>
            All ({getCategoryCount('All')})
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
              {cat} ({getCategoryCount(cat)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items List */}
      <ScrollView style={styles.itemsContainer} contentContainerStyle={styles.itemsContentContainer} showsVerticalScrollIndicator={false}>
        {finalFilteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Archive size={28} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search, filters, or add a new item.</Text>
          </View>
        ) : (
          finalFilteredItems.map((item) => {
            const isLoading = loadingActionId === item.id;

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>Quantity:</Text>
                    {formatQuantity(item)}
                  </View>
                  <View style={styles.expiryDivider}>
                    {formatExpiry(item.expiryDate)}
                  </View>
                </View>

                {/* Audit metadata */}
                <View style={styles.cardFooter}>
                  <View style={styles.metaRow}>
                    <User size={11} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.metaText}>
                      Added by <Text style={styles.metaTextHighlight}>{item.addedBy.name}</Text>
                    </Text>
                  </View>

                  {item.lastTouchedBy.id !== item.addedBy.id && (
                    <View style={styles.metaRow}>
                      <RefreshCw size={11} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.metaText}>
                        Updated by <Text style={styles.metaTextHighlight}>{item.lastTouchedBy.name}</Text>
                      </Text>
                    </View>
                  )}

                  {item.status === 'used' && item.usedUpBy && (
                    <View style={styles.usedByBox}>
                      <Check size={12} color="#10b981" style={{ marginRight: 6 }} />
                      <Text style={styles.usedByText} numberOfLines={2}>
                        Used by <Text style={styles.usedByTextHighlight}>{item.usedUpBy.name}</Text> on {formatDateTime(item.updatedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  {item.status === 'active' ? (
                    <>
                      <TouchableOpacity 
                        style={styles.markUsedButton} 
                        disabled={isLoading}
                        onPress={() => handleMarkAsUsed(item.id)}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#10b981" />
                        ) : (
                          <>
                            <Check size={14} color="#10b981" style={{ marginRight: 6 }} />
                            <Text style={styles.markUsedButtonText}>Mark Used Up</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.actionIconButton} 
                        disabled={isLoading}
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={13} color="#94a3b8" />
                      </TouchableOpacity>
                    </>
                  ) : null}

                  <TouchableOpacity 
                    style={[styles.actionIconButton, { borderColor: 'rgba(239, 68, 68, 0.2)' }]} 
                    disabled={isLoading}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Trash2 size={13} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingItem ? handleEditSave : handleAddNewSave}
        item={editingItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 3,
    flex: 1,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  tabActive: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#030712',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  chipContainer: {
    maxHeight: 40,
    marginBottom: 16,
  },
  chipContentContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  chipActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#10b981',
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContentContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#1e293b',
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryBadgeText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 6,
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  qtyBadgeBoolean: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  qtyBadgeWeight: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  qtyBadgeCount: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  qtyBadgeTextBoolean: {
    color: '#818cf8',
  },
  qtyBadgeTextWeight: {
    color: '#60a5fa',
  },
  qtyBadgeTextCount: {
    color: '#34d399',
  },
  expiryDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.4)',
    paddingTop: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryTextBase: {
    fontSize: 12,
    fontWeight: '500',
  },
  expiryTextNull: {
    fontSize: 11,
    color: '#64748b',
  },
  expiryExpired: {
    color: '#f87171',
    fontWeight: '600',
  },
  expiryExpiresToday: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  expiryExpiresTomorrow: {
    color: '#fbbf24',
    fontWeight: '600',
  },
  expiryExpiresSoon: {
    color: '#fbbf24',
    fontWeight: '600',
  },
  expiryNormal: {
    color: '#94a3b8',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.5)',
    paddingTop: 8,
    gap: 4,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: '#64748b',
  },
  metaTextHighlight: {
    fontWeight: '600',
    color: '#94a3b8',
  },
  usedByBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 4,
  },
  usedByText: {
    fontSize: 10,
    color: '#10b981',
    flex: 1,
  },
  usedByTextHighlight: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  markUsedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    height: 36,
  },
  markUsedButtonText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

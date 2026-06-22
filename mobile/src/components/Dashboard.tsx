import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, AlertTriangle, CheckCircle, Package } from 'lucide-react-native';

export interface User {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        {/* Stat Card 1 */}
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <View style={styles.statIconContainer}>
            <Package size={22} color="#3b82f6" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statTitle}>Total Active</Text>
            <Text style={styles.statValue}>{totalActive}</Text>
          </View>
        </View>

        {/* Stat Card 2 */}
        <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
          <View style={[styles.statIconContainer, expiredCount > 0 && styles.iconActiveRose]}>
            <AlertTriangle size={22} color={expiredCount > 0 ? '#ef4444' : '#64748b'} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statTitle}>Expired Items</Text>
            <Text style={[styles.statValue, expiredCount > 0 && styles.valueRose]}>
              {expiredCount}
            </Text>
          </View>
        </View>

        {/* Stat Card 3 */}
        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <View style={[styles.statIconContainer, upcomingExpiryCount > 0 && styles.iconActiveAmber]}>
            <Calendar size={22} color={upcomingExpiryCount > 0 ? '#f59e0b' : '#64748b'} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statTitle}>Expiring soon</Text>
            <Text style={[styles.statValue, upcomingExpiryCount > 0 && styles.valueAmber]}>
              {upcomingExpiryCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Expiry Alert Center */}
      <View style={styles.alertCenter}>
        <View style={styles.alertHeader}>
          <View style={styles.alertHeaderTitleGroup}>
            <Calendar size={20} color="#10b981" />
            <Text style={styles.alertHeaderText}>Expiry Alert Center</Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>Next 3 days</Text>
          </View>
        </View>

        <View style={styles.alertBody}>
          {expiringSoonItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <CheckCircle size={28} color="#10b981" />
              </View>
              <Text style={styles.emptyTextTitle}>All clear!</Text>
              <Text style={styles.emptyTextSub}>No active items are expired or expiring within 3 days.</Text>
            </View>
          ) : (
            expiringSoonItems.map((item) => {
              const status = getExpiryMessage(item.expiryDate!);
              let badgeStyle = styles.badgeDefault;
              let badgeTextS = styles.badgeTextDefault;

              if (status.severity === 'danger' || status.severity === 'critical') {
                badgeStyle = styles.badgeDanger;
                badgeTextS = styles.badgeTextDanger;
              } else if (status.severity === 'warning') {
                badgeStyle = styles.badgeWarning;
                badgeTextS = styles.badgeTextWarning;
              } else if (status.severity === 'alert') {
                badgeStyle = styles.badgeAlert;
                badgeTextS = styles.badgeTextAlert;
              }

              return (
                <View key={item.id} style={styles.alertItem}>
                  <View style={styles.alertItemLeft}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubtitle}>
                      Qty: {formatQuantity(item)} • Added by {item.addedBy.name}
                    </Text>
                  </View>
                  <View style={[styles.badgeBase, badgeStyle]}>
                    <Text style={[styles.badgeBaseText, badgeTextS]}>{status.text}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // slate-950
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#0f172a', // slate-900
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1e293b', // slate-800
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconActiveRose: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  iconActiveAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#94a3b8', // slate-400
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  valueRose: {
    color: '#f87171',
  },
  valueAmber: {
    color: '#fbbf24',
  },
  alertCenter: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  alertHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertHeaderText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  alertBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  alertBody: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTextTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  emptyTextSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  alertItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
    maxWidth: '70%',
  },
  categoryBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBaseText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeDefault: {
    backgroundColor: '#334155',
  },
  badgeTextDefault: {
    color: '#94a3b8',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeTextDanger: {
    color: '#f87171',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeTextWarning: {
    color: '#fbbf24',
  },
  badgeAlert: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.1)',
  },
  badgeTextAlert: {
    color: '#eab308',
  },
});

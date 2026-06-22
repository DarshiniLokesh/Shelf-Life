import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { User, ClipboardList, Check, ShoppingBag, Trash2, KeyRound } from 'lucide-react-native';

export interface Log {
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
        return <User size={13} color="#34d399" />;
      case 'LOGIN':
        return <KeyRound size={13} color="#60a5fa" />;
      case 'CREATE_ITEM':
        return <ShoppingBag size={13} color="#2dd4bf" />;
      case 'UPDATE_ITEM':
        return <ClipboardList size={13} color="#fbbf24" />;
      case 'USE_ITEM':
        return <Check size={13} color="#10b981" />;
      case 'DELETE_ITEM':
        return <Trash2 size={13} color="#f87171" />;
      default:
        return <ClipboardList size={13} color="#94a3b8" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ClipboardList size={18} color="#10b981" style={{ marginRight: 8 }} />
        <Text style={styles.cardTitle}>Recent Activity Log</Text>
      </View>

      <View style={styles.cardBody}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No recent activities.</Text>
        ) : (
          <ScrollView nestedScrollEnabled={true} style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {logs.slice(0, 10).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.iconContainer}>
                  {getActionIcon(log.action)}
                </View>
                <View style={styles.logDetails}>
                  <Text style={styles.logText}>
                    <Text style={styles.userName}>{log.userName} </Text>
                    {log.details
                      .replace(`Registered new household name: ${log.userName}`, 'registered')
                      .replace('Logged in', 'logged in')}
                  </Text>
                  <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    maxHeight: 280,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  cardBody: {
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 16,
  },
  scrollArea: {
    maxHeight: 200,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  logDetails: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  userName: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ActivityIndicator, SafeAreaView, 
  TouchableOpacity, Modal, Alert, Clipboard, StatusBar as RNStatusBar, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  LayoutGrid, ShoppingBag, ClipboardList, Key, LogOut, Info 
} from 'lucide-react-native';
import { getStoredUser, clearStoredUser } from './src/utils/storage';
import { useRealTime } from './src/hooks/useRealTime';
import { API_BASE_URL } from './src/config';
import AuthView from './src/components/AuthView';
import Dashboard from './src/components/Dashboard';
import InventoryList from './src/components/InventoryList';
import ActivityLog, { Log } from './src/components/ActivityLog';

interface UserSession {
  id: string;
  name: string;
  token: string;
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shelf' | 'logs'>('dashboard');
  const [showPinModal, setShowPinModal] = useState(false);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await getStoredUser();
        if (stored) {
          // Verify user structure matches UserSession
          // Note: stored is { displayName: string, pin: string }
          // We need to exchange it or check against the login API to get their user ID
          // Let's call /api/auth to verify credentials and retrieve the proper ID
          const res = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: stored.displayName, token: stored.pin }),
          });
          const data = await res.json();
          if (res.ok) {
            setUser({
              id: data.id,
              name: data.name,
              token: data.token,
            });
          } else {
            // If stored credentials are no longer valid, clear them
            await clearStoredUser();
          }
        }
      } catch (err) {
        console.error('Failed to restore user session:', err);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Fetch items & logs
  const fetchItems = useCallback(async (userId: string, userToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`, {
        headers: {
          'x-user-id': userId,
          'x-user-token': userToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch items:', e);
    }
  }, []);

  const fetchLogs = useCallback(async (userId: string, userToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`, {
        headers: {
          'x-user-id': userId,
          'x-user-token': userToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    }
  }, []);

  const refreshData = useCallback(() => {
    if (user) {
      fetchItems(user.id, user.token);
      fetchLogs(user.id, user.token);
    }
  }, [user, fetchItems, fetchLogs]);

  // Load items and logs once user is authenticated
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // Real-time synchronization
  useRealTime(refreshData);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await clearStoredUser();
            setUser(null);
            setItems([]);
            setLogs([]);
            setActiveTab('dashboard');
          }
        }
      ]
    );
  };

  const copyPinToClipboard = () => {
    if (user) {
      Clipboard.setString(user.token);
      Alert.alert('Copied!', 'PIN has been copied to your clipboard.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading ShelfLife...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthView onSuccess={(usr) => setUser(usr)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ShelfLife</Text>
          <Text style={styles.headerSubtitle}>Hello, {user.name}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowPinModal(true)}
          >
            <Key size={18} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.headerButton, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && <Dashboard items={items} />}
        {activeTab === 'shelf' && (
          <InventoryList items={items} user={user} onRefresh={refreshData} />
        )}
        {activeTab === 'logs' && <ActivityLog logs={logs} />}
      </View>

      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <LayoutGrid size={20} color={activeTab === 'dashboard' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'shelf' && styles.tabItemActive]}
          onPress={() => setActiveTab('shelf')}
        >
          <ShoppingBag size={20} color={activeTab === 'shelf' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabLabel, activeTab === 'shelf' && styles.tabLabelActive]}>
            Shelf
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'logs' && styles.tabItemActive]}
          onPress={() => setActiveTab('logs')}
        >
          <ClipboardList size={20} color={activeTab === 'logs' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabLabel, activeTab === 'logs' && styles.tabLabelActive]}>
            Audit Log
          </Text>
        </TouchableOpacity>
      </View>

      {/* PIN Reveal Modal */}
      <Modal visible={showPinModal} transparent={true} animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPinModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Your Security PIN</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton} 
                    onPress={() => setShowPinModal(false)}
                  >
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.infoAlert}>
                    <Info size={16} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.infoAlertText}>
                      Use this PIN to log in as "{user.name}" on other household devices. Keep it safe to prevent impersonation.
                    </Text>
                  </View>

                  <Text style={styles.pinLabel}>Display Name</Text>
                  <Text style={styles.pinValueName}>{user.name}</Text>

                  <Text style={styles.pinLabel}>Associated PIN</Text>
                  <TouchableOpacity style={styles.pinDisplayContainer} onPress={copyPinToClipboard}>
                    <Text style={styles.pinDisplayValue}>{user.token}</Text>
                    <Text style={styles.copyHelpText}>Tap to copy PIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// Simple local close icon replacement so we don't need additional import statements in App.tsx
function X({ size, color }: { size: number; color: string }) {
  return (
    <Text style={{ fontSize: size, color: color, fontWeight: 'bold' }}>×</Text>
  );
}

// Simple touchable backdrop wrapper
import { TouchableWithoutFeedback } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712', // slate-950
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#030712',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#030712',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#10b981',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 10,
    padding: 10,
  },
  infoAlertText: {
    fontSize: 11,
    color: '#60a5fa',
    lineHeight: 15,
    flex: 1,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  pinValueName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  pinDisplayContainer: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pinDisplayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 4,
  },
  copyHelpText: {
    fontSize: 10,
    color: '#475569',
  },
});

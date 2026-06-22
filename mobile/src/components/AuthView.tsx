import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { ShoppingBag, UserPlus, KeyRound, AlertCircle, LogIn } from 'lucide-react-native';
import { setStoredUser } from '../utils/storage';
import { API_BASE_URL } from '../config';

interface AuthViewProps {
  onSuccess: (user: { id: string; name: string; token: string }) => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a display name.');
      return;
    }

    if (requiresPin && pin.length !== 6) {
      setError('PIN must be a 6-digit number.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          token: requiresPin ? pin : undefined 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'username_taken') {
          setRequiresPin(true);
          setError(null);
        } else {
          setError(data.error || 'Authentication failed.');
        }
        return;
      }

      if (data.error === 'username_taken') {
        setRequiresPin(true);
        setError(null);
        return;
      }

      // Successful registration or login
      const authenticatedUser = {
        id: data.id,
        name: data.name,
        token: data.token,
      };

      // Save user to AsyncStorage
      await setStoredUser(authenticatedUser.name, authenticatedUser.token);
      onSuccess(authenticatedUser);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUsername = () => {
    setRequiresPin(false);
    setPin('');
    setError(null);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Background Blur Circles Mockup */}
        <View style={styles.blurCircleLeft} />
        <View style={styles.blurCircleRight} />

        <View style={styles.innerContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <ShoppingBag size={32} color="#030712" />
            </View>
            <Text style={styles.logoTitle}>ShelfLife</Text>
            <Text style={styles.logoSubtitle}>
              Shared kitchen inventory tracking for 3–6 housemates
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error && !requiresPin && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#f87171" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!requiresPin ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>What should we call you?</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <UserPlus size={18} color="#475569" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name (e.g. Alice)"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
                <Text style={styles.helpText}>
                  Use your actual name. If it's your first time, we will create your profile and generate a PIN for you.
                </Text>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <View style={styles.pinAlertBox}>
                  <KeyRound size={20} color="#f59e0b" style={{ marginRight: 10, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pinAlertTitle}>Enter your PIN</Text>
                    <Text style={styles.pinAlertDesc}>
                      The name "{name}" is already registered. Please enter its associated 6-digit PIN.
                    </Text>
                  </View>
                </View>

                {error && (
                  <View style={[styles.errorBox, { marginTop: 10 }]}>
                    <AlertCircle size={16} color="#f87171" style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={styles.pinInput}
                    placeholder="******"
                    placeholderTextColor="#334155"
                    value={pin}
                    onChangeText={(text) => setPin(text.replace(/\D/g, '').substring(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry={true}
                    editable={!loading}
                  />
                </View>

                <View style={styles.pinFooter}>
                  <Text style={styles.pinFooterLeft}>Ask a housemate if you forgot it.</Text>
                  <TouchableOpacity onPress={handleBackToUsername} disabled={loading}>
                    <Text style={styles.changeNameLink}>Change name</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#030712" />
              ) : (
                <View style={styles.buttonContent}>
                  <LogIn size={16} color="#030712" style={{ marginRight: 6 }} />
                  <Text style={styles.submitButtonText}>
                    {requiresPin ? 'Verify & Login' : 'Continue'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // slate-950
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  blurCircleLeft: {
    position: 'absolute',
    top: '10%',
    left: '-10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  blurCircleRight: {
    position: 'absolute',
    bottom: '15%',
    right: '-10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
    lineHeight: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
  },
  helpText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    lineHeight: 15,
  },
  pinAlertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  pinAlertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  pinAlertDesc: {
    fontSize: 11,
    color: '#f59e0b',
    lineHeight: 15,
    marginTop: 2,
  },
  pinInputContainer: {
    marginTop: 16,
    height: 48,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInput: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
  },
  pinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  pinFooterLeft: {
    fontSize: 10,
    color: '#475569',
  },
  changeNameLink: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#030712',
  },
});

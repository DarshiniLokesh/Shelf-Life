import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, TouchableWithoutFeedback, KeyboardAvoidingView, Platform 
} from 'react-native';
import { X, AlertCircle, Hash, Scale, Eye } from 'lucide-react-native';

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

  const handleSubmit = async () => {
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

    // Expiry Date simple validation
    let finalExpiryDate: string | null = null;
    if (expiryDate.trim()) {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(expiryDate.trim())) {
        setError('Expiry date must be in YYYY-MM-DD format.');
        setSubmitting(false);
        return;
      }
      const testDate = new Date(expiryDate.trim());
      if (isNaN(testDate.getTime())) {
        setError('Invalid expiry date value.');
        setSubmitting(false);
        return;
      }
      finalExpiryDate = testDate.toISOString();
    }

    const payload = {
      name: trimmedName,
      category,
      quantityType,
      quantityValue: parsedValue,
      unit: finalUnit,
      expiryDate: finalExpiryDate,
    };

    try {
      const success = await onSave(payload);
      if (success) {
        onClose();
      } else {
        setError('Server rejected submission. Check inputs.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardContainer}
            >
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerText}>
                    {item ? `Edit ${item.name}` : 'Add Inventory Item'}
                  </Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Body Form */}
                <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
                  {error && (
                    <View style={styles.errorBox}>
                      <AlertCircle size={16} color="#f87171" style={{ marginRight: 8 }} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {/* Item Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Item Name <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Basmati Rice, Milk, Eggs"
                      placeholderTextColor="#475569"
                      editable={!submitting}
                    />
                  </View>

                  {/* Category Grid */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                          onPress={() => setCategory(cat)}
                          disabled={submitting}
                        >
                          <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Quantity Type */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Quantity Type</Text>
                    <View style={styles.qtyTypeRow}>
                      <TouchableOpacity
                        style={[styles.qtyTypeButton, quantityType === 'count' && styles.qtyTypeButtonActive]}
                        onPress={() => {
                          setQuantityType('count');
                          setUnit('');
                          setQuantityValue(item?.quantityType === 'count' ? item.quantityValue?.toString() || '' : '');
                        }}
                        disabled={submitting}
                      >
                        <Hash size={18} color={quantityType === 'count' ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.qtyTypeButtonText, quantityType === 'count' && styles.qtyTypeButtonTextActive]}>
                          Count
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.qtyTypeButton, quantityType === 'weight' && styles.qtyTypeButtonActive]}
                        onPress={() => {
                          setQuantityType('weight');
                          setUnit('g');
                          setQuantityValue(item?.quantityType === 'weight' ? item.quantityValue?.toString() || '' : '');
                        }}
                        disabled={submitting}
                      >
                        <Scale size={18} color={quantityType === 'weight' ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.qtyTypeButtonText, quantityType === 'weight' && styles.qtyTypeButtonTextActive]}>
                          Weight
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.qtyTypeButton, quantityType === 'boolean' && styles.qtyTypeButtonActive]}
                        onPress={() => {
                          setQuantityType('boolean');
                          setQuantityValue('');
                          setUnit('');
                        }}
                        disabled={submitting}
                      >
                        <Eye size={18} color={quantityType === 'boolean' ? '#10b981' : '#94a3b8'} />
                        <Text style={[styles.qtyTypeButtonText, quantityType === 'boolean' && styles.qtyTypeButtonTextActive]}>
                          Presence
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quantity and Unit Inputs */}
                  {quantityType !== 'boolean' && (
                    <View style={styles.qtyInputsRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Quantity</Text>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="numeric"
                          value={quantityValue}
                          onChangeText={setQuantityValue}
                          placeholder={quantityType === 'weight' ? 'e.g. 500' : 'e.g. 4'}
                          placeholderTextColor="#475569"
                          editable={!submitting}
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Unit</Text>
                        {quantityType === 'weight' ? (
                          <View style={styles.weightUnitToggleContainer}>
                            <TouchableOpacity 
                              style={[styles.weightUnitButton, unit === 'g' && styles.weightUnitButtonActive]}
                              onPress={() => setUnit('g')}
                              disabled={submitting}
                            >
                              <Text style={[styles.weightUnitText, unit === 'g' && styles.weightUnitTextActive]}>g</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.weightUnitButton, unit === 'kg' && styles.weightUnitButtonActive]}
                              onPress={() => setUnit('kg')}
                              disabled={submitting}
                            >
                              <Text style={[styles.weightUnitText, unit === 'kg' && styles.weightUnitTextActive]}>kg</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TextInput
                            style={styles.textInput}
                            value={unit}
                            onChangeText={setUnit}
                            placeholder="e.g. eggs (opt)"
                            placeholderTextColor="#475569"
                            editable={!submitting}
                          />
                        )}
                      </View>
                    </View>
                  )}

                  {/* Expiry Date */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.expiryLabelRow}>
                      <Text style={styles.fieldLabel}>Expiry Date</Text>
                      <Text style={styles.optionalText}>Optional</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      placeholder="YYYY-MM-DD (e.g. 2026-06-25)"
                      placeholderTextColor="#475569"
                      editable={!submitting}
                    />
                  </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#030712" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {item ? 'Save' : 'Add Item'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formContent: {
    paddingVertical: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  requiredStar: {
    color: '#10b981',
  },
  textInput: {
    height: 48,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#f1f5f9',
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryButton: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#10b981',
  },
  qtyTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qtyTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#030712',
    gap: 6,
  },
  qtyTypeButtonActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  qtyTypeButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  qtyTypeButtonTextActive: {
    color: '#10b981',
  },
  qtyInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightUnitToggleContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 3,
  },
  weightUnitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  weightUnitButtonActive: {
    backgroundColor: '#1e293b',
  },
  weightUnitText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  weightUnitTextActive: {
    color: '#ffffff',
  },
  expiryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalText: {
    fontSize: 11,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    color: '#030712',
    fontWeight: 'bold',
  },
});

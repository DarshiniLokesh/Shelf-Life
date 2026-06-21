export interface ItemInput {
  name: string;
  category: 'Produce' | 'Dairy' | 'Grain' | 'Spice' | 'Frozen' | 'Other';
  quantityType: 'count' | 'weight' | 'boolean';
  quantityValue: number | null;
  unit: string | null;
  expiryDate: string | null;
}

/**
 * Validates inventory item input data from API requests.
 * Ensures proper quantity type matches.
 */
export function validateItemInput(input: any): { error?: string; validatedData?: ItemInput } {
  if (!input || typeof input !== 'object') {
    return { error: 'Invalid request body.' };
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const category = input.category;
  const quantityType = input.quantityType;
  const quantityValue = input.quantityValue;
  const unit = input.unit;
  const expiryDate = input.expiryDate;

  // Name validation
  if (!name) {
    return { error: 'Item name is required and cannot be empty.' };
  }
  if (name.length > 50) {
    return { error: 'Item name cannot exceed 50 characters.' };
  }

  // Category validation
  const validCategories = ['Produce', 'Dairy', 'Grain', 'Spice', 'Frozen', 'Other'];
  if (!category || !validCategories.includes(category)) {
    return { error: `Category must be one of: ${validCategories.join(', ')}` };
  }

  // Quantity structure validation
  const validQuantityTypes = ['count', 'weight', 'boolean'];
  if (!quantityType || !validQuantityTypes.includes(quantityType)) {
    return { error: 'Quantity type must be "count", "weight", or "boolean".' };
  }

  let finalValue: number | null = null;
  let finalUnit: string | null = null;

  if (quantityType === 'count') {
    if (typeof quantityValue !== 'number' || isNaN(quantityValue) || quantityValue <= 0) {
      return { error: 'For Count, quantity must be a positive number.' };
    }
    finalValue = quantityValue;
    finalUnit = typeof unit === 'string' ? unit.trim() : null;
  } else if (quantityType === 'weight') {
    if (typeof quantityValue !== 'number' || isNaN(quantityValue) || quantityValue <= 0) {
      return { error: 'For Weight, quantity must be a positive number.' };
    }
    if (unit !== 'g' && unit !== 'kg') {
      return { error: 'For Weight, unit must be either "g" or "kg".' };
    }
    finalValue = quantityValue;
    finalUnit = unit;
  } else if (quantityType === 'boolean') {
    if (quantityValue !== null && quantityValue !== undefined) {
      return { error: 'For Presence Only, quantity value must be empty/null.' };
    }
    finalValue = null;
    finalUnit = null;
  }

  // Expiry Date validation
  let finalExpiry: string | null = null;
  if (expiryDate) {
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      return { error: 'Expiry date is invalid.' };
    }
    finalExpiry = parsedDate.toISOString();
  }

  return {
    validatedData: {
      name,
      category: category as any,
      quantityType: quantityType as any,
      quantityValue: finalValue,
      unit: finalUnit,
      expiryDate: finalExpiry,
    },
  };
}

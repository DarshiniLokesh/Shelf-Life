import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'shelflife_user';

export interface UserSession {
  displayName: string;
  pin: string;
}

export const getStoredUser = async (): Promise<UserSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch (error) {
    console.error('Failed to load user from storage:', error);
    return null;
  }
};

export const setStoredUser = async (displayName: string, pin: string): Promise<void> => {
  try {
    const session: UserSession = { displayName, pin };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save user to storage:', error);
  }
};

export const clearStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear user from storage:', error);
  }
};

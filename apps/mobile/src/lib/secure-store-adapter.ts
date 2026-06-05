import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { return Promise.resolve(localStorage.getItem(key)); } catch (e) { return Promise.resolve(null); }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch (e) {}
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch (e) {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

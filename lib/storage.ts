import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage wrapper with type safety and error handling

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all storage keys:', error);
      return [];
    }
  },

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return pairs.reduce(
        (acc, [key, value]) => {
          acc[key] = value ? JSON.parse(value) : null;
          return acc;
        },
        {} as Record<string, T | null>
      );
    } catch (error) {
      console.error('Error reading multiple keys from storage:', error);
      return {};
    }
  },

  async multiSet(keyValuePairs: Record<string, unknown>): Promise<boolean> {
    try {
      const pairs = Object.entries(keyValuePairs).map(
        ([key, value]) => [key, JSON.stringify(value)] as [string, string]
      );
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('Error writing multiple keys to storage:', error);
      return false;
    }
  },
};


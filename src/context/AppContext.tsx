import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { AppState, AppAction, User } from '@/types';
import { seedAllData } from '@/data/mockData';

const STORAGE_KEY = 'stylestock_data';
const USER_KEY = 'stylestock_user';

const initialState: AppState = {
  products: [],
  inventory: [],
  sales: [],
  members: [],
  suppliers: [],
  purchaseOrders: [],
  purchasePlans: [],
  user: null,
  currentStore: null,
  stores: [],
  settings: {
    storeName: 'StyleStock总店',
    storeAddress: '北京市朝阳区建国路88号',
    storePhone: '010-8888-1001',
    receiptFooter: '感谢惠顾，欢迎再次光临！\nStyleStock服装连锁',
    lowStockThreshold: 5,
    autoBackup: true,
    theme: 'light',
    language: 'zh-CN',
  },
  notifications: [],
  isLoading: true,
  isInitialized: false,
};

function loadFromStorage(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: AppState) {
  try {
    const { isLoading, isInitialized, ...data } = state;
    void isLoading;
    void isInitialized;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveUserToStorage(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.payload, isLoading: false, isInitialized: true };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_CURRENT_STORE':
      return { ...state, currentStore: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'ADD_INVENTORY':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'UPDATE_INVENTORY':
      return { ...state, inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };
    case 'UPDATE_SALE':
      return { ...state, sales: state.sales.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return { ...state, members: state.members.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MEMBER':
      return { ...state, members: state.members.filter(m => m.id !== action.payload) };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'ADD_PURCHASE_ORDER':
      return { ...state, purchaseOrders: [...state.purchaseOrders, action.payload] };
    case 'UPDATE_PURCHASE_ORDER':
      return { ...state, purchaseOrders: state.purchaseOrders.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'READ_NOTIFICATION':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'MARK_INITIALIZED':
      return { ...state, isInitialized: true, isLoading: false };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const stored = loadFromStorage();
    const storedUser = loadUserFromStorage();

    if (stored) {
      dispatch({
        type: 'INIT_STATE',
        payload: {
          ...stored,
          user: storedUser,
          currentStore: storedUser
            ? (stored.stores || []).find((s: { id: string }) => s.id === storedUser.storeId) || (stored.stores || [])[0]
            : null,
        },
      });
    } else {
      // First load — seed mock data
      const seeded = seedAllData();
      dispatch({
        type: 'INIT_STATE',
        payload: {
          ...seeded,
          user: null,
          currentStore: null,
        },
      });
    }
  }, []);

  // Persist to localStorage on changes
  useEffect(() => {
    if (state.isInitialized) {
      saveToStorage(state);
    }
  }, [state]);

  const login = useCallback((user: User) => {
    saveUserToStorage(user);
    dispatch({ type: 'SET_USER', payload: user });
    const store = state.stores.find(s => s.id === user.storeId);
    if (store) {
      dispatch({ type: 'SET_CURRENT_STORE', payload: store });
    }
  }, [state.stores]);

  const logout = useCallback(() => {
    saveUserToStorage(null);
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_CURRENT_STORE', payload: { id: '', name: '', address: '', phone: '', manager: '', status: 'active', createdAt: '' } });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

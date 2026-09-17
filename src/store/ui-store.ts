import { create } from 'zustand';
import { BudgetCardData } from '../components/cards/BudgetCardModal';
import { TransactionItemData } from '../components/ledger/TransactionDetailModal';
import { PersonData } from '../components/khata/PersonManagerModal';
import { PersonProfileData } from '../components/khata/PersonProfileModal';
import { ContactLedger } from '../app/(tabs)/khata';
import { DEFAULT_CURRENCY } from '../utils/currency';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export interface ConfirmDialogState extends ConfirmDialogConfig {
  visible: boolean;
}

interface UIState {
  // Global Currency
  activeCurrency: string;
  setActiveCurrency: (currency: string) => void;
  currencyModalVisible: boolean;
  setCurrencyModalVisible: (visible: boolean) => void;

  // Custom Themed Confirm Modal
  confirmDialog: ConfirmDialogState;
  showConfirmDialog: (config: ConfirmDialogConfig) => void;
  closeConfirmDialog: () => void;

  // Dashboard UI state
  activeCardIndex: number;
  setActiveCardIndex: (index: number) => void;
  dashboardTimeFilter: 'today' | 'week' | 'month' | 'all';
  setDashboardTimeFilter: (filter: 'today' | 'week' | 'month' | 'all') => void;
  dashboardSearchQuery: string;
  setDashboardSearchQuery: (query: string) => void;

  // Dashboard Modals
  selectedTx: TransactionItemData | null;
  setSelectedTx: (tx: TransactionItemData | null) => void;
  detailModalVisible: boolean;
  setDetailModalVisible: (visible: boolean) => void;
  editingTx: TransactionItemData | null;
  setEditingTx: (tx: TransactionItemData | null) => void;

  budgetModalVisible: boolean;
  setBudgetModalVisible: (visible: boolean) => void;
  editingBudgetCard: BudgetCardData | null;
  setEditingBudgetCard: (card: BudgetCardData | null) => void;

  categoryModalVisible: boolean;
  setCategoryModalVisible: (visible: boolean) => void;

  recurringModalVisible: boolean;
  setRecurringModalVisible: (visible: boolean) => void;

  entryModalVisible: boolean;
  setEntryModalVisible: (visible: boolean) => void;

  profileModalVisible: boolean;
  setProfileModalVisible: (visible: boolean) => void;

  permissionsModalVisible: boolean;
  setPermissionsModalVisible: (visible: boolean) => void;

  // Khata UI state
  khataFilter: 'all' | 'receivable' | 'payable';
  setKhataFilter: (filter: 'all' | 'receivable' | 'payable') => void;
  khataSearchQuery: string;
  setKhataSearchQuery: (query: string) => void;

  personModalVisible: boolean;
  setPersonModalVisible: (visible: boolean) => void;
  editingPerson: PersonData | null;
  setEditingPerson: (person: PersonData | null) => void;

  khataProfileModalVisible: boolean;
  setKhataProfileModalVisible: (visible: boolean) => void;
  profilePerson: PersonProfileData | null;
  setProfilePerson: (person: PersonProfileData | null) => void;

  installmentModalVisible: boolean;
  setInstallmentModalVisible: (visible: boolean) => void;
  selectedKhataContact: ContactLedger | null;
  setSelectedKhataContact: (contact: ContactLedger | null) => void;
}

const defaultConfirmState: ConfirmDialogState = {
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDestructive: false,
  onConfirm: () => {},
};

export const useUIStore = create<UIState>((set) => ({
  // Global Currency
  activeCurrency: DEFAULT_CURRENCY,
  setActiveCurrency: (currency) => set({ activeCurrency: currency }),
  currencyModalVisible: false,
  setCurrencyModalVisible: (visible) => set({ currencyModalVisible: visible }),

  // Custom Confirm Dialog
  confirmDialog: defaultConfirmState,
  showConfirmDialog: (config) =>
    set({
      confirmDialog: {
        visible: true,
        title: config.title,
        message: config.message,
        confirmText: config.confirmText ?? (config.isDestructive ? 'Delete' : 'Confirm'),
        cancelText: config.cancelText ?? 'Cancel',
        isDestructive: config.isDestructive ?? false,
        onConfirm: config.onConfirm,
      },
    }),
  closeConfirmDialog: () =>
    set((state) => ({
      confirmDialog: { ...state.confirmDialog, visible: false },
    })),

  // Dashboard
  activeCardIndex: 0,
  setActiveCardIndex: (index) => set({ activeCardIndex: index }),
  dashboardTimeFilter: 'today',
  setDashboardTimeFilter: (filter) => set({ dashboardTimeFilter: filter }),
  dashboardSearchQuery: '',
  setDashboardSearchQuery: (query) => set({ dashboardSearchQuery: query }),

  selectedTx: null,
  setSelectedTx: (tx) => set({ selectedTx: tx }),
  detailModalVisible: false,
  setDetailModalVisible: (visible) => set({ detailModalVisible: visible }),
  editingTx: null,
  setEditingTx: (tx) => set({ editingTx: tx }),

  budgetModalVisible: false,
  setBudgetModalVisible: (visible) => set({ budgetModalVisible: visible }),
  editingBudgetCard: null,
  setEditingBudgetCard: (card) => set({ editingBudgetCard: card }),

  categoryModalVisible: false,
  setCategoryModalVisible: (visible) => set({ categoryModalVisible: visible }),

  recurringModalVisible: false,
  setRecurringModalVisible: (visible) => set({ recurringModalVisible: visible }),

  entryModalVisible: false,
  setEntryModalVisible: (visible) => set({ entryModalVisible: visible }),

  profileModalVisible: false,
  setProfileModalVisible: (visible) => set({ profileModalVisible: visible }),

  permissionsModalVisible: false,
  setPermissionsModalVisible: (visible) => set({ permissionsModalVisible: visible }),

  // Khata
  khataFilter: 'all',
  setKhataFilter: (filter) => set({ khataFilter: filter }),
  khataSearchQuery: '',
  setKhataSearchQuery: (query) => set({ khataSearchQuery: query }),

  personModalVisible: false,
  setPersonModalVisible: (visible) => set({ personModalVisible: visible }),
  editingPerson: null,
  setEditingPerson: (person) => set({ editingPerson: person }),

  khataProfileModalVisible: false,
  setKhataProfileModalVisible: (visible) => set({ khataProfileModalVisible: visible }),
  profilePerson: null,
  setProfilePerson: (person) => set({ profilePerson: person }),

  installmentModalVisible: false,
  setInstallmentModalVisible: (visible) => set({ installmentModalVisible: visible }),
  selectedKhataContact: null,
  setSelectedKhataContact: (contact) => set({ selectedKhataContact: contact }),
}));

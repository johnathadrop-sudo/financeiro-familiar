/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { Header } from './components/Header';
import { MonthSelector } from './components/MonthSelector';
import { SummaryCards } from './components/SummaryCards';
import { FixedExpensesTracker } from './components/FixedExpensesTracker';
import { CoupleSplitView } from './components/CoupleSplitView';
import { BudgetAnalysis } from './components/BudgetAnalysis';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { CoupleSettingsModal } from './components/CoupleSettingsModal';

import { Transaction, CoupleSettings, Partner, ExpenseNature } from './types/finance';
import { INITIAL_TRANSACTIONS, DEFAULT_COUPLE_SETTINGS } from './data/initialData';
import { calculateMonthSummary } from './utils/finance';
import {
  getSupabaseClient,
  fetchSupabaseTransactions,
  upsertSupabaseTransaction,
  deleteSupabaseTransaction,
  getEffectiveSupabaseConfig,
  subscribeToTransactions,
  parsePairingUrl,
} from './services/supabase';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const STORAGE_KEY_TRANSACTIONS = 'financasal_transactions_v2';
const STORAGE_KEY_SETTINGS = 'financasal_settings_v1';

export default function App() {
  const [isPending, startTransition] = useTransition();

  // Settings
  const [settings, setSettings] = useState<CoupleSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar settings:', e);
    }
    return DEFAULT_COUPLE_SETTINGS;
  });

  // Transactions - Starts empty so user can register real transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      // Purge any legacy sample data
      localStorage.removeItem('financasal_transactions_v1');
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar transactions:', e);
    }
    return [];
  });

  // Active dates
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Filters & Tabs
  const [selectedPartner, setSelectedPartner] = useState<Partner | 'all'>('all');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [presetNature, setPresetNature] = useState<ExpenseNature | undefined>(undefined);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Supabase live status & Sync alerts
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [syncAlert, setSyncAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Auto-detect pairing URL on mobile / second device on mount
  useEffect(() => {
    const paired = parsePairingUrl();
    if (paired) {
      setSettings((prev) => {
        const updated = {
          ...prev,
          supabaseUrl: paired.url,
          supabaseAnonKey: paired.key,
          useSupabase: true,
        };
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Clear the url hash or query param cleanly without reload
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setSyncAlert({
        type: 'success',
        message: 'Celular pareado com sucesso! Sincronizando finanças do casal em tempo real...',
      });
      setTimeout(() => setSyncAlert(null), 6000);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn(e);
    }
  }, [transactions]);

  // Connect to Supabase, listen for Realtime events and smart-poll fallback
  useEffect(() => {
    const config = getEffectiveSupabaseConfig(settings.supabaseUrl, settings.supabaseAnonKey);
    if (!config.isConfigured) {
      setSupabaseConnected(false);
      return;
    }

    const client = getSupabaseClient(config.url, config.key);
    if (!client) {
      setSupabaseConnected(false);
      return;
    }

    let isSubscribed = true;

    // Refresh function for fetching latest data
    const refreshData = async () => {
      try {
        const remoteData = await fetchSupabaseTransactions(client);
        if (!isSubscribed) return;
        setSupabaseConnected(true);
        setTransactions(remoteData);
      } catch (err: any) {
        if (!isSubscribed) return;
        console.warn('Erro ao atualizar dados do Supabase:', err.message);
        setSupabaseConnected(false);
        if (err.code === '42P01') {
          setSyncAlert({
            type: 'error',
            message: 'A tabela "transactions" ainda precisa ser criada no Supabase com o Script SQL.',
          });
        }
      }
    };

    // 1. Initial fetch
    refreshData();

    // 2. Realtime WebSocket subscription (receives instant INSERT, UPDATE, DELETE from partner)
    const unsubscribe = subscribeToTransactions(client, () => {
      refreshData();
    });

    // 3. Smart poll fallback every 4 seconds when the window is focused (ideal for mobile multitasking)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [settings.supabaseUrl, settings.supabaseAnonKey]);

  // Filter transactions for the selected month & year (and partner if selected)
  const monthTransactions = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const targetPrefix = `${selectedYear}-${monthStr}`;

    return transactions.filter((t) => {
      // Must match month & year
      if (!t.date.startsWith(targetPrefix)) return false;

      // Filter by partner if not 'all'
      if (selectedPartner !== 'all') {
        if (selectedPartner === 'shared' && t.paidBy !== 'shared') return false;
        if (selectedPartner === 'partner_1' && t.paidBy !== 'partner_1') return false;
        if (selectedPartner === 'partner_2' && t.paidBy !== 'partner_2') return false;
      }

      return true;
    });
  }, [transactions, selectedYear, selectedMonth, selectedPartner]);

  // All transactions of the month (unfiltered by partner) for accurate couple calculations
  const allMonthTransactions = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const targetPrefix = `${selectedYear}-${monthStr}`;
    return transactions.filter((t) => t.date.startsWith(targetPrefix));
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate summary metrics for the month
  const summary = useMemo(() => {
    return calculateMonthSummary(allMonthTransactions, settings);
  }, [allMonthTransactions, settings]);

  // Handlers
  const handleOpenNewTransaction = (nature?: ExpenseNature) => {
    setEditingTx(null);
    setPresetNature(nature);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setPresetNature(tx.nature);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    const isEdit = Boolean(data.id);
    const id = data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullTx: Transaction = {
      ...data,
      id,
      createdAt: isEdit
        ? transactions.find((t) => t.id === id)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    setTransactions((prev) => {
      if (isEdit) {
        return prev.map((t) => (t.id === id ? fullTx : t));
      }
      return [fullTx, ...prev];
    });

    // Sync to Supabase if client is available
    const client = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
    if (client) {
      try {
        await upsertSupabaseTransaction(client, fullTx);
        setSupabaseConnected(true);
      } catch (err: any) {
        console.error('Erro ao sincronizar com Supabase:', err);
        setSyncAlert({
          type: 'error',
          message: `Erro ao espelhar no Supabase: ${err.message || 'Verifique a estrutura da tabela'}. Abra as configurações para copiar o SQL.`,
        });
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const client = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
    if (client) {
      try {
        await deleteSupabaseTransaction(client, id);
      } catch (err: any) {
        console.error('Erro ao deletar no Supabase:', err);
        setSyncAlert({
          type: 'error',
          message: `Erro ao deletar no Supabase: ${err.message}`,
        });
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    const newStatus = tx.status === 'paid' ? 'pending' : 'paid';
    const updatedTx = { ...tx, status: newStatus as any };

    setTransactions((prev) => prev.map((t) => (t.id === id ? updatedTx : t)));

    const client = getSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey);
    if (client) {
      try {
        await upsertSupabaseTransaction(client, updatedTx);
      } catch (err: any) {
        console.error('Erro ao atualizar status no Supabase:', err);
        setSyncAlert({
          type: 'error',
          message: `Erro ao atualizar status no Supabase: ${err.message}`,
        });
      }
    }
  };

  const handleUpdateSplitMode = (mode: 'equal' | 'proportional') => {
    setSettings((prev) => ({ ...prev, splitMode: mode }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={() => handleOpenNewTransaction()}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        supabaseConnected={supabaseConnected}
        settings={settings}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Realtime Sync / Pairing Alert Banner */}
        {syncAlert && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200 ${
              syncAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {syncAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{syncAlert.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {syncAlert.type === 'error' && (
                <button
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-100 rounded-md font-bold text-rose-800 transition-colors cursor-pointer"
                >
                  Abrir Configuração
                </button>
              )}
              <button
                onClick={() => setSyncAlert(null)}
                className="p-1 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Month Selector and Partner Filter Bar */}
        <MonthSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onChangeMonth={(y, m) => {
            setSelectedYear(y);
            setSelectedMonth(m);
          }}
          selectedPartner={selectedPartner}
          onChangePartner={setSelectedPartner}
          settings={settings}
        />

        {/* Tab 1: Visão Geral (Dashboard) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Summary Stat Cards */}
            <SummaryCards
              summary={summary}
              onViewPendingBills={() => setActiveTab('fixed-checklist')}
            />

            {/* Side-by-side: Fixed vs Variable Overview + Recent Entries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Transactions & Quick Filter */}
              <div className="lg:col-span-2">
                <TransactionList
                  transactions={monthTransactions}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onToggleStatus={handleToggleStatus}
                  onOpenNewTransaction={() => handleOpenNewTransaction()}
                  settings={settings}
                />
              </div>

              {/* Right 1 Col: Quick Fixed Checklist Preview & Couple Settlement Widget */}
              <div className="space-y-6">
                {/* Couple Settlement Glance Card */}
                <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
                    Equilíbrio do Mês
                  </h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    Sugestão de repasse para manter os gastos compartilhados justos:
                  </p>

                  <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200/70 text-xs">
                    <p className="font-semibold text-neutral-800">
                      {summary.settlementSuggestion.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('couple-split')}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer block"
                  >
                    Ver detalhes da divisão a dois →
                  </button>
                </div>

                {/* 50/30/20 Snapshot */}
                <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-2">
                    Proporção 50/30/20 do Casal
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-neutral-600 mb-1">
                        <span>Fixos ({Math.round(summary.fixedExpenseRatio)}%)</span>
                        <span className="font-mono">Meta: 50%</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, summary.fixedExpenseRatio)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-600 mb-1">
                        <span>Variáveis ({Math.round(summary.variableExpenseRatio)}%)</span>
                        <span className="font-mono">Meta: 30%</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, summary.variableExpenseRatio)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-600 mb-1">
                        <span>Reserva ({Math.round(summary.savingsRatio)}%)</span>
                        <span className="font-mono">Meta: 20%</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, summary.savingsRatio)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('budget-rule')}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer block"
                  >
                    Abrir análise completa →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lançamentos (Transactions Table) */}
        {activeTab === 'transactions' && (
          <div className="animate-in fade-in duration-200">
            <TransactionList
              transactions={monthTransactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onToggleStatus={handleToggleStatus}
              onOpenNewTransaction={() => handleOpenNewTransaction()}
              settings={settings}
            />
          </div>
        )}

        {/* Tab 3: Contas Fixas & Checklist */}
        {activeTab === 'fixed-checklist' && (
          <div className="animate-in fade-in duration-200">
            <FixedExpensesTracker
              transactions={allMonthTransactions}
              onToggleStatus={handleToggleStatus}
              onOpenNewTransaction={(nature) => handleOpenNewTransaction(nature)}
              settings={settings}
            />
          </div>
        )}

        {/* Tab 4: Divisão do Casal */}
        {activeTab === 'couple-split' && (
          <div className="animate-in fade-in duration-200">
            <CoupleSplitView
              summary={summary}
              settings={settings}
              onUpdateSplitMode={handleUpdateSplitMode}
            />
          </div>
        )}

        {/* Tab 5: Regra 50/30/20 */}
        {activeTab === 'budget-rule' && (
          <div className="animate-in fade-in duration-200">
            <BudgetAnalysis
              summary={summary}
              transactions={allMonthTransactions}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white/70 py-6 mt-12 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            FinanCasal · Gestão financeira descomplicada para {settings.partner1Name} & {settings.partner2Name}.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
            >
              Configurar Supabase & Vercel
            </button>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
            >
              Preferências do Casal
            </button>
          </div>
        </div>
      </footer>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTx}
        presetNature={presetNature}
        settings={settings}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        transactions={transactions}
        onTransactionsSynced={() => setSupabaseConnected(true)}
      />

      {/* Couple Settings Modal */}
      <CoupleSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        transactions={transactions}
        onResetData={(newData) => setTransactions(newData)}
      />

    </div>
  );
}

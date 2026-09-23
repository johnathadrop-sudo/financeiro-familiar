import React from 'react';
import { Plus, Database, Settings as SettingsIcon, Heart, CheckCircle2, CloudOff, Smartphone, Radio } from 'lucide-react';
import { CoupleSettings } from '../types/finance';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenSettings: () => void;
  supabaseConnected: boolean;
  settings: CoupleSettings;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
  onOpenSupabaseConfig,
  onOpenSettings,
  supabaseConnected,
  settings,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Visão Geral' },
    { id: 'transactions', label: 'Lançamentos' },
    { id: 'fixed-checklist', label: 'Contas Fixas & Checklist' },
    { id: 'couple-split', label: 'Divisão do Casal' },
    { id: 'budget-rule', label: 'Regra 50/30/20' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-700/10">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-1.5"
            >
              <span>FinanCasal</span>
              <span className="text-xs font-medium text-neutral-500 hidden sm:inline">
                {settings.partner1Name} & {settings.partner2Name}
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Espelhar no 2º Celular / WhatsApp */}
            <button
              onClick={onOpenSupabaseConfig}
              title="Espelhar no celular da esposa / 2º aparelho"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Espelhar Celular</span>
            </button>

            {/* Supabase status badge / button */}
            <button
              onClick={onOpenSupabaseConfig}
              title={
                supabaseConnected
                  ? 'Supabase conectado: Sincronização em tempo real ativa!'
                  : 'Configurar banco de dados Supabase para espelhar com a esposa'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                supabaseConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {supabaseConnected ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">
                {supabaseConnected ? 'Tempo Real Ativo' : 'Conectar Supabase'}
              </span>
              {supabaseConnected ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
              )}
            </button>

            {/* Couple settings */}
            <button
              onClick={onOpenSettings}
              title="Configurações do Casal"
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* New Transaction Button */}
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Lançamento</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto scrollbar-none py-2 gap-1 border-t border-neutral-100">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs font-medium whitespace-nowrap rounded-md transition-colors ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

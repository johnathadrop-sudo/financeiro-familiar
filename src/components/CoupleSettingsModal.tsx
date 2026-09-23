import React, { useState } from 'react';
import { X, Users, Heart, Download, Upload, RotateCcw, AlertTriangle, Trash2, Sparkles } from 'lucide-react';
import { CoupleSettings, Transaction } from '../types/finance';
import { DEMO_TRANSACTIONS } from '../data/initialData';

interface CoupleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CoupleSettings;
  onSaveSettings: (settings: CoupleSettings) => void;
  transactions: Transaction[];
  onResetData: (data: Transaction[]) => void;
}

export const CoupleSettingsModal: React.FC<CoupleSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  transactions,
  onResetData,
}) => {
  const [partner1Name, setPartner1Name] = useState(settings.partner1Name);
  const [partner2Name, setPartner2Name] = useState(settings.partner2Name);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState(String(settings.monthlySavingsTarget));
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      partner1Name: partner1Name.trim() || 'Ele',
      partner2Name: partner2Name.trim() || 'Ela',
      monthlySavingsTarget: parseFloat(monthlySavingsTarget) || 0,
    });
    onClose();
  };

  const handleExportJSON = () => {
    const backup = {
      settings,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinanCasal_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onResetData(parsed.transactions);
          if (parsed.settings) {
            onSaveSettings(parsed.settings);
          }
          alert('Backup restaurado com sucesso!');
          onClose();
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-600 fill-emerald-100" />
            <h3 className="text-base font-bold text-neutral-900">
              Personalização do Casal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Nome do Parceiro 1
            </label>
            <input
              type="text"
              value={partner1Name}
              onChange={(e) => setPartner1Name(e.target.value)}
              placeholder="Ex: Johnatha"
              required
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Nome da Parceira 2
            </label>
            <input
              type="text"
              value={partner2Name}
              onChange={(e) => setPartner2Name(e.target.value)}
              placeholder="Ex: Esposa"
              required
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Meta de Poupança / Reserva Mensal (R$)
            </label>
            <input
              type="number"
              value={monthlySavingsTarget}
              onChange={(e) => setMonthlySavingsTarget(e.target.value)}
              placeholder="1500"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Backup & Export */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <span className="font-semibold text-neutral-700 block">Backup & Dados</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg text-neutral-800 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Backup</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg text-neutral-800 font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Data Reset & Clear Options */}
          <div className="pt-2 space-y-2">
            {/* Clear All Transactions */}
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Limpar Todos os Lançamentos (Zerar para lançar os reais)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Deseja apagar todos os {transactions.length} lançamentos?</span>
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  O painel ficará completamente zerado para você e sua parceira iniciarem os lançamentos verdadeiros.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onResetData([]);
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Sim, Limpar Tudo
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Optional Demo Data Load */}
            <div className="pt-1">
              {!confirmDemo ? (
                <button
                  type="button"
                  onClick={() => setConfirmDemo(true)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-neutral-400" />
                  <span>Carregar exemplos fictícios de demonstração</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 space-y-1.5">
                  <p className="text-[11px]">Substituir lançamentos atuais pelos exemplos de teste?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData(DEMO_TRANSACTIONS);
                        setConfirmDemo(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-neutral-900 text-white rounded font-medium text-[11px]"
                    >
                      Carregar Exemplos
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDemo(false)}
                      className="px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded font-medium text-[11px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Salvar Alterações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

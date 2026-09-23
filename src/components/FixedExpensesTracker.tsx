import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Plus, Calendar, Home, Zap, HeartPulse, Tv, ShieldCheck } from 'lucide-react';
import { Transaction, CoupleSettings } from '../types/finance';
import { formatBRL, formatDateBR } from '../utils/finance';

interface FixedExpensesTrackerProps {
  transactions: Transaction[];
  onToggleStatus: (id: string) => void;
  onOpenNewTransaction: (presetNature?: 'fixed') => void;
  settings: CoupleSettings;
}

export const FixedExpensesTracker: React.FC<FixedExpensesTrackerProps> = ({
  transactions,
  onToggleStatus,
  onOpenNewTransaction,
  settings,
}) => {
  // Filter for fixed expenses of this period
  const fixedExpenses = transactions.filter((t) => t.type === 'expense' && t.nature === 'fixed');

  const paidList = fixedExpenses.filter((t) => t.status === 'paid');
  const pendingList = fixedExpenses.filter((t) => t.status === 'pending');

  const totalFixedAmount = fixedExpenses.reduce((acc, t) => acc + t.amount, 0);
  const totalPaidAmount = paidList.reduce((acc, t) => acc + t.amount, 0);
  const totalPendingAmount = pendingList.reduce((acc, t) => acc + t.amount, 0);

  const percentPaid = totalFixedAmount > 0 ? Math.round((totalPaidAmount / totalFixedAmount) * 100) : 0;

  const getPartnerName = (partner: string) => {
    if (partner === 'partner_1') return settings.partner1Name;
    if (partner === 'partner_2') return settings.partner2Name;
    return 'Casal (Conta Conjunta)';
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Checklist de Contas Fixas do Mês
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Acompanhe o pagamento de aluguel, condomínio, luz, internet e assinaturas do casal.
            </p>
          </div>

          <button
            onClick={() => onOpenNewTransaction('fixed')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Conta Fixa</span>
          </button>
        </div>

        {/* Progress Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div>
            <div className="text-xs text-neutral-500 font-medium">Total de Contas Fixas</div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-0.5">
              {formatBRL(totalFixedAmount)}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">{fixedExpenses.length} compromissos no mês</div>
          </div>

          <div>
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Já Pagas ({paidList.length})</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
              {formatBRL(totalPaidAmount)}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">{percentPaid}% do total quitado</div>
          </div>

          <div>
            <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ainda Pendentes ({pendingList.length})</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-0.5">
              {formatBRL(totalPendingAmount)}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">A vencer ou aguardando pagamento</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
            <span>Progresso de Quitação das Contas</span>
            <span className="font-semibold text-neutral-800 font-mono tabular-nums">{percentPaid}%</span>
          </div>
          <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="px-5 py-3.5 bg-neutral-50/70 border-b border-neutral-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Contas Cadastradas
          </span>
          <span className="text-xs text-neutral-500">
            Clique no círculo para marcar como pago ou pendente
          </span>
        </div>

        {fixedExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ShieldCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-800">
              Nenhum gasto fixo cadastrado para este mês
            </p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
              Gastos fixos são contas previsíveis e essenciais como aluguel, condomínio, luz, internet e planos recorrentes.
            </p>
            <button
              onClick={() => onOpenNewTransaction('fixed')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              + Adicionar Primeiro Gasto Fixo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {fixedExpenses.map((expense) => {
              const isPaid = expense.status === 'paid';
              return (
                <div
                  key={expense.id}
                  className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-neutral-50/80 ${
                    isPaid ? 'opacity-85' : 'bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Toggle button */}
                    <button
                      onClick={() => onToggleStatus(expense.id)}
                      title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      className="shrink-0 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-300 hover:text-emerald-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isPaid ? 'text-neutral-700 line-through text-neutral-500' : 'text-neutral-900'
                          }`}
                        >
                          {expense.title}
                        </span>
                        {expense.dueDate && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            <span>Venc: {formatDateBR(expense.dueDate)}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                        <span>{expense.category}</span>
                        <span aria-hidden="true" className="text-neutral-300">·</span>
                        <span>Responsável: {getPartnerName(expense.paidBy)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono tabular-nums text-neutral-900">
                      {formatBRL(expense.amount)}
                    </div>
                    <div className="text-xs mt-0.5">
                      {isPaid ? (
                        <span className="text-emerald-700 font-medium">Pago</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Pendente</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

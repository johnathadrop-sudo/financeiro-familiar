import React from 'react';
import { TrendingUp, ArrowDownRight, Layers, PiggyBank, Clock, CheckCircle } from 'lucide-react';
import { MonthSummary, formatBRL, formatPercent } from '../utils/finance';

interface SummaryCardsProps {
  summary: MonthSummary;
  onViewPendingBills?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onViewPendingBills }) => {
  const isPositiveBalance = summary.netBalance >= 0;

  return (
    <div className="space-y-4 mb-8">
      {/* Pending bills notification banner if any */}
      {summary.pendingExpensesCount > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm">
              <strong className="font-semibold">{summary.pendingExpensesCount} contas a pagar</strong> pendentes neste mês, totalizando{' '}
              <span className="font-mono font-medium tabular-nums">{formatBRL(summary.pendingExpenses)}</span>.
            </p>
          </div>
          {onViewPendingBills && (
            <button
              onClick={onViewPendingBills}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              Conferir checklist de contas →
            </button>
          )}
        </div>
      )}

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Receitas Totais */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Receitas Totais
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 tracking-tight">
            {formatBRL(summary.totalIncome)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Fixas {formatBRL(summary.fixedIncome)}</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span>Variáveis {formatBRL(summary.variableIncome)}</span>
          </div>
        </div>

        {/* 2. Gastos Fixos */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Gastos Fixos
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 tracking-tight">
            {formatBRL(summary.fixedExpense)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>{formatPercent(summary.fixedExpenseRatio)} da receita total</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span>Moradia & Contas</span>
          </div>
        </div>

        {/* 3. Gastos Variáveis */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Gastos Variáveis
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-neutral-900 tracking-tight">
            {formatBRL(summary.variableExpense)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            <span>{formatPercent(summary.variableExpenseRatio)} da receita total</span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span>Mercado, Lazer & Extras</span>
          </div>
        </div>

        {/* 4. Saldo Líquido do Mês */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Saldo Líquido
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isPositiveBalance ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight ${
              isPositiveBalance ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatBRL(summary.netBalance)}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
            {isPositiveBalance ? (
              <>
                <span className="text-emerald-700 font-medium">
                  Taxa de poupança: {formatPercent(summary.savingsRate)}
                </span>
                <span aria-hidden="true" className="text-neutral-300">·</span>
                <span>Sobrando no mês</span>
              </>
            ) : (
              <span className="text-rose-600 font-medium">
                Déficit no mês ({formatPercent(Math.abs(summary.savingsRate))})
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

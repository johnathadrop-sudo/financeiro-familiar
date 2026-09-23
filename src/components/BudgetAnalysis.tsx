import React from 'react';
import { Target, PieChart, ShieldCheck, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { MonthSummary, formatBRL, formatPercent } from '../utils/finance';
import { Transaction, EXPENSE_CATEGORIES } from '../types/finance';

interface BudgetAnalysisProps {
  summary: MonthSummary;
  transactions: Transaction[];
}

export const BudgetAnalysis: React.FC<BudgetAnalysisProps> = ({ summary, transactions }) => {
  const { totalIncome, fixedExpense, variableExpense, netBalance } = summary;

  const fixedPct = totalIncome > 0 ? (fixedExpense / totalIncome) * 100 : 0;
  const variablePct = totalIncome > 0 ? (variableExpense / totalIncome) * 100 : 0;
  const savingsPct = totalIncome > 0 ? (Math.max(0, netBalance) / totalIncome) * 100 : 0;

  // Aggregate expenses by category
  const categoryTotals: { [category: string]: number } = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  }

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([catId, amount]) => {
      const info = EXPENSE_CATEGORIES.find((c) => c.id === catId || c.label === catId);
      return {
        id: catId,
        label: info?.label || catId,
        amount,
        percent: summary.totalExpense > 0 ? (amount / summary.totalExpense) * 100 : 0,
      };
    });

  const isFixedHealthy = fixedPct <= 55;
  const isSavingsHealthy = savingsPct >= 15;

  return (
    <div className="space-y-6">
      {/* 50 / 30 / 20 Framework Card */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="pb-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Análise do Orçamento · Método 50 / 30 / 20
            </h2>
            <p className="text-xs text-neutral-500">
              Referência recomendada para finanças equilibradas: 50% Gastos Fixos, 30% Gastos Variáveis e 20% Reserva.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg self-start sm:self-auto bg-neutral-100 text-neutral-800">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diagnóstico do Mês</span>
          </div>
        </div>

        {/* 3 Pillars Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          
          {/* Pillar 1: Fixos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700">Gastos Fixos (Meta: até 50%)</span>
              <span className="font-bold font-mono tabular-nums text-neutral-900">
                {formatPercent(fixedPct)}
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  fixedPct > 55 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, fixedPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatBRL(fixedExpense)}</span>
              <span>{fixedPct <= 50 ? 'Dentro da meta' : 'Acima da meta'}</span>
            </div>
          </div>

          {/* Pillar 2: Variáveis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700">Gastos Variáveis (Meta: até 30%)</span>
              <span className="font-bold font-mono tabular-nums text-neutral-900">
                {formatPercent(variablePct)}
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  variablePct > 35 ? 'bg-rose-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, variablePct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatBRL(variableExpense)}</span>
              <span>{variablePct <= 30 ? 'Dentro da meta' : 'Atenção aos extras'}</span>
            </div>
          </div>

          {/* Pillar 3: Reserva & Aportes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700">Reserva & Poupança (Meta: 20%)</span>
              <span className="font-bold font-mono tabular-nums text-neutral-900">
                {formatPercent(savingsPct)}
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  savingsPct >= 20 ? 'bg-emerald-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, savingsPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{formatBRL(Math.max(0, netBalance))}</span>
              <span>{savingsPct >= 20 ? 'Meta atingida' : 'Oportunidade de poupar'}</span>
            </div>
          </div>

        </div>

        {/* Insight callout */}
        <div className="mt-5 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/70 flex items-start gap-2.5 text-xs text-neutral-700">
          {isFixedHealthy ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <p>
            {isFixedHealthy
              ? 'Excelente! Os gastos fixos do casal estão em patamar saudável, o que dá tranquilidade e margem para imprevistos e momentos de lazer.'
              : 'Dica para o casal: os gastos fixos estão ocupando mais de 50% da receita. Analisem se há planos ou assinaturas que podem ser otimizados.'}
          </p>
        </div>
      </div>

      {/* Expenses by Category Breakdown */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="pb-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Onde o Casal Está Gastando (Por Categoria)
            </h3>
            <p className="text-xs text-neutral-500">
              Distribuição proporcional das despesas do mês ordenadas por valor.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-neutral-500 tabular-nums">
            Total: {formatBRL(summary.totalExpense)}
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">
            Nenhuma despesa registrada para categorizar neste mês.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 pt-2">
            {sortedCategories.map((item) => (
              <div key={item.id} className="py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 font-mono tabular-nums">
                      {formatPercent(item.percent)}
                    </span>
                    <span className="font-bold font-mono tabular-nums text-neutral-900">
                      {formatBRL(item.amount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-800 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

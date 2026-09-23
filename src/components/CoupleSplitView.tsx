import React from 'react';
import { Heart, ArrowRightLeft, User, Users, ShieldAlert, CheckCircle, Scale, Sparkles } from 'lucide-react';
import { MonthSummary, formatBRL, formatPercent } from '../utils/finance';
import { CoupleSettings } from '../types/finance';

interface CoupleSplitViewProps {
  summary: MonthSummary;
  settings: CoupleSettings;
  onUpdateSplitMode: (mode: 'equal' | 'proportional') => void;
}

export const CoupleSplitView: React.FC<CoupleSplitViewProps> = ({
  summary,
  settings,
  onUpdateSplitMode,
}) => {
  const { settlementSuggestion } = summary;
  const totalIncomes = summary.partner1Income + summary.partner2Income;
  const p1IncomePct = totalIncomes > 0 ? (summary.partner1Income / totalIncomes) * 100 : 50;
  const p2IncomePct = totalIncomes > 0 ? (summary.partner2Income / totalIncomes) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Fair settlement banner */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Equilíbrio de Contas do Casal
              </h2>
              <p className="text-xs text-neutral-500">
                Divisão transparente das despesas compartilhadas para paz financeira a dois.
              </p>
            </div>
          </div>

          {/* Division mode toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => onUpdateSplitMode('equal')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                settings.splitMode === 'equal'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Divisão 50 / 50
            </button>
            <button
              onClick={() => onUpdateSplitMode('proportional')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                settings.splitMode === 'proportional'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Proporcional à Renda
            </button>
          </div>
        </div>

        {/* Friendly Settlement Result Box */}
        <div className="mt-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-start gap-3">
            {settlementSuggestion.amount > 0 ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {settlementSuggestion.amount > 0 ? 'Sugestão de Repasse / Acerto' : 'Situação das Despesas'}
              </span>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                {settlementSuggestion.description}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                {settings.splitMode === 'equal'
                  ? 'Calculado com base na regra meio a meio para despesas que beneficiam ambos.'
                  : `Calculado com base proporcional: ${settings.partner1Name} contribui com ${formatPercent(
                      p1IncomePct
                    )} e ${settings.partner2Name} com ${formatPercent(p2IncomePct)}.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Partner 1 Card */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                {settings.partner1Name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">{settings.partner1Name}</h3>
                <span className="text-xs text-neutral-500">
                  {formatPercent(p1IncomePct)} da renda do casal
                </span>
              </div>
            </div>
            <span className="text-xs text-blue-700 bg-blue-50 font-medium px-2 py-0.5 rounded">
              Parceiro 1
            </span>
          </div>

          <div className="space-y-3 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Renda informada no mês:</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900">
                {formatBRL(summary.partner1Income)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Despesas pagas diretamente:</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900">
                {formatBRL(summary.partner1PaidExpense)}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Participação justa calculada:</span>
              <span className="font-mono font-medium tabular-nums">
                {settings.splitMode === 'equal' ? '50% do conjunto' : `${formatPercent(p1IncomePct)} do conjunto`}
              </span>
            </div>
          </div>
        </div>

        {/* Partner 2 Card */}
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                {settings.partner2Name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">{settings.partner2Name}</h3>
                <span className="text-xs text-neutral-500">
                  {formatPercent(p2IncomePct)} da renda do casal
                </span>
              </div>
            </div>
            <span className="text-xs text-purple-700 bg-purple-50 font-medium px-2 py-0.5 rounded">
              Parceiro 2
            </span>
          </div>

          <div className="space-y-3 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Renda informada no mês:</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900">
                {formatBRL(summary.partner2Income)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Despesas pagas diretamente:</span>
              <span className="font-mono font-bold tabular-nums text-neutral-900">
                {formatBRL(summary.partner2PaidExpense)}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Participação justa calculada:</span>
              <span className="font-mono font-medium tabular-nums">
                {settings.splitMode === 'equal' ? '50% do conjunto' : `${formatPercent(p2IncomePct)} do conjunto`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Shared Account / Conta Conjunta Information */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900">Conta Conjunta / Pago por Ambos</h4>
              <p className="text-xs text-neutral-500">
                Despesas debitadas diretamente de uma reserva ou conta corrente do casal.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900">
              {formatBRL(summary.sharedPaidExpense)}
            </div>
            <span className="text-xs text-neutral-400">Total debitado em conjunto</span>
          </div>
        </div>
      </div>
    </div>
  );
};

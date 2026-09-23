import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, User, Heart } from 'lucide-react';
import { Partner, CoupleSettings } from '../types/finance';
import { getMonthNameBR } from '../utils/finance';

interface MonthSelectorProps {
  selectedYear: number;
  selectedMonth: number; // 0 - 11
  onChangeMonth: (year: number, month: number) => void;
  selectedPartner: Partner | 'all';
  onChangePartner: (partner: Partner | 'all') => void;
  settings: CoupleSettings;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedYear,
  selectedMonth,
  onChangeMonth,
  selectedPartner,
  onChangePartner,
  settings,
}) => {
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onChangeMonth(selectedYear - 1, 11);
    } else {
      onChangeMonth(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onChangeMonth(selectedYear + 1, 0);
    } else {
      onChangeMonth(selectedYear, selectedMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    onChangeMonth(today.getFullYear(), today.getMonth());
  };

  const monthName = getMonthNameBR(selectedMonth);

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 sm:p-4 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Month Navigator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-neutral-100/80 rounded-lg p-0.5">
          <button
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-3 py-1 flex items-center gap-2 min-w-[170px] justify-center">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-neutral-900 text-sm tracking-tight">
              {monthName} {selectedYear}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleCurrentMonth}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1.5 rounded-md transition-colors border border-emerald-200"
        >
          Mês Atual
        </button>
      </div>

      {/* Partner Filter: Todos / Nós / Ele / Ela */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        <span className="text-xs text-neutral-500 font-medium mr-1 hidden lg:inline">
          Filtrar por:
        </span>

        <button
          onClick={() => onChangePartner('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedPartner === 'all'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Todos os Gastos</span>
          </span>
        </button>

        <button
          onClick={() => onChangePartner('shared')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedPartner === 'shared'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            <span>Casal (Conjunto)</span>
          </span>
        </button>

        <button
          onClick={() => onChangePartner('partner_1')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedPartner === 'partner_1'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{settings.partner1Name}</span>
          </span>
        </button>

        <button
          onClick={() => onChangePartner('partner_2')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedPartner === 'partner_2'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{settings.partner2Name}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

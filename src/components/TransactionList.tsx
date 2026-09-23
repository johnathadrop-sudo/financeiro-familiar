import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Edit2, Trash2, CheckCircle2, Circle, Download, Plus, FileSpreadsheet } from 'lucide-react';
import { Transaction, TransactionType, ExpenseNature, Partner, CoupleSettings } from '../types/finance';
import { formatBRL, formatDateBR } from '../utils/finance';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenNewTransaction: () => void;
  settings: CoupleSettings;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenNewTransaction,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [natureFilter, setNatureFilter] = useState<ExpenseNature | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }

      // Type
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Nature
      if (natureFilter !== 'all' && t.nature !== natureFilter) return false;

      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      return true;
    });
  }, [transactions, searchTerm, typeFilter, natureFilter, statusFilter]);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Data', 'Tipo', 'Natureza', 'Titulo', 'Categoria', 'Valor (R$)', 'Status', 'Quem Pagou', 'Observacoes'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.nature === 'fixed' ? 'Fixo' : 'Variavel',
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.amount.toFixed(2),
      t.status === 'paid' ? 'Pago' : 'Pendente',
      t.paidBy === 'shared' ? 'Casal' : t.paidBy === 'partner_1' ? settings.partner1Name : settings.partner2Name,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinanCasal_Lancamentos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPartnerLabel = (paidBy: Partner) => {
    if (paidBy === 'partner_1') return settings.partner1Name;
    if (paidBy === 'partner_2') return settings.partner2Name;
    return 'Casal';
  };

  return (
    <div className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Table Header and Filters */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Todos os Lançamentos do Mês
            </h2>
            <p className="text-xs text-neutral-500">
              Gerencie receitas e despesas com discriminação entre fixos e variáveis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors cursor-pointer"
              title="Exportar planilha CSV para Excel ou Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Filter controls bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-800"
          >
            <option value="all">Tipo: Todos (Entradas e Saídas)</option>
            <option value="income">Apenas Receitas (+)</option>
            <option value="expense">Apenas Despesas (-)</option>
          </select>

          {/* Nature filter (Fixo vs Variável) */}
          <select
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-800"
          >
            <option value="all">Natureza: Fixos & Variáveis</option>
            <option value="fixed">Apenas Gastos/Rendas Fixas</option>
            <option value="variable">Apenas Gastos/Rendas Variáveis</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-800"
          >
            <option value="all">Status: Todos</option>
            <option value="paid">Apenas Pagos / Recebidos</option>
            <option value="pending">Apenas Pendentes</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-14 px-4">
          <p className="text-sm font-bold text-neutral-800">Nenhum lançamento cadastrado neste mês</p>
          <p className="text-xs text-neutral-500 mt-1 mb-5 max-w-md mx-auto">
            O painel está completamente zerado e pronto para você começar a cadastrar as despesas e receitas reais do casal.
          </p>
          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Fazer Primeiro Lançamento</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/70 border-b border-neutral-200/80 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-10 text-center">Status</th>
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 px-4">Descrição</th>
                <th className="py-2.5 px-4">Natureza</th>
                <th className="py-2.5 px-4">Responsável</th>
                <th className="py-2.5 px-4 text-right">Valor</th>
                <th className="py-2.5 px-4 text-right w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredTransactions.map((t) => {
                const isIncome = t.type === 'income';
                const isPaid = t.status === 'paid';

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-neutral-50/70 transition-colors group"
                  >
                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStatus(t.id)}
                        title={isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                        className="cursor-pointer text-neutral-400 hover:text-emerald-600 transition-colors"
                      >
                        {isPaid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-500" />
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-neutral-600 whitespace-nowrap tabular-nums">
                      {formatDateBR(t.date)}
                    </td>

                    {/* Description and category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{t.title}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                        <span>{t.category}</span>
                        {t.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[200px]" title={t.notes}>
                              {t.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Nature: Fixo vs Variável */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.nature === 'fixed' ? (
                        <span className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Fixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          Variável
                        </span>
                      )}
                    </td>

                    {/* Paid By */}
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-700">
                      <span className="text-[11px] font-medium">
                        {getPartnerLabel(t.paidBy)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-700'
                            : 'text-neutral-900'
                        }
                      >
                        {isIncome ? '+ ' : '- '}
                        {formatBRL(t.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(t)}
                          title="Editar lançamento"
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(t.id)}
                          title="Excluir lançamento"
                          className="p-1 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

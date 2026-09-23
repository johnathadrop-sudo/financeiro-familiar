import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, DollarSign, Tag, Users, HelpCircle, Layers } from 'lucide-react';
import { Transaction, TransactionType, ExpenseNature, Partner, PaymentStatus, RecurrenceType, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CoupleSettings } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  editingTransaction?: Transaction | null;
  presetNature?: ExpenseNature;
  settings: CoupleSettings;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  presetNature,
  settings,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState<TransactionType>('expense');
  const [nature, setNature] = useState<ExpenseNature>('variable');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [paidBy, setPaidBy] = useState<Partner>('shared');
  const [beneficiary, setBeneficiary] = useState<'both' | 'partner_1' | 'partner_2'>('both');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('one_time');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // When editing or opening, populate fields
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setNature(editingTransaction.nature);
      setTitle(editingTransaction.title);
      setAmountStr(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setDueDate(editingTransaction.dueDate || '');
      setStatus(editingTransaction.status);
      setPaidBy(editingTransaction.paidBy);
      setBeneficiary(editingTransaction.beneficiary);
      setRecurrence(editingTransaction.recurrence || 'one_time');
      setNotes(editingTransaction.notes || '');
    } else {
      setType('expense');
      setNature(presetNature || 'variable');
      setTitle('');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0]?.label || 'Moradia');
      setDate(todayStr);
      setDueDate('');
      setStatus('paid');
      setPaidBy('shared');
      setBeneficiary('both');
      setRecurrence(presetNature === 'fixed' ? 'monthly' : 'one_time');
      setNotes('');
    }
    setErrorMsg('');
  }, [editingTransaction, presetNature, isOpen]);

  // Adjust default category when type changes
  useEffect(() => {
    if (!editingTransaction) {
      if (type === 'income') {
        setCategory(INCOME_CATEGORIES[0].label);
      } else {
        setCategory(EXPENSE_CATEGORIES[0].label);
      }
    }
  }, [type, editingTransaction]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Informe uma descrição ou título para o lançamento.');
      return;
    }

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Informe um valor monetário válido maior que zero.');
      return;
    }

    onSave({
      id: editingTransaction?.id,
      title: title.trim(),
      amount: parsedAmount,
      type,
      nature,
      category: category || (type === 'income' ? 'Outras Receitas' : 'Outros Gastos'),
      date: date || todayStr,
      dueDate: dueDate || undefined,
      status,
      paidBy,
      beneficiary,
      recurrence,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento do Casal'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Type Toggle: Despesa vs Receita */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Receita (Entrada)
              </button>
            </div>
          </div>

          {/* Nature: Fixo vs Variável */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-neutral-700">
                Natureza ({type === 'expense' ? 'Gasto Fixo ou Variável' : 'Renda Fixa ou Variável'})
              </label>
              <span className="text-[11px] text-neutral-500">
                {nature === 'fixed' ? 'Compromisso recorrente mensal' : 'Gasto flexível / do dia a dia'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => setNature('fixed')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  nature === 'fixed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{type === 'expense' ? 'Gasto Fixo' : 'Renda Fixa'}</span>
              </button>
              <button
                type="button"
                onClick={() => setNature('variable')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  nature === 'variable'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>{type === 'expense' ? 'Gasto Variável' : 'Renda Variável / Extra'}</span>
              </button>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Descrição / Título *
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel, Farmácia...' : 'Ex: Salário, Projeto Extra...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Valor em R$ *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Data do Registro
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quem Pagou & Beneficiário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Quem Pagou / Recebeu?
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as Partner)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="shared">Casal (Conta Conjunta)</option>
                <option value="partner_1">{settings.partner1Name}</option>
                <option value="partner_2">{settings.partner2Name}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Quem se Beneficia?
              </label>
              <select
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="both">Ambos (Casa / Conjunto)</option>
                <option value="partner_1">Apenas {settings.partner1Name}</option>
                <option value="partner_2">Apenas {settings.partner2Name}</option>
              </select>
            </div>
          </div>

          {/* Status (Pago vs Pendente) & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Status do Pagamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="paid">{type === 'expense' ? 'Pago' : 'Recebido'}</option>
                <option value="pending">{type === 'expense' ? 'Pendente / A pagar' : 'A receber'}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Vencimento (Opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Data de vencimento"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pago via Pix, parcelado em 3x, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
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
              {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

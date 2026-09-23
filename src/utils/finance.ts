import { Transaction, CoupleSettings } from '../types/finance';

export function formatBRL(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function getMonthNameBR(monthIndex: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex] || '';
}

export interface MonthSummary {
  totalIncome: number;
  fixedIncome: number;
  variableIncome: number;
  
  totalExpense: number;
  fixedExpense: number;
  variableExpense: number;
  
  netBalance: number;
  savingsRate: number;
  
  paidExpenses: number;
  pendingExpenses: number;
  pendingExpensesCount: number;

  fixedExpenseRatio: number; // % of total income
  variableExpenseRatio: number; // % of total income
  savingsRatio: number; // % of total income
  
  partner1Income: number;
  partner2Income: number;
  
  partner1PaidExpense: number;
  partner2PaidExpense: number;
  sharedPaidExpense: number;

  settlementSuggestion: {
    debtor: string | null;
    creditor: string | null;
    amount: number;
    description: string;
  };
}

export function calculateMonthSummary(
  transactions: Transaction[],
  settings: CoupleSettings
): MonthSummary {
  let totalIncome = 0;
  let fixedIncome = 0;
  let variableIncome = 0;

  let totalExpense = 0;
  let fixedExpense = 0;
  let variableExpense = 0;

  let paidExpenses = 0;
  let pendingExpenses = 0;
  let pendingExpensesCount = 0;

  let partner1Income = 0;
  let partner2Income = 0;

  let partner1PaidExpense = 0;
  let partner2PaidExpense = 0;
  let sharedPaidExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (t.nature === 'fixed') {
        fixedIncome += t.amount;
      } else {
        variableIncome += t.amount;
      }

      if (t.paidBy === 'partner_1') partner1Income += t.amount;
      else if (t.paidBy === 'partner_2') partner2Income += t.amount;
    } else {
      totalExpense += t.amount;
      if (t.nature === 'fixed') {
        fixedExpense += t.amount;
      } else {
        variableExpense += t.amount;
      }

      if (t.status === 'paid') {
        paidExpenses += t.amount;
      } else {
        pendingExpenses += t.amount;
        pendingExpensesCount++;
      }

      if (t.paidBy === 'partner_1') partner1PaidExpense += t.amount;
      else if (t.paidBy === 'partner_2') partner2PaidExpense += t.amount;
      else sharedPaidExpense += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;
  
  const fixedExpenseRatio = totalIncome > 0 ? (fixedExpense / totalIncome) * 100 : 0;
  const variableExpenseRatio = totalIncome > 0 ? (variableExpense / totalIncome) * 100 : 0;
  const savingsRatio = totalIncome > 0 ? (Math.max(0, netBalance) / totalIncome) * 100 : 0;

  // Couple settlement logic:
  // For shared/benefited-by-both expenses paid from individual pockets (not from shared account)
  // Let's calculate fair contribution
  let p1SharedContribution = 0;
  let p2SharedContribution = 0;

  for (const t of transactions) {
    if (t.type === 'expense' && t.beneficiary === 'both') {
      if (t.paidBy === 'partner_1') {
        p1SharedContribution += t.amount;
      } else if (t.paidBy === 'partner_2') {
        p2SharedContribution += t.amount;
      }
    }
  }

  const totalIndividualSharedPaid = p1SharedContribution + p2SharedContribution;
  let targetP1Share = 0.5;
  let targetP2Share = 0.5;

  if (settings.splitMode === 'proportional' && totalIncome > 0 && (partner1Income + partner2Income) > 0) {
    const totalPartnerIncome = partner1Income + partner2Income;
    targetP1Share = partner1Income / totalPartnerIncome;
    targetP2Share = partner2Income / totalPartnerIncome;
  }

  const p1ShouldPay = totalIndividualSharedPaid * targetP1Share;
  const p2ShouldPay = totalIndividualSharedPaid * targetP2Share;

  const p1Balance = p1SharedContribution - p1ShouldPay; // if positive, P1 overpaid

  let settlementSuggestion = {
    debtor: null as string | null,
    creditor: null as string | null,
    amount: 0,
    description: 'Gastos compartilhados estão equilibrados!',
  };

  if (Math.abs(p1Balance) > 1) {
    if (p1Balance > 0) {
      // P1 paid more than their fair share, P2 owes P1
      settlementSuggestion = {
        debtor: settings.partner2Name,
        creditor: settings.partner1Name,
        amount: Math.abs(p1Balance),
        description: `${settings.partner2Name} transfere ${formatBRL(Math.abs(p1Balance))} para ${settings.partner1Name} para equilibrar as despesas da casa.`,
      };
    } else {
      // P2 paid more, P1 owes P2
      settlementSuggestion = {
        debtor: settings.partner1Name,
        creditor: settings.partner2Name,
        amount: Math.abs(p1Balance),
        description: `${settings.partner1Name} transfere ${formatBRL(Math.abs(p1Balance))} para ${settings.partner2Name} para equilibrar as despesas da casa.`,
      };
    }
  }

  return {
    totalIncome,
    fixedIncome,
    variableIncome,
    totalExpense,
    fixedExpense,
    variableExpense,
    netBalance,
    savingsRate,
    paidExpenses,
    pendingExpenses,
    pendingExpensesCount,
    fixedExpenseRatio,
    variableExpenseRatio,
    savingsRatio,
    partner1Income,
    partner2Income,
    partner1PaidExpense,
    partner2PaidExpense,
    sharedPaidExpense,
    settlementSuggestion,
  };
}

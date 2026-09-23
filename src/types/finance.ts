export type TransactionType = 'income' | 'expense';
export type ExpenseNature = 'fixed' | 'variable';
export type Partner = 'shared' | 'partner_1' | 'partner_2';
export type PaymentStatus = 'paid' | 'pending';
export type RecurrenceType = 'one_time' | 'monthly' | 'yearly' | 'installment';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  nature: ExpenseNature; // 'fixed' ou 'variable' (Gasto Fixo vs Gasto Variável)
  category: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD for pending bills
  status: PaymentStatus; // 'paid' (Pago/Recebido) ou 'pending' (Pendente/Agendado)
  paidBy: Partner; // 'shared' (Ambos/Conta conjunta) | 'partner_1' | 'partner_2'
  beneficiary: 'both' | 'partner_1' | 'partner_2';
  notes?: string;
  recurrence?: RecurrenceType;
  installmentCurrent?: number;
  installmentTotal?: number;
  createdAt?: string;
}

export interface CoupleSettings {
  partner1Name: string; // e.g. "Johnatha"
  partner2Name: string; // e.g. "Esposa"
  partner1IncomeShare?: number; // percentual de contribuição para divisão proporcional se desejado (default 50)
  partner2IncomeShare?: number; // (default 50)
  splitMode: 'equal' | 'proportional'; // 50/50 ou proporcional à renda
  monthlySavingsTarget: number; // meta de reserva mensal em R$
  supabaseUrl: string;
  supabaseAnonKey: string;
  useSupabase: boolean;
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salario', label: 'Salário Principal', icon: 'Briefcase', color: 'emerald', type: 'income' },
  { id: 'freelance', label: 'Freelance & Bicos', icon: 'Laptop', color: 'teal', type: 'income' },
  { id: 'investimentos', label: 'Investimentos & Dividendos', icon: 'TrendingUp', color: 'cyan', type: 'income' },
  { id: 'aluguel_recebido', label: 'Rendas & Aluguéis', icon: 'Home', color: 'sky', type: 'income' },
  { id: 'beneficios', label: 'Vale/Benefícios/13º', icon: 'Gift', color: 'blue', type: 'income' },
  { id: 'outras_receitas', label: 'Outras Entradas', icon: 'PlusCircle', color: 'indigo', type: 'income' },
];

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'moradia', label: 'Moradia (Aluguel/Condomínio)', icon: 'Home', color: 'amber', type: 'expense' },
  { id: 'contas_consumo', label: 'Contas (Luz, Água, Gás, Net)', icon: 'Zap', color: 'orange', type: 'expense' },
  { id: 'supermercado', label: 'Supermercado & Feira', icon: 'ShoppingCart', color: 'emerald', type: 'expense' },
  { id: 'alimentacao_fora', label: 'Restaurantes & Delivery', icon: 'Utensils', color: 'rose', type: 'expense' },
  { id: 'transporte', label: 'Transporte & Carro', icon: 'Car', color: 'blue', type: 'expense' },
  { id: 'saude', label: 'Saúde & Farmácia', icon: 'HeartPulse', color: 'red', type: 'expense' },
  { id: 'lazer_viagens', label: 'Lazer, Passeios & Viagens', icon: 'Compass', color: 'purple', type: 'expense' },
  { id: 'assinaturas', label: 'Assinaturas & Streaming', icon: 'Tv', color: 'violet', type: 'expense' },
  { id: 'educacao', label: 'Educação & Cursos', icon: 'GraduationCap', color: 'indigo', type: 'expense' },
  { id: 'pets', label: 'Pets & Veterinário', icon: 'PawPrint', color: 'amber', type: 'expense' },
  { id: 'compras_pessoais', label: 'Roupas & Cuidados', icon: 'ShoppingBag', color: 'pink', type: 'expense' },
  { id: 'reserva_investimento', label: 'Reserva & Aportes', icon: 'PiggyBank', color: 'emerald', type: 'expense' },
  { id: 'outros_gastos', label: 'Outras Despesas', icon: 'Layers', color: 'stone', type: 'expense' },
];

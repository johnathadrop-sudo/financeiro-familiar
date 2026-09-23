import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction } from '../types/finance';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getEffectiveSupabaseConfig(storedUrl?: string, storedKey?: string) {
  // Check env vars first (standard for Vercel), then stored in localStorage
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const url = storedUrl?.trim() || envUrl.trim();
  const key = storedKey?.trim() || envKey.trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
    isFromEnv: Boolean(envUrl && envKey),
  };
}

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const config = getEffectiveSupabaseConfig(url, key);

  if (!config.isConfigured) {
    return null;
  }

  if (cachedClient && cachedUrl === config.url && cachedKey === config.key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = config.url;
    cachedKey = config.key;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'A URL do Supabase deve começar com https:// (ex: https://xyz.supabase.co)' };
    }
    const client = createClient(url, key);
    // Attempt a light query on transactions or check health
    const { error } = await client.from('transactions').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return {
          success: true,
          message: 'Conectado com sucesso ao Supabase! A tabela "transactions" ainda precisa ser criada com o script SQL fornecido abaixo.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message} (Código: ${error.code || 'Desconhecido'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! A tabela "transactions" está acessível.',
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Falha ao tentar conectar ao Supabase.',
    };
  }
}

export async function fetchSupabaseTransactions(client: SupabaseClient): Promise<Transaction[]> {
  const { data, error } = await client
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    nature: row.nature || 'variable',
    category: row.category,
    date: row.date,
    dueDate: row.due_date || undefined,
    status: row.status || 'paid',
    paidBy: row.paid_by || 'shared',
    beneficiary: row.beneficiary || 'both',
    notes: row.notes || undefined,
    recurrence: row.recurrence || 'one_time',
    installmentCurrent: row.installment_current || undefined,
    installmentTotal: row.installment_total || undefined,
    createdAt: row.created_at,
  }));
}

export async function upsertSupabaseTransaction(client: SupabaseClient, t: Transaction): Promise<void> {
  const row = {
    id: t.id,
    title: t.title,
    amount: t.amount,
    type: t.type,
    nature: t.nature,
    category: t.category,
    date: t.date,
    due_date: t.dueDate || null,
    status: t.status,
    paid_by: t.paidBy,
    beneficiary: t.beneficiary,
    notes: t.notes || null,
    recurrence: t.recurrence || 'one_time',
    installment_current: t.installmentCurrent || null,
    installment_total: t.installmentTotal || null,
  };

  const { error } = await client.from('transactions').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteSupabaseTransaction(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function batchSyncLocalToSupabase(client: SupabaseClient, transactions: Transaction[]): Promise<number> {
  if (transactions.length === 0) return 0;
  
  const rows = transactions.map((t) => ({
    id: t.id,
    title: t.title,
    amount: t.amount,
    type: t.type,
    nature: t.nature,
    category: t.category,
    date: t.date,
    due_date: t.dueDate || null,
    status: t.status,
    paid_by: t.paidBy,
    beneficiary: t.beneficiary,
    notes: t.notes || null,
    recurrence: t.recurrence || 'one_time',
    installment_current: t.installmentCurrent || null,
    installment_total: t.installmentTotal || null,
  }));

  const { error } = await client.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  return rows.length;
}

export function getSupabaseSQLScript(): string {
  return `-- ==============================================================================
-- FINANCASAL / GESTOR FINANCEIRO FAMILIAR - SUPABASE POSTGRESQL SCHEMA
-- Tabelas: profiles, families, family_members, categories, accounts, transactions
-- Inclui: UUIDs, Chaves Estrangeiras, Índices, Triggers Automáticos e RLS
-- ==============================================================================

-- 0. Habilitar extensões necessárias para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABELA: profiles (Perfis de Usuários vinculados ao Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. TABELA: families (Núcleo Familiar / Casal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    monthly_savings_target NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. TABELA: family_members (Membros vinculados à Família com permissões)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    income_percentage NUMERIC(5, 2) DEFAULT 50.00 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_id, user_id)
);

-- ==============================================================================
-- 4. TABELA: categories (Categorias Globais, Familiares ou Pessoais)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    nature TEXT NOT NULL DEFAULT 'variable' CHECK (nature IN ('fixed', 'variable')),
    color TEXT DEFAULT '#10b981',
    icon TEXT DEFAULT 'Tag',
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. TABELA: accounts (Contas Bancárias, Carteiras ou Cartões)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'investment', 'cash')),
    balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    is_shared BOOLEAN DEFAULT false NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. TABELA: transactions (Lançamentos de Receitas e Gastos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    nature TEXT NOT NULL DEFAULT 'variable' CHECK (nature IN ('fixed', 'variable')),
    scope TEXT NOT NULL DEFAULT 'family' CHECK (scope IN ('personal', 'family')),
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    
    date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    recurrence TEXT DEFAULT 'one_time' CHECK (recurrence IN ('one_time', 'monthly', 'yearly', 'installment')),
    installment_current INT,
    installment_total INT,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON public.family_members(family_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_family ON public.accounts(family_id);
CREATE INDEX IF NOT EXISTS idx_accounts_shared ON public.accounts(is_shared);

CREATE INDEX IF NOT EXISTS idx_categories_family ON public.categories(family_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family ON public.transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_scope ON public.transactions(scope);
CREATE INDEX IF NOT EXISTS idx_transactions_nature ON public.transactions(nature);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ==============================================================================
-- 8. FUNÇÃO HELPER: Verificar se o usuário pertence à família
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_member_of_family(check_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.family_members 
    WHERE family_id = check_family_id 
      AND user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 9. TRIGGER: Criação Automática de Perfil quando Usuário se Cadastra no Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA ESTRITAS
-- ==============================================================================

-- A. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis para o próprio usuário e membros da mesma família"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() AND fm2.user_id = public.profiles.id
  )
);

CREATE POLICY "Usuário pode atualizar apenas seu próprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- B. FAMILIES
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver famílias às quais pertencem"
ON public.families FOR SELECT
TO authenticated
USING (public.is_member_of_family(id) OR created_by = auth.uid());

CREATE POLICY "Usuários autenticados podem criar famílias"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Donos/Admins podem atualizar a família"
ON public.families FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = public.families.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  )
);

-- C. FAMILY_MEMBERS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da família podem visualizar outros membros"
ON public.family_members FOR SELECT
TO authenticated
USING (public.is_member_of_family(family_id) OR user_id = auth.uid());

CREATE POLICY "Admins/Donos podem gerenciar membros da família"
ON public.family_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = public.family_members.family_id 
      AND fm.user_id = auth.uid() 
      AND fm.role IN ('owner', 'admin')
  )
  OR (user_id = auth.uid() AND role = 'owner')
);

-- D. CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizar categorias do sistema, da família ou próprias"
ON public.categories FOR SELECT
TO authenticated
USING (
  is_system = true
  OR user_id = auth.uid()
  OR (family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

CREATE POLICY "Criar categorias próprias ou para a família"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND family_id IS NULL)
  OR (family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

-- E. ACCOUNTS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contas pessoais apenas pelo dono; contas compartilhadas pela família"
ON public.accounts FOR SELECT
TO authenticated
USING (
  (is_shared = false AND user_id = auth.uid())
  OR (is_shared = true AND family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

CREATE POLICY "Criar ou editar contas"
ON public.accounts FOR ALL
TO authenticated
USING (
  (is_shared = false AND user_id = auth.uid())
  OR (is_shared = true AND family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

-- F. TRANSACTIONS
-- REGRAS:
-- 1. Gastos pessoais (scope = 'personal') pertencem EXCLUSIVAMENTE ao usuário.
-- 2. Gastos compartilhados (scope = 'family') são visíveis e editáveis por todos os membros da família.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizar transações (Pessoais ou da Família)"
ON public.transactions FOR SELECT
TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'family' AND family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

CREATE POLICY "Inserir transações (Pessoais ou da Família)"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND (
    (scope = 'personal')
    OR (scope = 'family' AND family_id IS NOT NULL AND public.is_member_of_family(family_id))
  )
);

CREATE POLICY "Atualizar transações"
ON public.transactions FOR UPDATE
TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'family' AND family_id IS NOT NULL AND public.is_member_of_family(family_id))
);

CREATE POLICY "Excluir transações"
ON public.transactions FOR DELETE
TO authenticated
USING (
  (scope = 'personal' AND user_id = auth.uid())
  OR (scope = 'family' AND family_id IS NOT NULL AND (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = public.transactions.family_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  ))
);

-- ==============================================================================
-- 11. INSERÇÃO DE CATEGORIAS PADRÃO (SEEDS)
-- ==============================================================================
INSERT INTO public.categories (name, type, nature, icon, color, is_system) VALUES
('Salário Principal', 'income', 'fixed', 'Briefcase', '#10b981', true),
('Freelance & Bicos', 'income', 'variable', 'Laptop', '#14b8a6', true),
('Investimentos & Dividendos', 'income', 'variable', 'TrendingUp', '#06b6d4', true),
('Moradia (Aluguel/Condomínio)', 'expense', 'fixed', 'Home', '#f59e0b', true),
('Contas (Luz, Água, Gás, Internet)', 'expense', 'fixed', 'Zap', '#f97316', true),
('Supermercado & Feira', 'expense', 'variable', 'ShoppingCart', '#10b981', true),
('Restaurantes & Delivery', 'expense', 'variable', 'Utensils', '#f43f5e', true),
('Transporte & Combustível', 'expense', 'variable', 'Car', '#3b82f6', true),
('Saúde & Farmácia', 'expense', 'variable', 'HeartPulse', '#ef4444', true),
('Lazer, Passeios & Viagens', 'expense', 'variable', 'Compass', '#8b5cf6', true),
('Assinaturas & Streaming', 'expense', 'fixed', 'Tv', '#6366f1', true),
('Reserva & Aportes', 'expense', 'fixed', 'PiggyBank', '#10b981', true),
('Outros Gastos', 'expense', 'variable', 'Layers', '#78716c', true)
ON CONFLICT DO NOTHING;
`;
}


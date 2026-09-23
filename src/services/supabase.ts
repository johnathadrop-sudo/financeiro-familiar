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

/**
 * Escuta eventos do Supabase Realtime (INSERT, UPDATE, DELETE) na tabela 'transactions'
 */
export function subscribeToTransactions(
  client: SupabaseClient,
  onChange: () => void
): () => void {
  const channel = client
    .channel('couple_transactions_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      () => {
        onChange();
      }
    )
    .subscribe((status) => {
      console.log('[Supabase Realtime] Status do canal:', status);
    });

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Gera um link de pareamento seguro para espelhar as configurações no celular do parceiro
 */
export function generatePairingUrl(url: string, key: string): string {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ u: url.trim(), k: key.trim() }))));
    return `${origin}${pathname}#sync=${payload}`;
  } catch (err) {
    console.error('Erro ao gerar pairing URL:', err);
    return window.location.href;
  }
}

/**
 * Lê credenciais de pareamento da URL se o parceiro tiver aberto um link de convite
 */
export function parsePairingUrl(): { url: string; key: string } | null {
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('sync=')) {
      const match = hash.match(/sync=([^&]+)/);
      if (match && match[1]) {
        const json = decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
        const data = JSON.parse(json);
        if (data.u && data.k) {
          return { url: data.u, key: data.k };
        }
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sbUrl = params.get('sb_url');
    const sbKey = params.get('sb_key');
    if (sbUrl && sbKey) {
      return { url: sbUrl, key: sbKey };
    }
  } catch (err) {
    console.warn('Erro ao decodificar link de pareamento:', err);
  }
  return null;
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
-- FINANCASAL: SCRIPT SQL PARA ESPELHAMENTO SIMULTÂNEO EM TEMPO REAL ENTRE DISPOSITIVOS
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- IMPORTANTE: Se você já criou a tabela antes com id UUID, remova-a para recriar com suporte direto:
-- DROP TABLE IF EXISTS public.transactions CASCADE;

-- 1. TABELA PRINCIPAL DE TRANSAÇÕES DO CASAL
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    nature TEXT NOT NULL DEFAULT 'variable' CHECK (nature IN ('fixed', 'variable')),
    category TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    paid_by TEXT NOT NULL DEFAULT 'shared' CHECK (paid_by IN ('shared', 'partner_1', 'partner_2')),
    beneficiary TEXT NOT NULL DEFAULT 'both' CHECK (beneficiary IN ('both', 'partner_1', 'partner_2')),
    notes TEXT,
    recurrence TEXT DEFAULT 'one_time',
    installment_current INT,
    installment_total INT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ÍNDICES DE ALTA PERFORMANCE PARA DISPOSITIVOS MÓVEIS
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_nature ON public.transactions(nature);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_by ON public.transactions(paid_by);

-- 3. HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICA PARA O CASAL (Permite sincronização segura entre os aparelhos via chave Anon do projeto)
DROP POLICY IF EXISTS "Acesso sincronizado para o casal" ON public.transactions;
CREATE POLICY "Acesso sincronizado para o casal"
ON public.transactions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. ATIVAÇÃO DO REALTIME (Crucial para espelhar instantaneamente entre dois celulares ou computador)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;
`;
}

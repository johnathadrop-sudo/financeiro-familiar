import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, CloudUpload, KeyRound, Globe, Terminal } from 'lucide-react';
import { testSupabaseConnection, getSupabaseSQLScript, batchSyncLocalToSupabase, getSupabaseClient } from '../services/supabase';
import { CoupleSettings, Transaction } from '../types/finance';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CoupleSettings;
  onSaveSettings: (settings: CoupleSettings) => void;
  transactions: Transaction[];
  onTransactionsSynced?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  transactions,
  onTransactionsSynced,
}) => {
  const [url, setUrl] = useState(settings.supabaseUrl || '');
  const [anonKey, setAnonKey] = useState(settings.supabaseAnonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const sqlScript = getSupabaseSQLScript();

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Preencha a URL e a Anon Key do Supabase para testar.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    const isConfigured = Boolean(url.trim() && anonKey.trim());
    onSaveSettings({
      ...settings,
      supabaseUrl: url.trim(),
      supabaseAnonKey: anonKey.trim(),
      useSupabase: isConfigured,
    });
    onClose();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setSyncResult('Configure primeiro a URL e a Anon Key do Supabase.');
      return;
    }

    const client = getSupabaseClient(url.trim(), anonKey.trim());
    if (!client) {
      setSyncResult('Não foi possível inicializar o cliente Supabase.');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const count = await batchSyncLocalToSupabase(client, transactions);
      setSyncResult(`Sucesso! ${count} lançamentos foram sincronizados para o Supabase.`);
      onSaveSettings({
        ...settings,
        supabaseUrl: url.trim(),
        supabaseAnonKey: anonKey.trim(),
        useSupabase: true,
      });
      if (onTransactionsSynced) onTransactionsSynced();
    } catch (err: any) {
      setSyncResult(`Erro ao sincronizar: ${err.message || 'Verifique se a tabela "transactions" foi criada com o SQL abaixo.'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Integração Supabase & Vercel
              </h3>
              <p className="text-xs text-neutral-500">
                Conecte seu banco de dados na nuvem para você e sua esposa acessarem de qualquer celular ou computador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          
          {/* Credentials Inputs */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
            <h4 className="font-bold text-neutral-900 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Credenciais do seu Projeto Supabase</span>
            </h4>
            <p className="text-neutral-500">
              Crie um projeto gratuito em{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold underline underline-offset-2"
              >
                supabase.com
              </a>{' '}
              e pegue as chaves em <em>Project Settings → API</em>.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Project URL (URL do Projeto)
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://xyzabcdefg.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Anon / Public Key (Chave Pública Anon)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testing ? 'Testando conexão...' : 'Testar Conexão'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* SQL Setup Instruction */}
          <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Criação da Tabela no Supabase (Script SQL)</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              >
                {copiedSQL ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-neutral-500">
              Copie o código abaixo e cole no menu <strong>SQL Editor</strong> do seu painel Supabase. Ele cria a tabela <code className="font-mono bg-neutral-200 px-1 py-0.5 rounded text-[11px]">transactions</code> e as permissões de acesso.
            </p>

            <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-36 leading-relaxed">
              {sqlScript}
            </pre>
          </div>

          {/* Local data upload */}
          <div className="space-y-2 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2">
              <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
              <span>3. Sincronizar Dados Atuais para o Supabase</span>
            </h4>
            <p className="text-neutral-600">
              Gostaria de enviar todos os lançamentos cadastrados nesta sessão para a sua tabela no Supabase?
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={syncing}
                className="px-3.5 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{syncing ? 'Enviando...' : `Sincronizar ${transactions.length} Lançamentos`}</span>
              </button>
            </div>
            {syncResult && (
              <p className="text-xs font-semibold text-emerald-800 pt-1">{syncResult}</p>
            )}
          </div>

          {/* Vercel Deployment Instructions */}
          <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
            <h4 className="font-bold text-neutral-900">
              4. Como Publicar no Vercel
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-neutral-600">
              <li>Suba seu repositório no GitHub ou importe diretamente no Vercel.</li>
              <li>Nas configurações do projeto no Vercel (<strong>Environment Variables</strong>), adicione:</li>
            </ol>
            <div className="bg-neutral-900 text-neutral-200 p-2.5 rounded-lg font-mono text-[11px] space-y-1">
              <div>VITE_SUPABASE_URL = {url || 'https://seu-projeto.supabase.co'}</div>
              <div>VITE_SUPABASE_ANON_KEY = {anonKey ? '••••••••••••••••••••' : 'sua-chave-anon'}</div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Pronto! Ao dar deploy no Vercel, o app conectará automaticamente ao Supabase e funcionará em qualquer dispositivo do casal.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-2.5 shrink-0 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Salvar Configurações
          </button>
        </div>

      </div>
    </div>
  );
};

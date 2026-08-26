import React, { useState } from 'react';
import { rpcPlayground } from '../services/connectRpc';
import { RpcCallRecord } from '../types';
import { 
  Server, Cpu, Layers, CheckCircle2, XCircle, ArrowRight, 
  Terminal, ShieldCheck, Zap, RefreshCw, Code, BookOpen, Clock, Activity, HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../services/audio';

export const GrpcLearningHub: React.FC = () => {
  const { user } = useAuth();
  
  // Playground State
  const [selectedService, setSelectedService] = useState<'UserService' | 'PokedexService'>('PokedexService');
  const [selectedMethod, setSelectedMethod] = useState<string>('GetCard');
  const [useBinaryFormat, setUseBinaryFormat] = useState<boolean>(true);
  const [requestPayloadText, setRequestPayloadText] = useState<string>('{\n  "cardId": "tcg-026"\n}');
  const [executing, setExecuting] = useState<boolean>(false);
  const [lastRecord, setLastRecord] = useState<RpcCallRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'tutorial' | 'playground' | 'proto' | 'comparison'>('tutorial');

  const methodOptions: Record<string, { methods: string[]; defaultParams: Record<string, string> }> = {
    UserService: {
      methods: ['GetUser', 'UpdateFavorites'],
      defaultParams: {
        GetUser: '{\n  "userId": "usr_78912"\n}',
        UpdateFavorites: '{\n  "userId": "usr_78912",\n  "favoriteCardIds": ["tcg-001", "tcg-026"]\n}'
      }
    },
    PokedexService: {
      methods: ['GetCard', 'ListCards', 'ListDecks', 'SyncCollection'],
      defaultParams: {
        GetCard: '{\n  "cardId": "tcg-026"\n}',
        ListCards: '{\n  "query": "Charizard",\n  "pageSize": 5,\n  "page": 1\n}',
        ListDecks: '{}',
        SyncCollection: '{\n  "userId": "usr_78912",\n  "cardQuantities": {\n    "tcg-001": 2,\n    "tcg-026": 1\n  }\n}'
      }
    }
  };

  const handleServiceChange = (service: 'UserService' | 'PokedexService') => {
    soundEffects.playClick();
    setSelectedService(service);
    const firstMethod = methodOptions[service].methods[0];
    setSelectedMethod(firstMethod);
    setRequestPayloadText(methodOptions[service].defaultParams[firstMethod]);
  };

  const handleMethodChange = (method: string) => {
    soundEffects.playClick();
    setSelectedMethod(method);
    setRequestPayloadText(methodOptions[selectedService].defaultParams[method] || '{}');
  };

  const handleExecuteCall = async () => {
    soundEffects.playClick();
    setExecuting(true);
    try {
      let params = {};
      try {
        params = JSON.parse(requestPayloadText);
      } catch (err) {
        // Fallback for empty
      }

      const format = useBinaryFormat ? 'Protobuf (Binary)' : 'JSON (Connect)';
      const record = await rpcPlayground.executeRpcCall(
        selectedService,
        selectedMethod,
        params,
        format,
        user?.token
      );
      setLastRecord(record);
      soundEffects.playScan();
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Sub-Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <button
          onClick={() => { soundEffects.playClick(); setActiveTab('tutorial'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeTab === 'tutorial'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-yellow-300" />
          <span>Guia Completo & Arquitetura</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveTab('playground'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeTab === 'playground'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4 text-yellow-300" />
          <span>Playground Interativo RPC</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveTab('comparison'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeTab === 'comparison'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-yellow-300" />
          <span>Matriz: gRPC vs REST vs GraphQL</span>
        </button>

        <button
          onClick={() => { soundEffects.playClick(); setActiveTab('proto'); }}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all border flex items-center space-x-2 ${
            activeTab === 'proto'
              ? 'bg-pokedex-red text-white font-bold border-yellow-400/80 shadow-md'
              : 'bg-pokedex-card/90 text-slate-300 border-slate-800'
          }`}
        >
          <Code className="w-4 h-4 text-yellow-300" />
          <span>Contratos .proto & Buf</span>
        </button>
      </div>

      {/* TAB 1: TUTORIAL & ARQUITETURA */}
      {activeTab === 'tutorial' && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="bg-pokedex-card/95 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Server className="w-4 h-4" />
              <span>Modern RPC Architecture // Google Cloud & Firebase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              Dominando gRPC & Connect RPC na Web Moderna
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              O <strong>gRPC</strong> é um framework RPC de altíssimo desempenho criado pelo Google. No entanto, sua adoção direta em navegadores tradicionais sempre enfrentou o obstáculo dos frames HTTP/2. Descubra como a evolução para o <strong>Connect RPC (Buf)</strong> resolveu isso para aplicações Serverless no Firebase sem necessidade de proxies intermediários.
            </p>
          </div>

          {/* 4 Pillars of Knowledge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Pillar 1: O Que é gRPC? */}
            <div className="bg-pokedex-card/90 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-yellow-300 font-mono font-bold">
                <Cpu className="w-4 h-4" />
                <span>1. O Que é gRPC e Protocol Buffers?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ao contrário de APIs REST convencionais que trocam textos JSON verbosos via URLs dinâmicas, o gRPC define <strong>contratos estritos agnósticos</strong> através de arquivos <code className="bg-slate-800 text-yellow-300 px-1 rounded font-mono">.proto</code> (Protocol Buffers v3).
              </p>
              <ul className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Serialização binária ultracompacta (economiza até 70% de banda)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Tipagem de ponta a ponta gerada automaticamente para TypeScript</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Multiplexação nativa sobre uma única conexão TCP</li>
              </ul>
            </div>

            {/* Pillar 2: O Desafio dos Browsers */}
            <div className="bg-pokedex-card/90 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-pokedex-lightred font-mono font-bold">
                <XCircle className="w-4 h-4" />
                <span>2. O Obstáculo Histórico: Browsers vs gRPC Nativo</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Os navegadores modernos não expõem através da Fetch API ou XMLHttpRequest controle granular sobre frames HTTP/2 binários puros e <strong>HTTP Trailers</strong> (utilizados pelo gRPC para retornar status codes de término de chamada).
              </p>
              <div className="bg-red-950/30 p-3 rounded-2xl border border-red-900/40 text-[11px] text-red-200 font-mono">
                <strong>O Problema do Envoy:</strong> Tradicionalmente, era obrigatório subir e pagar servidores dedicados (ex: Envoy Proxy) apenas para traduzir requisições de navegadores para o backend.
              </div>
            </div>

            {/* Pillar 3: A Solução Connect RPC */}
            <div className="bg-pokedex-card/90 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold">
                <Zap className="w-4 h-4" />
                <span>3. A Revolução: Connect RPC (Sem Proxies!)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                O <strong>Connect RPC</strong> (desenvolvido pela Buf) é um protocolo RPC moderno 100% interoperável com gRPC e gRPC-Web. Ele funciona diretamente via requisições <strong>HTTP POST padrão (HTTP/1.1 e HTTP/2)</strong> tanto com Protobuf binário quanto com JSON tipado.
              </p>
              <div className="bg-cyan-950/30 p-3 rounded-2xl border border-cyan-900/40 text-[11px] text-cyan-200 font-mono">
                ✨ <strong>Zero Servidores Proxy:</strong> Funciona nativamente direto no Firebase Cloud Functions (2nd Gen) e Cloud Run com autoscaling a zero!
              </div>
            </div>

            {/* Pillar 4: Autenticação via Interceptors */}
            <div className="bg-pokedex-card/90 rounded-3xl p-5 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-emerald-300 font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>4. Autenticação & Segurança com Firebase</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                No Connect RPC, a passagem de tokens JWT do Firebase Authentication ocorre através de <strong>Interceptors</strong> de cliente, injetando o cabeçalho <code className="bg-slate-800 text-yellow-300 px-1 rounded font-mono">Authorization: Bearer &lt;token&gt;</code> em todas as chamadas. No backend, a validação é feita com <code className="bg-slate-800 text-yellow-300 px-1 rounded font-mono">firebase-admin/auth</code>.
              </p>
            </div>
          </div>

          {/* Topology Diagram Box */}
          <div className="bg-pokedex-darker rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Diagrama da Topologia Serverless (Connect RPC + Firebase)</span>
            </h3>

            <div className="p-4 bg-black/60 rounded-2xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
              <pre className="text-cyan-400">{`[ CAMADA DE APRESENTAÇÃO (Frontend) ]
  • React SPA (Vite / TypeScript)
  • Hospedagem: Firebase Hosting (Edge CDN Global)
  • Cliente: @connectrpc/connect-web
         │
         │  Requisições HTTP POST (Connect Protocol)
         │  Payloads Binários Protobuf ou JSON Tipado
         ▼
[ CAMADA SERVERLESS (Backend) ]
  • Firebase Cloud Functions (2nd Gen) sobre Cloud Run
  • Middleware: @connectrpc/connect-express
  • Validação: Firebase Auth Bearer Tokens
         │
         │  SDK Nativo Google Cloud Firestore (Admin SDK)
         ▼
[ CAMADA DE PERSISTÊNCIA (Database) ]
  • Cloud Firestore (Coleções: cards, decks, users)
  • Transações ACID & Escalabilidade Global`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAYGROUND INTERATIVO RPC */}
      {activeTab === 'playground' && (
        <div className="space-y-5">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-sans text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-yellow-300" />
                <span>Playground Interativo Connect-RPC</span>
              </h2>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Endpoint Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Execute chamadas RPC reais e simuladas, alterne entre Protobuf binário e JSON, e visualize a redução real de payload e cabeçalhos de rede.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Request Builder */}
            <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-4 text-xs font-mono shadow-md">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Configuração da Requisição RPC</span>
                <span className="text-yellow-300 font-normal">POST /api/{selectedService}/{selectedMethod}</span>
              </h3>

              {/* Service & Method Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Serviço Proto:</label>
                  <select
                    value={selectedService}
                    onChange={(e) => handleServiceChange(e.target.value as any)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-pokedex-blue text-xs"
                  >
                    <option value="PokedexService">pokedex.v1.PokedexService</option>
                    <option value="UserService">user.v1.UserService</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Método RPC:</label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-pokedex-blue text-xs"
                  >
                    {methodOptions[selectedService].methods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format Toggle: Protobuf vs JSON */}
              <div className="p-3 bg-pokedex-darker rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Formato de Transporte:</span>
                  <span className="text-[10px] text-slate-400">
                    {useBinaryFormat ? 'application/proto (Serialização Binária)' : 'application/json (Connect JSON)'}
                  </span>
                </div>
                <button
                  onClick={() => { soundEffects.playClick(); setUseBinaryFormat(!useBinaryFormat); }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    useBinaryFormat 
                      ? 'bg-pokedex-blue text-white shadow-md' 
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {useBinaryFormat ? 'Protobuf Binário' : 'JSON Textual'}
                </button>
              </div>

              {/* Request Payload JSON editor */}
              <div className="space-y-1.5">
                <label className="text-slate-400 block text-[10px] uppercase">Payload da Mensagem (JSON Input):</label>
                <textarea
                  value={requestPayloadText}
                  onChange={(e) => setRequestPayloadText(e.target.value)}
                  rows={4}
                  className="w-full bg-black/60 font-mono text-cyan-300 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-pokedex-blue text-xs"
                />
              </div>

              {/* Submit Trigger */}
              <button
                onClick={handleExecuteCall}
                disabled={executing}
                className="w-full bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
              >
                {executing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                ) : (
                  <Zap className="w-4 h-4 text-yellow-300" />
                )}
                <span>{executing ? 'Executando gRPC Call...' : 'Disparar Chamada Connect RPC'}</span>
              </button>
            </div>

            {/* Right Column: Response & Wire Inspector */}
            <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-4 text-xs font-mono shadow-md flex flex-col justify-between">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Inspetor de Resposta & Métricas</span>
                {lastRecord && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {lastRecord.durationMs}ms
                  </span>
                )}
              </h3>

              {lastRecord ? (
                <div className="space-y-3">
                  {/* Wire Size Savings Metric */}
                  <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-800/60 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase block font-bold">Economia de Banda</span>
                      <span className="text-base font-black text-emerald-400">-{lastRecord.savingsPercentage}% de Payload</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-300">
                      <div>Protobuf: <strong className="text-white">{lastRecord.payloadSizeBytes} bytes</strong></div>
                      <div>JSON: <strong className="text-slate-400">{lastRecord.jsonEquivalentBytes} bytes</strong></div>
                    </div>
                  </div>

                  {/* Headers Inspector */}
                  <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cabeçalhos HTTP / Connect:</span>
                    {Object.entries(lastRecord.headers).map(([k, v]) => (
                      <div key={k} className="text-[10px] text-slate-300 flex justify-between">
                        <span className="text-cyan-400">{k}:</span>
                        <span className="text-slate-400 truncate max-w-[200px]">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Response Body JSON */}
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payload de Retorno Deserializado:</span>
                    <pre className="p-3 bg-black/70 rounded-2xl border border-slate-800 text-emerald-300 overflow-x-auto text-[11px] max-h-48">
                      {JSON.stringify(lastRecord.responseData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="my-auto py-12 text-center text-slate-500">
                  <Terminal className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Selecione um método e clique em "Disparar Chamada" para inspecionar os bytes e tempo de resposta.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATRIZ DE COMPARAÇÃO */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-yellow-300" />
              <span>Matriz Comparativa: Connect RPC vs REST vs GraphQL</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Avaliação técnica dos trade-offs, vantagens e preocupações ao escolher o protocolo para o frontend.
            </p>
          </div>

          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-pokedex-darker text-slate-300 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Dimensão Técnica</th>
                    <th className="p-4 text-amber-400">REST Tradicional (JSON)</th>
                    <th className="p-4 text-cyan-400">Connect RPC / Protobuf</th>
                    <th className="p-4 text-purple-400">GraphQL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px] text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white font-sans">Segurança de Tipos (Type-Safety)</td>
                    <td className="p-4 text-slate-400">Manual / OpenAPI (propenso a drift)</td>
                    <td className="p-4 text-emerald-400 font-bold">100% Estrita em tempo de compilação via .proto</td>
                    <td className="p-4 text-purple-300">Boa via GraphQL Code Generator</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white font-sans">Tamanho do Payload</td>
                    <td className="p-4 text-slate-400">JSON textual com nomes de campos repetidos</td>
                    <td className="p-4 text-emerald-400 font-bold">Binário compacto (até 70% menor)</td>
                    <td className="p-4 text-slate-400">JSON textual com campos sob medida</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white font-sans">Complexidade de Infraestrutura</td>
                    <td className="p-4 text-emerald-400">Simples (qualquer servidor web)</td>
                    <td className="p-4 text-emerald-400 font-bold">Zero Proxy (Cloud Functions 2nd Gen)</td>
                    <td className="p-4 text-amber-400">Gateway dedicado / Parser pesado</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white font-sans">Suporte a Streaming</td>
                    <td className="p-4 text-slate-400">SSE / WebSockets separados</td>
                    <td className="p-4 text-emerald-400 font-bold">Nativo Server-Streaming e Bidi RPC</td>
                    <td className="p-4 text-slate-400">Subscriptions via WebSockets</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-white font-sans">Curva de Aprendizado</td>
                    <td className="p-4 text-emerald-400">Baixa (Padrão de mercado)</td>
                    <td className="p-4 text-yellow-300">Média (Aprender sintaxe .proto e Buf)</td>
                    <td className="p-4 text-amber-400">Média-Alta (N+1 queries, schemas)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTRATOS .PROTO */}
      {activeTab === 'proto' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-pokedex-card/95 rounded-3xl p-5 border border-slate-800">
            <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-cyan-400" />
              <span>Contratos de Interface Protobuf v3</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Os arquivos .proto servem como fonte única da verdade (Single Source of Truth) para o backend e frontend.
            </p>
          </div>

          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between text-yellow-300 font-bold">
              <span>proto/pokedex/v1/pokedex.proto</span>
              <span className="text-[10px] text-slate-400">Buf Syntax v3</span>
            </div>
            <pre className="p-4 bg-black/70 rounded-2xl border border-slate-800 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed">
{`syntax = "proto3";

package pokedex.v1;

message Card {
  string id = 1;
  string name_pt = 2;
  string name_en = 3;
  string set_code = 4;
  string card_number = 6;
  int32 quantity = 7;
  string rarity = 8;
  string color = 9;
  bool is_foil = 10;
  string image_url = 11;
}

service PokedexService {
  rpc ListCards (ListCardsRequest) returns (ListCardsResponse);
  rpc GetCard (GetCardRequest) returns (Card);
  rpc ListDecks (ListDecksRequest) returns (ListDecksResponse);
  rpc SyncCollection (SyncCollectionRequest) returns (SyncCollectionResponse);
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

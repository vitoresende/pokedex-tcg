import React, { useState } from 'react';
import { 
  Server, Zap, Shield, CheckCircle2, XCircle, Code, 
  Terminal, ArrowRight, Play, RefreshCw, FileCode, Check 
} from 'lucide-react';
import { soundEffects } from '../services/audio';
import { rpcPlayground } from '../services/connectRpc';
import { RpcCallRecord } from '../types';

export const GrpcLearningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'playground' | 'proto' | 'comparison'>('tutorial');
  
  // Interactive RPC Playground State
  const [selectedService, setSelectedService] = useState<'PokedexService' | 'UserService'>('PokedexService');
  const [selectedMethod, setSelectedMethod] = useState<string>('ListCards');
  const [payloadFormat, setPayloadFormat] = useState<'Protobuf (Binary)' | 'JSON (Connect)'>('Protobuf (Binary)');
  const [requestQuery, setRequestQuery] = useState<string>('Charizard');
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRecord, setLastRecord] = useState<RpcCallRecord | null>(null);
  const [history, setHistory] = useState<RpcCallRecord[]>([]);

  const handleSelectTab = (tab: 'tutorial' | 'playground' | 'proto' | 'comparison') => {
    soundEffects.playClick();
    setActiveTab(tab);
  };

  const handleExecuteCall = async () => {
    soundEffects.playScan();
    setLoading(true);

    const params: any = {};
    if (selectedService === 'PokedexService') {
      if (selectedMethod === 'ListCards') {
        params.query = requestQuery;
        params.pageSize = Number(pageSize) || 10;
        params.page = 1;
      } else if (selectedMethod === 'GetCard') {
        params.cardId = 'tcg-026';
      } else if (selectedMethod === 'ListDecks') {
        params.format = 'expanded';
      }
    } else {
      if (selectedMethod === 'GetUser') {
        params.userId = 'usr_ash_ketchum_001';
      } else if (selectedMethod === 'UpdateFavorites') {
        params.favoriteCardIds = ['tcg-001', 'tcg-054', 'tcg-108'];
      }
    }

    try {
      const result = await rpcPlayground.executeRpcCall(
        selectedService,
        selectedMethod,
        params,
        payloadFormat
      );
      setLastRecord(result);
      setHistory(rpcPlayground.getHistory());
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-black font-display text-white">
            gRPC & Connect-RPC Masterclass
          </h2>
          <span className="bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-800/60">
            HTTP/2 & HTTP/3 + Protobuf
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Complete guide, architectural deep-dive, Protocol Buffers schema viewer, and interactive live RPC playground
        </p>
      </div>

      {/* Nav Switcher */}
      <div className="flex bg-pokedex-card/90 p-1.5 rounded-2xl border border-slate-800 space-x-1 text-xs font-mono overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSelectTab('tutorial')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'tutorial'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Concept & Architecture
        </button>
        <button
          onClick={() => handleSelectTab('comparison')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'comparison'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Comparison Matrix
        </button>
        <button
          onClick={() => handleSelectTab('proto')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'proto'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Protobuf Contracts (.proto)
        </button>
        <button
          onClick={() => handleSelectTab('playground')}
          className={`flex-1 py-2 px-3 rounded-xl whitespace-nowrap transition-all font-bold ${
            activeTab === 'playground'
              ? 'bg-pokedex-red text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Live RPC Playground
        </button>
      </div>

      {/* TAB 1: TUTORIAL & ARCHITECTURE */}
      {activeTab === 'tutorial' && (
        <div className="space-y-6">
          {/* Executive Overview */}
          <div className="bg-pokedex-card/95 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span>What is gRPC & Why Does Connect-RPC Solve Browser Limitations?</span>
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              <strong>gRPC (Google Remote Procedure Call)</strong> is an open-source high-performance RPC framework created by Google. Instead of transferring verbose human-readable JSON over standard HTTP/1.1 REST endpoints, gRPC serializes data into compact binary payloads using <strong>Protocol Buffers (Protobuf)</strong> and multiplexes streams over <strong>HTTP/2</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-yellow-300 font-mono block">1. Ultra-Compact Wire Size</span>
                <p className="text-[11px] text-slate-300 font-sans">
                  Protobuf encodes keys as integer tags (varints) rather than repeating long JSON string property keys, achieving <strong>60% to 75% smaller payloads</strong> on the wire.
                </p>
              </div>

              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-cyan-300 font-mono block">2. Strict Type Safety</span>
                <p className="text-[11px] text-slate-300 font-sans">
                  The <code className="text-yellow-300">.proto</code> schema is the single source of truth. TypeScript, Go, Java, and Python clients are automatically generated at compile time.
                </p>
              </div>

              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-emerald-300 font-mono block">3. Connect-RPC in Browsers</span>
                <p className="text-[11px] text-slate-300 font-sans">
                  Standard gRPC requires raw HTTP/2 framing and trailers which standard web browsers cannot send without an Envoy proxy. <strong>Connect-RPC</strong> works natively with standard HTTP POST requests with zero proxy dependencies.
                </p>
              </div>
            </div>
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Advantages */}
            <div className="bg-pokedex-card/90 rounded-3xl border border-emerald-900/40 p-5 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                <CheckCircle2 className="w-5 h-5" />
                <span>Key Advantages of gRPC / Connect-RPC</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Blazing Serialization Speed:</strong> Protobuf encodes and decodes in native binary at up to 6x the speed of <code>JSON.parse()</code> and <code>JSON.stringify()</code>.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Zero Schema Drift:</strong> Breaking schema changes fail instantly at compile time rather than crashing in production runtime.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Full Streaming Support:</strong> Native support for Server Streaming, Client Streaming, and Bidirectional Streaming.</span>
                </li>
              </ul>
            </div>

            {/* Disadvantages / Concerns */}
            <div className="bg-pokedex-card/90 rounded-3xl border border-red-900/40 p-5 space-y-3 shadow-md">
              <div className="flex items-center space-x-2 text-red-400 font-bold font-mono text-sm uppercase">
                <XCircle className="w-5 h-5" />
                <span>Trade-offs & Considerations</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                  <span><strong>Non-Human Readable Wire Payloads:</strong> Inspecting raw binary Protobuf streams in browser DevTools requires decoding tooling.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                  <span><strong>Build Toolchain Setup:</strong> Requires Protobuf compilers (like <code>buf</code> or <code>protoc</code>) integrated into your CI/CD pipeline.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                  <span><strong>Public API Adoption:</strong> Third-party external developers still largely prefer standard REST/OpenAPI documentation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARISON MATRIX */}
      {activeTab === 'comparison' && (
        <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg overflow-x-auto space-y-4">
          <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
            Architecture Comparison: REST vs gRPC (Connect) vs GraphQL
          </h3>

          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-pokedex-darker text-yellow-300">
                <th className="p-3">Feature</th>
                <th className="p-3 text-red-400">REST (JSON / OpenAPI)</th>
                <th className="p-3 text-cyan-300 bg-cyan-950/40 border-l border-r border-cyan-800/50">gRPC & Connect-RPC</th>
                <th className="p-3 text-purple-400">GraphQL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-bold text-white">Serialization Format</td>
                <td className="p-3 text-red-300">Text / JSON (Heavy)</td>
                <td className="p-3 text-cyan-300 bg-cyan-950/20 border-l border-r border-cyan-800/30 font-bold">Binary Protobuf / JSON</td>
                <td className="p-3 text-purple-300">Text / JSON</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Transport Protocol</td>
                <td className="p-3">HTTP/1.1 or HTTP/2</td>
                <td className="p-3 text-cyan-300 bg-cyan-950/20 border-l border-r border-cyan-800/30 font-bold">HTTP/2 & HTTP/3</td>
                <td className="p-3">HTTP/1.1 or HTTP/2</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Type Safety & Contract</td>
                <td className="p-3">Optional (OpenAPI/Swagger)</td>
                <td className="p-3 text-cyan-300 bg-cyan-950/20 border-l border-r border-cyan-800/30 font-bold">Strict Strict (.proto contract)</td>
                <td className="p-3">Strict (GraphQL Schema)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Wire Bandwidth</td>
                <td className="p-3 text-red-400">High (repeats keys)</td>
                <td className="p-3 text-emerald-400 bg-cyan-950/20 border-l border-r border-cyan-800/30 font-bold">Minimal (-70% smaller)</td>
                <td className="p-3 text-yellow-400">Moderate</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Client Code Generation</td>
                <td className="p-3">Third-party tooling</td>
                <td className="p-3 text-cyan-300 bg-cyan-950/20 border-l border-r border-cyan-800/30 font-bold">Native First-Class (Buf/Protoc)</td>
                <td className="p-3">Codegen plugins</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PROTOBUF CONTRACTS */}
      {activeTab === 'proto' && (
        <div className="space-y-4">
          <div className="bg-pokedex-card/90 rounded-3xl border border-slate-800 p-5 shadow-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-yellow-300 font-bold flex items-center gap-2">
                <FileCode className="w-4 h-4" /> proto/pokedex/v1/pokedex.proto
              </span>
              <span className="text-slate-500 text-[10px]">Buf Toolchain Ready</span>
            </div>

            <pre className="bg-black/80 text-emerald-400 p-4 rounded-2xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
{`syntax = "proto3";

package pokedex.v1;

service PokedexService {
  rpc GetCard(GetCardRequest) returns (GetCardResponse);
  rpc ListCards(ListCardsRequest) returns (ListCardsResponse);
  rpc ListDecks(ListDecksRequest) returns (ListDecksResponse);
  rpc SyncCollection(SyncCollectionRequest) returns (SyncCollectionResponse);
}

message GetCardRequest {
  string card_id = 1;
}

message GetCardResponse {
  string id = 1;
  string name_pt = 2;
  string name_en = 3;
  string set_code = 4;
  string card_number = 5;
  int32 quantity = 6;
  string rarity = 7;
  string color = 8;
  bool is_foil = 9;
  string image_url = 10;
  repeated string deck_ids = 11;
}

message ListCardsRequest {
  string query = 1;
  string set_code = 2;
  string type = 3;
  int32 page = 4;
  int32 page_size = 5;
}

message ListCardsResponse {
  repeated GetCardResponse cards = 1;
  int32 total_count = 2;
  int32 page = 3;
  int32 total_pages = 4;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE RPC PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="bg-pokedex-card/95 rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <span>Interactive Connect-RPC Execution Engine</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block text-[10px] uppercase mb-1">Target Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    soundEffects.playClick();
                    setSelectedService(e.target.value as any);
                    setSelectedMethod(e.target.value === 'PokedexService' ? 'ListCards' : 'GetUser');
                  }}
                  className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue"
                >
                  <option value="PokedexService">pokedex.v1.PokedexService</option>
                  <option value="UserService">user.v1.UserService</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] uppercase mb-1">RPC Method</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => {
                    soundEffects.playClick();
                    setSelectedMethod(e.target.value);
                  }}
                  className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue"
                >
                  {selectedService === 'PokedexService' ? (
                    <>
                      <option value="ListCards">ListCards(query, pageSize)</option>
                      <option value="GetCard">GetCard(cardId)</option>
                      <option value="ListDecks">ListDecks()</option>
                    </>
                  ) : (
                    <>
                      <option value="GetUser">GetUser(userId)</option>
                      <option value="UpdateFavorites">UpdateFavorites(cardIds)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] uppercase mb-1">Wire Serialization</label>
                <select
                  value={payloadFormat}
                  onChange={(e) => {
                    soundEffects.playClick();
                    setPayloadFormat(e.target.value as any);
                  }}
                  className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-yellow-300 font-bold focus:outline-none focus:border-pokedex-blue"
                >
                  <option value="Protobuf (Binary)">application/proto (Binary Protobuf)</option>
                  <option value="JSON (Connect)">application/json (Connect JSON)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Inputs */}
            {selectedMethod === 'ListCards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Search Query Parameter</label>
                  <input
                    type="text"
                    value={requestQuery}
                    onChange={(e) => setRequestQuery(e.target.value)}
                    placeholder="Ex: Charizard, Darkrai, Mewtwo..."
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Page Size</label>
                  <input
                    type="number"
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExecuteCall}
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Execute Connect-RPC Call</span>
            </button>
          </div>

          {/* Telemetry Result & Savings Monitor */}
          {lastRecord && (
            <div className="bg-pokedex-card/95 rounded-3xl border border-cyan-800/60 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> RPC Call Succeeded ({lastRecord.durationMs}ms)
                </span>
                <span className="text-[10px] font-mono text-slate-400">{lastRecord.timestamp}</span>
              </div>

              {/* Wire Comparison KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Protobuf Wire Size</span>
                  <span className="text-lg font-black text-cyan-300">{lastRecord.payloadSizeBytes} bytes</span>
                </div>

                <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">JSON Equivalent Size</span>
                  <span className="text-lg font-black text-slate-300">{lastRecord.jsonEquivalentBytes} bytes</span>
                </div>

                <div className="bg-pokedex-darker p-3 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Bandwidth Reduction</span>
                  <span className="text-lg font-black text-emerald-400">-{lastRecord.savingsPercentage}%</span>
                </div>
              </div>

              {/* Response Inspector */}
              <div className="space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Response Body:</span>
                <pre className="bg-black/90 text-cyan-300 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {JSON.stringify(lastRecord.responseData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

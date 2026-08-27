import React, { useState } from 'react';
import { Plus, X, Upload, Sparkles, Check } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { soundEffects } from '../services/audio';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { addNewCard, importCardsFromCsv } = useCollection();
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');

  // Manual Form State
  const [nameEn, setNameEn] = useState('');
  const [namePt, setNamePt] = useState('');
  const [setCode, setSetCode] = useState('SV1');
  const [setEn, setSetEn] = useState('Scarlet & Violet');
  const [cardNumber, setCardNumber] = useState('');
  const [totalInSet, setTotalInSet] = useState('198');
  const [colorCode, setColorCode] = useState('R');
  const [rarityCode, setRarityCode] = useState('C');
  const [quantity, setQuantity] = useState(1);
  const [quality, setQuality] = useState('NM');
  const [isFoil, setIsFoil] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [comment, setComment] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !namePt.trim()) return;

    soundEffects.playScan();
    addNewCard({
      name_en: nameEn.trim() || namePt.trim(),
      name_pt: namePt.trim() || nameEn.trim(),
      set_code: setCode.trim().toUpperCase(),
      set_en: setEn.trim(),
      set_pt: setEn.trim(),
      card_number: cardNumber.trim() || '1',
      total_in_set: totalInSet.trim() || '100',
      color_code: colorCode,
      rarity_code: rarityCode,
      quantity: Number(quantity) || 1,
      quality,
      is_foil: isFoil,
      image_url: imageUrl.trim() || `https://images.pokemontcg.io/${setCode.toLowerCase()}/${cardNumber.replace(/\D/g, '') || '1'}.png`,
      comment: comment.trim()
    });

    onClose();
  };

  const handleCsvImport = () => {
    if (!csvText.trim()) return;
    const res = importCardsFromCsv(csvText);
    setImportResult(res);
    setTimeout(() => {
      setImportResult(null);
      onClose();
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Top Header */}
        <div className="bg-pokedex-red px-6 py-3 border-b-2 border-pokedex-darkred flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-yellow-300" />
            <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Add Cards to Collection
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-pokedex-darkred hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-pokedex-darker text-xs font-mono">
          <button
            onClick={() => { soundEffects.playClick(); setTab('manual'); }}
            className={`flex-1 py-3 font-bold transition-colors ${
              tab === 'manual' ? 'bg-slate-800 text-yellow-300 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Form
          </button>
          <button
            onClick={() => { soundEffects.playClick(); setTab('csv'); }}
            className={`flex-1 py-3 font-bold transition-colors ${
              tab === 'csv' ? 'bg-slate-800 text-yellow-300 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Batch CSV Import
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {tab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Card Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Ex: Charizard ex"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Card Name (Portuguese / Alias)</label>
                  <input
                    type="text"
                    value={namePt}
                    onChange={(e) => setNamePt(e.target.value)}
                    placeholder="Ex: Charizard ex"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Set Code *</label>
                  <input
                    type="text"
                    required
                    value={setCode}
                    onChange={(e) => setSetCode(e.target.value)}
                    placeholder="Ex: SVI, PAF, OBF"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Card # *</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Ex: 054 or 125"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Total in Set</label>
                  <input
                    type="text"
                    value={totalInSet}
                    onChange={(e) => setTotalInSet(e.target.value)}
                    placeholder="Ex: 198"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Type / Category</label>
                  <select
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  >
                    <option value="R">Fire</option>
                    <option value="W">Water</option>
                    <option value="G">Grass</option>
                    <option value="L">Lightning</option>
                    <option value="P">Psychic</option>
                    <option value="F">Fighting</option>
                    <option value="D">Darkness</option>
                    <option value="M">Metal</option>
                    <option value="Y">Fairy</option>
                    <option value="O">Dragon</option>
                    <option value="C">Colorless</option>
                    <option value="">Trainer</option>
                    <option value="E">Energy</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Rarity</label>
                  <select
                    value={rarityCode}
                    onChange={(e) => setRarityCode(e.target.value)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  >
                    <option value="C">Common (C)</option>
                    <option value="U">Uncommon (U)</option>
                    <option value="R">Rare (R)</option>
                    <option value="RH">Rare Holo (RH)</option>
                    <option value="RU">Ultra Rare (RU/GX)</option>
                    <option value="RD">Double Rare (RD/ex)</option>
                    <option value="IR">Illustration Rare (IR)</option>
                    <option value="S">Secret Rare (S)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  />
                </div>
              </div>

              {/* URL & Foil Checkbox */}
              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Direct Image URL (Optional - CDN or Cloud Storage)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.pokemontcg.io/sv1/54.png"
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="foil-check"
                    checked={isFoil}
                    onChange={(e) => setIsFoil(e.target.checked)}
                    className="w-4 h-4 rounded text-pokedex-red focus:ring-0 bg-pokedex-darker border-slate-800"
                  />
                  <label htmlFor="foil-check" className="text-slate-200 text-xs flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Holographic (Foil / Holo) Card</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider"
              >
                Save Card to Collection
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300 text-xs font-sans">
                Paste spreadsheet or CSV text (Pokemon TCG / LigaPokemon format), or upload a <code>.csv</code> file from your computer:
              </p>

              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pokedex-darker file:text-yellow-300 hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Set Name (PT),Set Name (EN),Set Code,Card Name (PT),Card Name (EN),Quantity,Quality,Language,Rarity,Color,Extras,Card #,Comment,Total In Set"
                rows={6}
                className="w-full bg-black/60 font-mono text-cyan-300 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-pokedex-blue text-[11px]"
              />

              {importResult && (
                <div className="bg-emerald-950 border border-emerald-500/40 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Import finished: {importResult.added} added, {importResult.updated} updated!</span>
                </div>
              )}

              <button
                onClick={handleCsvImport}
                disabled={!csvText.trim()}
                className="w-full bg-pokedex-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Process CSV Import</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

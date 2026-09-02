import React, { useState } from 'react';
import { Plus, X, Upload, Sparkles, Check, Image as ImageIcon, Loader2, Layers } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { useLanguage } from '../context/LanguageContext';
import { soundEffects } from '../services/audio';
import { uploadCardImageToStorage, downloadAndUploadImageToStorage } from '../services/firebase';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose }) => {
  const { addNewCard, importCardsFromCsv, decks } = useCollection();
  const { t } = useLanguage();
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [comment, setComment] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [deckMode, setDeckMode] = useState<'none' | 'existing' | 'new'>('none');
  const [targetDeckId, setTargetDeckId] = useState<string>(decks[0]?.id || '');
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckFormat, setNewDeckFormat] = useState<'Standard' | 'Expanded' | 'Casual'>('Standard');
  const [importResult, setImportResult] = useState<{ added: number; updated: number; deckName?: string } | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !namePt.trim()) return;

    soundEffects.playScan();
    setIsUploadingImage(true);

    const cleanSet = setCode.trim().toLowerCase();
    const cleanNum = cardNumber.trim().replace(/\D/g, '') || '1';
    const targetFilename = `${cleanSet}_${cleanNum}.png`;

    let finalImageUrl = imageUrl.trim();

    try {
      if (imageFile) {
        finalImageUrl = await uploadCardImageToStorage(imageFile, targetFilename);
      } else if (finalImageUrl && !finalImageUrl.includes('firebasestorage.googleapis.com')) {
        finalImageUrl = await downloadAndUploadImageToStorage(finalImageUrl, targetFilename);
      } else if (!finalImageUrl) {
        finalImageUrl = `https://images.pokemontcg.io/${cleanSet}/${cleanNum}.png`;
      }
    } catch (err) {
      console.warn('Storage upload warning, using fallback URL:', err);
    } finally {
      setIsUploadingImage(false);
    }

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
      image_url: finalImageUrl,
      comment: comment.trim()
    });

    onClose();
  };

  const handleCsvImport = () => {
    if (!csvText.trim()) return;
    const res = importCardsFromCsv(csvText, {
      mode: deckMode,
      existingDeckId: deckMode === 'existing' ? targetDeckId : undefined,
      newDeckName: deckMode === 'new' ? newDeckName : undefined,
      newDeckFormat: deckMode === 'new' ? newDeckFormat : undefined,
    });
    setImportResult(res);
    setTimeout(() => {
      setImportResult(null);
      onClose();
    }, 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!newDeckName) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/^export_/, 'Deck ')
          .substring(0, 30);
        setNewDeckName(cleanName);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setCsvText(text);
      };
      reader.readAsText(file, 'latin1');
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
              {t('addCard.title')}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label={t('common.close')}
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
            {t('addCard.tabManual')}
          </button>
          <button
            onClick={() => { soundEffects.playClick(); setTab('csv'); }}
            className={`flex-1 py-3 font-bold transition-colors ${
              tab === 'csv' ? 'bg-slate-800 text-yellow-300 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('addCard.tabCsv')}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {tab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.nameEn')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.namePt')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.setCode')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.cardNumber')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.totalInSet')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.typeCategory')}</label>
                  <select
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-full bg-pokedex-darker border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                  >
                    <option value="R">{t('filters.types.fire')}</option>
                    <option value="W">{t('filters.types.water')}</option>
                    <option value="G">{t('filters.types.grass')}</option>
                    <option value="L">{t('filters.types.lightning')}</option>
                    <option value="P">{t('filters.types.psychic')}</option>
                    <option value="F">{t('filters.types.fighting')}</option>
                    <option value="D">{t('filters.types.darkness')}</option>
                    <option value="M">{t('filters.types.metal')}</option>
                    <option value="Y">{t('filters.types.fairy')}</option>
                    <option value="O">{t('filters.types.dragon')}</option>
                    <option value="C">{t('filters.types.colorless')}</option>
                    <option value="">{t('filters.types.trainer')}</option>
                    <option value="E">{t('filters.types.energy')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.rarity')}</label>
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
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.quantity')}</label>
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

              {/* Image Upload & Firebase Storage Section */}
              <div className="space-y-3 p-3 bg-pokedex-darker rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-bold block text-[10px] uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{t('addCard.imageSectionTitle')}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Firebase Storage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.imageOptionA')}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-[11px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-yellow-300 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[10px] uppercase mb-1">{t('addCard.imageOptionB')}</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.pokemontcg.io/sv1/54.png"
                      className="w-full bg-black/50 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-pokedex-blue text-xs"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div className="flex items-center space-x-3 pt-1">
                    <img src={imagePreview} alt="Preview" className="w-12 h-16 rounded-lg object-cover border border-slate-700 shadow-md" />
                    <span className="text-[11px] text-emerald-400">✓ {t('addCard.imageReadyNotice')}</span>
                  </div>
                )}
              </div>

              {/* Foil Checkbox */}
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
                  <span>{t('addCard.isFoil')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploadingImage}
                className="w-full bg-pokedex-red hover:bg-pokedex-lightred disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                    <span>{t('addCard.uploadingAndSaving')}</span>
                  </>
                ) : (
                  <span>{t('addCard.saveCardBtn')}</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300 text-xs font-sans">
                {t('addCard.csvHelp')}
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
                rows={5}
                className="w-full bg-black/60 font-mono text-cyan-300 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-pokedex-blue text-[11px]"
              />

              {/* Deck Destination Controls */}
              <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1.5 font-mono">
                    <Layers className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{t('addCard.deckAssignment')}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{t('common.optional')}</span>
                </div>

                {/* Segment Options */}
                <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-xl border border-slate-800 font-mono">
                  <button
                    type="button"
                    onClick={() => setDeckMode('none')}
                    className={`py-2 px-2 rounded-lg text-[10px] font-bold transition-all truncate text-center ${
                      deckMode === 'none'
                        ? 'bg-slate-800 text-yellow-300 shadow border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('addCard.deckModeNone')}
                  </button>
                  <button
                    type="button"
                    disabled={decks.length === 0}
                    onClick={() => setDeckMode('existing')}
                    className={`py-2 px-2 rounded-lg text-[10px] font-bold transition-all truncate text-center disabled:opacity-30 ${
                      deckMode === 'existing'
                        ? 'bg-pokedex-blue text-white shadow border border-blue-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('addCard.deckModeExisting')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeckMode('new')}
                    className={`py-2 px-2 rounded-lg text-[10px] font-bold transition-all truncate text-center ${
                      deckMode === 'new'
                        ? 'bg-emerald-600 text-white shadow border border-emerald-400/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('addCard.deckModeNew')}
                  </button>
                </div>

                {/* Sub-form: Existing Deck Dropdown */}
                {deckMode === 'existing' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-slate-400 block text-[10px] uppercase font-mono">{t('addCard.selectExistingDeck')}</label>
                    <select
                      value={targetDeckId}
                      onChange={(e) => setTargetDeckId(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                    >
                      {decks.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.format})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sub-form: Create New Deck Fields */}
                {deckMode === 'new' && (
                  <div className="space-y-2.5 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-slate-400 block text-[10px] uppercase mb-1 font-mono">{t('addCard.newDeckName')}</label>
                        <input
                          type="text"
                          value={newDeckName}
                          onChange={(e) => setNewDeckName(e.target.value)}
                          placeholder="Ex: Malamar Necrozma Turbo"
                          className="w-full bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block text-[10px] uppercase mb-1 font-mono">{t('addCard.format')}</label>
                        <select
                          value={newDeckFormat}
                          onChange={(e) => setNewDeckFormat(e.target.value as any)}
                          className="w-full bg-black/60 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                        >
                          <option value="Standard">Standard</option>
                          <option value="Expanded">Expanded</option>
                          <option value="Casual">Casual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {importResult && (
                <div className="bg-emerald-950 border border-emerald-500/40 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {t('addCard.importSuccess', { added: importResult.added, updated: importResult.updated })}
                    {importResult.deckName ? ` (assigned to deck "${importResult.deckName}")` : ''}!
                  </span>
                </div>
              )}

              <button
                onClick={handleCsvImport}
                disabled={!csvText.trim()}
                className="w-full bg-pokedex-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {deckMode === 'new' && newDeckName.trim()
                    ? t('addCard.importAndCreateDeck', { name: newDeckName.trim() })
                    : deckMode === 'existing'
                    ? t('addCard.importAndAddToDeck')
                    : t('addCard.processCsv')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

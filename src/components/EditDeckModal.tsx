import React, { useState, useEffect } from 'react';
import { Layers, X, Save, Plus, Trash2, Swords, Trophy, Sparkles, Palette } from 'lucide-react';
import { useCollection } from '../context/CollectionContext';
import { Deck, DeckStrategyGuide } from '../types';
import { soundEffects } from '../services/audio';

interface EditDeckModalProps {
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Red', color: '#EF4444', badge: 'from-red-600 to-red-950' },
  { name: 'Blue', color: '#3B82F6', badge: 'from-blue-600 to-blue-950' },
  { name: 'Purple', color: '#8B5CF6', badge: 'from-purple-600 to-purple-950' },
  { name: 'Emerald', color: '#10B981', badge: 'from-emerald-600 to-emerald-950' },
  { name: 'Amber', color: '#F59E0B', badge: 'from-amber-600 to-amber-950' },
  { name: 'Cyan', color: '#06B6D4', badge: 'from-cyan-600 to-cyan-950' },
];

export const EditDeckModal: React.FC<EditDeckModalProps> = ({ deck, isOpen, onClose }) => {
  const { updateDeck } = useCollection();

  const [activeTab, setActiveTab] = useState<'playbook' | 'general'>('playbook');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'Standard' | 'Expanded' | 'Casual'>('Standard');
  const [archetype, setArchetype] = useState('');
  const [accentColor, setAccentColor] = useState('#EF4444');
  const [badgeColor, setBadgeColor] = useState('from-red-600 to-red-950');
  const [summary, setSummary] = useState('');
  const [winCondition, setWinCondition] = useState('');
  const [prizeTradeTip, setPrizeTradeTip] = useState('');

  // Strategy Guide state
  const [openingTitle, setOpeningTitle] = useState('1. Opening Plan');
  const [openingSteps, setOpeningSteps] = useState<string[]>([]);

  const [midgameTitle, setMidgameTitle] = useState('2. Midgame Plan');
  const [midgameSteps, setMidgameSteps] = useState<string[]>([]);

  const [lategameTitle, setLategameTitle] = useState('3. Endgame Plan');
  const [lategameSteps, setLategameSteps] = useState<string[]>([]);

  // Sync state whenever active deck changes or modal opens
  useEffect(() => {
    if (deck) {
      setName(deck.name || '');
      setFormat((deck.format as any) || 'Standard');
      setArchetype(deck.archetype || '');
      setAccentColor(deck.accent_color || '#EF4444');
      setBadgeColor(deck.badge_color || 'from-red-600 to-red-950');
      setSummary(deck.summary || '');
      setWinCondition(deck.win_condition || '');
      setPrizeTradeTip(deck.prize_trade_tip || '');

      const guide = deck.strategy_guide || {
        opening: { title: '1. Opening Plan', steps: [] },
        midgame: { title: '2. Midgame Plan', steps: [] },
        lategame: { title: '3. Endgame Plan', steps: [] }
      };

      setOpeningTitle(guide.opening?.title || '1. Opening Plan');
      setOpeningSteps(guide.opening?.steps && guide.opening.steps.length > 0 ? [...guide.opening.steps] : ['']);

      setMidgameTitle(guide.midgame?.title || '2. Midgame Plan');
      setMidgameSteps(guide.midgame?.steps && guide.midgame.steps.length > 0 ? [...guide.midgame.steps] : ['']);

      setLategameTitle(guide.lategame?.title || '3. Endgame Plan');
      setLategameSteps(guide.lategame?.steps && guide.lategame.steps.length > 0 ? [...guide.lategame.steps] : ['']);
    }
  }, [deck, isOpen]);

  if (!isOpen || !deck) return null;

  // Step Helpers
  const handleStepChange = (phase: 'opening' | 'midgame' | 'lategame', index: number, value: string) => {
    if (phase === 'opening') {
      const updated = [...openingSteps];
      updated[index] = value;
      setOpeningSteps(updated);
    } else if (phase === 'midgame') {
      const updated = [...midgameSteps];
      updated[index] = value;
      setMidgameSteps(updated);
    } else {
      const updated = [...lategameSteps];
      updated[index] = value;
      setLategameSteps(updated);
    }
  };

  const handleAddStep = (phase: 'opening' | 'midgame' | 'lategame') => {
    soundEffects.playClick();
    if (phase === 'opening') setOpeningSteps(prev => [...prev, '']);
    else if (phase === 'midgame') setMidgameSteps(prev => [...prev, '']);
    else setLategameSteps(prev => [...prev, '']);
  };

  const handleRemoveStep = (phase: 'opening' | 'midgame' | 'lategame', index: number) => {
    soundEffects.playClick();
    if (phase === 'opening') {
      setOpeningSteps(prev => prev.filter((_, i) => i !== index));
    } else if (phase === 'midgame') {
      setMidgameSteps(prev => prev.filter((_, i) => i !== index));
    } else {
      setLategameSteps(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundEffects.playScan();

    const cleanOpening = openingSteps.map(s => s.trim()).filter(Boolean);
    const cleanMidgame = midgameSteps.map(s => s.trim()).filter(Boolean);
    const cleanLategame = lategameSteps.map(s => s.trim()).filter(Boolean);

    const updatedGuide: DeckStrategyGuide = {
      opening: {
        title: openingTitle.trim() || '1. Opening Plan',
        steps: cleanOpening.length > 0 ? cleanOpening : ['Setup your Basic Pokémon and bench engine.']
      },
      midgame: {
        title: midgameTitle.trim() || '2. Midgame Plan',
        steps: cleanMidgame.length > 0 ? cleanMidgame : ['Power up attackers and trade prizes efficiently.']
      },
      lategame: {
        title: lategameTitle.trim() || '3. Endgame Plan',
        steps: cleanLategame.length > 0 ? cleanLategame : ['Close out remaining Prize Cards.']
      }
    };

    updateDeck(deck.id, {
      name: name.trim(),
      format,
      format_slug: format === 'Expanded' ? 'expanded' : (format === 'Casual' ? 'casual' : 'standard'),
      archetype: archetype.trim() || 'Custom Rogue',
      accent_color: accentColor,
      badge_color: badgeColor,
      summary: summary.trim() || deck.summary,
      win_condition: winCondition.trim() || deck.win_condition,
      prize_trade_tip: prizeTradeTip.trim() || deck.prize_trade_tip,
      strategy_guide: updatedGuide
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-pokedex-screen border-4 border-pokedex-darkred rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Top Header */}
        <div className="bg-pokedex-red px-6 py-3 border-b-2 border-pokedex-darkred flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-yellow-300" />
            <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Edit Deck & Strategic Playbook: {deck.name}
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
            type="button"
            onClick={() => { soundEffects.playClick(); setActiveTab('playbook'); }}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'playbook' ? 'bg-slate-800 text-yellow-300 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Strategic Turn Playbook</span>
          </button>
          <button
            type="button"
            onClick={() => { soundEffects.playClick(); setActiveTab('general'); }}
            className={`flex-1 py-3 font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'general' ? 'bg-slate-800 text-yellow-300 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Deck Details & Theme</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto font-mono text-xs space-y-5">
          {activeTab === 'playbook' ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Win Condition & Prize Trade Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-yellow-400 flex items-center gap-1.5 font-bold uppercase text-[10px]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Win Condition & Primary Goal</span>
                  </label>
                  <textarea
                    rows={2}
                    value={winCondition}
                    onChange={(e) => setWinCondition(e.target.value)}
                    placeholder="Ex: Take 6 Prize Cards by cycling Energy with Malamar to power up Necrozma's Special Laser attack."
                    className="w-full bg-black/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                  />
                </div>

                <div className="bg-pokedex-darker p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <label className="text-purple-300 flex items-center gap-1.5 font-bold uppercase text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Prize Trade Tip</span>
                  </label>
                  <textarea
                    rows={2}
                    value={prizeTradeTip}
                    onChange={(e) => setPrizeTradeTip(e.target.value)}
                    placeholder="Ex: Aim to trade 1-Prize attackers efficiently against opponent's 2-Prize Pokémon-GX/V."
                    className="w-full bg-black/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                  />
                </div>
              </div>

              {/* 1. Opening / Early Game Section */}
              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-sm text-blue-400 uppercase">1. Opening / Early Game Plan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStep('opening')}
                    className="text-xs text-yellow-300 hover:text-yellow-200 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={openingTitle}
                  onChange={(e) => setOpeningTitle(e.target.value)}
                  placeholder="Section Title (e.g. 1. Opening Plan)"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-yellow-300 focus:outline-none focus:border-pokedex-blue font-sans"
                />

                <div className="space-y-2">
                  {openingSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px] w-4 shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange('opening', idx, e.target.value)}
                        placeholder={`Step ${idx + 1} (e.g. Bench Inkay and use Mysterious Treasure)`}
                        className="flex-1 bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep('opening', idx)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-black/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Midgame Section */}
              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <span className="font-bold text-sm text-teal-400 uppercase">2. Midgame Strategy</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStep('midgame')}
                    className="text-xs text-yellow-300 hover:text-yellow-200 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={midgameTitle}
                  onChange={(e) => setMidgameTitle(e.target.value)}
                  placeholder="Section Title (e.g. 2. Midgame Plan)"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-yellow-300 focus:outline-none focus:border-pokedex-blue font-sans"
                />

                <div className="space-y-2">
                  {midgameSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px] w-4 shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange('midgame', idx, e.target.value)}
                        placeholder={`Step ${idx + 1} (e.g. Evolve into Malamar and attach Psychic Recharge)`}
                        className="flex-1 bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep('midgame', idx)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-black/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Endgame / Lategame Section */}
              <div className="bg-pokedex-darker p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="font-bold text-sm text-purple-400 uppercase">3. Endgame / Closing Plan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStep('lategame')}
                    className="text-xs text-yellow-300 hover:text-yellow-200 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={lategameTitle}
                  onChange={(e) => setLategameTitle(e.target.value)}
                  placeholder="Section Title (e.g. 3. Endgame Plan)"
                  className="w-full bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-yellow-300 focus:outline-none focus:border-pokedex-blue font-sans"
                />

                <div className="space-y-2">
                  {lategameSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px] w-4 shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange('lategame', idx, e.target.value)}
                        placeholder={`Step ${idx + 1} (e.g. Close out remaining Prize Cards with Necrozma)`}
                        className="flex-1 bg-black/60 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-pokedex-blue font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep('lategame', idx)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-black/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Deck Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Necrozma (Laser Focus)"
                    className="w-full bg-pokedex-darker border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue font-sans text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Archetype</label>
                  <input
                    type="text"
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value)}
                    placeholder="Ex: Psychic Toolbox / Malamar Turbo"
                    className="w-full bg-pokedex-darker border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue font-sans text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full bg-pokedex-darker border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue font-sans text-xs"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Expanded">Expanded</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block text-[10px] uppercase mb-1">Accent Color & Glow</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setAccentColor(preset.color);
                          setBadgeColor(preset.badge);
                        }}
                        style={{ backgroundColor: preset.color }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          accentColor === preset.color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] uppercase mb-1">Deck Summary</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Strategic summary of this deck's gameplan..."
                  className="w-full bg-pokedex-darker border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-pokedex-blue font-sans text-xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-mono text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-pokedex-red hover:bg-pokedex-lightred text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 text-xs font-mono uppercase tracking-wider flex items-center gap-2 border border-white/20"
            >
              <Save className="w-4 h-4 text-yellow-300" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

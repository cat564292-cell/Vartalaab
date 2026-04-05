import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

const KEYPADS: Record<string, { label: string; rows: string[][] }> = {
  mr: {
    label: 'मराठी',
    rows: [
      ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ'],
      ['क','ख','ग','घ','च','छ','ज','झ','ट','ठ'],
      ['ड','ढ','त','थ','द','ध','न','प','फ','ब'],
      ['भ','म','य','र','ल','व','श','ष','स','ह'],
      ['ा','ि','ी','ु','ू','े','ै','ो','ौ','्'],
      ['।','?','!',',','.','०','१','२','३','⌫'],
    ],
  },
  hi: {
    label: 'हिन्दी',
    rows: [
      ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ'],
      ['क','ख','ग','घ','च','छ','ज','झ','ट','ठ'],
      ['ड','ढ','त','थ','द','ध','न','प','फ','ब'],
      ['भ','म','य','र','ल','व','श','ष','स','ह'],
      ['ा','ि','ी','ु','ू','े','ै','ो','ौ','्'],
      ['।','?','!',',','.','⌫'],
    ],
  },
  ja: {
    label: 'かな',
    rows: [
      ['あ','い','う','え','お','ア','イ','ウ','エ','オ'],
      ['か','き','く','け','こ','カ','キ','ク','ケ','コ'],
      ['さ','し','す','せ','そ','サ','シ','ス','セ','ソ'],
      ['た','ち','つ','て','と','タ','チ','ツ','テ','ト'],
      ['な','に','ぬ','ね','の','ナ','ニ','ヌ','ネ','ノ'],
      ['は','ひ','ふ','へ','ほ','ハ','ヒ','フ','ヘ','ホ'],
      ['ま','み','む','め','も','ら','り','る','れ','ろ'],
      ['や','ゆ','よ','わ','を','ん','っ','ー','。','⌫'],
    ],
  },
  ko: {
    label: '한국어',
    rows: [
      ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ'],
      ['ㅋ','ㅌ','ㅍ','ㅎ','ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ'],
      ['ㅜ','ㅠ','ㅡ','ㅣ','ㅐ','ㅒ','ㅔ','ㅖ','ㅘ','ㅙ'],
      ['가','나','다','라','마','바','사','아','자','차'],
      ['카','타','파','하','이','우','오','에','의','⌫'],
    ],
  },
  'zh-Hans': {
    label: '中文',
    rows: [
      ['你','好','是','的','了','在','我','有','他','这'],
      ['们','来','上','大','为','和','国','地','到','以'],
      ['说','时','要','就','出','会','可','也','对','生'],
      ['学','中','年','人','日','用','发','那','么','去'],
      ['。','，','？','！','、','"','"','…','—','⌫'],
    ],
  },
  ar: {
    label: 'عربي',
    rows: [
      ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر'],
      ['ز','س','ش','ص','ض','ط','ظ','ع','غ','ف'],
      ['ق','ك','ل','م','ن','ه','و','ي','ء','ة'],
      ['َ','ُ','ِ','ً','ٌ','ٍ','ّ','ْ','،','⌫'],
    ],
  },
  th: {
    label: 'ไทย',
    rows: [
      ['ก','ข','ค','ง','จ','ช','ซ','ญ','ด','ต'],
      ['ถ','ท','น','บ','ป','ผ','ฝ','พ','ฟ','ภ'],
      ['ม','ย','ร','ล','ว','ส','ห','อ','ฮ','า'],
      ['ิ','ี','ึ','ื','ุ','ู','เ','แ','โ','ใ'],
      ['ไ','็','่','้','๊','๋','ํ','ๆ','ฯ','⌫'],
    ],
  },
  ru: {
    label: 'Рус',
    rows: [
      ['й','ц','у','к','е','н','г','ш','щ','з'],
      ['х','ъ','ф','ы','в','а','п','р','о','л'],
      ['д','ж','э','я','ч','с','м','и','т','ь'],
      ['б','ю','ё','А','Б','В','Г','Д','Е','Ж'],
      ['.','?','!',',','-','«','»','—','…','⌫'],
    ],
  },
};

export const KEYPAD_LANGS = Object.keys(KEYPADS);

interface Props {
  lang: string;
  onInsert: (char: string) => void;
}

export function ScriptKeypad({ lang, onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const kp = KEYPADS[lang];
  if (!kp) return null;

  const handleKey = (k: string) => {
    if (k === '⌫') onInsert('\b');
    else onInsert(k);
  };

  return (
    <div className="relative inline-block">
      <motion.button
        type="button"
        whileHover={{ scale: 1.08, y: -1 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-white/80 hover:text-white text-xs border border-white/15 transition-colors"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>{kp.label}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="absolute bottom-full mb-2 left-0 z-50 glass-card rounded-2xl p-3 shadow-2xl border border-white/15 min-w-[300px] max-w-[360px]"
            style={{ transformOrigin: 'bottom left' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-xs font-medium">{kp.label} Keyboard</span>
              <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {kp.rows.map((row, ri) => (
                <div key={ri} className="flex gap-1 flex-wrap">
                  {row.map((key) => (
                    <motion.button
                      key={`${ri}-${key}`}
                      type="button"
                      whileHover={{ scale: 1.18, y: -2 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => handleKey(key)}
                      className={`min-w-[26px] h-8 px-1.5 rounded-lg text-sm font-medium transition-colors
                        ${key === '⌫'
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30 px-2'
                          : 'bg-white/8 text-white hover:bg-white/20 border border-white/10'
                        }`}
                    >
                      {key}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onInsert(' ')}
              className="mt-2 w-full h-8 rounded-lg bg-white/8 border border-white/10 text-white/50 text-xs hover:bg-white/15 transition-colors"
            >
              Space
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

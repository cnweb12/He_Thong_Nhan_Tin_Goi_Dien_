import React, { useEffect, useRef, useState } from 'react';

// ─── Danh sách emoji theo category ─────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
      '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫',
      '🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬',
      '🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢',
      '🤮','🤧','🥵','🥶','🥴','😵','💫','🤯','🤠','🥳',
      '🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯',
      '😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭',
      '😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
      '😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺',
      '👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽',
      '🙀','😿','😾',
    ],
  },
  {
    label: 'Tay',
    icon: '👋',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞',
      '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍',
      '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
      '🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂',
      '🦻','👃','👁️','👀','🫀','🫁','🧠','🦷','🦴','👅',
      '👄','💋','💌','💘','💝','💖','💗','💓','💞','💕',
      '💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎',
      '🖤','🤍','💯','💢','💥','💫','💦','💨','🕳️','💬',
      '👁️‍🗨️','🗨️','🗯️','💭','💤',
    ],
  },
  {
    label: 'Người',
    icon: '🧑',
    emojis: [
      '👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓',
      '👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇',
      '🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👰',
      '🤵','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟',
      '🧑‍⚕️','🧑‍🎓','🧑‍🏫','🧑‍⚖️','🧑‍🌾','🧑‍🍳','🧑‍🔧','🧑‍🏭','🧑‍💼',
      '🧑‍🔬','🧑‍🎨','🧑‍🚒','🧑‍✈️','🧑‍🚀','🧑‍💻','👫','👬','👭','💑','👪',
    ],
  },
  {
    label: 'Động vật',
    icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨',
      '🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒',
      '🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗',
      '🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗',
      '🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀',
      '🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆',
      '🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒',
      '🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙',
      '🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃',
      '🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡',
      '🦫','🦦','🦥','🐁','🐀','🐿️','🦔',
    ],
  },
  {
    label: 'Thức ăn',
    icon: '🍕',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐',
      '🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🧄','🧅','🥔',
      '🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈',
      '🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕',
      '🫓','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫',
      '🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙',
      '🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭',
      '🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤',
      '🧋','☕','🍵','🧉','🍺','🍻','🥂','🍷','🥃','🍸',
      '🍹','🧊','🥄','🍴','🍽️',
    ],
  },
  {
    label: 'Giao thông',
    icon: '🚗',
    emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐',
      '🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼',
      '🚏','🛣️','🛤️','✈️','🛩️','🛫','🛬','🛳️','🚢','⛵',
      '🚤','🛥️','🚀','🛸','🪂','⛽','🚧','🚦','🚥','🗺️',
      '🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️',
      '🏛️','🏗️','🧱','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤',
      '🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰',
    ],
  },
  {
    label: 'Hoạt động',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🏐','🏉','🥏','🎾','🏸',
      '🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣',
      '🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🤼','🤸',
      '⛹️','🤺','🏇','🏋️','🤾','🏌️','🏄','🚣','🧗','🚵',
      '🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫',
      '🎟️','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼',
      '🎵','🎶','🎷','🪗','🎸','🎹','🎺','🎻','🪘','🥁',
      '🪇','🎲','♟️','🎯','🎳','🎮','🎰','🧩',
    ],
  },
  {
    label: 'Vật phẩm',
    icon: '💡',
    emojis: [
      '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📀',
      '📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠',
      '📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡',
      '🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💰','💴',
      '💵','💶','💷','💸','💳','🪙','💎','⚖️','🪜','🧲',
      '🔧','🪛','🔩','⚙️','🔫','🪃','🗡️','⚔️','🛡️','🔨',
      '🪚','⛏️','🪝','🗜️','🔑','🗝️','🔒','🔓','📦','📫',
      '📬','📭','📮','🗳️','📝','✏️','🖊️','🖋️','🖌️','🔍',
      '🔎','🔬','🔭','📊','📈','📉','📋','📌','📍','✂️',
    ],
  },
  {
    label: 'Ký hiệu',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💝','💘',
      '☮️','✝️','☪️','🕉️','🔯','☯️','⚛️','🛐','♈','♉',
      '♊','♋','♌','♍','♎','♏','♐','♑','♒','♓',
      '⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪',
      '⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','🎦','🔅',
      '🔆','📶','📳','📴','📵','📡','🔇','🔈','🔉','🔊',
      '📢','📣','🔔','🔕','🎵','🎶','⚠️','🚸','⛔','🚫',
      '🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️',
      '✅','❎','🆗','🆕','🆙','🆒','🆓','🆖','📛','⛔',
      '#️⃣','*️⃣','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣',
      '8️⃣','9️⃣','🔟','🔠','🔡','🔢','🔣','🔤','🅰️','🅱️',
    ],
  },
  {
    label: 'Cờ',
    icon: '🏳️',
    emojis: [
      '🏳️','🏴','🏴‍☠️','🚩','🎌','🏁','🇻🇳','🇺🇸','🇬🇧','🇫🇷',
      '🇩🇪','🇯🇵','🇰🇷','🇨🇳','🇷🇺','🇧🇷','🇮🇳','🇨🇦','🇦🇺','🇮🇹',
      '🇪🇸','🇲🇽','🇸🇦','🇹🇷','🇸🇬','🇹🇭','🇵🇭','🇮🇩','🇲🇾','🇿🇦',
    ],
  },
];

/**
 * EmojiPicker — popup chọn emoji thuần FE.
 *
 * Props:
 *  - onSelect  : (emoji: string) => void  — callback khi chọn emoji
 *  - onClose   : () => void               — callback đóng picker
 */
export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Lọc emoji khi tìm kiếm
  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((e) => {
        // Tìm theo tên category chứa emoji (không có tên cho từng emoji nên chỉ hiện tất cả)
        return true;
      }).slice(0, 100)
    : EMOJI_CATEGORIES[activeCategory]?.emojis || [];

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 z-50"
      style={{ width: '320px' }}
    >
      {/* Container với glass morphism effect */}
      <div
        className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-[#2a3946] bg-white/95 dark:bg-[#1c2b38]/95"
        style={{
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Search */}
        <div className="p-2 border-b border-slate-100 dark:border-[#2a3946]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Tìm emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-100 dark:bg-[#121c25] text-slate-800 dark:text-slate-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500 transition placeholder-slate-400 dark:placeholder-slate-500"
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="flex overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-[#2a3946] bg-slate-50 dark:bg-[#1a232b]">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                title={cat.label}
                onClick={() => setActiveCategory(idx)}
                className={`flex-shrink-0 px-2.5 py-2 text-base transition-all ${
                  activeCategory === idx
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-b-2 border-blue-500'
                    : 'hover:bg-slate-100 dark:hover:bg-[#202f3a]'
                }`}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Category label */}
        {!search.trim() && (
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-white dark:bg-[#1c2b38]">
            {EMOJI_CATEGORIES[activeCategory]?.label}
          </div>
        )}

        {/* Emoji grid */}
        <div
          className="overflow-y-auto p-1.5"
          style={{ height: '200px' }}
        >
          <div className="grid grid-cols-8 gap-0.5">
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                type="button"
                onClick={() => onSelect?.(emoji)}
                className="flex items-center justify-center rounded-lg text-xl leading-none transition-all hover:bg-blue-50 dark:hover:bg-[#202f3a] hover:scale-110 active:scale-95 cursor-pointer"
                style={{ width: '36px', height: '36px' }}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Không tìm thấy emoji</p>
          )}
        </div>
      </div>
    </div>
  );
}

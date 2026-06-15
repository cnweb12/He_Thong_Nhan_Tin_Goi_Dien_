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

  // Lọc emoji khi tìm kiếm: do không có dữ liệu tên cho từng emoji,
  // tìm kiếm theo tên category (ví dụ gõ "động vật", "food", "cờ"...)
  // sẽ thu hẹp về các category có tên khớp. Nếu không khớp category nào,
  // hiển thị toàn bộ emoji để người dùng vẫn tìm được bằng cách lướt.
  const normalize = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredEmojis = (() => {
    const query = normalize(search);
    if (!query) {
      return EMOJI_CATEGORIES[activeCategory]?.emojis || [];
    }

    const matchingCategories = EMOJI_CATEGORIES.filter((c) =>
      normalize(c.label).includes(query)
    );

    const source = matchingCategories.length > 0 ? matchingCategories : EMOJI_CATEGORIES;
    const seen = new Set();
    const result = [];
    for (const cat of source) {
      for (const emoji of cat.emojis) {
        if (!seen.has(emoji)) {
          seen.add(emoji);
          result.push(emoji);
        }
      }
    }
    return result.slice(0, 100);
  })();

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 z-50"
      style={{ width: '320px' }}
    >
      {/* Container với glass morphism effect */}
      <div
        className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Search */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Tìm emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-200 transition placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="flex overflow-x-auto scrollbar-none border-b border-slate-100 bg-slate-50">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                title={cat.label}
                onClick={() => setActiveCategory(idx)}
                className={`flex-shrink-0 px-2.5 py-2 text-base transition-all ${
                  activeCategory === idx
                    ? 'bg-blue-50 border-b-2 border-blue-500'
                    : 'hover:bg-slate-100'
                }`}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        {/* Category label */}
        {!search.trim() && (
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white">
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
                className="flex items-center justify-center rounded-lg text-xl leading-none transition-all hover:bg-blue-50 hover:scale-110 active:scale-95 cursor-pointer"
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

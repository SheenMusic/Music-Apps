/* 和弦记号课程 · 术语表数据
   每课一组：{lesson, title, terms:[{term, en, definition, example}]}
   example 中的和弦记号用 cs(根音, 后缀, 低音) 写，页面会按记谱字体排版。
   术语与定义须与该课定稿文案一致（见 docs/chord-theory/lessonXX-v3.md）。 */
window.CHORD_GLOSSARY = [
  {
    lesson: 1, title: '三和弦',
    terms: [
      {term: '和弦记号', en: 'Chord Symbol', definition: '用字母、数字和符号描述和弦结构的记谱语言；说明是什么和弦，不规定具体八度与排列。', example: [['G','7'], ['F','maj7'], ['E','7(♭9)']]},
      {term: '三和弦', en: 'Triad', definition: '由三个音按三度叠置而成的和弦：根音、三音、五音。'},
      {term: '根音', en: 'Root', definition: '三和弦三度叠置的起点，与它在哪个八度无关。'},
      {term: '三音', en: 'Third', definition: '根音上方三度的和弦音。'},
      {term: '五音', en: 'Fifth', definition: '根音上方五度的和弦音。'},
      {term: '低音', en: 'Bass', definition: '实际排列中音高最低的音；不一定是根音。'},
      {term: '三和弦的性质', en: 'Triad Quality', definition: '由根音到三音、五音的音程决定；有大、小、增、减四种。英文资料常统称 chord quality。'},
      {term: '大三和弦', en: 'Major Triad', definition: '根音到三音为大三度（M3），到五音为纯五度（P5）。', example: [['C',''], ['C','M'], ['C','maj']]},
      {term: '小三和弦', en: 'Minor Triad', definition: '根音到三音为小三度（m3），到五音为纯五度（P5）。', example: [['C','m'], ['C','min'], ['C','−']]},
      {term: '增三和弦', en: 'Augmented Triad', definition: '根音到三音为大三度（M3），到五音为增五度（A5）。', example: [['C','aug'], ['C','+']]},
      {term: '减三和弦', en: 'Diminished Triad', definition: '根音到三音为小三度（m3），到五音为减五度（d5）。', example: [['C','dim'], ['C','°']]},
      {term: '后缀', en: 'Suffix', definition: '写在根音之后、说明和弦性质的部分；有英文缩写与专属符号两种写法。'},
      {term: '英文缩写', en: 'Abbreviation', definition: '取自英文名称前三个字母的后缀：maj、min、aug、dim（大三和弦也可写 M，或省略）。'},
      {term: '专属符号', en: 'Symbol', definition: '约定俗成的后缀符号：△、−、+、°；「−」表示小三和弦，不是减三和弦。'},
      {term: '转位', en: 'Inversion', definition: '看哪个和弦音在低音：根音在低音为原位，三音为第一转位，五音为第二转位。'},
      {term: '原位', en: 'Root Position', definition: '根音在低音的排列。'},
      {term: '第一转位', en: 'First Inversion', definition: '三音在低音的排列。', example: [['C','','E']]},
      {term: '第二转位', en: 'Second Inversion', definition: '五音在低音的排列。', example: [['C','','G']]},
      {term: '斜线和弦记号', en: 'Slash Chord', definition: '「和弦 / 低音」：斜线前面写和弦，后面写低音；原位不写斜线。', example: [['C','','E'], ['A','m','C']]},
      {term: '简化标记', en: '', definition: '同一个和弦连续出现、只换低音时，只写斜线和新的低音；不能脱离上下文理解。', example: [['D','m'], ['','','F'], ['','','A']]},
      {term: '重复音', en: 'Doubling', definition: '同一个和弦音在不同八度再次出现。'},
      {term: '省略音', en: 'Omission', definition: '和弦中省去的音；三和弦最常省略纯五度，增、减三和弦的五音不能省。'},
      {term: '柱式和弦', en: 'Block Chord', definition: '和弦音同时发声。'},
      {term: '分解和弦', en: 'Broken Chord', definition: '和弦音依次发声；与柱式和弦使用同一个和弦记号。'},
      {term: '和弦外音', en: 'Non-chord Tone', definition: '出现在分解和弦等织体中、但不属于和弦的音；判断和弦性质时可以排除。'}
    ]
  },
  {
    lesson: 2, title: '七和弦',
    terms: [
      {term: '七和弦', en: 'Seventh Chord', definition: '由四个音按三度叠置而成的和弦：根音、三音、五音、七音。'},
      {term: '七音', en: 'Seventh', definition: '根音上方七度的和弦音。'},
      {term: '七和弦的性质', en: 'Seventh Chord Quality', definition: '由三和弦的性质与根音到七音的音程共同决定；常用的有八种。英文资料常统称 chord quality。'},
      {term: '大小七和弦', en: 'Dominant Seventh', definition: '大三和弦 ＋ 小七度；又称属七和弦。记号只写一个 7。', example: [['C','7']]},
      {term: '属七和弦', en: 'Dominant Seventh', definition: '大小七和弦的通用名称。', example: [['C','7']]},
      {term: '大七和弦', en: 'Major Seventh', definition: '大三和弦 ＋ 大七度；全称大大七和弦。', example: [['C','maj7'], ['C','M7'], ['C','△7']]},
      {term: '小七和弦', en: 'Minor Seventh', definition: '小三和弦 ＋ 小七度；全称小小七和弦。', example: [['C','m7'], ['C','min7'], ['C','−7']]},
      {term: '减七和弦', en: 'Diminished Seventh', definition: '减三和弦 ＋ 减七度；全称减减七和弦。', example: [['C','°7'], ['C','dim7']]},
      {term: '半减七和弦', en: 'Half-diminished Seventh', definition: '减三和弦 ＋ 小七度；全称减小七和弦。只有三和弦是「减」的，所以叫「半减」。', example: [['C','ø7'], ['C','m7(♭5)'], ['C','m7(−5)']]},
      {term: '小大七和弦', en: 'Minor-major Seventh', definition: '小三和弦 ＋ 大七度。', example: [['C','m(maj7)'], ['C','mM7'], ['C','−△7']]},
      {term: '增七和弦', en: 'Augmented Seventh', definition: '增三和弦 ＋ 小七度；全称增小七和弦，也叫增属七和弦。也可以看作属七和弦升高五音。', example: [['C','+7'], ['C','aug7'], ['C','7(♯5)']]},
      {term: '增属七和弦', en: 'Augmented Dominant Seventh', definition: '增七和弦在古典和声里的名称。'},
      {term: '增大七和弦', en: 'Augmented Major Seventh', definition: '增三和弦 ＋ 大七度。', example: [['C','maj7(♯5)'], ['C','△7(♯5)']]},
      {term: '第三转位', en: 'Third Inversion', definition: '七和弦的七音在低音的排列。', example: [['C','7','B♭']]},
      {term: '等音记谱', en: 'Enharmonic Spelling', definition: '为了突出声部倾向或方便读谱，把和弦音写成音高相同、音名不同的另一个音（等音），如 E+7 的五音 B♯ 写成 C。没有上下文时，仍按和弦结构拼写。'}
    ]
  },
  {
    lesson: 3, title: '延伸音和弦',
    terms: [
      {term: '延伸音', en: 'Extension', definition: '在七和弦上继续往上叠三度得到的九音、十一音、十三音。默认音程是大九度（M9）、纯十一度（P11）、大十三度（M13），即二度、四度、六度加一个八度的复音程。'},
      {term: '延伸音和弦', en: 'Extension Chord', definition: '含有延伸音的和弦。记号把七和弦记号里的 7 换成延伸音的数字；数字说明叠到哪个音，中间的延伸音都包含在内。', example: [['C','maj9'], ['C','m11'], ['C','13']]},
      {term: '九和弦', en: 'Ninth Chord', definition: '在七和弦上叠到九音的和弦：根音、三音、五音、七音、九音。', example: [['C','9'], ['C','maj9'], ['C','m9']]},
      {term: '十一和弦', en: 'Eleventh Chord', definition: '叠到十一音的和弦，包含九音。含大三度的十一和弦常省略三音，避开三音和十一音的碰撞。', example: [['C','11'], ['C','m11']]},
      {term: '十三和弦', en: 'Thirteenth Chord', definition: '叠到十三音的和弦，包含九音和十一音；实际演奏常省略五音、九音、十一音，记号不变。', example: [['C','13'], ['C','maj13'], ['C','m13']]},
      {term: '避免音', en: 'Avoid Note', definition: '含大三度的和弦（大七、属七、增七、增大七）里的十一音：与三音形成尖锐的小九度，通常避开两者直接碰撞（十三和弦省十一音，十一和弦省三音）。这是常见做法，并不绝对。'}
    ]
  },
  {
    lesson: 4, title: '变化音和弦',
    terms: [
      {term: '变化音', en: 'Alteration', definition: '和弦里被升高或降低半音的五音或延伸音。一共六个：♭5、♯5、♭9、♯9、♯11、♭13；变化只改变音程的性质，不改变度数。', example: [['C','7(♭9)'], ['C','7(♯5)'], ['C','7(♯11)']]},
      {term: '变化音和弦', en: 'Altered Chord', definition: '带有变化音的和弦。变化音写在括号里，放在记号最后（转位时写在斜线前面），几个变化音用逗号分开、从小到大排列；替换 7 的数字只能是自然的延伸音。', example: [['C','7(♯5, ♭9)'], ['C','13(♭9)'], ['C','m(♭5)']]},
      {term: '属变和弦', en: 'Altered Dominant', definition: '变化音由演奏者自由决定的属七和弦，记作 alt：可以从六个变化音里选择，至少用一个。', example: [['G','7alt']]}
    ]
  },
  {
    lesson: 5, title: 'add、sus、omit 和弦',
    terms: [
      {term: '附加音和弦', en: 'Added-note Chord', definition: '在三和弦上直接加进二音、四音或六音的和弦，没有七音。二音、四音写 add；六音直接写 6，二音和六音一起写 6/9。', example: [['C','add9'], ['C','6'], ['C','6/9']]},
      {term: '挂留音和弦', en: 'Suspended Chord', definition: '用大二度或纯四度替换三音的和弦，用 sus 标记；三音被换掉，所以不分大小。sus 紧跟在 7、9、13 后面。', example: [['C','sus4'], ['C','sus2'], ['C','7sus4']]},
      {term: '省略音和弦', en: 'Omitted-note Chord', definition: '去掉和弦里某个音的和弦，用 omit（或 no）标记。按惯例的省略（五音、延伸音和弦里的九音、十一音）不用写出来。', example: [['C','7(omit3)']]},
      {term: '强力和弦', en: 'Power Chord', definition: '只有根音和纯五度的和弦，写作 5，可以看作 omit3 的专用写法；没有三音，所以不分大小。', example: [['C','5']]}
    ]
  },
  {
    lesson: 6, title: '综合应用',
    terms: [
      {term: '和弦排列', en: 'Voicing', definition: '和弦音在实际演奏中的具体排列：用哪些音、各在哪个八度、谁在低音。常见的排列中，延伸音与根音之间是超过一个八度的复音程，很少和低音构成单音程。'}
    ]
  }
];

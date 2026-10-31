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
      {term: '和弦性质', en: 'Chord Quality', definition: '由根音到三音、五音的音程决定；三和弦有大、小、增、减四种。'},
      {term: '大三和弦', en: 'Major Triad', definition: '根音到三音为大三度（M3），到五音为纯五度（P5）。', example: [['C',''], ['C','M'], ['C','maj']]},
      {term: '小三和弦', en: 'Minor Triad', definition: '根音到三音为小三度（m3），到五音为纯五度（P5）。', example: [['C','m'], ['C','min'], ['C','−']]},
      {term: '增三和弦', en: 'Augmented Triad', definition: '根音到三音为大三度（M3），到五音为增五度（A5）。', example: [['C','aug'], ['C','+']]},
      {term: '减三和弦', en: 'Diminished Triad', definition: '根音到三音为小三度（m3），到五音为减五度（d5）。', example: [['C','dim'], ['C','°']]},
      {term: '后缀', en: 'Suffix', definition: '写在根音之后、说明和弦性质的部分；有英文缩写与专属符号两种写法。'},
      {term: '英文缩写', en: 'Abbreviation', definition: '取自英文名称前三个字母的后缀：maj、min、aug、dim（大三和弦也可写 M，或省略）。'},
      {term: '专属符号', en: 'Symbol', definition: '约定俗成的后缀符号：△、−、+、°；「−」表示小三和弦，不是减三和弦。'},
      {term: '等音', en: 'Enharmonic', definition: '音高相同、音名不同的音，如 A♯ 与 B♭；构建和弦时，音名必须按三度拼写，不能互换。'},
      {term: '转位', en: 'Inversion', definition: '看哪个和弦音在低音：根音在低音为原位，三音为第一转位，五音为第二转位。'},
      {term: '原位', en: 'Root Position', definition: '根音在低音的排列。'},
      {term: '第一转位', en: 'First Inversion', definition: '三音在低音的排列。', example: [['C','','E']]},
      {term: '第二转位', en: 'Second Inversion', definition: '五音在低音的排列。', example: [['C','','G']]},
      {term: '斜线记号', en: 'Slash Chord', definition: '「和弦 / 低音」：斜线前面写和弦，后面写低音；原位不写斜线。', example: [['C','','E'], ['A','m','C']]},
      {term: '简化标记', en: '', definition: '同一个和弦连续出现、只换低音时，只写斜线和新的低音；不能脱离上下文理解。', example: [['D','m'], ['','','F'], ['','','A']]},
      {term: '重复音', en: 'Doubling', definition: '同一个和弦音在不同八度再次出现。'},
      {term: '省略音', en: 'Omission', definition: '和弦中省去的音；三和弦最常省略纯五度，增、减三和弦的五音不能省。'},
      {term: '柱式和弦', en: 'Block Chord', definition: '和弦音同时发声。'},
      {term: '分解和弦', en: 'Broken Chord', definition: '和弦音依次发声；与柱式和弦使用同一个和弦记号。'},
      {term: '和弦外音', en: 'Non-chord Tone', definition: '出现在分解和弦等织体中、但不属于和弦的音；判断和弦性质时可以排除。'}
    ]
  }
];

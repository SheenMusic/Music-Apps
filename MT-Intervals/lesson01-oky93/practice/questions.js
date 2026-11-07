/* Course-owned teaching data. Order, copy, answers and notation preserved. */
const practiceData = {
  "lessonId": "music-theory-practice-01",
  "lessonTitle": "音程理论基础练习 1",
  "questions": [
    {
      "id": "q01",
      "type": "boolean",
      "prompt": "1. 变音记号（如升号、降号）会直接改变音程的度数。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "错误"
      ],
      "explanation": "音程的度数只取决于音符在谱表上的“位置/字母距离”（数线和间的数量），与升降记号无关。升降记号改变的是音数，而不是度数。"
    },
    {
      "id": "q02",
      "type": "boolean",
      "prompt": "2. 音程的度数最多为八度。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "错误"
      ],
      "explanation": "常见的音程度数的确是 1~8 度，但八度并不是两个音理论上的最远距离，超过八度的音程称为复音程（如九度、十度等）。"
    },
    {
      "id": "q03",
      "type": "boolean",
      "prompt": "3. E 和 F 之间的音数是 1。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "错误"
      ],
      "explanation": "音数 1 表示距离是一个全音，但 E 和 F 之间是自然半音，所以 E 和 F 的音数是 0.5。"
    },
    {
      "id": "q04",
      "type": "boolean",
      "prompt": "4. 即使音数不同的两组音，度数也有可能相同。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "正确"
      ],
      "explanation": "比如 C-E（大三度，音数 2）和 C-Eb（小三度，音数 1.5），两者的音数不同，但都是三度音程。"
    },
    {
      "id": "q05",
      "type": "boolean",
      "prompt": "5. 高音谱表第一线和第二线的音为三度关系。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "正确"
      ],
      "explanation": "第一线（E）到第二线（G），包含“第一线、第一间、第二线”共三个位置，数出来是三度。"
    },
    {
      "id": "q06",
      "type": "boolean",
      "prompt": "6. F B之间的音数为3。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "正确"
      ],
      "explanation": "F 到 B 包含 F-G(1) + G-A(1) + A-B(1)，一共是 3 个全音，音数为 3（即增四度/减五度的音数）。"
    },
    {
      "id": "q07",
      "type": "boolean",
      "prompt": "7. 如果两个音程的音数相同，那么度数也一定相同。",
      "options": [
        {
          "id": "opt_true",
          "label": "正确",
          "value": "正确"
        },
        {
          "id": "opt_false",
          "label": "错误",
          "value": "错误"
        }
      ],
      "correctAnswer": [
        "错误"
      ],
      "explanation": "音数相同但度数可以不同。比如 C-F#（增四度，度数为 4，音数为 3）和 C-Gb（减五度，度数为 5，音数为 3），它们的音数都是 3，但度数一个是四度，一个是五度。"
    },
    {
      "id": "q08",
      "type": "single-choice",
      "prompt": "8. 下列音程中，属于“一度”的是哪一个？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. A-Bb",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. B-C",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. A-A#",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. G-A",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "度数看的是字母本身的距离。A 到 A# 的音符字母都是 A（同名音），包含的位置数量为 1，所以是一度音程（增一度）。其余选项字母都发生了改变，属于二度。"
    },
    {
      "id": "q09",
      "type": "single-choice",
      "prompt": "9. 在五线谱中，一个“四度”音程的两个音在视觉位置上呈现什么规律？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 一个在线上，一个在间里",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 都在线上",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 都在间里",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 无法确定规律",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "奇数度数（一度、三度、五度、七度）的两个音视觉上要么“都在线上”，要么“都在间里”；偶数度数（二度、四度、六度、八度）必定是“一个在线上，一个在间里”。"
    },
    {
      "id": "q10",
      "type": "single-choice",
      "prompt": "10. C-A 这对上行六度的音数是多少？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 4.5",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 5.5",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 6",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 9",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 10",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "C-A 是大六度。推算全半音：C-D(1) + D-E(1) + E-F(0.5) + F-G(1) + G-A(1) = 4.5。"
    },
    {
      "id": "q11",
      "type": "single-choice",
      "prompt": "11. 如果在钢琴上先弹奏 G，再弹奏G左边最近的D，这个音程是什么？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 上行四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 下行四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 上行五度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 下行五度",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 和声四度",
          "value": "E"
        },
        {
          "id": "opt_f",
          "label": "F. 和声五度",
          "value": "F"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "先弹 G，再弹其“左边”的音，说明音高是在往低走，属于下行；从 G 往下数到 D（G-F-E-D）正好包含四个音，所以是下行四度。"
    },
    {
      "id": "q12",
      "type": "multiple-choice",
      "prompt": "12. 在音程中，音高相对较低的音被称为什么？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 根音",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 冠音",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 低音",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 高音",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "C"
      ],
      "explanation": "在音程中，下方（较低）的音称为“根音”或“低音”；上方（较高）的音称为“冠音”或“高音”。"
    },
    {
      "id": "q13",
      "type": "multiple-choice",
      "prompt": "13. 如果将 C-E 中的 E 加上一个降号变成 Eb，该音程会发生什么变化？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 度数减少",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 度数增加",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 度数不变",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 音数增加",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 音数减少",
          "value": "E"
        },
        {
          "id": "opt_f",
          "label": "F. 音数不变",
          "value": "F"
        }
      ],
      "correctAnswer": [
        "C",
        "E"
      ],
      "explanation": "字母依然是 C 和 E，所以度数保持“三度”不变；E 降半音后距离 C 更近了，因此音数由原来的 2（C-E）减少到了 1.5（C-Eb）。"
    },
    {
      "id": "q14",
      "type": "multiple-choice",
      "prompt": "14. 关于“二度和声音程”，下列哪些描述是正确的？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 必须是相同乐器同时发声",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 符头的书写位置需要稍微错开",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 具有进行的方向性",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 同时按下 C 和 Db 可以得到“二度和声音程”",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B",
        "D"
      ],
      "explanation": "和声音程是指两个音同时发声。因为二度的两个音位置太近，符头在五线谱上必须紧贴错开记写（B 正确）；同时按下 C 和 Db 即为同时发声的二度（D 正确）。和声音程不需要指定相同乐器，也不像先后发声的旋律音程那样具有明确的前后进行方向性。"
    },
    {
      "id": "q15",
      "type": "multiple-choice",
      "prompt": "15. 关于“和声音程”的记谱，下列说法正确的是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 低音必须记在高音的右侧",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 同谱表的二度需要左右错开排列",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 两个音必须共享同一根符干",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 可以同时被两件乐器演奏出来",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 普通单声部人声一般不能同时唱出和声音程",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "B",
        "D",
        "E"
      ],
      "explanation": "同谱表二度和声音程在五线谱记谱法中，符头为了避免重叠，需要左右错开记写。（B 正确，A 错误）；和声音程是两个音同时发声，完全可以由两件乐器或多人合奏（D 正确）；普通单声部人声一般无法同时唱出两个音（E 正确）；多声部记谱时两个音可以有各自独立的符干，不一定要共享（C 错误）。"
    }
  ],
  "code": "MT01",
  "title": "度数、音数、旋律音程与和声音程",
  "reportTitle": "度数、音数、旋律音程与和声音程",
  "subtitle": "音程理论基础 · 第一课"
};
window.practiceData = practiceData;

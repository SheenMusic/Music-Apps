/* Course-owned teaching data. Order, copy, answers and notation preserved. */
const practiceData = {
  "lessonId": "music-theory-practice-02",
  "lessonTitle": "音程理论基础练习 2",
  "questions": [
    {
      "id": "q01",
      "type": "boolean",
      "prompt": "1. 二度、三度、六度、七度不能通过增加或减少音数来变成纯音程。",
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
      "explanation": "二度、三度、六度、七度属于“大 / 小音程”体系，不使用“纯”作为基本性质。改变音数可以使它们成为大、小、增、减音程，但不会变成纯音程。"
    },
    {
      "id": "q02",
      "type": "boolean",
      "prompt": "2. 一度、四度、五度、八度不能通过增加或减少音数来变成增减音程。",
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
      "explanation": "一度、四度、五度、八度虽然不使用“大 / 小”性质，但可以产生增、减音程。例如纯五度增加一个半音可以成为增五度，减少一个半音可以成为减五度。"
    },
    {
      "id": "q03",
      "type": "boolean",
      "prompt": "3. 增一度比纯一度宽一个半音。",
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
      "explanation": "纯一度的音数为 0；在保持“一度”这个度数不变的情况下，将上方音升高一个半音，就得到增一度。因此增一度比纯一度宽一个半音。"
    },
    {
      "id": "q04",
      "type": "boolean",
      "prompt": "4. 大六度比纯五度多一个半音。",
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
      "explanation": "纯五度的音数为 3.5，大六度的音数为 4.5，两者相差 1 个音数，也就是两个半音，而不是一个半音。"
    },
    {
      "id": "q05",
      "type": "boolean",
      "prompt": "5. 小写字母 m 表示小音程。",
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
      "explanation": "音程性质的英文缩写中，M 表示 Major（大），而小写 m 表示 minor（小）。例如 M3 是大三度，m3 是小三度。"
    },
    {
      "id": "q06",
      "type": "boolean",
      "prompt": "6. 任何度数的音程都可以通过增加或减少半音，产生对应的“增音程”或“减音程”。",
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
      "explanation": "增、减性质原则上可以通过改变音数产生，但教材规定减一度是例外。纯一度的音数已经为 0，没有比它更窄的一度，因此本课程体系中不存在减一度。"
    },
    {
      "id": "q07",
      "type": "boolean",
      "prompt": "7. C 和 F♯ 是一对三全音。",
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
      "explanation": "C–F♯ 是增四度，音数为 3，也就是三个全音，因此属于三全音（Tritone）。三全音可以记作增四度或减五度。"
    },
    {
      "id": "q08",
      "type": "boolean",
      "prompt": "8. 自然音程里不能出现变化音。",
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
      "explanation": "自然音程并不是按照“有没有升降号”来判断的。所有大、小、纯音程以及增四度、减五度都属于自然音程。例如 C–E♭ 虽然出现降号，但它是小三度，因此仍然属于自然音程。"
    },
    {
      "id": "q09",
      "type": "boolean",
      "prompt": "9. M1 是一个错误的音程名称。",
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
      "explanation": "一度属于纯音程体系，不使用“大 / 小”作为基本性质，因此 M1（大一度）是错误的音程名称。正确的基本一度是 P1（纯一度）。"
    },
    {
      "id": "q10",
      "type": "boolean",
      "prompt": "10. 纯八度的低音到高音相距 6 个全音。",
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
      "explanation": "纯八度的音数为 6。因为 1 个音数等于 1 个全音，所以纯八度的低音到高音相距 6 个全音，也就是 12 个半音。"
    },
    {
      "id": "q11",
      "type": "single-choice",
      "prompt": "11. d3 对应的音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大三度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小三度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增三度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减三度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "D"
      ],
      "explanation": "d 是 diminished（减）的缩写，数字 3 表示三度，因此 d3 表示减三度。"
    },
    {
      "id": "q12",
      "type": "single-choice",
      "prompt": "12. 下面哪一个音程是不存在的？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 减一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小六度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯四度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 增八度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "按照本课程的理论体系，纯一度的音数为 0，已经没有更窄的一度，因此不存在减一度。小六度、纯四度和增八度都可以成立。"
    },
    {
      "id": "q13",
      "type": "single-choice",
      "prompt": "13. 关于 C–E♭ 这个音程，下列说法正确的是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 音数为 3",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 属于自然音程",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 属于变化音程",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 大三度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "C–E♭ 是三度，音数为 1.5，因此是小三度（m3）。所有小音程都属于自然音程，所以即使 E♭ 是变化音，C–E♭ 仍然属于自然音程。"
    },
    {
      "id": "q14",
      "type": "single-choice",
      "prompt": "14. 下面哪个音程是自然音程？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 减五度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 减四度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 增一度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "自然音程包括所有大、小、纯音程，以及增四度和减五度。因此四个选项中只有减五度属于自然音程。减五度与增四度的音数都是 3，二者都属于三全音。"
    },
    {
      "id": "q15",
      "type": "single-choice",
      "prompt": "15. F 上行到 B 的具体音程关系为：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 三全音",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 减五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增四度",
          "value": "C"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "从 F 上行到 B，按音名计算 F–G–A–B，共四度；实际音数为 3。纯四度的音数为 2.5，比纯四度宽一个半音，因此 F–B 是增四度（A4）。它同时也是三全音，但题目要求的是具体的“音程关系”，所以应选择增四度。"
    },
    {
      "id": "q16",
      "type": "multiple-choice",
      "prompt": "16. 下面说法正确的有：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 三全音是自然音程中唯一的增减音程",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 所有增减音程都不属于自然音程",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯八度增加半音得到增八度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 所有的大小音程都属于自然音程",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "C",
        "D"
      ],
      "explanation": "A 正确：自然音程中的增、减音程只有增四度和减五度这一对，它们都是三全音。B 错误：增四度和减五度属于自然音程。C 正确：纯八度增加一个半音，在八度度数保持不变的情况下得到增八度。D 正确：所有大音程和小音程都属于自然音程。"
    },
    {
      "id": "q17",
      "type": "multiple-choice",
      "prompt": "17. 下面哪些音程属于自然音程？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大音程",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小音程",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯音程",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 三全音",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "自然音程包括所有大音程、小音程、纯音程，以及增四度和减五度。三全音正是增四度和减五度的统称，因此四项都属于自然音程。"
    },
    {
      "id": "q18",
      "type": "multiple-choice",
      "prompt": "18. 音数为 3 的音程有：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 三全音",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 大四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增四度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 小五度",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 减五度",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "A",
        "C",
        "E"
      ],
      "explanation": "音数为 3 就是三个全音，因此称为三全音。增四度和减五度的音数都为 3，所以 A、C、E 正确。大四度和小五度本身就不符合本课的音程性质命名规则：四度、五度属于纯音程体系，不使用“大 / 小”性质。"
    },
    {
      "id": "q19",
      "type": "multiple-choice",
      "prompt": "19. 不存在的音程名称有哪些？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 减一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 纯五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 大四度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减八度",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 增二度",
          "value": "E"
        },
        {
          "id": "opt_f",
          "label": "F. 纯七度",
          "value": "F"
        },
        {
          "id": "opt_g",
          "label": "G. 小四度",
          "value": "G"
        },
        {
          "id": "opt_h",
          "label": "H. 大三度",
          "value": "H"
        }
      ],
      "correctAnswer": [
        "A",
        "C",
        "F",
        "G"
      ],
      "explanation": "A 减一度不存在：按照教材体系，纯一度的音数已经为 0，不能再缩小。C 大四度不存在：四度属于纯音程体系，不使用“大 / 小”。F 纯七度不存在：七度属于“大 / 小”体系，不使用“纯”。G 小四度不存在：四度属于纯音程体系，不使用“大 / 小”。其余选项均可成立。"
    },
    {
      "id": "q20",
      "type": "multiple-choice",
      "prompt": "20. 关于 C–F 这对双音，说法正确的有：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 上行时为纯四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 下行时为纯五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 音数为 2.5",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 属于自然音程",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 上行增加一个半音就一定会变成减五度",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "C–F 上行按音名计算为四度，音数为 2.5，因此是纯四度（P4），A、C 正确；反过来从 C 向下到 F，按下行方向计算为纯五度，因此 B 正确。纯四度属于自然音程，所以 D 正确。E 错误：C–F 上行增加一个半音，在“四度”这个度数保持不变的情况下，应得到 C–F♯，也就是增四度 A4，而不是减五度。虽然增四度和减五度的音数都为 3，但二者的度数不同，不能只根据音数互相替换名称。"
    }
  ],
  "code": "MT02",
  "title": "音程的性质与自然音程",
  "reportTitle": "音程的性质与自然音程",
  "subtitle": "音程理论基础 · 第二课"
};
window.practiceData = practiceData;

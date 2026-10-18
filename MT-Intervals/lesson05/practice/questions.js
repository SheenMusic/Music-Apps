/* Course-owned teaching data. Order, copy, answers and notation preserved. */
const practiceData = {
  "lessonId": "music-theory-practice-05",
  "lessonTitle": "音程理论基础练习 5",
  "questions": [
    {
      "id": "q01",
      "type": "boolean",
      "prompt": "1. 单音程在转位时，转位前后的度数相加都等于 9。",
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
      "explanation": "一般单音程符合“度数和为 9”，但增八度是特殊情况，转位后为减八度。"
    },
    {
      "id": "q02",
      "type": "boolean",
      "prompt": "2. 纯一度转位后是纯八度，而纯八度转位后是纯一度。",
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
      "explanation": "1 + 8 = 9，而且纯音程转位后仍为纯音程。"
    },
    {
      "id": "q03",
      "type": "boolean",
      "prompt": "3. 增八度转位之后得到的音程是减一度。",
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
      "explanation": "增八度是特殊情况，一次八度移动不能颠倒高低音，因此转位后是减八度。"
    },
    {
      "id": "q04",
      "type": "boolean",
      "prompt": "4. 将原位音程的根音升高一个八度，就一定能完成该音程的转位。",
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
      "explanation": "转位的核心是颠倒高低音位置。复音程或增八度只移动一个八度可能无法完成转位。"
    },
    {
      "id": "q05",
      "type": "boolean",
      "prompt": "5. 单音程转位后只能变成单音程，不能变成复音程。",
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
      "explanation": "转位只要求颠倒高低音位置，并不限制转位后的跨度。"
    },
    {
      "id": "q06",
      "type": "boolean",
      "prompt": "6. 增音程转位后一定是减音程。",
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
      "explanation": "转位时性质互换：增 ↔ 减。"
    },
    {
      "id": "q07",
      "type": "boolean",
      "prompt": "7. 变化音程转位后仍然是变化音程。",
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
      "explanation": "变化音程中的增、减等性质转位后互换；增四度与减五度本身属于自然音程，不属于这里的变化音程。"
    },
    {
      "id": "q08",
      "type": "single-choice",
      "prompt": "8. 原位音程转位后，关于其“性质”变化的说法，正确的是",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大音程变小音程，纯音程变增音程",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增音程变减音程，纯音程保持不变",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 小音程变大音程，纯音程变减音程",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 倍增音程变减音程，倍减音程变增音程",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "大 ↔ 小，增 ↔ 减，倍增 ↔ 倍减；纯性质保持不变。"
    },
    {
      "id": "q09",
      "type": "single-choice",
      "prompt": "9. 将“纯十一度”进行转位，转位后得到的音程是",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 纯五度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 纯四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯十二度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 小五度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "复音程转位前后的度数和为 16：16 − 11 = 5；纯性质保持不变。"
    },
    {
      "id": "q10",
      "type": "single-choice",
      "prompt": "10. 已知某单音程转位后变成了“减七度”，则该原位音程是",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 增九度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增二度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 倍增三度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减二度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "2 + 7 = 9；减的原位性质是增，因此原位音程是增二度。"
    },
    {
      "id": "q11",
      "type": "single-choice",
      "prompt": "11. 音程转位的核心本质是",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 必须将根音升高八度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 必须将冠音降低八度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 必须颠倒原音程的高低音位置",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 必须将单音程变成复音程",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "转位的核心是颠倒两个音的高低位置，并不限定必须移动哪一个音。"
    },
    {
      "id": "q12",
      "type": "single-choice",
      "prompt": "12. m3 转位后的单音程是",
      "options": [
        {
          "id": "opt_a",
          "label": "A. m3",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. m6",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. M3",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. M6",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "D"
      ],
      "explanation": "3 + 6 = 9；小音程转位后变大音程，因此 m3 → M6。"
    },
    {
      "id": "q13",
      "type": "multiple-choice",
      "prompt": "13. 减八度可以转位为：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 增八度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增一度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增十五度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减一度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C"
      ],
      "explanation": "转位只要求颠倒高低音。根据八度移动的方式和次数，可以得到增一度、增八度或增十五度。"
    },
    {
      "id": "q14",
      "type": "multiple-choice",
      "prompt": "14. 下列说法正确的有：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 纯一度转位后是纯八度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增八度转位后是减八度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 乐理中不存在“减一度”和“倍减一度”",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 纯八度转位后是纯一度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "纯一度 ↔ 纯八度；增八度是特殊情况，转位后为减八度；本课程体系中不存在减一度和倍减一度。"
    },
    {
      "id": "q15",
      "type": "single-choice",
      "prompt": "15. 将谱例中的原位音程转位后，得到的单音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 小六度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 大六度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 小三度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 纯六度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "谱例是大三度。3 + 6 = 9；大转小，所以转位后是小六度。",
      "staff": {
        "notes": [
          "C4",
          "E4"
        ]
      }
    },
    {
      "id": "q16",
      "type": "single-choice",
      "prompt": "16. 将谱例中的原位音程转位后，得到的单音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 纯四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 纯五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增五度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减五度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "谱例是纯四度。4 + 5 = 9；纯性质不变，所以转位后是纯五度。",
      "staff": {
        "notes": [
          "D4",
          "G4"
        ]
      }
    },
    {
      "id": "q17",
      "type": "single-choice",
      "prompt": "17. 将谱例中的低音移高八度后，得到的音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 纯一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 纯八度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增一度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减八度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "谱例是纯八度。8 + 1 = 9；纯性质不变，所以转位后是纯一度。",
      "staff": {
        "notes": [
          "C4",
          "C5"
        ]
      }
    },
    {
      "id": "q18",
      "type": "single-choice",
      "prompt": "18. 将谱例中的原位音程转位后，得到的音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 增四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 减五度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯五度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 增五度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "谱例是增四度。4 + 5 = 9；增转减，所以转位后是减五度。",
      "staff": {
        "notes": [
          "F4",
          "B4"
        ]
      }
    },
    {
      "id": "q19",
      "type": "single-choice",
      "prompt": "19. 将谱例中的复音程转位后，得到的单音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 小六度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 大六度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 小三度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 大三度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "谱例是大十度。复音程转位前后的度数和为 16：16 − 10 = 6；大转小，所以得到小六度。",
      "staff": {
        "notes": [
          "C4",
          "E5"
        ]
      }
    },
    {
      "id": "q20",
      "type": "single-choice",
      "prompt": "20. 将谱例中的复音程转位后，得到的单音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大七度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小七度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增七度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 大二度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "谱例是小九度。16 − 9 = 7；小转大，所以得到大七度。",
      "staff": {
        "notes": [
          "C4",
          "Db5"
        ]
      }
    }
  ],
  "code": "MT05",
  "title": "原位音程与转位音程",
  "reportTitle": "原位音程与转位音程",
  "subtitle": "音程理论基础 · 第五课"
};
window.practiceData = practiceData;

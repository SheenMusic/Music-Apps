/* Course-owned teaching data. Order, copy, answers and notation preserved. */
const practiceData = {
  "lessonId": "music-theory-practice-04",
  "lessonTitle": "音程理论基础练习 4",
  "questions": [
    {
      "id": "q01",
      "type": "boolean",
      "prompt": "1. 增八度为最小的复音程。",
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
      "explanation": "增八度虽然音数超过纯八度，但度数仍是八度，所以属于单音程。"
    },
    {
      "id": "q02",
      "type": "boolean",
      "prompt": "2. 大三度的高音移高一个八度后，得到的音程叫复大十度。",
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
      "explanation": "大三度扩展一个八度后是大十度，也可以叫复大三度；不能叫“复大十度”。"
    },
    {
      "id": "q03",
      "type": "boolean",
      "prompt": "3. 十五度没有大音程的性质。",
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
      "explanation": "十五度对应八度，属于纯音程体系，可以用纯、增、减等性质，但不用大、小。"
    },
    {
      "id": "q04",
      "type": "boolean",
      "prompt": "4. 把大二度的低音移低纯八度，会变成大九度。",
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
      "explanation": "大二度扩展一个八度后成为大九度，性质仍然是“大”。"
    },
    {
      "id": "q05",
      "type": "boolean",
      "prompt": "5. 十三度又可以叫复五度。",
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
      "explanation": "十三度对应六度，因此十三度应理解为复六度，而不是复五度。"
    },
    {
      "id": "q06",
      "type": "boolean",
      "prompt": "6. 音程最宽只能到十五度。",
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
      "explanation": "十五度不是音程的上限；十六度以上仍然存在，只是实际使用中通常会简化命名。"
    },
    {
      "id": "q07",
      "type": "single-choice",
      "prompt": "7. 距离最窄的复音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 增八度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 减九度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 减八度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 倍减九度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "D"
      ],
      "explanation": "单/复看度数，不看实际音数。九度已经属于复音程，其中倍减九度的实际距离最窄。"
    },
    {
      "id": "q08",
      "type": "single-choice",
      "prompt": "8. 距离最窄的单音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 倍减一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 减一度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯一度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 增一度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "纯一度的音数为 0；本课程体系中减一度和倍减一度不存在，因此最窄的是纯一度。"
    },
    {
      "id": "q09",
      "type": "single-choice",
      "prompt": "9. 增八度的等音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 小九度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增七度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 减九度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 大九度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "增八度和小九度的实际音高距离相同，但度数不同，因此可以构成等音程。"
    },
    {
      "id": "q10",
      "type": "single-choice",
      "prompt": "10. 十八度简化后的单音程是多少度？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 十一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 十度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 三度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "超过 8 度的复音程，可以通过减 7 得到简化后的度数；超过 15 度的复音程，可以通过减 14 得到简化后的度数。"
    },
    {
      "id": "q11",
      "type": "single-choice",
      "prompt": "11. 比 C 高增九度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. C",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. C♯",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. D♭",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. D",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. D♯",
          "value": "E"
        },
        {
          "id": "opt_f",
          "label": "F. E♭",
          "value": "F"
        }
      ],
      "correctAnswer": [
        "E"
      ],
      "explanation": "九度对应二度。C 向上的大九度是 D，再升高半音得到 D♯，即增九度。"
    },
    {
      "id": "q12",
      "type": "single-choice",
      "prompt": "12. 比 G 低大十度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. D",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. D♯",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. E♭",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. E",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. E♯",
          "value": "E"
        },
        {
          "id": "opt_f",
          "label": "F. F",
          "value": "F"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "十度对应三度。从 G 向下构成大十度，目标音名必须是 E；向下的大三度关系对应 E♭。"
    },
    {
      "id": "q13",
      "type": "multiple-choice",
      "prompt": "13. 下面哪些性质可以用在十一度的音程前？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 纯",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "C",
        "D",
        "E"
      ],
      "explanation": "十一度对应四度，属于纯音程体系，因此可以使用纯、增、减，不使用大、小。"
    },
    {
      "id": "q14",
      "type": "multiple-choice",
      "prompt": "14. 下面哪些性质可以用在十三度的音程前？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 纯",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C",
        "D"
      ],
      "explanation": "十三度对应六度，属于大/小音程体系，因此可以使用大、小、增、减，不使用纯。"
    },
    {
      "id": "q15",
      "type": "multiple-choice",
      "prompt": "15. 下面哪些性质可以用在八度的音程前？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 小",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 增",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 减",
          "value": "D"
        },
        {
          "id": "opt_e",
          "label": "E. 纯",
          "value": "E"
        }
      ],
      "correctAnswer": [
        "C",
        "D",
        "E"
      ],
      "explanation": "八度属于纯音程体系，因此可以使用纯、增、减，不使用大、小。"
    },
    {
      "id": "q16",
      "type": "multiple-choice",
      "prompt": "16. 下面哪些音程是纯四度扩展一个八度之后的复音程？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 复纯四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 纯十一度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 纯十二度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 复纯五度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B"
      ],
      "explanation": "纯四度扩展一个八度后是纯十一度，也可以叫复纯四度。"
    },
    {
      "id": "q17",
      "type": "single-choice",
      "prompt": "17. 谱例中的音程是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大三度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 复大三度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 小十度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 纯十度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "C–E 是大三度，跨越一个八度后是大十度，也可以叫复大三度。",
      "staff": {
        "notes": [
          "C4",
          "E5"
        ]
      }
    },
    {
      "id": "q18",
      "type": "single-choice",
      "prompt": "18. 将谱例中的复音程简化为对应的单音程，是：",
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
          "label": "C. 纯十一度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 复纯四度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "谱例是纯十一度。11 − 7 = 4，因此对应的单音程是纯四度。",
      "staff": {
        "notes": [
          "D4",
          "G5"
        ]
      }
    },
    {
      "id": "q19",
      "type": "multiple-choice",
      "prompt": "19. 谱例中的两个音对应的正确音程名称有哪些？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 大十三度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 复大六度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 大六度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 复大十三度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B"
      ],
      "explanation": "C–A 跨越一个八度后是大十三度，也可以叫复大六度。",
      "staff": {
        "notes": [
          "C4",
          "A5"
        ]
      }
    },
    {
      "id": "q20",
      "type": "multiple-choice",
      "prompt": "20. 关于谱例中的音程，下面哪些说法正确？",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 纯十一度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 复纯四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 属于纯音程体系",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 可以叫大十一度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "B",
        "C"
      ],
      "explanation": "十一度对应四度，因此使用“纯”性质；纯十一度也可以叫复纯四度。",
      "staff": {
        "notes": [
          "C4",
          "F5"
        ]
      }
    }
  ],
  "code": "MT04",
  "title": "单音程与复音程",
  "reportTitle": "单音程与复音程",
  "subtitle": "音程理论基础 · 第四课"
};
window.practiceData = practiceData;

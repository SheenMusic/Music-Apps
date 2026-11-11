/* Course-owned teaching data. Order, copy, answers and notation preserved. */
const practiceData = {
  "lessonId": "music-theory-practice-03",
  "lessonTitle": "音程理论基础练习 3",
  "questions": [
    {
      "id": "q01",
      "type": "boolean",
      "prompt": "1. 相距两个全音的音程一定是大三度。",
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
      "explanation": "虽然大三度的音数是两个全音，但减四度这样的变化音程也是两个全音。"
    },
    {
      "id": "q02",
      "type": "boolean",
      "prompt": "2. 两个音都是自然音的话，不可能构成变化音程。",
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
      "explanation": "变化音程中至少有一个音是变化音，因此两个自然音不会构成变化音程。"
    },
    {
      "id": "q03",
      "type": "boolean",
      "prompt": "3. 所有的性质为增减的音程都是变化音程。",
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
      "explanation": "增四度和减五度是例外，它们属于自然音程。"
    },
    {
      "id": "q04",
      "type": "boolean",
      "prompt": "4. 如果两个音中有一个是变化音，那么一定是变化音程。",
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
      "explanation": "出现变化音不代表一定是变化音程。例如 C–E♭ 是小三度，仍属于自然音程。"
    },
    {
      "id": "q05",
      "type": "boolean",
      "prompt": "5. 增二度和小三度是等音程。",
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
      "explanation": "增二度和小三度的音数都是 1.5，音高可以相同，但度数不同，是等音程。"
    },
    {
      "id": "q06",
      "type": "boolean",
      "prompt": "6. 等音程因为音高音数都相同，所以听感相同。",
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
      "explanation": "等音程的实际音高和音数相同，只是音程名称和度数不同。"
    },
    {
      "id": "q07",
      "type": "boolean",
      "prompt": "7. 自然音程指的是由自然音构成的音程。",
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
      "explanation": "自然音程不是按“有没有变化音”来定义的。例如 C–E♭ 含有变化音，但小三度仍是自然音程。"
    },
    {
      "id": "q08",
      "type": "single-choice",
      "prompt": "8. 比 C 高增二度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. F𝄫",
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
        }
      ],
      "correctAnswer": [
        "B"
      ],
      "explanation": "从 C 向上二度，目标音名必须是 D；比大二度再宽半音，就是 D♯。"
    },
    {
      "id": "q09",
      "type": "single-choice",
      "prompt": "9. 比 C 低增一度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. C♭",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. B",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. A𝄪",
          "value": "C"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "一度必须保持相同音名。C 向下扩大一个半音，就是 C♭。"
    },
    {
      "id": "q10",
      "type": "single-choice",
      "prompt": "10. 比 D 高减三度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. E",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. F",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. F♭",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. D𝄪",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "C"
      ],
      "explanation": "D–F 是小三度，再缩小一个半音就是 D–F♭，即减三度。"
    },
    {
      "id": "q11",
      "type": "single-choice",
      "prompt": "11. 比 F 低减四度的音是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. C♯",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. D♭",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. B𝄪",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. C",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A"
      ],
      "explanation": "F 向下到 C 是纯四度，将下面的 C 升高半音成为 C♯，就得到减四度。"
    },
    {
      "id": "q12",
      "type": "multiple-choice",
      "prompt": "12. 下面哪个音程是变化音程：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 减四度",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增四度",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 减五度",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 增五度",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "A",
        "D"
      ],
      "explanation": "增四度和减五度是自然音程中的例外；减四度和增五度属于变化音程。"
    },
    {
      "id": "q13",
      "type": "multiple-choice",
      "prompt": "13. 下面哪些音程和 C–C♯ 是等音程：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. B–B𝄪",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. B♯–C♯",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. C–D♭",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. E–F",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B",
        "C"
      ],
      "explanation": "等音程要求音高、音数相同，但度数不同。B♯–C♯ 和 C–D♭ 都与 C–C♯ 满足这一条件。"
    },
    {
      "id": "q14",
      "type": "multiple-choice",
      "prompt": "14. 关于变化音程，下面说法完全正确的是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 音数为 0.5 的音程一定是增一度。",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 增一度的音数是 0.5。",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 把大三度的高音升高小二度，就能得到一个增三度的变化音程。",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 把大三度的高音升高增一度，就能得到一个增三度的变化音程。",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B",
        "D"
      ],
      "explanation": "0.5 音不一定是增一度，也可能是小二度；增一度是在音名不变的情况下升高半音，所以大三度的高音升高增一度可得到增三度。"
    },
    {
      "id": "q15",
      "type": "multiple-choice",
      "prompt": "15. 关于等音程，下面说法完全正确的是：",
      "options": [
        {
          "id": "opt_a",
          "label": "A. 度数和音数相同，但音高不同的音程叫等音程。",
          "value": "A"
        },
        {
          "id": "opt_b",
          "label": "B. 音数和音高相同，但度数不同的音程叫等音程。",
          "value": "B"
        },
        {
          "id": "opt_c",
          "label": "C. 音程的音高相同，音数也一定相同。",
          "value": "C"
        },
        {
          "id": "opt_d",
          "label": "D. 音程的音高相同，度数也一定相同。",
          "value": "D"
        }
      ],
      "correctAnswer": [
        "B",
        "C"
      ],
      "explanation": "等音程的音高和音数相同，但度数不同。因此音高相同意味着实际音程距离相同，但记写出的度数可以不同。"
    }
  ],
  "code": "MT03",
  "title": "变化音程与等音程",
  "reportTitle": "变化音程与等音程",
  "subtitle": "音程理论基础 · 第三课"
};
window.practiceData = practiceData;

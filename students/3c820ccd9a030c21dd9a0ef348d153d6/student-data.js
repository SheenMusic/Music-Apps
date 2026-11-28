/* 仅维护必要教学信息；不要填写完整会议转写或联系方式。
 * purchasedMinutes 为购买分钟；sessions 每次追加一条，余额自动计算。
 * 只知道日期和时长时，填写 date 和 durationSeconds（实际秒数，自动四舍五入到分钟）。
 * 已知精确起止时，可改用带时区的 start/end；两种时长来源不能同时填写。
 * topics / homework 为可选文字数组；learningFocus 是可选学习方向。
 */
const studentData = {
  studentName: '阿润',
  courses: [
      {
      id: 'interval-theory',
      title: '音程理论基础',
      enrollmentTitle: '音程理论基础',
      status: 'completed',
      accessEnabled: true,
      currentLessons: [6],
      accessibleLessons: [1, 2, 3, 4, 5, 6],
      accessibleSupplementary: ['interval-fluency']
    },

    {
      id: 'interval-ear-training',
      title: '音程听力训练',
      status: 'active',
      accessEnabled: true,
      currentLessons: [18],
      accessibleLessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      accessibleSupplementary: ['harmonic-fourths-fifths', 'interval-final-exam']
    },

    {
      id: 'chord-theory',
      title: '和弦记号用法',
      enrollmentTitle: '和弦记号用法',
      status: 'active',
      accessEnabled: true,
      currentLessons: [6],
      accessibleLessons: [1, 2, 3, 4, 5, 6],
      accessibleSupplementary: []
    },

    {
      id: 'private-lesson-20261022',
      type: 'private-lesson',
      title: 'private lesson',
      status: 'active',
      pausedUntil: '2026-11-24T00:00:00+08:00',
      accessEnabled: false,
      lessonPackage: {
        purchasedMinutes: 600,
        start: '2026-10-22T00:00:00+08:00',
        end: '2027-01-29T00:00:00+08:00',
        extendedFrom: '2027-01-22T00:00:00+08:00',
        sessions: [
          {
            id: 'session-01',
            date: '2026-10-22',
            durationSeconds: 4644,
            title: '需求分析和学习规划',
            topics: ['视频视觉升级｜乐谱制作工具｜项目驱动学习｜AI工具和个人发展'],
            homework: [
              '视频制作（优先）：准备Sibelius；梳理视频视觉需求，探索升级方案并整理问题。',
              '乐理自评（中期）：借助AI探索乐理知识体系，诊断自身薄弱环节，形成初步学习计划并反馈。'
            ]
          },
          {
            id: 'session-02',
            start: '2026-11-16T14:00:00+08:00',
            end: '2026-11-16T15:00:00+08:00',
            title: 'MIDI 记谱规范与 AI 视频制作',
            topics: ['AI工具选择与网络环境现状｜MIDI录音和记谱规范｜Prompt编写方法'],
            details: [
              {
                heading: '一、AI工具选择与网络环境现状',
                items: [
                  'VPN节点不稳定：当前国内网络政策较严，私人VPN（如泰山）节点常变动，企业级软件相对更稳定。',
                  'ChatGPT订阅受阻：国内Visa卡无法支付，目前通过美国Apple ID购买苹果礼品卡进行订阅。',
                  'Claude生成视频效果佳：使用Claude生成视频无需额外付费，且生成效果优于人工剪辑，但耗时较长。',
                  '结论：先确定现有 AI 工具的能力边界。真的产生必要的需求时，才考虑 Claude 订阅。'
                ]
              },
              {
                heading: '二、MIDI录音与记谱规范优化',
                sections: [
                  {
                    heading: '1. MIDI量化与触键细节',
                    items: [
                      '避免音符过度对齐：录音时建议保留适当自然的触键时间错位，尤其是八度音，过度对齐会导致声音听起来不自然。'
                    ]
                  },
                  {
                    heading: '2. 音符符杠与声部划分',
                    items: [
                      '规整小节需按拍断开符杠：小节内音符较散时，需按拍点分开符杠（如第一、二拍之间不连），避免视觉混乱。',
                      '明确区分旋律与伴奏声部：需通过符干朝向区分不同声部，避免混淆。',
                      '高音区音符符干应朝上：若音符处于高声部，即使休止符在下，符干也应保持朝上以符合规范。'
                    ]
                  },
                  {
                    heading: '3. 节奏型与记谱符号规范',
                    items: [
                      '优先使用六连音：为降低读谱压力，能合并为一拍的节奏（如六个音）应尽量使用六连音记谱。',
                      '慎用32分音符：过多的32分音符会干扰读谱，注意作曲意义上的 32 分音符和Rubato的个人处理之间的区别。',
                      '小音符适用场景：小音符通常用于表达即兴或节奏不确定的段落，常规伴奏不建议滥用，伴奏和旋律之间的声部关系尽量用符干朝向来区分。',
                      '记号的明确方向：当高低声部符干朝向不同时，保持音记号需分别写在符干的上下方，以明确保持对象。'
                    ]
                  },
                  {
                    heading: '4. AI分析与人工校对（重要）',
                    items: [
                      'AI检测音高不一致需人工复核：AI在分析谱面与MIDI时可能报错（如44小节同音重复），需人工核对并指导AI忽略或正确解析。',
                      '同音连线与括号音符处理：需明确告知AI同音连线后的音符在按下后持续亮起，且括号内的音符虽未实际弹奏但需按时点亮。'
                    ]
                  }
                ]
              },
              {
                heading: '三、视频制作流程与AI辅助方案',
                sections: [
                  {
                    heading: '1. 选曲策略与内容形态',
                    items: [
                      '从片段转向长视频：长视频更能体现专业度并具备长尾效应，但制作耗时较长；片段视频将主要用于维持日常更新节奏。',
                      '选曲兼顾流量与喜好：初期为追求转化而追热点，现更倾向于选择能进入心流状态且具留存价值的曲目。'
                    ]
                  },
                  {
                    heading: '2. 基于SVG坐标的AI生成方案',
                    items: [
                      '导出SVG文件供AI定位：MuseScore导出的SVG文件包含坐标信息，AI可通过读取代码精准定位每个音符在画面上的位置。',
                      '坐标对齐验证成功：经测试，AI已能准确识别并定位SVG中的音符坐标，为后续视觉逻辑优化打下基础。',
                      '结合MIDI时间轴控制发光：下一步需将MIDI文件中音符的起始时间与谱面坐标对应，实现音符保持状态下的持续发光效果。'
                    ]
                  },
                  {
                    heading: '3. Prompt编写与工具使用建议',
                    items: [
                      '借助通用大模型设计Prompt：若难以精准描述视觉效果，可先用豆包、ChatGPT等通用大模型理解意图并生成专业Prompt，再交由执行模型运行。',
                      '推荐使用语音输入法：建议使用豆包语音输入法，通过语音快速记录想法并转化为文字，提升指令编写效率。'
                    ]
                  }
                ]
              }
            ],
            homework: [
              '研究并解决Claude等AI工具的稳定网络访问方案。（长期非紧急任务）',
              '课后继续尝试基于SVG坐标与MIDI时间轴的AI视频生成流程，解决光标移动生硬等问题，并整理遇到的困难。',
              '下次线上沟通时，展示完全跑通的视频自动制作流程效果。',
              '下载并安装豆包语音输入法以辅助编写Prompt。'
            ]
          }
        ]
      }
    }
  ],
    learningPeriods: [
      {id: 'term-01', courseId: 'interval-theory', start: '2026-10-29T00:00:00+08:00', end: '2026-11-05T00:00:00+08:00'},
      {id: 'term-02', courseId: 'interval-ear-training', start: '2026-11-04T00:00:00+08:00', end: '2026-11-12T00:00:00+08:00'},
      {id: 'term-03', courseId: 'chord-theory', start: '2026-11-16T00:00:00+08:00', end: '2026-11-24T00:00:00+08:00'}
    ]
  };

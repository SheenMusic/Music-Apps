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
      id: 'private-lesson-20261022',
      type: 'private-lesson',
      title: '一对一音乐课',
      status: 'active',
      accessEnabled: false,
      lessonPackage: {
        purchasedMinutes: 600,
        start: '2026-10-22T00:00:00+08:00',
        end: '2027-01-22T00:00:00+08:00',
        sessions: [
          {
            id: 'session-01',
            date: '2026-10-22',
            durationSeconds: 4644,
            title: '创作方法与音乐学习规划',
            topics: ['视频视觉升级｜动态乐谱｜Sibelius与AI制谱｜乐理学习规划'],
            homework: [
              '视频制作（优先）：准备Sibelius；梳理视频视觉需求，借助AI探索制作方案并整理问题。',
              '乐理自评（中期）：借助AI了解乐理知识体系，诊断自身薄弱环节，形成初步学习计划并反馈。'
            ]
          }
        ]
      }
    }
  ],
  learningPeriods: [],
  learningFocus: [
    {title: '音乐理论与键盘应用', description: '提升听觉反应、移调与即时演奏能力。'},
    {title: '音乐可视化', description: '探索动态乐谱与视频制作流程。'},
    {title: 'AI与创作技术', description: '探索AI辅助创作与自动化工作流程。'}
  ]
};

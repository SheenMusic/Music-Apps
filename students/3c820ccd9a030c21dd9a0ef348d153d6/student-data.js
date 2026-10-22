/* 仅维护必要教学信息；不要填写完整会议转写或联系方式。
 * purchasedMinutes 为购买分钟；sessions 每次追加一条，余额自动计算。
 * 只知道日期和时长时，填写 date 和 durationSeconds（实际秒数，自动四舍五入到分钟）。
 * 已知精确起止时，可改用带时区的 start/end；两种时长来源不能同时填写。
 * content / homework / advice 为可选文字数组；learningFocus 是可选学习方向。
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
            content: ['动态乐谱制作与视觉呈现。','制谱、动画及AI辅助制作流程。','现有钢琴、扒谱与编配能力分析。','听觉反应、移调与即时演奏的学习需求。','AI工具与长期创作方向。'],
            homework: ['使用ChatGPT梳理基础乐理知识体系。','评估现有理论知识与实际应用中的薄弱环节。','整理希望优先解决的问题，作为后续咨询的讨论材料。'],
            advice: ['优先加强听觉理解与键盘演奏之间的联系。','以实际创作需求确定学习内容。','可以先尝试AI辅助制作，积累具体技术问题后再进行专项咨询。']
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

/* 公开虚拟数据，不对应真实购买。修改状态、进度与开放范围可测试不同界面。
 * 周期用 courseId 关联课程；active 的显示状态按其真实起止时间判断。
 * 暂停测试：增加 learningState: 'paused'；全部完成：移除此字段并将课程设为 completed。
 * 一对一 records 在 lessonPackage.sessions 追加；秒数逐次取整，余额自动计算。
 */
const studentData = {
  studentName: '功能测试',
  courses: [
    {
      id: 'interval-ear-training',
      title: '音程听力训练课',
      enrollmentTitle: '音程听力训练课',
      status: 'active',
      accessEnabled: true,
      currentLessons: [4],
      accessibleLessons: [1,2,3,4,5,6,7],
      accessibleSupplementary: ['harmonic-fourths-fifths','harmonic-simple-intervals']
    },
    {
      id: 'interval-theory',
      title: '音程理论训练课',
      enrollmentTitle: '音程理论训练课',
      status: 'active',
      accessEnabled: true,
      currentLessons: [2],
      accessibleLessons: [1,2,3],
      accessibleSupplementary: []
    },
    {
      id: 'chord-theory',
      title: '和弦记号理论训练课',
      enrollmentTitle: '和弦记号理论训练课',
      status: 'completed',
      accessEnabled: true,
      accessibleLessons: [1],
      accessibleSupplementary: []
    },
    {
      id: 'private-lesson-example',
      type: 'private-lesson',
      title: '一对一课',
      status: 'active',
      accessEnabled: false,
      lessonPackage: {
        purchasedMinutes: 600,
        start: '2026-10-01T09:00:00+08:00',
        end: '2027-01-01T21:30:00+08:00',
        sessions: [
          {
            id: 'example-session-01',
            date: '2026-10-10',
            durationSeconds: 4644,
            title: '和声与键盘应用',
            content: ['比较常见和声进行。','在键盘上尝试不同伴奏织体。'],
            homework: ['选一段熟悉的旋律练习伴奏。'],
            advice: ['先保持节奏稳定，再增加变化。']
          },
          {
            id: 'example-session-02',
            date: '2026-10-20',
            durationSeconds: 3635,
            title: '听辨与即兴练习',
            content: ['听辨旋律的运动方向。','在固定和声上进行简短即兴。'],
            homework: ['录制一段简短即兴并整理问题。'],
            advice: ['用较少的音建立完整乐句。']
          }
        ]
      }
    }
  ],
  learningPeriods: [
    {
      id: 'example-ear',
      courseId: 'interval-ear-training',
      start: '2026-10-01T09:00:00+08:00',
      end: '2026-12-01T18:00:00+08:00'
    },
    {
      id: 'example-theory',
      courseId: 'interval-theory',
      start: '2026-09-01T09:00:00+08:00',
      end: '2026-10-15T18:30:00+08:00'
    },
    {
      id: 'example-chord',
      courseId: 'chord-theory',
      start: '2026-09-01T09:00:00+08:00',
      end: '2026-10-01T20:15:00+08:00'
    }
  ]
};

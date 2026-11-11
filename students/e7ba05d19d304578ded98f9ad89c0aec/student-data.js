/* 一对一课沿用旧的计费与统计规则：legacyBilling 课程只记录起止日期，不显示余额或上课记录。 */
const studentData = {
  studentName: '小洋',
  courses: [
    {
      id: 'private-lesson-20260210',
      type: 'private-lesson',
      title: '一对一课',
      status: 'completed',
      accessEnabled: false,
      legacyBilling: true,
      lessonPackage: {
        start: '2026-02-10T00:00:00+08:00',
        end: '2026-09-03T00:00:00+08:00'
      }
    },

    {
      id: 'chord-theory',
      title: '和弦记号用法',
      enrollmentTitle: '和弦记号用法',
      status: 'active',
      accessEnabled: true,
      currentLessons: [1],
      accessibleLessons: [1],
      accessibleSupplementary: []
    }
  ],
  learningPeriods: [
    {id: 'term-01', courseId: 'chord-theory', start: '2026-06-17T00:00:00+08:00', end: '2026-06-24T00:00:00+08:00'}
  ]
};

/* 音程听力训练未正式报名：status 'supplementary' 只开放音程听力综合测试作为辅助训练，不显示状态、不设有效期。 */
const studentData = {
  studentName: '简衡',
  courses: [
    {
      id: 'chord-theory',
      title: '和弦记号用法',
      enrollmentTitle: '和弦记号用法',
      status: 'completed',
      accessEnabled: true,
      accessibleLessons: [1],
      accessibleSupplementary: []
    },

    {
      id: 'interval-ear-training',
      title: '音程听力训练',
      enrollmentTitle: '音程听力训练',
      status: 'supplementary',
      accessEnabled: true,
      accessibleLessons: [],
      accessibleSupplementary: ['interval-final-exam']
    }
  ],
  learningPeriods: [
    {id: 'term-01', courseId: 'chord-theory', start: '2026-06-17T00:00:00+08:00', end: '2026-06-24T00:00:00+08:00'}
  ]
};

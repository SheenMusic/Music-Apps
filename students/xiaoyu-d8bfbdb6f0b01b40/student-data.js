const studentData = {
  studentName: '小羽',
  learningState: 'paused',
  courses: [
    {
      id: 'interval-theory',
      title: '音程理论基础',
      enrollmentTitle: '音程理论基础',
      startDate: '2026-07-15',
      status: 'completed',
      accessEnabled: false
    },
    {
      id: 'interval-ear-training',
      title: '音程听力训练',
      enrollmentTitle: '音程听力训练',
      status: 'completed',
      accessEnabled: true,
      accessibleLessons: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
      accessibleSupplementary: ['harmonic-fourths-fifths','interval-final-exam']
    },
    {
      id: 'chord-theory',
      title: '和弦记号用法',
      enrollmentTitle: '和弦记号用法',
      status: 'paused',
      accessEnabled: false
    }
  ],
  learningPeriods: []
};

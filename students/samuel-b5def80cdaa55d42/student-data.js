/* Manual maintenance only. Progress, visible lesson links and validity are independent.
 * Append a dated learning period to renew; the last dated entry is displayed.
 * URLs and lesson titles live in /learning-resources/course-catalog.js.
 * accessibleLessons controls link display, not authentication or file authorization.
 */
const studentData = {
  studentName: 'Samuel',
  courses: [
    {
      id: 'chord-theory',
      title: '和弦记号理论训练课',
      enrollmentTitle: '和弦记号理论训练课',
      startDate: '2026-06-01',
      status: 'completed',
      accessEnabled: false
    },
    {
      id: 'interval-theory',
      title: '音程理论训练',
      status: 'completed',
      accessEnabled: false
    },
    {
      id: 'interval-ear-training',
      title: '音程听力训练',
      status: 'active',
      accessEnabled: true,
      currentLessons: [12],
      accessibleLessons: [1,2,3,4,5,6,7,8,9,10,11,12],
      accessibleSupplementary: []
    }
  ],
  learningPeriods: [
    {id: 'period-01', start: null, end: null},
    {id: 'period-02', start: '2026-10-13T00:00+08:00', end: '2026-11-10T23:59+08:00'}
  ]
};

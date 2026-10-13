/* Manual maintenance only. Progress, visible lesson links and validity are independent.
 * Append a dated learning period to renew; the last dated entry is displayed.
 * accessibleLessons controls link display, not authentication or file authorization.
 */
const studentData = {
  studentName: 'Samuel',
  courses: [
    {id:'chord-theory', title:'和弦记号理论训练', status:'completed', accessEnabled:false},
    {id:'interval-theory', title:'音程理论训练', status:'completed', accessEnabled:false},
    {
      id:'interval-ear-training', title:'音程听力训练', status:'active', accessEnabled:true,
      currentLessons:[5,6],
      accessibleLessons:[1,2,3,4,5,6,7],
      lessonURLs:{
        1:'/ET-Intervals/01-Direction/',
        2:'/ET-Intervals/02-Distance/',
        3:'/ET-Intervals/03-EchoSinging/',
        4:'/ET-Intervals/04-Octave/',
        5:'/ET-Intervals/05-2nd/',
        6:'/ET-Intervals/06-2nd/',
        7:'/ET-Intervals/07-7th/'
      }
    }
  ],
  learningPeriods:[
    {id:'period-01', status:'expired', start:null, end:null},
    {id:'period-02', start:'2026-10-13T16:07:00+08:00', end:'2026-10-27T16:07:00+08:00'}
  ]
};

/* Learning data only. No background survey, contact details or inferred lesson results. */
const studentData = {
  studentName:'周舰',
  showPeriodDuration:true,
  courses:[
    {id:'chord-theory',title:'和弦记号训练',status:'previous',accessEnabled:false},
    {
      id:'interval-ear-training',title:'音程听力训练',status:'active',accessEnabled:true,
      currentLessons:[9],
      accessibleLessons:[1,2,3,4,5,6,7,8,9],
      accessibleSupplementary:[]
    }
  ],
  learningPeriods:[
    {id:'period-01',start:'2026-09-16T17:15:00+08:00',end:'2026-09-30T17:15:00+08:00'}
  ]
};

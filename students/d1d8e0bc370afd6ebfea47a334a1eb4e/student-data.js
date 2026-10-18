/* 虚拟学员，仅供公开功能测试；不要填写真实个人资料。
 * 学习中：移除 learningState，并至少保留一门 status: 'active'；日期需处于本期内。
 * 暂停中：在 studentName 同级添加 learningState: 'paused'，不改变资源开放范围。
 * 已完成：移除 learningState，将所有 courses 的 status 改为 'completed'。
 * 单门暂停/待开课使用 status: 'paused' / 'pending'；pending 必须 accessEnabled: false。
 * currentLessons 是当前课次，必须包含在 accessibleLessons 中；后者控制可见入口。
 * accessibleSupplementary 控制听力课内补充训练；accessEnabled 控制资料折叠入口。
 * learningPeriods 的 start/end 必须带时区（北京时间 +08:00）；新增周期保留历史。
 * 顶部学习状态按课程及日期计算；截止前72小时内提示即将到期，到期后链接仍可用。
 * GitHub 修改本文件并提交 main 后，Actions 自动校验、生成带新哈希的入口并部署。
 */
const studentData = {
  "studentName": "功能测试",
  "courses": [
    {
      "id": "interval-ear-training",
      "title": "音程听力训练课",
      "enrollmentTitle": "音程听力训练课",
      "status": "active",
      "accessEnabled": true,
      "currentLessons": [
        4
      ],
      "accessibleLessons": [
        1,2,3,4,5,6,7
      ],
      "accessibleSupplementary": [
        "harmonic-fourths-fifths",
        "harmonic-simple-intervals"
      ]
    },
    {
      "id": "interval-theory",
      "title": "音程理论训练课",
      "enrollmentTitle": "音程理论训练课",
      "status": "active",
      "accessEnabled": false
    },
    {
      "id": "chord-theory",
      "title": "和弦记号理论训练课",
      "enrollmentTitle": "和弦记号理论训练课",
      "status": "active",
      "accessEnabled": false
    }
  ],
  "learningPeriods": [
    {
      "id": "example-01",
      "start": "2026-10-18T09:00:00+08:00",
      "end": "2026-12-01T09:00:00+08:00"
    }
  ]
};

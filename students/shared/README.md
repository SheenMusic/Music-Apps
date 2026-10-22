# Student Dashboard V3.0

## 目录与职责

```text
students/
├── <32位随机十六进制字符串>/
│   ├── student-data.js
│   └── index.html                 # 自动生成，不手改
└── shared/
    ├── index.template.html        # 唯一的 HTML 入口生成模板
    ├── dashboard-template.js      # 共享界面结构，只有可信静态 HTML
    ├── dashboard.js               # 安全 DOM 渲染、资源折叠、计时、下载
    ├── dashboard-logic.js         # 无 DOM 的可测试纯函数
    ├── dashboard.css
    └── README.md
```

目录由 `crypto.randomBytes(16).toString('hex')` 生成，不含姓名、拼音或序号。随机路径和 noindex 不是身份验证。学生核心数据不存入 localStorage；不得将背景调查、联系方式、密钥放进公开文件。Teacher 的导航只包含显示名和页面链接，不读取学生学习记录。

## 新增、修改与发布前验证

在仓库根目录执行：

```sh
node scripts/generate-student-pages.mjs --new "显示名"
```

只创建独立数据和自动生成的轻量入口，初始课程与周期均为空。之后编辑该学员 `student-data.js`，再执行：

```sh
node scripts/generate-student-pages.mjs
node scripts/generate-student-pages.mjs --check
node scripts/validate-students.mjs
node scripts/test-dashboard-logic.mjs
node scripts/test-student-tools.mjs
```

生成器对标题中的姓名进行 HTML 转义，数据脚本 URL 带文件 SHA1 内容摘要前8位；不会把其他学习数据嵌入 HTML。相同输入输出一致，检查模式只比较不写入。普通模式拒绝覆盖未标记的既有页面。一次性 `--migrate` 只接收与原共享入口结构完全一致的未标记页面，并在仓库外保存原 HTML 备份；有差异必须人工检查。`--allow-legacy-directories` 仅是迁移期目录校验开关，不是课程分类。

本地修改显示名或数据后，发布前运行生成器；GitHub 上直接提交 `student-data.js` 到 main 时，Pages Actions 会自动执行校验、重新生成入口、检查哈希及相关测试，然后上传生成后的工作区。Actions 不自动回写生成文件到仓库，所以仓库中的 index.html 可能暂时带旧哈希，实际部署使用本次生成结果。校验或生成失败时不会上传和部署。需要新增教师页入口时，在 `teacher/teacher-data.js` 添加显示名与 Dashboard URL，不加入背景调查信息。当前只读 Teacher 页面没有鉴权；入口展示不代表授权管理。

## 数据与课程资源

`currentLessons`、`accessibleLessons`、`accessibleSupplementary`、`course.status` 与学习周期彼此独立。保留未知的历史记录，不推断成绩或课时完成。补充训练只有明确开放 ID 才显示，空配置不产生占位区域。

Enrollment Course 是实际报名或购买的教学课程，Learning Resource 是其对应的在线 App、PDF、课时和练习；两者不是同一层。`courseCatalog.courses` 不必覆盖所有报名课程。校验脚本明确认可：

- `chord-theory`：当前主要使用本地 PDF 教材，没有在线 App 属于正常情况。
- `interval-theory`：对应开发中的 MT-Intervals，报名 ID 与目录名不同，不是废弃课程。

其余未知课程 ID 仍报 Error。已有在线资源按 Catalog 或现有 MT 资源映射校验；不自动修改数据、创建占位 App、重命名课程或新增访问映射。显示标题优先使用当前 `courseCatalog.courses[id].title`，没有在线 Catalog 标题时回退到学员数据标题。教师侧乐理资源的临时显示名不是报名课程名称。

## 学习状态、课程有效期与日历

所有页面统一为 Learning Dashboard → 学员姓名 → 学习进度与课程资料 → 学习进度 → 按报名顺序排列的课程。页眉右侧只显示一次整体状态；单门课程独立显示状态、截止、资料或课程记录。原始课程状态与访问权限仍然分开，不因过期清除链接。

日期必须含明确时区，例如 `2026-10-13T16:07:00+08:00`。所有截止统一按 Asia/Shanghai（北京时间 UTC+8）显示到分钟，格式 `YYYY.MM.DD HH:mm`，午夜也显示00:00；只调整格式，不改变精确截止时刻。已完成课程不显示截止，但原数据保留。没有可靠日期时不显示，不补造开始或截止时间。

有效期来源：

- 一对一课只使用自己的 `lessonPackage.start/end`。
- 系统课优先使用 `learningPeriods` 中 `courseId` 与课程 id 相同的周期；多段时仍优先选择当前有效周期，再选最近未来周期或最近历史周期。
- 兼容旧数据：只有一门未完成系统课且它的状态为 active 时，才把原来的未标记周期用于该课程。已完成课程、其他一对一课不会继承这段日期。
- 多门未完成系统课共用一段未注明归属的周期时，不猜测关联，校验器给 Warning，各课程不显示该截止时间。教师确认后，在原周期记录中标注真实 `courseId`；不同课程应分别保留实际周期，不复制编造日期。

例：`{id: 'term-01', courseId: 'interval-ear-training', start: '2026-10-01T00:00:00+08:00', end: '2026-11-05T18:00:00+08:00'}`。不必改写既有学员数据结构或删除未知历史记录。

`computeCourseStatus` 按本课程状态及其有效期判断进行中、已过期或尚未开始；完成、暂停、待开课状态继续保留。`computeStudentStatus` 汇总：仍有进行中课程就显示学习中；全部完成才显示已完成；没有进行中课程且仅剩过期活动则显示已过期。继续兼容整体 `learningState: 'paused'`，显示暂停中。每分钟、恢复页面可见和浏览器返回时刷新。

“添加到日历”位于本课程截止旁，仅未来截止、非已完成课程显示。微信浏览器仍提示使用系统浏览器。导出的 ICS 使用对应课程真实截止和课程 ID，避免混合课程日历事件相互覆盖；保留 UTC、CRLF、UTF-8 折行和原提醒。重复导入是否覆盖由日历应用决定。

不再渲染独立时间卡、倒计时或学习周期。`showPeriodDuration` 和原始起止数据仍兼容保存，界面不再显示周期长度。

## 托管缓存与工具边界

当前使用 GitHub Pages 静态部署，仓库没有实际适用的自定义缓存头配置。未创建无效的 `_headers` 等文件；查询参数内容版本有助更新缓存，但不能替代平台缓存头。未来若采用支持自定义响应头的平台，可给数据脚本设置 `Cache-Control: no-cache`。

工具仅使用 Node 内置模块：fs/path 读写配置，crypto 生成随机目录及缓存摘要，vm 读取仓库内可信静态配置（**不是执行不可信代码的安全沙箱**），assert 测试，module 兼容浏览器/CJS 逻辑，url 解析脚本位置，os 创建仓库外迁移备份和测试目录，child_process 在临时测试仓库执行 CLI。无需 npm、框架或构建服务。

## 打包

```sh
zip -r students.zip students \
  -x "*.DS_Store" "*/._*" "__MACOSX/*"
```

`__MACOSX` 不是网站资源，不应部署。是否推送和部署按当前维护任务的授权执行。

## 已发送地址的兼容例外

Samuel 使用已发送的固定目录 `samuel-b5def80cdaa55d42`；生成器与校验器明确接受这一项例外，Teacher 入口同步使用该地址。其他现有及新增学员继续采用32位随机十六进制目录，新建命令不受影响。

### 待开课与报名名称

`status: 'pending'` 表示待开课，统一显示“待开课”。此状态必须关闭 `accessEnabled`，未确认日期时保持 `learningPeriods: []`。Dashboard 不记录或显示付款信息。

报名记录可提供 `enrollmentTitle` 作为正式课程显示名；未提供时沿用原有 Catalog / title 回退规则，已有学员不受影响。在线资源集合名称不必与报名产品名称完全一致。教师页使用 `teacher/teacher-data.js` 学生入口列表。背景调查资料不应存入公开静态数据。

学生入口也接受 `姓名slug-16位随机十六进制后缀`，现有入口保持不变。`accessEnabled` 与完成状态独立：已完成课程可继续开放其 `accessibleLessons` 和 `accessibleSupplementary`。补充训练属于音程听力课程内部，不是独立课程；学生只显示明确开放的资源。

暂停学习的学员可设置 `learningState: "paused"`，右上角统一显示“暂停中”。该字段不改变单门课程状态、有效期或已开放资源；恢复学习时移除此字段，重新按现有规则计算整体状态。

## 在 GitHub 手动维护学员

1. 打开对应 `students/<学员目录>/student-data.js`，点击编辑，不需要修改自动生成的 `index.html`。
2. 修改课程的 `currentLessons` 和 `accessibleLessons`：例如当前第5课、开放1–5课，分别填写 `[5]` 与 `[1,2,3,4,5]`。当前课次必须已开放。
3. 按需调整状态或有效期，保留未知记录，不补写未确认的日期、成绩或完成记录。
4. 提交到 main，打开 Actions → Deploy static site to GitHub Pages，等待成功后刷新学员页面。若提交到其他分支，需要先将修改合并到 main 才部署。
5. 失败时查看 “Validate and generate student dashboards” 日志并修正数据。无需手工更新哈希、无需自动提交生成文件。

| 字段 | 维护规则 |
| --- | --- |
| `studentName` | 页面显示名，非公开背景调查资料 |
| `learningState` | 仅支持 `"paused"`，令顶部显示暂停中；恢复或结课时移除此字段，不填写 `active` 或 `completed` |
| `courses` | 报名课程数组，课程 ID 不重复 |
| `courses[].id` | `interval-ear-training`、`interval-theory`、`chord-theory`；报名课程不等于在线资源集合 |
| `title` / `enrollmentTitle` | 必填课程名称 / 可选正式报名显示名；后者优先于资源标题，不必改写旧学员标题 |
| `status` | 单门课程：`active` 进行中、`completed` 已完成、`pending` 待开课、`paused` 暂停中、`previous` 曾参加 |
| `accessEnabled` | 是否显示该课程资料入口，和完成状态独立；`pending` 必须为 false |
| `currentLessons` | 正整数数组，当前课次，必须为已开放课次的子集 |
| `accessibleLessons` | 正整数数组，只显示明确开放的课次；不会推断这些课程已完成 |
| `accessibleSupplementary` | 明确开放的补充训练 ID；两项为 `harmonic-fourths-fifths`、`harmonic-simple-intervals`，空数组不显示补充训练 |
| `learningPeriods` | 周期数组，记录唯一 `id` 和带时区的 `start` / `end`；结束须晚于开始，可保留双方均 null 的未知历史；无周期时 `[]` |
| `showPeriodDuration` | 可选布尔值，控制是否显示周期长度，不改变时间和课程权限 |

页眉状态按各门课程综合判断，课程状态按自己的有效期判断。整体暂停、课程完成、资料开放范围仍彼此独立。没有可靠周期时保留原进行中状态，不推测截止。

## 功能测试学员

目录：`students/d1d8e0bc370afd6ebfea47a334a1eb4e/`，只有公开虚拟数据。它复用正式 Dashboard，包含四门课：

- 听力课：active，2026-10-01 09:00 至2026-12-01 18:00，当前第4课、开放1–7课及两项补充训练。
- 音程理论课：active，2026-09-01 09:00 至2026-10-15 18:30，日期已过期但1–3课仍可访问。
- 和弦记号课：completed，保留2026-09-01 09:00 至2026-10-01 20:15的历史周期，界面不显示其截止。
- 一对一课：购买600分钟，2026-10-01 09:00 至2027-01-01 21:30；两次模拟授课77分24秒及60分35秒，逐次扣除77、61分钟，剩余462分钟（7小时42分钟）。每次有简短纪要和任务。

以上时间全部为北京时间，数据带明确 `+08:00`。系统课程周期逐条通过 `courseId` 关联，不再存在归属歧义。状态示例以2026-10-22为检查日期；它们随实际时间自然变化，过期不会关闭已开放链接。

仅修改虚拟配置即可测试其他状态，不改变真实学员。整体暂停使用 `learningState: 'paused'`；全部完成时移除该字段并将各门课的 status 设为 completed。课时计算仍由共享逻辑自动完成。

学员数据统一使用2空格缩进、不加引号的字段名、单引号字符串和单行简单数组。每门课程单独书写为对象，课程对象之间空一行；无学习周期时写 `learningPeriods: []`。新建学员生成器遵循同样格式，不改变随机目录规则。


## Private Lesson：按分钟计费的共享课时包

每位学生继续使用同一份共享 Dashboard。`courses` 可同时包含短期训练课和 Private Lesson；无需复制页面或改写其他学员的代码。每个独立购买的课时包使用不同课程 `id`，并设置 `type: "private-lesson"`、`accessEnabled: false`。已结束的旧课程和课时包可以保留。

```js
{
  id: 'private-lesson-20261006',
  type: 'private-lesson',
  title: 'Private Lesson · 10 课时包',
  status: 'active',
  accessEnabled: false,
  lessonPackage: {
    purchasedMinutes: 600,
    start: '2026-10-06T15:00:00+08:00',
    end: '2027-01-06T15:00:00+08:00',
    sessions: [
      {id: 'session-01', start: '2026-10-06T15:00:00+08:00', end: '2026-10-06T16:52:00+08:00'}
    ]
  }
}
```

`lessonPackage` 是该课时包有效期和授课记录的唯一来源，不需重复写入学员级 `learningPeriods`。只参加 Private Lesson 的学生使用 `learningPeriods: []`；混合报名者的原短期训练周期继续保留。课时包有效期参与该课程的状态计算；截止直接显示于该课程行，固定显示到分钟，不重复展示日期范围或倒计时。

共享逻辑按授课日期/开始时间排序，逐次将实际秒数四舍五入到整数分钟，再累计扣除。剩余 = 购买分钟数减已销课分钟。仅录入已确认的授课记录，不用此列表保存未来预约。已知起止时间时使用带时区的 start/end（支持整秒），不知道精确时间时使用 date 与 durationSeconds；两种原始时长来源不能同时填写。已确认的计费分钟优先保留，详见下方维护规范。不自动取整到60分钟，不预扣预约。时长超支时如实显示“超用”，不截断为零。到期、暂停、已完成均不清除历史记录，也不自动改变购买时长。

校验会阻止重复 ID、无效/倒置时间、重叠记录、有效期外授课及资料入口配置；超出购买时长给出 Warning，保留实际授课。续购或延期由老师明确更新配置，不自动推断。学员在同一课程列表中直接看到“一对一课”、剩余课时和截止时间。“当前进度”默认收起，展开后只有一套最新优先的授课记录。每条显示日期、计费时长和已有标题，点击有纪要的条目，在原位置展开内容；不嵌套更多折叠。无纪要的记录只展示事实，不创建空白说明。

给周同学、Samuel 等学生接入时，只需在各自 `courses` 中追加上述课程对象并更新上课记录；若原课程确实结束，再明确调整其状态。更新后运行本文件上方的生成、校验及测试命令，并执行 `node scripts/test-private-lessons.mjs`。

共享 CSS、计算逻辑与渲染脚本 URL 也带共享内容摘要；生成器在共享代码更新后为各学生入口刷新版本参数，避免新旧脚本混用。

### 新增一对一学员与课程内容

1. 运行 `node scripts/generate-student-pages.mjs --new '中文姓名'`。
2. 在新目录的 `student-data.js` 中填写一门 `type: 'private-lesson'` 课程，沿用上面的 `lessonPackage`。仅一对一学员使用 `learningPeriods: []`，不要在这里重复填写课时包日期；Teacher 入口按需加入 `teacher/teacher-data.js`。
3. `learningFocus` 数据可继续保留，但统一 Dashboard 不再单独展示学习方向区域。
4. 后续授课只需向 `lessonPackage.sessions` 追加一个唯一 ID 的记录，余额及课程列表自动更新，不改 HTML。

只知道日期、确认实际时长的例子：

```js
{
  id: 'session-01',
  date: '2026-10-22',
  durationSeconds: 4644, // 77分24秒，四舍五入销课77分钟
  title: '创作方法与音乐学习规划',
  content: ['本次内容'],
  homework: ['课后任务'],
  advice: ['学习建议']
}
```

`durationSeconds` 是实际秒数，不另外存储分钟扣除或余额。60分钟填3600；77分24秒填4644。已知精确起止时，可改用原有 `start` / `end`，不能同时填确认时长。仅日期的记录只校验所属日期与有效期是否相交，无法据此判断当天准确起止或重叠，不会编造时间。

课程内容沿用同一条授课记录中的可选 `title`、`content`、`homework`、`advice`，不另建重复的历史记录列表。内容项为文字数组，空项对应标题不显示。外层“当前进度”默认收起；展开后的记录也默认只显示简短行，逐条点击查看纪要，详情彼此独立。没有课程内容的既有记录保留日期和时长，不显示空白纪要。

阿润的配置位于 `students/3c820ccd9a030c21dd9a0ef348d153d6/student-data.js`。所有姓名和摘要通过 textContent 渲染；不存会议转写、联系方式或课包价格。一对一课与系统课共享相同页眉、课程排列和状态位置，显示名统一为“一对一课”，不修改原始报名课程名称。混合报名时分别保留各课程的资料和有效期。

验证命令：`node scripts/validate-students.mjs`、`node scripts/test-private-lessons.mjs`、`node scripts/test-dashboard-logic.mjs`、`node scripts/test-student-tools.mjs`、`node scripts/generate-student-pages.mjs --check`。浏览器检查沿用已有 Playwright：`node --test tests/student-dashboard/private-lessons.test.cjs`，不需要新增运行时依赖。

### 统一取整、显示与历史兼容

计算入口位于 `students/shared/dashboard-logic.js`：

- `roundLessonSeconds(seconds)`：每次授课的实际秒数独立四舍五入为整数分钟。
- `calculateSessionMinutes(session)`：读取一条记录的计费分钟；`summarizePrivateLesson(course)` 对每次结果求和，再从购买分钟中扣除。不能先累计原始秒数再取整。
- `formatLessonMinutes(minutes)`：统一输出 `45分钟`、`1小时`、`1小时17分钟`、`2小时`、`8小时43分钟`，余额、累计及每次时长均使用此函数。不显示秒或 8:43。

录入规则及优先级：

1. `billedMinutes`：教师已明确确认的非负整数计费分钟，优先于原始时长；仅教师明确确认或需要保留历史计费结果时使用，不根据新规则擅自改写。
2. 历史数据若已存 `durationMinutes`，兼容视为已确认分钟；不要求迁移字段。它与 `billedMinutes` 不能同时填写，避免两份确认值。新建整数分钟记录优先使用 `billedMinutes`。
3. 未存确认分钟时，按 `durationSeconds` 或 `start/end` 计算。两者是互斥的原始时长来源。前者使用日期 `date: 'YYYY-MM-DD'`，后者保留带时区的原始时间戳，不因展示隐藏秒而截断。
4. 只有整数分钟可确认、没有原始秒数或精确时间时，使用 `date` + `billedMinutes`。不编造秒数或起止时间。原始时长与已确认计费结果可以并存，分别代表事实记录和计费决定；余额以确认值为准，不强行将确认值改成新规则结果。
5. 新记录有实际秒数时，通常只保存原始秒数，由统一函数计算，无需再写一份可推导的分钟/余额。没有明确确认的计费覆盖时，不自动增加 `billedMinutes`。

历史数据检查：当前鲁茜茜的112、100分钟及剩余388分钟，阿润77分钟及剩余523分钟均保持不变。现有原始起止时间和学员文件未被改写。今后若发现旧记录只有原始起止时间，且新规则会改变已确认余额，先列出每条旧值、新值和余额差异，请教师确认；不能直接重算迁移。若需明确保留旧扣费，应在确认后记录对应的确认分钟，仍保留原时间戳。

### 教师用自然语言提出销课时

例如“阿润今天上课1小时17分24秒，请销课”：

1. 先读取该学员当前课时包及全部 sessions，确认目标姓名、日期和使用中的课时包。
2. 理解实际时长为4644秒，用 `calculateSessionMinutes({durationSeconds: 4644})` 得到77分钟，不要求教师换算。
3. 检查唯一 ID、同日同样时长/内容、已有起止时间是否重复或重叠。相同日期不代表重复；无法判断是否为第二次真实授课时，先确认，不重复扣课。校验器会阻止重复 ID 及已知起止时间的重叠，但无法仅凭日期自动判断所有重复。
4. 在对应 `lessonPackage.sessions` 中追加唯一 ID、真实日期、`durationSeconds: 4644`；只录入已确认的课程摘要。没有精确起止时间时不编造；不要再手写累计消耗、剩余余额或重复的计费字段。
5. 调用 `summarizePrivateLesson` 核对前后余额、运行数据及课时测试，再生成带新哈希的入口。保留旧记录和原始秒级时间戳。
6. 回复“本次扣除1小时17分钟，剩余……”，余额由当前包自动计算；不要把文档示例误当成新的真实授课指令。

本段仅规范后续维护，并未新增、修改或重复销扣任何真实课程。

## 统一列表与本轮数据检查

共享样式位于 `students/shared/dashboard.css`：课程行 `.course-row`、折叠入口 `.course-toggle`、展开容器 `.course-resources`、资源/销课行 `.resource-list .resource-row`、纪要 `.record-notes`。所有列表采用相同字体、行高、留白、基础缩进，标题保留字重层级；箭头继续复用 site-visual 的 disclosure token。无新增卡片、背景或动画系统。

展开系统课仍由 accessEnabled、accessibleLessons 和 accessibleSupplementary 控制；不会因为完成或到期改变权限。音程理论资料复用已有 interval-theory.js 映射，仅显示明确开放的课次，未开放不显示。课程列表底部保留“收起”及焦点返回。

已记录截止均有时区及准确时分，无需补造时间。Samuel 和周舰仅各有一门未完成的系统课，可以安全关联现有周期。功能测试已用独立 courseId 周期覆盖各门系统课程，并新增一对一课时包作为混合测试，所有模拟日期可自由调整。小羽没有有效期记录，继续不显示截止，不补造日期。真实课程进度（如Samuel第6课、周舰第15课）、余额与历史记录均保持原值。

### 手机端轻量维护

`student-data.js` 使用2空格缩进、无引号字段名、单引号字符串。课程分开书写，短数组单行；简短时间记录可单行，较长课程纪要按条目分行。不压缩为整文件长行，也不把单个数字拆成多行。

- 进度：修改 `currentLessons: [6]`；开放范围修改 `accessibleLessons: [1,2,3,4,5,6]`，当前课次必须已开放。
- 状态：改对应课程的 `status`；注意 active 的过期显示由日期计算，不需把真实状态改成 completed。
- 系统课有效期：修改属于该课程 `courseId` 的那段 start/end，保留明确北京时间时区；续期可追加记录保留历史。
- 一对一有效期：只改对应 `lessonPackage.start/end`。
- 销课：在该课时包 sessions 追加独立记录，至少填唯一 id、真实 date 和实际 durationSeconds，或已有精确起止时间；不手写余额。
- 纪要：在该次记录中修改 title、content、homework、advice，短数组可单行，长文字分条便于编辑。没有内容的分类无需填占位文字。

例如确认授课后追加 `{id: 'session-03', date: '实际日期', durationSeconds: 实际秒数, title: '课程主题', homework: ['课后任务']}`；占位值需换成真实数据，不应直接提交。数据解析、校验、生成和销课计算不依赖排版。

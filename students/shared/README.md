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

## 学习状态与时间

日期必须含明确时区，例如 `2026-10-13T16:07:00+08:00` 或 UTC `Z`。统一按 Asia/Shanghai（北京时间 UTC+8）显示，比较使用时间戳。优先选正在进行且结束最晚的周期，其次最近开始的未来周期，最后最近结束的历史周期；保留日期为空的历史记录。没有有效周期时隐藏时间面板并在控制台说明原因。

顶部状态：全部课程 completed 为“已完成”；有 active 课程时，按所选周期显示“尚未开始 / 学习中 / 已过期”；active 无有效周期时仍为“学习中”；其余为“暂无进行中课程”。页面每分钟及恢复可见时更新。课程行保持“进行中 / 已完成 ✓ / 曾参加”，到期不改变课程状态，**也不关闭、隐藏或删除已开放资料**。

周期长度按总时长四舍五入到小时，遵循 `showPeriodDuration`。暂时使用学员级周期；未来不同课程需要独立有效期时，可考虑给 learningPeriods 增加 `courseId`，本轮未改变关联结构。

## 日历提醒

“添加到日历”在有效周期尚未到期时显示，包括未来周期。下载本地 `learning-period-end.ics`，可以导入日历应用；事件在截止时刻开始，持续30分钟，包含提前3天、1天提醒。不调用外部日历 API，不上传姓名或日期。ICS 使用 UTC、CRLF、UTF-8 字节折叠和稳定 UID；**重复导入是否覆盖事件由日历应用决定**。

部分浏览器不支持直接下载。微信内置浏览器改为“请在系统浏览器中打开本页后再添加到日历”。到期后按钮隐藏，学习记录和课程链接保留。

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

顶部“学习中”要求至少一门 `active` 且当前日期在所选有效期内；`learningState: "paused"` 显示“暂停中”；移除该字段且所有课程为 `completed` 显示“已完成”。截止前72小时内，时间卡显示“即将到期”；到期后顶部显示“已过期”，已开放资料仍可访问。不要把付款、状态、开放范围和日期当作同一个字段。

## 功能测试学员

目录：`students/d1d8e0bc370afd6ebfea47a334a1eb4e/`。仅含虚拟数据，使用正式共享模板，不复制真实学员记录。初始听力进度第4课、开放1–4课及两项补充训练；三门报名课程均 active，未映射在线资源的报名课程关闭资料入口。

示例周期为北京时间 `2026-10-18 09:00` 至 `2026-11-01 09:00`。测试其他有效期状态时直接调整其日期，不修改真实学员。暂停时增加 `learningState: "paused"`；完成时移除它并将三门 status 都设为 completed。进度与资源、完成状态与日期始终独立。

正式学员检查结论：Samuel、周舰、小羽的结构、状态、课程 ID、进度/开放范围和日期格式均兼容当前校验器；缩进、单双引号和换行仅属排版差异，本次未修改其数据。以后建议新增配置采用两空格缩进、每门课程独立对象、明确时区和稳定字段名，不必为格式重写历史文件。

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

`lessonPackage` 是该课时包有效期和授课记录的唯一来源，不需重复写入学员级 `learningPeriods`。只参加 Private Lesson 的学生使用 `learningPeriods: []`；混合报名者的原短期训练周期继续保留。课时包有效期参与整体学习状态计算，每个课时包卡片分别显示其有效期状态。

共享逻辑先按上课开始时间排序，再逐次累计实际分钟数。总消耗 = 所有已记录授课的结束减开始；剩余 = 购买分钟数减总消耗。仅录入已确认的实际授课记录，不用此列表保存未来预约。时间须含时区并精确到分钟；不自动取整到课时，不预扣预约。时长超支时如实显示“超用”，不截断为零。到期、暂停、已完成均不清除历史记录，也不自动改变购买时长。

校验会阻止重复 ID、无效/倒置时间、重叠记录、有效期外授课及资料入口配置；超出购买时长给出 Warning，保留实际授课。续购或延期由老师明确更新配置，不自动推断。时间卡片包含总时长、累计消耗、剩余、有效期起止和每次课起止、本次消耗、课后余额。Private Lesson 不显示课时资料及补充训练。

给周同学、Samuel 等学生接入时，只需在各自 `courses` 中追加上述课程对象并更新上课记录；若原课程确实结束，再明确调整其状态。更新后运行本文件上方的生成、校验及测试命令，并执行 `node scripts/test-private-lessons.mjs`。

共享 CSS、计算逻辑与渲染脚本 URL 也带共享内容摘要；生成器在共享代码更新后为各学生入口刷新版本参数，避免新旧脚本混用。

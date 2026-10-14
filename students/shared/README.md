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

如果更新了显示名或数据，必须重新运行生成器。需要新增教师页入口时，在 `teacher/teacher-data.js` 添加显示名与 Dashboard URL，不加入背景调查信息。当前只读 Teacher 页面没有鉴权；入口展示不代表授权管理。

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

`__MACOSX` 不是网站资源，不应部署。本轮分阶段本地提交，不自动推送。

## 已发送地址的兼容例外

Samuel 使用已发送的固定目录 `samuel-b5def80cdaa55d42`；生成器与校验器明确接受这一项例外，Teacher 入口同步使用该地址。其他现有及新增学员继续采用32位随机十六进制目录，新建命令不受影响。

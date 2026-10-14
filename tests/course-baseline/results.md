# Phase 0 / Phase 1 验证记录

起始提交：`d4936c7ddbae8dfbd963c6880b1be983f2d96110`。浏览器：系统 Chromium `151.0.7922.173`；没有安装依赖。审计报告保持原样且未纳入本次提交。

## Phase 0（课程修改前）

- `node --test tests/course-baseline/baseline.test.cjs`：5通过、0失败、3TODO（B01/B03/B04待确认的教学/设备期望）。
- `COURSE_VISUAL_OUTPUT=/tmp/music-apps-phase0 node --test tests/course-baseline/visual.test.cjs`：43通过、0失败；42个viewport/theme/课程组合及1项动画契约。
- 378组状态比较：80项计算样式、元素/伪元素、几何、文本及按钮状态一致；84对初始/报告/结果PNG哈希一致。
- Phase 1作用域隔离测试在共享文件尚未创建时明确SKIP（1项），不计作通过。
- 原课程、公共视觉层、所有非试点原文件未修改。三课DOM/JavaScript逐字保护；MT03全部15题静态完整性及独立答案检查通过。
- ET05/ET06原出题、示范参数、合成波形检测、0.2s通过、十题及报告验证；MT03重试、题号/当前/已答状态、计时、结果、历史、复制与重新开始验证。

截图和`summary.json`位于`/tmp/music-apps-phase0`，可用README中的命令从固定Git基线重新生成。截图未添加到Git。

## 尚未验证

真实Safari/iPhone/iPad、安全区、设备旋转过程、人声/噪声/音高准确率、真实麦克风授权/拒绝与Web Audio生命周期、输出延迟/耳机、系统剪贴板权限与逐帧动画。浏览器真实渲染通过不能替代这些验收；音频/权限/时钟/剪贴板使用测试替身。

## 已知缺陷

未修复音区越界、麦克风流保留、ET06播放/录音竞争、MT03返回首页缺失、题号刷新延迟及原教学文案差异。三个TODO不表示期望行为已实现。它们的现状兼容性观察只适用于本次CSS迁移。

## Phase 1A：共享基础 + ET05

- 新增三个计划中的共享CSS；ET05引用顺序为course-visual → ET base → 本课内联CSS → 原site-visual。作用域使用现有data-visual及`:where`，不改DOM结构、不增加选择器权重。
- ET05移出37个顶层CSS块（36个常规规则及1个窄屏media组），目标、meter、录音/成功状态、报告和教学提示保留本地。内联CSS由9,118 B降到4,456 B；HTML由788行/36,548 B降到729行/32,009 B。
- 行为套件：5通过、0失败、3TODO；试点之外文件哈希、试点DOM/脚本保护通过。
- ET05视觉及动画：15通过、0失败；98状态、28对PNG一致，CSS响应无404、无页面JavaScript错误。
- 共享CSS隔离：1通过、0失败；首页、商店、Catalog、Student Profile、学生Dashboard、Teacher Dashboard各Light/Dark，共12页面对比，native计算样式/几何不变。各新选择器均限定课程；没有新keyframes或新!important补丁（MT基础的.hidden important是原规则迁移）。
- 修正隔离测试的样式注入方式：应用JavaScript禁用时采用同步插入style，避免Playwright addStyleTag等待load回调。仅改测试助手，不改课程行为。
- 截图/summary：`/tmp/music-apps-phase1-et05`。未迁移ET06/MT03及其他页面仍用原样式。

## Phase 1B：ET06接入

- 仅ET06接入已有course-visual/ET base，未改共享文件。移出同样37个顶层CSS块；双音target布局、low/high采集按钮、锁定状态、全局meter和七列报告保持本地。
- ET06内联CSS由9,339 B降到4,622 B；HTML由921行/41,017 B降到855行/36,423 B。
- 行为套件：5通过、0失败、3TODO。ET05/ET06两种教学逻辑及MT03原脚本/题库不变。
- ET06视觉及动画：15通过、0失败；126状态、28对PNG一致；无CSS 404/页面JavaScript错误。
- 共享CSS未再改变；之前ET05的98状态及12个公共/Dashboard隔离结果仍适用于最终共享文件。
- 截图/summary：`/tmp/music-apps-phase1-et06`。

## Phase 1C：MT03接入与最终结果

- 仅MT03引用已有course-visual/Practice base；共享文件仍与Phase 1A提交一致。迁移91个顶层CSS块，涵盖容器、标题、题型badge、选项、反馈状态、题号导航、进度、结果、历史模态及按钮。原题库/解释/脚本/DOM原样。
- 本课保留`:root`教学/兼容变量、`.feedback-box`动画容器、`@keyframes fadeIn`、返回首页按钮样式；未修复返回路径。ET05/06各自的教学视觉也保持本地。
- MT03内联CSS由12,507 B降到1,405 B；HTML由1,709行/46,284 B降到1,127行/35,314 B。
- 行为套件：5通过、0失败、3TODO；全部15题、错题重试、已答/题号状态、计时、结果、历史、重新开始、剪贴板替身均通过。
- MT03视觉及动画：15通过、0失败；154状态、28对PNG一致。没有CSS 404或页面JavaScript错误。
- 最终三课视觉覆盖为ET05 98 + ET06 126 + MT03 154 = **378状态**，28×3 = **84对PNG**。每课分批复跑同一Phase 0矩阵；全程共享文件没有后续改动，因此早期试点结果适用于最终代码。动画契约每批均通过。
- 截图/summary分别在`/tmp/music-apps-phase1-et05`、`/tmp/music-apps-phase1-et06`、`/tmp/music-apps-phase1-mt03`；无需重新安装或下载浏览器。

### 代码规模（不计测试，内联只计一次）

| 文件/口径 | 原行数 | 新行数 | 原字节 | 新字节 |
|---|---:|---:|---:|---:|
| ET05 index.html | 788 | 729 | 36,548 | 32,009 |
| ET06 index.html | 921 | 855 | 41,017 | 36,423 |
| MT03 index.html | 1,709 | 1,127 | 46,284 | 35,314 |
| 三入口合计 | 3,418 | 2,711 | 123,849 | 103,746 |
| 新course-visual.css | 0 | 22 | 0 | 814 |
| 新ET base.css | 0 | 73 | 0 | 6,288 |
| 新MT practice-base.css | 0 | 515 | 0 | 14,798 |
| 三入口+三个新共享CSS | **3,418** | **3,321** | **123,849** | **125,646** |

净减少97物理行；由于零权重作用域前缀、变量fallback、注释和新增引用，字节净增加1,797 B（约1.8KB）。不以缩小字节为此次唯一收益。ET两课原有**40条相同限定规则/158个声明**（含窄屏media内4条）现为共享一份；各课37个顶层块退出内联。MT03只移位置并建立可复用基础，本次没有迁移其他四个Practice页面，不宣称已消除五课全部重复。

目录口径：ET的HTML/CSS/JS为23文件、15,001行、644,858 B；MT为11文件、12,446行、470,183 B；另单列新assets/course-visual.css 22行/814 B。加该文件一次，两系统课程代码从27,566行/1,114,058 B到27,469行/1,115,855 B，原site-visual等公共文件没有变化。

### 加载顺序、范围与回滚

所有试点采用：**course-visual → 对应ET/MT base → 本课保留的内联样式 → 原site-visual**。这保留site-visual原来最后覆盖普通UI/主题的契约；family选择器的`:where`作用域不增加原选择器优先级。保留原media阈值、教学palette、按钮尺寸、圆角、阴影与动画；没有替换全站主题。

CSS只有三个试点加载；所有非试点原文件通过Git对象哈希保护，Dashboard/Catalog/部署配置未修改，隔离测试12个页面/主题也通过。所有新增选择器明确限定ear/practice课程根，新增文件不注册全局keyframes。没有Phase 2–6的JS工具、组件引擎、配置迁移、其他课程接入或旧教学代码删除。

本地提交顺序：Phase 0 `59c7a6d`；共享基础+ET05 `d62e50d`；ET06 `ca01afc`；MT03为本记录所在的Phase 1C提交（`git log -4 --oneline`可查完整SHA）。逐个提交均同时包含完整依赖/引用，不存在链接指向缺失CSS的中间状态。回滚某课的接入提交即可恢复本课内联规则；整体回滚按Phase 1C→1B→1A顺序，不需要更改URL、音频或部署配置。

所有提交仅保存在本地，**未推送、未部署**。上阶段审计报告仍为原有未跟踪文件，哈希不变，没有覆盖/回退它。

### 下一阶段判断

共享CSS基础和试点兼容性已达到本次Chromium自动化成功标准，可以进行Phase 2的设计与范围确认；批量迁移前建议先完成真实Safari/iPhone/iPad与教师教学视觉验收。不得把目前的设备替身验证当成真实权限、音频延迟或人声验证。本次完成Phase 1后停止。

# MT Learning 共享框架：实施与验证记录

> 首次实施记录截至 `23dd0b6`；当前规则以文末 v1.1.2 及独立对齐证据为准，v1.1.0/v1.1.1 为历史记录。下述首次字号、规模与测试数量属于当时结果。

日期：2026-10-17。起点：最新远程 main `3eae716095bd2941f4508184ff074d5df51dd18b`，本地最初为干净的 `work@73d6884`；远程只新增了本任务必读专项规范。独立工作分支 `refactor/mt-learning-framework`，不推送、不合并、不部署。

## 范围与共享边界

只迁移现存三个 Learning：MT01（23步）、MT02（26步）、MT06（4模块）。不新建 MT03–05 Learning，不改任何 Practice、ET、Dashboard、Catalog、学生数据、课程目录、URL、报告核心或部署配置。

生产修改5文件：`MT-Intervals/lesson01/index.html`、`lesson02/index.html`、`lesson06/index.html`、`lesson06/lesson.css`、`lesson06/lesson.js`。

新增共享3文件：

- `MT-Intervals/shared/styles/learning-base.css`：以 MT06 为参考的外壳、安全区、语义排版、Board 尺寸档、导航、首页/完成、响应式和减少动态。
- `MT-Intervals/shared/styles/learning-components.css`：MT01/02 已有谱例容器、原琴键几何、音频按钮、Quiz 与反馈样式。没有通用音程判题引擎。
- `MT-Intervals/shared/learning/theory-lesson.js`：显式步骤元数据、内容/演示分离、节点缓存、返回状态和最小容器滚动。`explanation: null` 可供明确的只更新演示步骤保留讲解；相同 boardKey 可只更新讲解。业务和音乐内容留在课程。

维护4文档：通用规范修订，专项 v1.0.1 技术契约补充，两个旧视觉报告只加历史状态说明。新增本说明与同目录 `learning.test.cjs`；未删除文件。

`learning-base.css` 已在原版恢复时被删除，本次按新的专项契约明确重建，没有悄悄恢复已撤销的旧全课程设计。

## 显式知识链（下列均为1起始编号）

| 课程 | 新概念 | 延伸讲解 | 练习检验 |
|---|---|---|---|
| MT01 | 1、3、6、10、15 | 2；4–5；7–9；11–13；16–21 | 14、22、23 |
| MT02 | 1、6、10、17、19 | 2–3；7；11–14；18；20–23 | 4–5、8–9、15–16、24–26 |
| MT06 | 四个独立复习模块 | 不强制新增 | 既有外部练习，不产生站内成绩 |

MT01 的知识链为音程/根冠音、度数、度数序列、旋律/和声分类、音数；MT02 为二度、三度、纯四五度与三全音、增减性质、五种性质归纳。划分依照原累计段落，保留原文与教学顺序，没有仅按编号推断累积。比如 MT01 的和声音程保留原有旋律分类回顾，并不擅自删掉原稿前缀。

延伸步骤的原累计 HTML 作为内容源；只有显式同组、原节点确为前缀时才 append 新节点。新概念替换内容；Quiz 沿用原判断和通过门槛。后退复用该步的节点、选择/反馈、演示及阅读位置，不提前显示未来段落。会话缓存不读写 localStorage 或学生数据。

示例只更新文字而保留演示：MT01 10→11、19→20；MT02 2→3、21–26 的相同演示。不同演示用独立 key；ResizeObserver 仅重对齐原根冠音标签，不重置练习或重建相同五线谱。

布局稳定后只在新增段落溢出时做最小滚动；段落本身超过视区时从段首阅读，不跳过长段落。滚轮/触摸/指针会取消等待中的自动定位。减少动态使用 instant，无渐显。返回或重新进入已访问步骤不自动重播音频；主动播放与原共享录音组的连续播放保留。

## CSS 与规范清理

实测范围为三页内联 CSS + MT06 CSS + 新增两份共享 CSS，物理文件只计一次，不含未改动的 site 样式：79,381 → 17,469 字节（约减少78.0%）；`!important` 583 → 1，唯一一条是有作用域的 hidden 契约。样式花括号块811→162，仅作为文本规模指标，不冒充独立组件数或精确 CSS AST 规则数。

清理的旧实现包括：stable frame v3/v4、iOS header/safe-area 重复补丁、多层 landscape/wide-screen/final override、失效的 `.lesson-card/.lesson-body` 框架选择器、四套音频按钮几何强制覆盖、重复导航和字号、旧 `.tiny` 同义规格。相同谱例 wrapper 合并，不再靠末尾 important 扩张。

保留 MT02 的双小节与性质逻辑图，MT06 的 SVG、转位与复音程控制，原谱面色彩/比例、琴键非对称圆角和水平滚动、真圆音频按钮。普通容器和按钮使用 site card/control 圆角，折叠规范未改。窄屏复杂复习演示允许在自身容器滚动，正文/导航始终独立。

权威来源按领域：全站 site 主题/圆角/折叠 → 通用课程边界 → MT Learning 专项教学契约。通用文档不再重复旧640/720/1120宽度、8px卡片/按钮、6px进度等已失效参数。

## 自动化与真实浏览器结果

- `learning.test.cjs`：53项通过，0失败，0跳过。包含49个原教学步骤的前后文字、谱例数、琴键高亮和继续门槛对照；原绘谱、判题、音频函数及音频文件映射保护；3课完整点击流程、错题反馈、多选确认、返回/前进状态恢复、最小滚动、减少动态、进度 ARIA、首页/完成和资源链接。
- 响应式：3课 ×7视口 ×2主题 =42场景，742次教学步骤布局检查；320×568、390×844、430×932、844×390、768×1024、1024×768、1280×900。0页脚本错误、0本地404、0页面/讲解横向溢出、0导航遮挡。验证独立长文滚动到底，页眉/Board/导航稳定、17.92px正文与14px普通卡片、页眉无重叠。
- 使用真实 VexFlow 4.2.5，不用空库 fallback；真实 HTML Audio 成功解码、播放 MT01/02 MP3。状态计数测试使用 Audio 替身，另有独立真实播放检查，不宣称验证听感。琴键原本是展示/横向滚动，没有擅自添加点击发声；MT06 原按钮的 Enter/Space 与 aria-pressed 通过。
- 新 CSS 注入 MT03、ET05、Student、Teacher、Catalog，明暗共10组合，计算样式/几何不变；固定起点白名单严格保护非本任务文件。
- 既有 Practice 报告35项通过，包括23课复制快照、题库/数据/历史与报告核心保护。
- 既有 ET05、ET06、MT03、已知缺陷观察4项通过；3条既有 Desired TODO 仍未实现：ET05音区越界、停止麦克风未释放缓存轨道、MT03缺失返回首页。没有改为“通过”。
- 既有普通 UI 套件执行 `desktop/mobile|five live`：42项通过，覆盖分类、Student/Teacher、ET参数、MT题号、手机导航、购买清单及键盘/焦点/现行五档圆角。
- Dashboard逻辑8组与学生工具测试通过；修改的 JS/CJS 语法、资源引用与 `git diff --check` 通过。

保留首轮失败日志：MT06 320×568 演示挤压正文的实际布局问题已修正；MT02 测试误选禁用历史按钮的定位已修正。没有改判题、旧截图阈值、原失败证据或历史结论。

不运行旧全课程312组合与 PNG 像素门禁。UI 历史套件中“所有生产JS不变”“Learning前后几何/教学圆角完全相同”不适用于本次明确授权的改造，未执行；由上述固定起点源码保护、原内容/业务函数对照、新布局与隔离检查替代。没有删除或修改旧测试。

最终 Chromium 151.0.7922.173 / Playwright1.62.1；截图138张及 `responsive.json` 在 `/tmp/music-apps-theory-learning/accepted/`，含桌面/手机、明暗、首页/教学/阅读及12张原版/新版代表对照。截图供观察，不做像素一致判定。日志 `/tmp/theory-accepted.log`、`theory-practice-regression.log`、`theory-behavior-regression.log`、`theory-ui-regression.log`。临时产物、VexFlow缓存不进入仓库。

## 复核命令与限制

环境已安装 Playwright 与 `/usr/bin/chromium`，无需安装依赖。保留原 CDN URL；为网络可重复性，浏览器测试从临时缓存拦截同版本 VexFlow。缓存 SHA-256 在测试中固定校验：`e99d9f8d7ebcb88fe2f4dae3d0c22427493d17f217c2dfac2483bd39b23f3fcf`。

```bash
curl -L --fail https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js -o /tmp/vexflow.js
THEORY_ARTIFACT_DIR=/tmp/music-apps-theory-learning/accepted node --test tests/theory-learning/learning.test.cjs
node --test tests/practice-report/*.test.cjs
node --test --test-name-pattern='ET05:|ET06:|MT03:|Known defects:|Desired ' tests/course-baseline/baseline.test.cjs
node --test --test-name-pattern='desktop/mobile|five live' tests/ui-components/ui.test.cjs
node scripts/test-dashboard-logic.mjs
node scripts/test-student-tools.mjs
git diff --check
```

真实 iPhone/iPad Safari、设备刘海/地址栏动态高度、VoiceOver、物理音频输出/听感和外部 MusicTheory.net 完整练习未验证；外部 URL、noopener、新窗口、原PDF文件存在性已核实，未向外部服务提交答案。没有发现需重新确认的教学内容变更；新页面框架与上述设备限制需在实际设备使用时观察。

## v1.1.0：人工预览反馈修订

继续在同一功能分支修正，不重新开发教学框架。规范已按实际人工反馈升为 v1.1.0，旧1.12rem/2.08不再是正文门禁。

- 全课统一层级：模块24px/1.4（短横屏21px）、小标题17px/1.5、正文16px/1.85、列表15px/1.85、注释/操作13px/1.75、演示标签13px/1.6、参考说明14px/1.7、Quiz题干18px/1.65。共享 token 位于 learning-base.css，MT06 没有独立正文覆盖。
- 阅读区最大34rem、水平居中、段内左对齐；对称 padding 与 stable both-edges 滚动条占位保证追加前后中心不跳动。原谱面外壳内部对齐修正，音乐图形比例仍独立维护。
- 延伸先无位移测量，再240ms渐显/6px轻微进入，同步最小原生平滑滚动；overflow-anchor:none 避免浏览器锚定竞争。手动操作取消等待及正在执行的定位，不留隐藏文字；减少动态/返回位置/原 Quiz 门槛保留。
- MT01/02 独立谱表用 VexFlow setBegBarType(NONE) 隐藏左起始线；结构性 BarNote、手绘中间分隔线和结束线保留。原函数保护断言只规范化这一个获授权配置调用，不能掩盖音符、答案或其他逻辑变化。
- 三课共用方向键导航，排除输入/编辑、Quiz、演示按钮及其原生操作；保留 Enter/Space，禁用的继续按钮仍不能被绕过。精确指针默认显示提示，触屏使用框架方向键后显示，固定提示行避免导航移动。

新增预览反馈检查覆盖三课×五类视口的层级/居中、连续多个延伸步骤的真实逐帧 opacity/scroll/旧文位置、读者滚轮中止正在执行的原生平滑滚动、返回、触屏提示、Quiz/音乐按钮/输入的键盘排除，以及真实 VexFlow 起始/内部/结束线。

最终验证结果、截图和限制随本次提交一并记录；原始首轮实施结果与历史失败报告保持不变。新的截图目录为 `/tmp/mt-learning-v1.1-accepted/`，连续动作逐帧证据为 `smooth-motion.json`；不上传临时截图或运行缓存。真机 Safari、安全区动态变化、VoiceOver 和实际听感仍未验证。

本轮最终结果：Learning整套57项通过、0失败；另以触控设备模拟复核三课×五视口的层级、水平中心和演示按钮触达（1项测试、15场景）通过。连续帧验证覆盖新文渐显、滚动中间位置、旧文仅随容器移动，以及真实 wheel 对已开始平滑滚动的接管。Practice报告35项、相关UI18项、既有行为4项通过（另3项既有TODO）；Dashboard逻辑8组和学生工具检查通过。JavaScript语法、资源路径和git diff检查通过。未修改非目标页面。

日志：`/tmp/mt-learning-v1.1-accepted.log`、`/tmp/mt-learning-v1.1-touch.log`、`/tmp/mt-learning-practice-regression.log`、`/tmp/mt-learning-behavior-regression.log`、`/tmp/mt-learning-ui-regression.log`。首轮谱表专项测试误把 MT02 的 BarNote 内部分隔当成手绘 SVG line，已按实际组件类型校正断言；未因此修改或删除原结构线。首轮日志仍保留在 `/tmp/mt-learning-feedback.log`，不把它改写为通过。

## v1.1.1：垂直居中与渐进滚动修正（2026-10-17）

实施起点为干净的 `refactor/mt-learning-framework@58c42f5de00dc8afadd798a56e793e9c33bf5e50`。本次仅修改三课的内容包装层接入、共享显示 CSS/运行时、规范和相关测试；保留16px/1.85及已有层级、34rem阅读宽度、全部原文/Quiz/谱例/音频参数。

### 布局及状态契约

- `.lesson-content` 是固定的、可聚焦的滚动视口，内部新增 `.theory-explanation`。外层纵向 flex、内层 `flex:none; margin-block:auto`：空间足够时上下等分，溢出时自动外边距归零，首行从滚动起点可达。无需每帧 JavaScript 改写 top/margin，也不在滚动视口上使用强制 center。
- 原 `body` 内容操作仍指向内部文字/Quiz 容器；快照保留内部节点与外层滚动位置。短内容返回、溢出返回及再次前进均由同一 CSS 恢复居中或顶部模式。
- continuation 提交前后记录内容层位置，以240ms Web Animations FLIP 平滑移动旧文字，新段落轻微渐显。定位只滚讲解视口，并在变换前测量、限制自然滚动范围；过长新段优先显示段首。
- 滚轮/触摸/指针/键盘阅读取消等待或执行中的自动定位。聚焦溢出阅读区时上/下方向键用于原生滚动，左/右仍能导航；减少动态模式不创建过渡动画。清理动画 class 时恢复原本无 class 的属性状态，避免前缀匹配失败而重建旧段落。

### 本轮验证与证据

复核命令：

```sh
THEORY_ARTIFACT_DIR=/tmp/mt-learning-vertical-final node --test tests/theory-learning/learning.test.cjs
node --test tests/practice-report/*.test.cjs
node --test --test-name-pattern='ET05:|ET06:|MT03:|Known defects:|Desired ' tests/course-baseline/baseline.test.cjs
UI_CASES=teacher,student,practice,settings node --test --test-name-pattern='desktop/mobile|five live' tests/ui-components/ui.test.cjs
node scripts/test-dashboard-logic.mjs
node scripts/test-student-tools.mjs
```

- Learning：完整59项通过、0失败；随后针对最终键盘焦点规则及源码保护的定向复核2项通过。原有49个教学步骤与固定原课程的文本、音符、键盘高亮、门槛及音频映射仍严格对照；完整23/26步及MT06四模块、Quiz答错/恢复、真实音频资源解码、谱表起始/内部/结束小节线均验证。
- 原有42个视口/主题场景（3课 × 7视口 × Light/Dark）遍历53个教学步骤，共742个逐步布局检查；新增每步内容高度与中心/顶部可达性断言。触控模拟另测三课×五视口。
- 新增可控临界案例：80px/200px内容在220px视口分别留70px/10px顶部空隙；245px内容转为25px滚动范围。继续追加400px单段，验证段首可见及末尾可达；多次返回、重新前进恢复原节点数与12px手动滚动位置，键盘接管取消延迟定位；同场景覆盖减少动态。
- 首次全套运行与其他浏览器回归并发时有2项动效采样失败（旧文字单调移动、中间帧数），原始日志 `/tmp/mt-vertical-full.log` 保留。未放宽断言；定向复核通过，其他回归完成后独立串行执行全套59项通过，最终日志 `/tmp/mt-vertical-full-final.log`。
- 新增真实 Chromium RAF 连续帧记录及 CDP PNG 帧录制，使用系统已有 ffmpeg 按真实时间戳生成 MT01/02 的 WebM；未放慢课程动画或注入替代动效。记录包含旧段落初始/中间/最终Y、scrollTop、新段透明度及整页滚动。帧数断言需避免与其他浏览器测试并发，防止重负载丢帧。
- 指定截图位于 `/tmp/mt-learning-vertical-final/vertical-mt01-step{1,5,9}-1280x900.png`、`vertical-mt02-step{1,3}-1280x900.png`、`vertical-mt01-step1-{390x844,844x390}.png`。手机截图使用触控模拟；`mt01-continuous.webm` / `mt02-continuous.webm`、对应 `*-continuous-frames/` 与 `vertical-motion.json` 提供实际连续动画证据，`smooth-motion.json` 提供独立溢出滚动证据。
- 报告回归35项、相关UI18项、既有行为4项通过，另3项既有TODO（ET音区、麦克风生命周期、MT03返回首页）保持未实现。Dashboard逻辑8组和学生工具测试通过。源码、语法、资源引用及非目标CSS隔离检查通过。

浏览器为本机 Chromium，视口/触控模拟不等于真实 iPhone/iPad Safari；真实安全区、VoiceOver和实际扬声器听感仍未验证。截图、视频、临时日志仅在 `/tmp`，不提交到正式网站；未新增依赖。此前测试记录和历史证据保留。本次只推送功能分支并更新 Draft PR #1，不合并 main，不部署。


## v1.1.2：演示始终居中、讲解按实际布局对齐

根据第二轮预览反馈修正v1.1.1：演示始终按真实可见音乐内容居中（含标签，不含音频按钮）；讲解只有实际双栏布局才居中，上下布局始终顶部阅读。此前关于所有方向均居中的叙述仅是历史实现记录，已由专项规范v1.1.2替代。

根因、实现边界、九个指定场景截图、中心差、两段真实动画及测试说明见 [独立对齐实施证据](alignment-evidence/README.md)。本轮 Learning 完整61项通过、0失败，含全部742次响应式逐步布局、两种模式动画、旋转不重建SVG、标签/引线锚点、超高演示可访问性。非目标源码与CSS隔离、Quiz/音频/状态回归均通过。

复核：`THEORY_ARTIFACT_DIR=/tmp/mt-independent-alignment/final-accepted node --test tests/theory-learning/learning.test.cjs`。测试只读课程内容，试验性溢出数据只注入浏览器；常规临时截图/日志不提交，本次按交付要求仅提交代表截图、录屏、测量和说明。

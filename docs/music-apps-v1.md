# Music Apps V1.0 — MT01–05 架构实施记录

起点：`main` / `8e3dd0d8fbcdcf8e9bf3d35ce5837aca9faf75a1`。实施于独立分支 `refactor/music-apps-v1`，按授权通过后合并推送 main。未引入框架、TypeScript、构建工具或新的运行依赖。原审计文件 `docs/course-architecture-audit.md` 在此次起点不存在，未创建虚假的历史报告。

## 目录与数据基线

| 课程 | 原 Practice | 当前首页 / Learning / Practice | 题数 | 谱例题 |
|---|---|---|---:|---:|
| MT01 | lesson01/practice/index.html | lesson01/{index.html,learning/index.html,practice/index.html} | 15 | 0 |
| MT02 | lesson02/practice/index.html | lesson02/{index.html,learning/index.html,practice/index.html} | 20 | 0 |
| MT03 | lesson03/index.html | lesson03/{index.html,learning/index.html,practice/index.html} | 15 | 0 |
| MT04 | lesson04-x3n6cu/index.html | lesson04/{index.html,learning/index.html,practice/index.html} | 20 | 4 |
| MT05 | lesson05-s2e2f4/index.html | lesson05/{index.html,learning/index.html,practice/index.html} | 20 | 6 |

以上路径均位于 `MT-Intervals/`。每课题库独立为 `practice/questions.js`，保留原 `lessonId`、`lessonTitle` 和所有 questions 字段。逐字段、顺序对照固定起点，合计90题；没有修改题干、选项、正确答案、解析或 staff 音符。基线原路径、数量和原始数据 SHA256 在 `tests/music-apps-v1/baseline.json`。

MT01/02 原 Learning 移至 learning/，只校准相对路径、接入 Notation 工厂并添加课程首页入口。原讲解、演示、Quiz、音频参数、独立居中/滚动机制继续保留。MT03–05 仅提供“本课内容正在建设中。”，没有编造课程或学习进度。

按明确授权，MT04/05 不保留旧随机目录或重定向。ET 随机目录及 URL 全部保持不变。

## 共享实现与边界

- `shared/practice/practice-engine.js`：无 DOM 状态引擎。原正确率、尝试记录、累计时间、答对完成条件和会话历史格式保留。已尝试但未答对不会误标为“需要复习”；答对且 attempts>1 才需要复习，仍计入进度。
- `shared/practice/practice-ui.js`：以原 MT05 为基础的一套公共结构和交互。题目导航、三种题型、反馈、结果、历史、重新开始统一；只读回看有独立模式和返回结果按钮，不修改成绩、时间、尝试或历史。
- `shared/styles/practice-base.css`：以原 MT05 为基础的一套公共视觉，主题继续来自 site-visual；旧 MT 样式地址保留 import，避免独立维护第二套当前 UI。
- `shared/notation/notation-{config,renderer}.js`、`notation-styles.css`：公共 Renderer/Stave/Formatter 工厂，静态单音、音程、和弦及谱号/临时记号支持，响应式重绘。`showInitialBarline:false` 控制谱号前起始线；内部有音乐意义的边界保留。默认缩放、间距格式器选项均可集中配置。
- 原 Learning 的专属 Voice、变音示范、音符标注和交互仍在课程内；只经共享工厂创建谱面，避免重写教学功能。当前 MT01/02 的 Renderer/Stave/Formatter 创建都已接入，MT04/05 Practice 仅提供 score 数据。
- 复用原 `assets/practice-report.js` 与 `MT-Intervals/shared/utils/format-time.js`，两文件字节不变。

未来课程接入、加载顺序、数据格式与扩展边界见 [shared/README.md](../shared/README.md)。没有实现未来的节奏引擎或乐谱编辑器。

## 链接与保护范围

`learning-resources/interval-theory.js` 只更新 MT04/05 的首页 URL 两处。Teacher 通过这份映射渲染课程入口，其他导航保持业务逻辑不变。扫描当前生产 HTML/JS/JSON，没有仍指向两个旧随机目录的内部链接；五课的15个入口与资源路径均检查。

没有修改学生个人数据、进度、课程开放状态、有效期、Student/Teacher Dashboard 源码、Catalog、支付、ET、MT06 或部署工作流。原报告核心、时间工具、Learning CSS 与运行时也保持字节不变。

## 验证结果

- MT05 先行：16项通过，0失败，再迁移其余四课。
- V1.0 完整测试：**65通过、0失败**。覆盖90题原始对象比较、每课三种题型、错误重试、跳题/前后题、Review 与进度100%、只读回看、冻结计时/成绩/历史、重练、报告快照、资源与 JS 语法、样式隔离。
- Chromium Practice：5课 × 5视口 × Light/Dark = **50组**。视口为390×844、844×390、768×1024、1024×768、1280×900；检查初始、题目/导航、全部谱例、完成结果、历史弹窗，未发现横向溢出、弹窗超出视口或资源404/页面脚本错误。另实测高低谱号、单音、两音、四音和弦及全局起始线配置。
- 既有 Learning 回归：**61通过、0失败**。49个 MT01/02 教学步骤对照原文本/谱例/键盘/门槛与音频映射，完整 Quiz 流程、独立滚动、恢复、演示对齐、方向键、Reduced Motion 和42组视口/主题检查（含未修改的MT06）通过。
- 既有23练习报告：**35通过、0失败**。含固定文本快照和实际浏览器剪贴板事件；ET 报告适配器与所有 ET 数据/脚本保留。
- 学员校验：0 Error / 0 Warning；生成检查4页一致；Dashboard 8组及附加状态测试、学员工具测试通过。
- 既有 ET05/06 行为检查通过；其麦克风资源释放、音区策略属于本次范围外的旧 TODO。旧 MT03 返回地址 TODO 的原始历史文件保留；当前新目录的返回首页由 V1.0 链接测试覆盖。
- Git diff 检查通过。最后的可配置科目页眉/报告类型默认值及 CSS 作用域兼容调整另外运行针对性单元、报告和隔离回归。

旧测试适配仅处理当前路径/共享工厂及授权范围。原 Learning 音乐/教学基线提交不变；一个旧断言原本在内容404px、视口411px且全部可见时仍强制要求 scrollTop>0，已改为按真实溢出判断；临界溢出、大段落和滚动恢复专测保持严格。首次失败日志保留在临时目录，没有通过修改教学/滚动代码掩盖失败。

### 证据与限制

本机截图 `/tmp/music-apps-v1/`，Learning 图像/动画证据 `/tmp/music-apps-theory-learning/`；运行日志 `/tmp/mt-v1-*.log`。临时截图、浏览器缓存及日志不提交到正式网站。

使用真实 Chromium 和原 VexFlow 4.2.5；视口模拟不等于真实 iPhone/iPad Safari。外部 CDN 在测试中由原版本文件替代，未重新验证公网 CDN 可用性；没有新增音频/麦克风算法，ET 行为回归使用既有设备替身，不能代替真机音准或听感验证。没有运行已废止的历史 PNG 一致性/旧全课程视觉统一门禁，不将其视为 V1.0 验收标准。

# Music Apps V1.0 共享组件

仅需静态文件，GitHub Pages 直接运行；不需要构建。当前消费者为 MT01–05，MT06、ET 与学生业务数据保持独立。

## 新增课程

```text
lessonXX/
  index.html              # Learning 首页及互动教学，直接提供课后练习入口
  practice/index.html     # 复用任意一课的薄入口，调整标题
  practice/questions.js   # 唯一的课程配置和题库
```

复制薄入口时校准相对路径。不要复制旧答题脚本或内联 CSS。MT01–05 的 index.html 就是 Learning 首页，不另建 Learning / Practice 选择页或 learning/ 子目录。当前 MT04/05 实际目录为 lesson04/lesson05；本次首页修正保留这些既有名称。

`questions.js` 在 UI 脚本前定义 `window.practiceData`：保留 `lessonId`、`lessonTitle`，增加 `code`、`title`、`subtitle`、`reportTitle`；`questions` 每题包含 `id`、`type`（boolean / single-choice / multiple-choice）、`prompt`、`options: [{id,label,value}]`、`correctAnswer: [value]`、`explanation` 和可选的 `staff`。可选 `brand` 覆盖页眉科目名、`reportType` 对接未来报告类型（当前五课默认 mt；不提前实现其他报告格式）。不要改动既有题目 ID、答案、音符及顺序。

## Practice

- `practice/practice-engine.js`：无 DOM 状态引擎；`PracticeEngine.create(data, {now, formatTime})`。注入时钟/格式器方便测试和未来课程使用；浏览器默认复用已有 `MTFormatTime`。
- `practice/practice-ui.js`：MT05 成熟界面结构，统一渲染、选择、反馈、导航、历史弹窗及复制。只在有 `#practiceApp` 的 Practice 入口加载。
- `styles/practice-base.css`：五课唯一公共样式，基础作用域为现有 `html[data-visual="practice"]`（适配缓存中的旧课程 HTML），新引擎专用规则另用 `data-practice`，沿用 `site-visual.css` 的主题、字体和圆角。MT 旧样式路径仅保留 import 兼容入口。
- 时间和报告分别复用 `MT-Intervals/shared/utils/format-time.js`、`assets/practice-report.js`，没有第二套文本格式。

状态：未作答 → 已尝试 → 一次答对 / 需要复习。只有答对才计入完成进度；需要复习也已完成。准确率保持“已完成题数 / 总提交次数”，全部完成时等于原来的“总题数 / 总提交次数”。

完成后只读 Review 不提交、不计时、不改成绩、不新增历史；明确的“返回结果”回到已冻结结果。重练清空当前答题状态，保留本页会话历史。

历史继续为**各页面内存数组**，关闭/刷新即失效，没有 localStorage 键或迁移。每条仍是 `{timestamp, accuracy, totalTime, totalAttempts, stats}`，逐题仍是 `{attempts, timeSpent, isSolved, wrongChoices}`。不要混入其他课程数据或把“建设中”视为学员进度。

## Learning

MT01/02 完整互动教学位于课程根 index.html，继续使用 `MT-Intervals/shared/learning/theory-lesson.js` 和原共享排版。MT03–05 的根首页复用同一首页结构，提供“开始学习 / 课后练习 / 辅助练习”三个入口；两个未实现入口为原生 disabled 按钮，只有课后练习正常跳转，不创建占位页或额外交互。未来添加内容按 `docs/interactive-theory-lesson-standard.md` 定义步骤；演示区独立居中、双栏讲解居中/滚动、上下布局讲解顶部排列等规则不变。

`shared/styles/course-shell.css` 只对显式 `data-mt-shell` 的 MT01–05 页面统一页眉、页脚和普通页面外框。它在各自 CSS 之后加载，不加载或覆盖 Practice 卡片/结果内部规则；Learning 的活动双栏演示和阅读区继续由原 Learning 样式控制。MT06 与其他模块不自动接入。

## Notation

先加载 VexFlow 4.2.5，再加载 `notation/notation-config.js`、`notation/notation-renderer.js`；谱面可加载 `notation/notation-styles.css`。

```js
const view = NotationRenderer.mount(document.querySelector('[data-notation]'));
view.set({clef: 'treble', notes: ['C4', 'F#4']}); // 顺序音符
view.set({clef: 'bass', notes: [['C3', 'Eb3', 'G3']]}); // 一个和弦
view.set({notes: [{keys: ['C4'], duration: 'h'}, {keys: ['D4'], duration: 'q'}]});
view.destroy(); // 仅在宿主真正移除时释放 observer
```

原始音符保存在题库/score 中，SVG 只是输出。更复杂的 Learning 使用 `createRenderer`、`createStave`、`createFormatter`、`formatAndDraw` 工厂，保留原来的 Voice、教学标注、内部小节线与交互。不要在课程中另建 Renderer/Stave/Formatter。

全局规则在 `NotationConfig`：`showInitialBarline: false` 控制谱号前起始线；`staffLineCount`、`defaultClef`、`defaultScale`、`responsive`、`padding`、`maxWidth` 与 `formatterOptions` 管理公共谱面与间距。特殊多谱表的内部边界用 `createStave(..., {initial:false})` 保留真实分隔线，不能用遮盖图形实现隐藏。

未来多小节、节奏、编辑器应增加独立的 score 数据适配器/交互模块，继续使用这些工厂；本次没有实现乐谱编辑器，也没有修改其他课程。

## 验证

```sh
node --test tests/music-apps-v1/system.test.cjs tests/music-apps-v1/home-shell.test.cjs
node --test tests/practice-report/{report,scope,browser}.test.cjs
node --test tests/theory-learning/learning.test.cjs
node scripts/validate-students.mjs
node scripts/generate-student-pages.mjs --check
node scripts/test-dashboard-logic.mjs
node scripts/test-student-tools.mjs
```

浏览器测试需已有 Playwright、Chromium 与 `/tmp/vexflow.js`（原 CDN 4.2.5）；没有引入项目运行依赖。截图默认在 `/tmp/music-apps-v1`，不部署临时证据。90题基线提交与原路径见 `tests/music-apps-v1/baseline.json`。

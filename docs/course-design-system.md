# Music-Apps 课程通用设计与维护规范

状态：现行规范，2026-10-17 修订。MT Learning 的专项教学规范（v1.1.1，按人工预览反馈统一排版、垂直居中与渐进滚动）见 [Interactive Theory Lesson Standard](interactive-theory-lesson-standard.md)。历史“全课程视觉统一”已撤销，不再以其宽度、字号、CSS 覆盖顺序或 PNG 像素门禁约束当前课程。

## 权威来源与边界

1. 全站主题、字体、圆角和折叠图标：`assets/site-visual.css` 与 `assets/VISUAL-SYSTEM.md`。五档圆角为 small/control/card/panel/pill（6/10/14/18/999px），保留兼容别名；普通面板右/下箭头，独立“收起”动作向上。不得另建主题或复制这些变量。
2. 本文规定课程分类、共享层、资源加载、教学保护和维护要求，不规定所有课程相同的宽度、排版或业务行为。
3. MT Learning 的 T/I/V/F/P/S 条款、具体排版与滚动，以专项规范为准；不得在本文重复维护数值。三课与未来 Learning 使用同一套层级，不再把旧1.12rem/2.08当作冻结标准，也不允许为 MT06 单列正文体系。
4. 五线谱、琴键、音高仪表和其他音乐教学图形允许有明确的课程专用几何、颜色和非对称圆角。它们是教学内容，不能机械套用普通 UI。

## 当前共享架构

| 层 | 实际实现 | 边界 |
|---|---|---|
| 全站 | `assets/site-visual.css` | 已选择 `data-visual` 的页面；主题、字体、状态、圆角和折叠视觉 |
| 早期课程试点 | `assets/course-visual.css` | 现存 ET05/ET06/MT03 的别名与尺寸兼容规则，不是所有课程的通用布局 |
| ET | `ET-Intervals/shared/styles/base.css` 与各课现存样式 | 保留构唱/模唱、旋律/和声及单音/双音的布局和业务差异 |
| MT Practice | `MT-Intervals/shared/styles/practice-base.css` 与单课现存样式 | 按已接入范围工作，不改变题库、判题、计时、历史或报告 |
| MT Learning 外壳 | `MT-Intervals/shared/styles/learning-base.css` | 仅 `html[data-theory-lesson]`，当前 MT01/02/06；页面框架、语义排版、Board 尺寸档、导航、动效与响应式 |
| 可选教学组件 | `MT-Intervals/shared/styles/learning-components.css` | 当前 MT01/02；谱例容器、键盘几何、音频按钮和 Quiz 表现 |
| Learning 显示控制 | `MT-Intervals/shared/learning/theory-lesson.js` | 显式步骤、独立演示更新、讲解追加、滚动和会话内 DOM 状态恢复；不包含音乐知识或判题 |
| 单课 | MT02 内联图示样式；MT06 `lesson.css`；三课各自渲染与交互代码 | 只装课程专属图示、内容和业务规则 |

`learning-base.css` 在原版恢复时曾被删除；本次在新专项契约下重建。不存在的 `quiz-base.css` 等历史文件不作为当前依赖。

Learning 加载：site 主题 → shared learning base → 可选教学组件 → 课程专用样式；共享显示脚本必须在课程脚本之前执行。普通主题由 site token 提供，教学岛继续使用明亮、可读的谱面与黑白琴键，不对 SVG 路径或琴键应用全局主题重写。其他课程保持其现有加载顺序，不在本任务中统一。

## 教学与数据保护

ET 模唱与构唱、旋律参考音与和声双音采集独立维护，不共享教学引擎。播放、录音、音准、锁定与完成状态的含义由原课程控制。

MT Learning 可以改变教学显示和导航实现，但应保留知识点、文字含义、揭示顺序、音符、频率、原 Quiz 答案和完成门槛。MT Practice 的单选/多选、准确率、错题重试和历史数据不属于 Learning 框架。

课程 URL、随机目录、PDF/练习资源、学生数据、权限、Dashboard/Catalog、报告核心与支付逻辑不可因视觉组件迁移而改动。

## 测试与验收

共享组件的每次变更应明确列出实际消费者；检查这些课程完整流程及受影响视口。真实 Chromium 验证手机竖/横屏、iPad 竖/横屏、桌面、Light/Dark、独立滚动、固定导航、键盘焦点、资源加载与脚本错误。截图用于观察设计和布局，不要求历史 PNG 逐像素一致。

使用固定 Git 起点保护不在授权范围的源码；课程内容、题库、判题和音频函数应有对照检查。执行已有 Practice 报告、Dashboard 和普通 UI 的相关回归。历史测试如果固化了已被本次授权替换的 Learning 布局，不能再把该旧布局等同于现行契约；应明确记录替代测试和未执行项，不隐藏失败或修改原始证据。

浏览器视口与音频替身不等于 iPhone/iPad Safari、真实人声、音频听感或设备安全区域；未执行项和既有 TODO 必须单列。

## 维护规则

- 修改共享组件，同步检查全部实际消费者；未来 Learning 优先复用共享框架，不复制三套页面 CSS。
- 修改规范，同步清理失效声明与旧实现。权威来源按适用范围确定，不按文件时间简单覆盖。
- 不允许不断追加媒体查询、末尾覆盖和大量 `!important` 掩盖布局问题。隐藏契约允许一条有作用域的 `[hidden]/.hidden` 规则，教学特殊形状应有明确理由。
- 新增课程专用例外，应写明教学原因、适用组件与设备；不让专用规则渗入普通页面。
- 历史审计、失败日志与审核材料保留原始结论，并标明历史状态；不再作为新设计的旧像素审批门禁。

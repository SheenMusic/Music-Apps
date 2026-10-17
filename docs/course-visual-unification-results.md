# 全课程视觉与CSS统一完成报告

> 历史记录：以下保留当时的实施与测试结论，不代表现行课程设计要求。当前 MT Learning 规范见 `interactive-theory-lesson-standard.md`；全课程通用边界见 `course-design-system.md`。

## 版本与范围

从集成提交 `9a4ae6b260feb4f25605bbf2ba335b116241d52a` 建立本地分支 `refactor/course-visual-system`。原未跟踪审计报告原样保留，SHA-256为 `6bd32d6fa65cd4af7496db744ec4e52247a4275ce4c9078114f1d0f6de1ddeaa`；历史Phase0/1视觉、栅格与审批材料未删除或覆盖。没有推送、合并或部署。

迁移全部实际课程网页：ET18页、MT8页（3 Learning、5 Practice），共26页。保持课程目录、URL、全部教学body、所有inline/external课程JS逐字节不变。只调整head的课程标识、CSS引用与样式，未创建PDF专用课的虚假网页。

## 迁移清单

| 文件 | 类型 |
|---|---|
| `ET-Intervals/01-Direction-gn2y3h/index.html` | et-quiz |
| `ET-Intervals/02-Distance-p65l32/index.html` | et-quiz |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html` | et-sing |
| `ET-Intervals/04-Octave-irx7ar/index.html` | et-sing |
| `ET-Intervals/05-2nd-d7wzes/index.html` | et-sing |
| `ET-Intervals/06-2nd-9g6ymn/index.html` | et-sing |
| `ET-Intervals/07-7th-wns1er/index.html` | et-sing |
| `ET-Intervals/08-7th-f0m7ys/index.html` | et-sing |
| `ET-Intervals/09-3rd-hz86pk/index.html` | et-sing |
| `ET-Intervals/10-3rd-9sb0vu/index.html` | et-sing |
| `ET-Intervals/11-6th-z79m8y/index.html` | et-sing |
| `ET-Intervals/12-6th-020gcq/index.html` | et-sing |
| `ET-Intervals/13-4th-fdown4/index.html` | et-sing |
| `ET-Intervals/14-4th-gqx79i/index.html` | et-sing |
| `ET-Intervals/15-5th-4awj58/index.html` | et-sing |
| `ET-Intervals/16-5th-1d2mp0/index.html` | et-sing |
| `ET-Intervals/17-Compound-be0x3n/index.html` | et-sing |
| `ET-Intervals/18-Compound-1qoxm6/index.html` | et-sing |
| `MT-Intervals/lesson01/index.html` | mt-learning |
| `MT-Intervals/lesson01/practice/index.html` | mt-practice |
| `MT-Intervals/lesson02/index.html` | mt-learning |
| `MT-Intervals/lesson02/practice/index.html` | mt-practice |
| `MT-Intervals/lesson03/index.html` | mt-practice |
| `MT-Intervals/lesson04-x3n6cu/index.html` | mt-practice |
| `MT-Intervals/lesson05-s2e2f4/index.html` | mt-practice |
| `MT-Intervals/lesson06/index.html` | mt-learning |

## 共享架构

- Level1：`assets/course-visual.css`，只作用于data-course页面；直接复用site主题、字体、状态和阴影变量；补充课程宽度、间距、控件尺寸和动效。全站site-visual与VISUAL-SYSTEM未修改。
- Level2：ET `shared/styles/base.css`（16个音高训练）、`quiz-base.css`（2个听辨）；MT `shared/styles/practice-base.css`（5练习页）、`learning-base.css`（3学习页）。相同普通组件的多个旧实现统一为一份；媒体查询合并相邻相同条件，保持课程专用布局顺序。
- Level3：课程保留谱例/白板/键盘及特有布局、音程目标显示、各训练模式和特定题型需要的CSS。ET01/02的旧style.css路径保留作为空本地覆盖文件；所有当前共同UI已在共享层。

规范详见 `docs/course-design-system.md`：普通卡片8px圆角、44px普通控件、640px常规宽度、Learning720/1120px教学布局、site Light/Dark；教学琴键、谱线、音高偏差与目标锁定语义不套普通UI重置。没有合并ET构唱/模唱或改Quiz引擎。

## 实测规模与重复减少

| 指标 | 起点 | 完成 |
|---|---:|---:|
| ET/MT目录CSS字节（内联+共享+本地外链，物理文件只计一次） | 308,152 | 115,678 |
| 上述CSS代码行 | 7,502 | 1,489 |
| 加上课程通用基础CSS后的字节 | 308,966 | 124,225 |
| ET/MT规则数（含媒体查询内规则） | 2,594 | 809 |
| 完全重复规则的额外出现次数 | 1,807 | 122 |
| 精确重复规则字节下界 | 194,705 | 13,909 |

包含新增课程基础后，CSS体积实测减少184,741字节（59.8%）。行数受格式整理影响，不能当复用率。重复指标为静态语法规则规范化（空白/课程作用域前缀）后的下界，不是语义克隆检测；剩余重复未全部消除，主要保留课程特有响应式和教学图形。23个单课内联块保留，但只装课程差异，不追求消除独立HTML。

公共普通按钮/卡片/主题参数以后主要编辑1个全课程文件；某类控件编辑其类型文件，教学专属样式仍由课程维护。没有第二套主题，也没有大型框架或构建工具。

## 验证结果

- 固定工程起点下，26页教学body、inline JS和所有课程外部JS一致；题库、题序、音频参数、麦克风/检测、报告统计、导航和存储代码未改。
- 原三课行为：5通过、0失败、3既有TODO；作用域保护通过。
- Dashboard/Catalog隔离：8个非课程入口×Light/Dark，共16组合，注入全部5个共享CSS仍保持计算样式/几何；真实动态Dashboard已加载。Student/Teacher/Catalog、公共视觉、课程管理与部署配置源码相对起点无差异。
- 最终全页矩阵：27项测试通过、0失败，26页×6尺寸×2主题=312个组合，1,649次活动状态布局检查。尺寸320×812、390×844、430×932、768×1024、1024×768、1280×900。覆盖ET初始/播放/录音/报告、两听辨题目、全部Learning步骤/完成、Practice题目/题号；五个Practice题库在桌面完整答完并检查结果。
- 最后截图检查清除了MT02遗留的主按钮白字important覆盖；仅MT02完整12组合重验通过（2测试：源码保护＋MT02布局），没有重复整个矩阵。额外全部26页×两主题的主按钮规范检查通过（1测试、52组合），包括Learning活动末页。
- 110个本地link/script/image/audio资源引用检查无缺失；浏览器页面/资源无新增404和pageerror；全部课程JS与验收CJS语法检查通过，Git diff --check通过。
- 核对新设计截图（ET深色报告、MT窄屏Quiz、MT横屏白板等）。没有新旧PNG逐像素比较、圆角研究、参考栅格证明或审批循环。

测试在真实Chromium中运行，音频/麦克风/时钟/剪贴板为原替身；报告布局由原成功处理器生成。ET03/04防重复生成器需要非恒定的随机值，因此新布局夹具使用确定性随机序列，未更改课程生成逻辑。Layout检查按真实绘制范围计算，允许教学内容在既有滚动容器内滚动；不会把已裁剪的离屏Quiz选项误判成覆盖导航。

新入口见 `tests/course-system/README.md`。最终矩阵/截图：`/tmp/course-unification/accepted/`；完整日志 `accepted.log`，行为隔离 `accepted-behavior-isolation.log`，MT02修正复验 `mt02-corrected.log`，主题检查 `theme.log`，统计 `stats.json`，均位于 `/tmp/course-unification/`。MT02修正后的截图在对应mt02-corrected目录。历史原始失败文件未改写；新工程不以旧审批机制作为完成条件。

## 真实问题处理、保留项和发布建议

已修复新主题下ET报告复制按钮及MT02旧白字规则的可读性。ET报告保留原inline普通按钮颜色以维持body字节契约，因此只有两条精准报告作用域important用于兼容；MT02不必要的普通UIimportant已删除。其余教学布局important未随意删除，避免破坏谱例/白板布局。

既有TODO：ET05目标可能越出设定音区；关闭麦克风未释放缓存轨道；MT03返回首页指向缺失页面。本次只做CSS统一，不修改算法、生命周期或导航业务，因此上述缺陷继续单列，不宣称为通过或修复。

未验证真实人声/噪声、麦克风权限、设备输出延迟、真实系统剪贴板、Safari和实际iPhone/iPad安全区/方向旋转；这些是发布巡检范围，不是旧像素验收。静态布局和合成行为不能替代真实听感。

工程完成，建议进入发布准备：上线前做三类设备与代表训练（构唱、双音模唱、Learning键盘、Practice多选/历史）巡检，并核对浏览器缓存中的共享CSS版本。当前分支所有本次修改以分阶段本地提交保存；原未跟踪审计报告不纳入提交。未推送、未合并main、未触发Pages部署。

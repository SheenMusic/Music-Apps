# 全站圆角与折叠组件审计及实施记录

日期：2026-10-17（Asia/Tokyo）。基线：`70c9f0cc6d46f2f14e2b27ff2347881c58cf3e38`。

## 1. 方法与精确统计

`scripts/audit-ui.py` 从已发布HTML递归追踪本地stylesheet/script、模块导入和CSS import（去除query/hash），扫描独立CSS、内联style、style属性（含脚本模板）、媒体查询、伪元素、变量覆盖以及JS中的borderRadius/setProperty/CSS字符串。变量引用不按使用页面重复放大；包含被后续覆盖的声明，不代表最终计算样式。

范围：54个发布HTML入口、22个CSS、31个JS，共107文件。54入口含保留的Teacher转向入口，实际常驻UI页面53个。排除tests/docs、未发布生成模板、构建/管理脚本、articles/vendor两份第三方库和远程VexFlow；实际部署的学生生成入口仍计入，未改入口或生成器。

| 指标 | 修改前 | 修改后 |
|---|---:|---:|
| border-radius源码声明 | 465 | 467 |
| 独立CSS / HTML style块中的声明 | 68 / 397 | 70 / 397 |
| style属性 / JS动态圆角声明 | 0 / 0 | 0 / 0 |
| 源码值或表达式写法（含!important/变量/继承/非对称） | 37 | 22 |
| 单一px数值种类 | 17 | 普通UI统一五档；教学/结构例外另计 |
| 原生details / summary源码实例 | 32 / 32 | 32 / 32 |
| 默认open原生实例 | 2（ET04/05） | 不变 |
| 普通折叠180°旋转声明 | 20 | 0 |

366条声明按语义映射，99条例外；其中谱面预览原变量引用改成原计算值8px以避免裁切变化。ET01/02原来未声明圆角的普通操作控件和模式/音频/反馈容器由共享层新增2条规则覆盖。没有为降低声明数量而删除教学规则。

共有10类状态控制家族，72个页面状态拥有者：32个原生面板、37个静态JS入口（菜单23、PDF8、MT题号6）、3个学生运行时入口。此数包括初始隐藏的练习/结果导航，不是同屏可见数。Teacher5个、Student3个底部收起按钮是附加动作，不再算8个独立面板。源码aria-expanded属性46处与原生summary有9处重叠，不能直接与32相加。

## 2. 唯一圆角规范与兼容映射

| 变量 | 默认值 | 角色 |
|---|---:|---|
| --site-radius-small | 6px | 紧凑按钮、题型/关键词/勾选标记 |
| --site-radius-control | 10px | 标准按钮、输入、select、选项、题号 |
| --site-radius-card | 14px | 普通卡片、折叠容器、反馈、历史条目 |
| --site-radius-panel | 18px | 弹窗、咨询面板、选择工具栏、普通媒体面板 |
| --site-radius-pill | 999px | 原有胶囊按钮、标签、普通进度条 |

唯一默认值在assets/site-visual.css的html[data-visual]；不建立主题或颜色系统。保留--site-card-radius兼容别名→14px；--course-card-radius→14px；--course-button-radius/--course-option-radius→10px；--radius-lg/--radius-md→卡片/控件别名。弹窗消费者直接引用18px，解除原lg同时控制按钮和面板的歧义。Light/Dark没有圆角覆盖。

按角色映射而非就近取整：18px普通卡片→14px，16px弹窗→18px，18px输入→10px，999px胶囊保留。ET01/02的58px圆播放按钮不变。五档只描述适用普通UI，不能声称含教学/结构例外的整个网站只剩五个数值。

## 3. 折叠分类、状态与保护

| 家族 | 页面实例 | 默认/状态机制 | 本次处理 |
|---|---:|---|---|
| ET参数 | 16 | 原生open，ET04/05默认开 | 右/下图标、44px触控；参数和原生键盘不变 |
| MT题号/结果导航 | 6 | expanded+aria；MT05结果导航默认开但结果屏初始隐藏 | 保留display:none/grid和状态写入，仅统一图标/触控 |
| Student课程资料 | 3 | aria-expanded+panel.hidden | 整行标题可点击；权限、链接、底部收起和toggle.focus不变 |
| Teacher主列表/菜单 | 5 | 原生open，pageshow收起主列表 | 独立展开、底部按钮、summary.focus不变 |
| 课程分类 | 3 | open/toggle/aria/hash | 保留courses.js与语言/URL逻辑；加减号换右/下 |
| 作品分类 | 4 | open/aria/hash/pushState/popstate/pageshow | 保留works.js联动；加减号换右/下 |
| 乐谱分类 | 2 | open/aria/hash | 保留catalog-categories.js；加减号换右/下 |
| 购买内容清单 | 2 | 原生details | 保留邮箱、价格、订单和支付步骤，只改summary视觉 |
| PDF预览 | 8 | aria+frame.hidden，首次展开建iframe | 仅装饰span加class，不改预览脚本和PDF地址 |
| 手机/公共导航抽屉 | 23 | aria/is-open/aria-hidden/inert/Escape | 汉堡↔关闭符号的45°特殊逻辑保留 |

公共图标在site-visual.css以两份内嵌SVG mask显示右/下：12px盒、1.5px描边、12px间距、--site-muted颜色，无图标库、旋转动画或新控制器。原native open与JS aria仍是真值。ET/MT/购买清单/PDF标题至少44px；分类既有较大标题保留，Student按钮铺满所在标题行。PDF预览与下载同排工具栏不重排，整个原按钮均可点击。

原20条180°规则应用于22个ET/MT实例，不能算20种组件；三个分类的加减号重复规则也已移除。没有新增全局点击监听、焦点劫持、状态清空或内容动画。既有reduced-motion继续生效。hidden还用于语言、练习屏幕、支付步骤，未一概变成折叠。

依据：ET-Intervals/shared/styles/base.css、MT-Intervals/shared/styles/practice-base.css；students/shared/dashboard.js:33–65；teacher/script.js:36–41；learning-resources/resource-links.js的collapseButton；courses/courses.js、works/works.js、scores/catalog-categories.js、assets/site-navigation.js。所有生产JS字节不变。

## 4. 保留例外

- MT白/黑键0 0 4/5/6px、staff/stage、lesson-board、教学pattern-card及#lesson裁切：保留原值和!important，不改黑板高度、Flex/Grid、min-height:0、独立正文滚动和底部导航。
- ET meter-bar/pointer/target-zone的999px属于教学标尺端点，保留位置、颜色和原声明。
- 真圆50%及教学圆音频按钮不变；旧999px音频按钮声明被后续50%覆盖，也保留以免改教学级联。
- term-box侧边强调、Learning顶部圆角导航、底部支付sheet的24px 24px 0 0等非对称结构保留。
- 无表面的下划线资源链接、贴边抽屉为0；分类summary使用inherit跟随父卡片。
- 菩萨蛮谱面预览图片保持原8px裁切。
- Teacher/Student独立收起动作保留，装饰箭头表示当前展开状态（向下），不改变原“收起”无障碍标签或焦点返回。

附录逐项列明例外；保留的非五档值不能算遗漏。

## 5. 验证与证据

- 严格对照基线：所有生产JS/JSON/部署配置、HTML除style及8个PDF装饰class以外均不变；题库、报告核心、学生数据、支付、语言及SEO保持不变。
- Chromium前后加载54入口：0脚本错误、0本地404、0新增横向溢出；非图标CSS选择器前后相同，防止清理规则时拼接选择器。
- 10类代表组件×390/1280宽×Light/Dark=40场景，分别保存修改前后、展开/收起截图，验证鼠标、Enter/Space、抽屉Escape及焦点。购买弹窗测试邮箱保留、确认勾选门禁、支付方式切换，不提交订单或实际付款。
- MT01/02/06×320×568、390×844、768×1024、1024×768×Light/Dark=24场景，比较长正文滚到底、黑板/底部导航不随正文移动，以及原教学圆角和几何。长正文只在测试浏览器临时注入。
- 三个Student入口、Teacher菜单另外验证独立收起和焦点返回；明暗下实际计算五档圆角。
- 练习报告既有35项（23课完整复制快照、五类型、边界和不改记录）通过。scope测试改为严格保护已发布70c9f0c脚本/DOM/报告核心，仅允许本次已授权style变更，文本快照标准不变。
- Dashboard逻辑8组及学生工具检查通过；67个运行时JavaScript单元语法和git diff检查通过。UI主套件43项、Learning专项25项、五档及完整Dashboard补充1项均通过；Student整行点击的4场景另行复测通过。
- 首轮旧截图夹具读取大视频超出默认maxBuffer的假404已修正。清理旧图标时的选择器残留已修正，新增选择器及题号面板display检查；未使用容差、SKIP或删除断言掩盖失败。

截图与JSON证据仅在`/tmp/music-apps-ui-unification/`，不提交网站。包括smoke.json、interactions.json、learning-layouts.json。已抽查手机课程分类、桌面Teacher、ET深色设置与购买弹窗；未见明显错位或遮挡。

复核命令：

```bash
python3 scripts/audit-ui.py > /tmp/ui-current.json
node --test tests/ui-components/ui.test.cjs
node --test tests/practice-report/*.test.cjs
node scripts/test-dashboard-logic.mjs
node scripts/test-student-tools.mjs
```

限制：Chromium视口模拟不等于iPhone/iPad Safari真机；测试拦截外部分析和CDN，VexFlow使用已有离线fallback，不宣称验收真实雕版、人声/麦克风或真实支付。受保护源码及教学CSS例外对照通过。未运行旧PNG像素门禁；未改缓存策略或部署配置。

## 附录A：每种圆角写法的声明次数

包含媒体覆盖、伪元素和!important，不按页面引用放大。

| 原值/写法 | 修改前次数 | 修改后同写法次数 |
|---|---:|---:|
| `0` | 6 | 6 |
| `0 0 4px 4px` | 2 | 2 |
| `0 0 5px 5px` | 4 | 4 |
| `0 0 6px 6px` | 2 | 2 |
| `0 10px 10px 0` | 2 | 2 |
| `10px` | 47 | 0 |
| `11px` | 16 | 2 |
| `12px` | 26 | 7 |
| `12px!important` | 2 | 2 |
| `13px` | 15 | 0 |
| `14px` | 10 | 4 |
| `14px 14px 0 0` | 2 | 2 |
| `15px` | 39 | 0 |
| `16px` | 18 | 0 |
| `18px` | 18 | 0 |
| `20px` | 1 | 0 |
| `22px` | 1 | 0 |
| `24px` | 2 | 0 |
| `24px 24px 0 0` | 1 | 1 |
| `4px` | 10 | 0 |
| `50%` | 8 | 8 |
| `50%!important` | 4 | 4 |
| `5px` | 5 | 0 |
| `6px` | 15 | 0 |
| `8px` | 9 | 1 |
| `999px` | 90 | 48 |
| `999px!important` | 2 | 2 |
| `9px` | 40 | 0 |
| `inherit` | 2 | 2 |
| `var(--course-button-radius, 11px)` | 1 | 0 |
| `var(--course-button-radius, var(--radius-lg))` | 2 | 0 |
| `var(--course-card-radius, 18px)` | 1 | 0 |
| `var(--course-card-radius, var(--radius-lg))` | 1 | 0 |
| `var(--course-option-radius, var(--radius-md))` | 1 | 0 |
| `var(--radius-lg)` | 21 | 0 |
| `var(--radius-md)` | 30 | 0 |
| `var(--site-card-radius)` | 9 | 0 |

新增语义引用次数：`var(--site-radius-card)` 191；`var(--site-radius-control)` 80；`var(--site-radius-small)` 41；`var(--site-radius-pill)` 42；`var(--site-radius-panel)` 14。

前后代表截图共168张（临时目录，非提交内容）。

## 附录B：变量原默认值和覆盖

| 基线文件:行 | 变量 | 原值 | 新兼容别名 |
|---|---|---|---|
| `MT-Intervals/lesson01/index.html:8` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson01/index.html:8` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson01/practice/index.html:24` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson01/practice/index.html:25` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson02/index.html:8` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson02/index.html:8` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson02/practice/index.html:24` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson02/practice/index.html:25` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson03/index.html:26` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson03/index.html:27` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson04-x3n6cu/index.html:24` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson04-x3n6cu/index.html:25` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson05-s2e2f4/index.html:24` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson05-s2e2f4/index.html:25` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `MT-Intervals/lesson06/lesson.css:2` | `--radius-lg` | `16px` | `--site-radius-card (14px)` |
| `MT-Intervals/lesson06/lesson.css:2` | `--radius-md` | `10px` | `--site-radius-control (10px)` |
| `assets/course-visual.css:13` | `--course-card-radius` | `18px` | `--site-radius-card (14px)` |
| `assets/course-visual.css:14` | `--course-button-radius` | `11px` | `--site-radius-control (10px)` |
| `assets/course-visual.css:19` | `--course-card-radius` | `16px` | `--site-radius-card (14px)` |
| `assets/course-visual.css:20` | `--course-button-radius` | `16px` | `--site-radius-control (10px)` |
| `assets/course-visual.css:21` | `--course-option-radius` | `10px` | `--site-radius-control (10px)` |
| `assets/site-visual.css:11` | `--site-card-radius` | `8px` | `--site-radius-card (14px)` |

原变量位于各页:root/课程data-visual作用域；Dark不覆盖圆角。原ET380px卡片16px覆盖改为同一14px引用；教学!important及非对称覆盖保留。

## 附录C：465条声明的完整映射

行号指70c9f0c基准；当前文件请结合选择器查找。相同选择器在不同媒体上下文或重复出现时分别计数，原!important强度保持。

| 文件:基线行 | 选择器 / 上下文 | 原值 | 目标或保留值 | 理由 |
|---|---|---|---|---|
| `ET-Intervals/01-Direction-gn2y3h/style.css:1` | `.play`  | `50%` | `50%` | 真正圆形 |
| `ET-Intervals/02-Distance-p65l32/style.css:1` | `.play`  | `50%` | `50%` | 真正圆形 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:99` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:138` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:181` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:212` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:228` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:262` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:335` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:352` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:368` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:379` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:441` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/03-EchoSinging-l9ipbz/index.html:488` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:99` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:138` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:181` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:197` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/04-Octave-irx7ar/index.html:229` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/04-Octave-irx7ar/index.html:245` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:267` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:319` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/04-Octave-irx7ar/index.html:392` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:409` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/04-Octave-irx7ar/index.html:425` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/04-Octave-irx7ar/index.html:436` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/04-Octave-irx7ar/index.html:508` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/04-Octave-irx7ar/index.html:555` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/05-2nd-d7wzes/index.html:32` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/05-2nd-d7wzes/index.html:37` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/05-2nd-d7wzes/index.html:41` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/05-2nd-d7wzes/index.html:44` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/05-2nd-d7wzes/index.html:57` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/05-2nd-d7wzes/index.html:59` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/05-2nd-d7wzes/index.html:60` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/05-2nd-d7wzes/index.html:61` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/05-2nd-d7wzes/index.html:66` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:32` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:37` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:41` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:43` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:53` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:61` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:62` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:63` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:64` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/06-2nd-9g6ymn/index.html:70` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/07-7th-wns1er/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/07-7th-wns1er/index.html:83` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:86` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:94` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/07-7th-wns1er/index.html:107` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:109` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/07-7th-wns1er/index.html:110` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/07-7th-wns1er/index.html:111` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/07-7th-wns1er/index.html:120` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/07-7th-wns1er/index.html:129` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/08-7th-f0m7ys/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/08-7th-f0m7ys/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/08-7th-f0m7ys/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/08-7th-f0m7ys/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/08-7th-f0m7ys/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/08-7th-f0m7ys/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/08-7th-f0m7ys/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/09-3rd-hz86pk/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/09-3rd-hz86pk/index.html:83` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:86` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:94` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/09-3rd-hz86pk/index.html:107` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:109` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/09-3rd-hz86pk/index.html:110` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/09-3rd-hz86pk/index.html:111` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/09-3rd-hz86pk/index.html:120` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/09-3rd-hz86pk/index.html:129` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/10-3rd-9sb0vu/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/11-6th-z79m8y/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/11-6th-z79m8y/index.html:83` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:86` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:94` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/11-6th-z79m8y/index.html:107` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:109` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/11-6th-z79m8y/index.html:110` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/11-6th-z79m8y/index.html:111` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/11-6th-z79m8y/index.html:120` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/11-6th-z79m8y/index.html:129` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/12-6th-020gcq/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/12-6th-020gcq/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/12-6th-020gcq/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/12-6th-020gcq/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/12-6th-020gcq/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/12-6th-020gcq/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/12-6th-020gcq/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/13-4th-fdown4/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/13-4th-fdown4/index.html:83` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:86` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:94` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/13-4th-fdown4/index.html:107` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:109` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/13-4th-fdown4/index.html:110` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/13-4th-fdown4/index.html:111` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/13-4th-fdown4/index.html:120` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/13-4th-fdown4/index.html:129` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/14-4th-gqx79i/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/14-4th-gqx79i/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/14-4th-gqx79i/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/14-4th-gqx79i/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/14-4th-gqx79i/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/14-4th-gqx79i/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/14-4th-gqx79i/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/15-5th-4awj58/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/15-5th-4awj58/index.html:83` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:86` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:94` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/15-5th-4awj58/index.html:107` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:109` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/15-5th-4awj58/index.html:110` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/15-5th-4awj58/index.html:111` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/15-5th-4awj58/index.html:120` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/15-5th-4awj58/index.html:129` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/16-5th-1d2mp0/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/16-5th-1d2mp0/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/16-5th-1d2mp0/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/16-5th-1d2mp0/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/16-5th-1d2mp0/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/16-5th-1d2mp0/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/16-5th-1d2mp0/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/17-Compound-be0x3n/index.html:82` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/17-Compound-be0x3n/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:87` | `.target-half.highlight`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:95` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/17-Compound-be0x3n/index.html:108` | `.status-box`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:110` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/17-Compound-be0x3n/index.html:111` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/17-Compound-be0x3n/index.html:112` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/17-Compound-be0x3n/index.html:121` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/17-Compound-be0x3n/index.html:130` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:51` | `.card`  | `18px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:59` | `.settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:71` | `.rule-box-inner`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:76` | `.register-line`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:81` | `select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:84` | `.target-card`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:86` | `.target-half-box`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:93` | `.btn`  | `11px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:106` | `.status-box-dual`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:113` | `.status-box-global`  | `15px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:114` | `.meter-bar`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:115` | `.meter-pointer`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:116` | `.meter-target-zone`  | `999px` | `999px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:127` | `.report-table`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/18-Compound-1qoxm6/index.html:136` | `.card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/shared/styles/base.css:28` | `:where(html[data-visual="ear"]) .card`  | `var(--course-card-radius, 18px)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/shared/styles/base.css:36` | `:where(html[data-visual="ear"]) .settings-details`  | `13px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `ET-Intervals/shared/styles/base.css:48` | `:where(html[data-visual="ear"]) select`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/shared/styles/base.css:51` | `:where(html[data-visual="ear"]) .btn`  | `var(--course-button-radius, 11px)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `ET-Intervals/shared/styles/base.css:70` | `:where(html[data-visual="ear"]) .card` @media (max-width: 380px) | `16px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/index.html:10` | `.lesson-badge`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:10` | `.progress-wrap`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:10` | `.progress`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:10` | `.card`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/index.html:11` | `.primary,.secondary,.ghost,.choice,.degree-btn`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/index.html:12` | `.stage`  | `14px` | `14px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:12` | `.staff`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:12` | `.audio-btn`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/index.html:12` | `.interaction-hint`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/index.html:12` | `.pattern-card`  | `14px` | `14px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:12` | `.example-chip`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/index.html:12` | `.term-box`  | `0 10px 10px 0` | `0 10px 10px 0` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:12` | `.rule`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/index.html:14` | `.white-key`  | `0 0 6px 6px` | `0 0 6px 6px` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:14` | `.black-key`  | `0 0 5px 5px` | `0 0 5px 5px` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:15` | `.summary-item`  | `9px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/index.html:15` | `.pill`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:15` | `.status`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:17` | `.lesson .nav`  | `14px 14px 0 0` | `14px 14px 0 0` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:30` | `body.lesson-active .lesson .nav`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `MT-Intervals/lesson01/index.html:75` | `.quiz-option`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/index.html:82` | `body.lesson-active .lesson-board`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:83` | `body.lesson-active .lesson-board .staff`  | `11px` | `11px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:125` | `.compact-keyboard .white-key`  | `0 0 5px 5px` | `0 0 5px 5px` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:127` | `.compact-keyboard .black-key`  | `0 0 4px 4px` | `0 0 4px 4px` | 非对称结构／琴键 |
| `MT-Intervals/lesson01/index.html:348` | `body.lesson-active #lesson` @media (orientation:landscape) and (max-height:500px) and (max-width:950px) | `12px!important` | `12px!important` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:514` | `.lesson-audio-btn`  | `50%` | `50%` | 真正圆形 |
| `MT-Intervals/lesson01/index.html:532` | `#lessonBoard > .lesson-audio-btn`  | `50%!important` | `50%!important` | 真正圆形 |
| `MT-Intervals/lesson01/index.html:549` | `#lessonBoard .lesson-audio-btn`  | `999px!important` | `999px!important` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson01/index.html:570` | `body.lesson-active #lessonBoard > .lesson-audio-btn`  | `50%!important` | `50%!important` | 真正圆形 |
| `MT-Intervals/lesson01/practice/index.html:81` | `.history-toggle-btn`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:96` | `.progress-bar-container`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/practice/index.html:105` | `.progress-bar`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/practice/index.html:121` | `.lesson-tag`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/practice/index.html:133` | `.card-container`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:163` | `.start-info`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:192` | `.type-badge`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:214` | `.question-keyword`  | `5px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:230` | `.question-nav-toggle`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:255` | `.question-nav-btn`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:288` | `.option-btn`  | `var(--radius-md)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:330` | `.indicator`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:365` | `.feedback-box`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:430` | `.stat-card`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:463` | `.detail-list`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:493` | `.detail-item-wrong-choices`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:521` | `.modal-card`  | `var(--radius-lg)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/lesson01/practice/index.html:551` | `.modal-tip`  | `6px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:565` | `.history-card-item`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:590` | `.secondary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:611` | `.primary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:689` | `.header-title-right`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/practice/index.html:694` | `.history-toggle-btn`  | `9px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson01/practice/index.html:700` | `.card-container`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:708` | `.start-info`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:709` | `.primary-btn,.secondary-btn`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:713` | `.question-nav-toggle`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:714` | `.type-badge`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson01/practice/index.html:717` | `.option-btn`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson01/practice/index.html:720` | `.feedback-box`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:721` | `.stat-card,.detail-list,.history-card-item,.modal-tip`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson01/practice/index.html:722` | `.modal-card`  | `16px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/lesson02/index.html:10` | `.lesson-badge`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:10` | `.progress-wrap`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:10` | `.progress`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:10` | `.card`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/index.html:11` | `.primary,.secondary,.ghost,.choice,.degree-btn`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/index.html:12` | `.stage`  | `14px` | `14px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:12` | `.staff`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:12` | `.audio-btn`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/index.html:12` | `.interaction-hint`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/index.html:12` | `.pattern-card`  | `14px` | `14px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:12` | `.example-chip`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/index.html:12` | `.term-box`  | `0 10px 10px 0` | `0 10px 10px 0` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:12` | `.rule`  | `10px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/index.html:14` | `.white-key`  | `0 0 6px 6px` | `0 0 6px 6px` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:14` | `.black-key`  | `0 0 5px 5px` | `0 0 5px 5px` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:15` | `.summary-item`  | `9px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/index.html:15` | `.pill`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:15` | `.status`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:17` | `.lesson .nav`  | `14px 14px 0 0` | `14px 14px 0 0` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:30` | `body.lesson-active .lesson .nav`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `MT-Intervals/lesson02/index.html:75` | `.quiz-option`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/index.html:82` | `body.lesson-active .lesson-board`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:83` | `body.lesson-active .lesson-board .staff`  | `11px` | `11px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:125` | `.compact-keyboard .white-key`  | `0 0 5px 5px` | `0 0 5px 5px` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:127` | `.compact-keyboard .black-key`  | `0 0 4px 4px` | `0 0 4px 4px` | 非对称结构／琴键 |
| `MT-Intervals/lesson02/index.html:348` | `body.lesson-active #lesson` @media (orientation:landscape) and (max-height:500px) and (max-width:950px) | `12px!important` | `12px!important` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:514` | `.lesson-audio-btn`  | `50%` | `50%` | 真正圆形 |
| `MT-Intervals/lesson02/index.html:532` | `#lessonBoard > .lesson-audio-btn`  | `50%!important` | `50%!important` | 真正圆形 |
| `MT-Intervals/lesson02/index.html:549` | `#lessonBoard .lesson-audio-btn`  | `999px!important` | `999px!important` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson02/index.html:570` | `body.lesson-active #lessonBoard > .lesson-audio-btn`  | `50%!important` | `50%!important` | 真正圆形 |
| `MT-Intervals/lesson02/practice/index.html:81` | `.history-toggle-btn`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson02/practice/index.html:96` | `.progress-bar-container`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/practice/index.html:105` | `.progress-bar`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/practice/index.html:121` | `.lesson-tag`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson02/practice/index.html:133` | `.card-container`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:163` | `.start-info`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:192` | `.type-badge`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson02/practice/index.html:214` | `.question-keyword`  | `5px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson02/practice/index.html:230` | `.question-nav-toggle`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/practice/index.html:255` | `.question-nav-btn`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/practice/index.html:288` | `.option-btn`  | `var(--radius-md)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/practice/index.html:330` | `.indicator`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson02/practice/index.html:365` | `.feedback-box`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:430` | `.stat-card`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:463` | `.detail-list`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:493` | `.detail-item-wrong-choices`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson02/practice/index.html:521` | `.modal-card`  | `var(--radius-lg)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/lesson02/practice/index.html:551` | `.modal-tip`  | `6px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:565` | `.history-card-item`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson02/practice/index.html:590` | `.secondary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson02/practice/index.html:611` | `.primary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson03/index.html:49` | `.feedback-box`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:81` | `.history-toggle-btn`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson04-x3n6cu/index.html:96` | `.progress-bar-container`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson04-x3n6cu/index.html:105` | `.progress-bar`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson04-x3n6cu/index.html:121` | `.lesson-tag`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson04-x3n6cu/index.html:133` | `.card-container`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:163` | `.start-info`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:192` | `.type-badge`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson04-x3n6cu/index.html:214` | `.question-keyword`  | `5px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson04-x3n6cu/index.html:230` | `.question-nav-toggle`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson04-x3n6cu/index.html:255` | `.question-nav-btn`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson04-x3n6cu/index.html:299` | `.option-btn`  | `var(--radius-md)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson04-x3n6cu/index.html:341` | `.indicator`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson04-x3n6cu/index.html:376` | `.feedback-box`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:441` | `.stat-card`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:474` | `.detail-list`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:504` | `.detail-item-wrong-choices`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson04-x3n6cu/index.html:532` | `.modal-card`  | `var(--radius-lg)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/lesson04-x3n6cu/index.html:562` | `.modal-tip`  | `6px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:576` | `.history-card-item`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson04-x3n6cu/index.html:601` | `.secondary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson04-x3n6cu/index.html:622` | `.primary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson04-x3n6cu/index.html:681` | `.staff-question`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson05-s2e2f4/index.html:81` | `.history-toggle-btn`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson05-s2e2f4/index.html:96` | `.progress-bar-container`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson05-s2e2f4/index.html:105` | `.progress-bar`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson05-s2e2f4/index.html:121` | `.lesson-tag`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson05-s2e2f4/index.html:133` | `.card-container`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:163` | `.start-info`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:192` | `.type-badge`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson05-s2e2f4/index.html:214` | `.question-keyword`  | `5px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson05-s2e2f4/index.html:230` | `.question-nav-toggle`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson05-s2e2f4/index.html:255` | `.question-nav-btn`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson05-s2e2f4/index.html:299` | `.option-btn`  | `var(--radius-md)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson05-s2e2f4/index.html:341` | `.indicator`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson05-s2e2f4/index.html:376` | `.feedback-box`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:441` | `.stat-card`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:474` | `.detail-list`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:504` | `.detail-item-wrong-choices`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/lesson05-s2e2f4/index.html:532` | `.modal-card`  | `var(--radius-lg)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/lesson05-s2e2f4/index.html:562` | `.modal-tip`  | `6px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:576` | `.history-card-item`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson05-s2e2f4/index.html:601` | `.secondary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson05-s2e2f4/index.html:622` | `.primary-btn`  | `var(--radius-lg)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson05-s2e2f4/index.html:681` | `.staff-question`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson06/lesson.css:7` | `.lesson-badge`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson06/lesson.css:7` | `.progress-wrap`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/lesson06/lesson.css:8` | `.card`  | `var(--radius-lg)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/lesson06/lesson.css:10` | `.primary,.secondary,.ghost`  | `var(--radius-md)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/lesson06/lesson.css:11` | `.lesson-board`  | `12px` | `12px` | 教学图示、谱例、琴键、音高计量或教学框架裁切 |
| `MT-Intervals/lesson06/lesson.css:12` | `.board-controls button`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/shared/styles/practice-base.css:49` | `:where(html[data-visual="practice"]) .history-toggle-btn`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/shared/styles/practice-base.css:62` | `:where(html[data-visual="practice"]) .progress-bar-container`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/shared/styles/practice-base.css:70` | `:where(html[data-visual="practice"]) .progress-bar`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/shared/styles/practice-base.css:84` | `:where(html[data-visual="practice"]) .lesson-tag`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `MT-Intervals/shared/styles/practice-base.css:93` | `:where(html[data-visual="practice"]) .card-container`  | `var(--course-card-radius, var(--radius-lg))` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:118` | `:where(html[data-visual="practice"]) .start-info`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:142` | `:where(html[data-visual="practice"]) .type-badge`  | `6px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/shared/styles/practice-base.css:161` | `:where(html[data-visual="practice"]) .question-keyword`  | `5px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/shared/styles/practice-base.css:174` | `:where(html[data-visual="practice"]) .question-nav-toggle`  | `9px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/shared/styles/practice-base.css:195` | `:where(html[data-visual="practice"]) .question-nav-btn`  | `8px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/shared/styles/practice-base.css:223` | `:where(html[data-visual="practice"]) .option-btn`  | `var(--course-option-radius, var(--radius-md))` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/shared/styles/practice-base.css:258` | `:where(html[data-visual="practice"]) .indicator`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/shared/styles/practice-base.css:334` | `:where(html[data-visual="practice"]) .stat-card`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:362` | `:where(html[data-visual="practice"]) .detail-list`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:388` | `:where(html[data-visual="practice"]) .detail-item-wrong-choices`  | `4px` | `var(--site-radius-small)` | 小型控件或紧凑标记 |
| `MT-Intervals/shared/styles/practice-base.css:412` | `:where(html[data-visual="practice"]) .modal-card`  | `var(--radius-lg)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `MT-Intervals/shared/styles/practice-base.css:438` | `:where(html[data-visual="practice"]) .modal-tip`  | `6px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:450` | `:where(html[data-visual="practice"]) .history-card-item`  | `var(--radius-md)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `MT-Intervals/shared/styles/practice-base.css:472` | `:where(html[data-visual="practice"]) .secondary-btn`  | `var(--course-button-radius, var(--radius-lg))` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `MT-Intervals/shared/styles/practice-base.css:490` | `:where(html[data-visual="practice"]) .primary-btn`  | `var(--course-button-radius, var(--radius-lg))` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `articles/articles.css:49` | `.markdown-body pre`  | `8px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `assets/site-navigation.css:23` | `[data-site-navigation] .menu-inner`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `assets/site-visual.css:323` | `:where(html[data-public-visual]) a.site-cta`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `courses/courses.css:68` | `.training-card`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `courses/courses.css:69` | `.training-card summary`  | `inherit` | `inherit` | 无表面链接／贴边容器或继承父容器结构 |
| `en/home.css:90` | `.button`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `en/home.css:205` | `.consultation`  | `24px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `en/home.css:218` | `.consultation :is(input,textarea)`  | `18px` | `var(--site-radius-control)` | 输入控件 |
| `en/home.css:226` | `.consultation .button`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `index.html:101` | `.button`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `index.html:216` | `.consultation`  | `24px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `index.html:229` | `.consultation :is(input,textarea)`  | `18px` | `var(--site-radius-control)` | 输入控件 |
| `index.html:237` | `.consultation .button`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `learning-resources/resource-links.css:7` | `.resource-list a.training-link`  | `var(--site-card-radius)` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/catalog-categories.css:3` | `.scores-catalog .score-category`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `scores/catalog-categories.css:4` | `.scores-catalog .score-category-heading`  | `inherit` | `inherit` | 无表面链接／贴边容器或继承父容器结构 |
| `scores/consent.css:2` | `.score-consent`  | `18px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `scores/consent.css:16` | `body:has(.work-detail) .score-consent .close-button`  | `50%` | `50%` | 真正圆形 |
| `scores/consent.css:18` | `body:has(.work-detail) .consent-continue`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `scores/jiangnan/index.html:56` | `.video-wrap`  | `16px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `scores/jiangnan/index.html:56` | `.pill`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `scores/jiangnan/index.html:57` | `.primary`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `scores/jiangnan/index.html:58` | `.sheet`  | `24px 24px 0 0` | `24px 24px 0 0` | 非对称结构／琴键 |
| `scores/jiangnan/index.html:58` | `.close`  | `50%` | `50%` | 真正圆形 |
| `scores/jiangnan/index.html:58` | `.choice`  | `14px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/jiangnan/index.html:58` | `.field input`  | `12px` | `var(--site-radius-control)` | 输入控件 |
| `scores/jiangnan/index.html:58` | `.wide`  | `12px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/jiangnan/index.html:58` | `.pay-summary`  | `14px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `scores/jiangnan/index.html:58` | `.method`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/jiangnan/index.html:58` | `.qr`  | `14px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `scores/jiangnan/index.html:58` | `.open-pay`  | `12px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/jiangnan/index.html:58` | `.status .mark`  | `50%` | `50%` | 真正圆形 |
| `scores/jiangnan/index.html:58` | `.fallback`  | `12px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `scores/jiangnan/index.html:58` | `.order-copy`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/jiangnan/index.html:58` | `.copy-btn`  | `10px` | `var(--site-radius-control)` | 按钮／输入／选项 |
| `scores/pusa-man/product.css:7` | `.product-preview img`  | `var(--site-card-radius)` | `8px` | 谱面预览裁切，保持原8px |
| `scores/scores.css:17` | `.button`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `scores/scores.css:19` | `.demo-video`  | `18px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `scores/scores.css:21` | `.search-input`  | `14px` | `var(--site-radius-control)` | 输入控件 |
| `scores/scores.css:23` | `.selection-bar`  | `20px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `scores/scores.css:24` | `.purchase-dialog`  | `22px` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `scores/scores.css:24` | `.close-button`  | `50%` | `50%` | 真正圆形 |
| `scores/scores.css:34` | `.checkout-field input`  | `14px` | `var(--site-radius-control)` | 输入控件 |
| `scores/scores.css:36` | `.payment-qr`  | `14px` | `var(--site-radius-card)` | 普通卡片／容器 |
| `scores/scores.css:51` | `.score-card`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `student-profile/profile.css:16` | `input[type=text],textarea`  | `16px` | `var(--site-radius-control)` | 输入控件 |
| `student-profile/profile.css:24` | `#submitProfile`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `students/shared/dashboard.css:20` | `.period-panel`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `students/shared/dashboard.css:44` | `.dashboard .resource-list a.training-link`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `teacher/style.css:20` | `.teacher-dashboard .resource-list a.training-link`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `teacher/style.css:30` | `.teacher-menu .resource-list a.training-link`  | `0` | `0` | 无表面链接／贴边容器或继承父容器结构 |
| `works/beyond-the-horizon/animated-score.css:2` | `.animated-score video`  | `var(--site-card-radius)` | `var(--site-radius-panel)` | 大型面板／弹窗／媒体面板 |
| `works/works.css:18` | `.work-card`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |
| `works/works.css:41` | `.score-actions button.site-cta`  | `999px` | `var(--site-radius-pill)` | 胶囊语义 |
| `works/works.css:62` | `.category-card`  | `var(--site-card-radius)` | `var(--site-radius-card)` | 普通卡片／容器 |

## 附录D：实际依赖文件

- `ET-Intervals/01-Direction-gn2y3h/index.html`
- `ET-Intervals/01-Direction-gn2y3h/script.js`
- `ET-Intervals/01-Direction-gn2y3h/style.css`
- `ET-Intervals/02-Distance-p65l32/index.html`
- `ET-Intervals/02-Distance-p65l32/script.js`
- `ET-Intervals/02-Distance-p65l32/style.css`
- `ET-Intervals/03-EchoSinging-l9ipbz/index.html`
- `ET-Intervals/04-Octave-irx7ar/index.html`
- `ET-Intervals/05-2nd-d7wzes/index.html`
- `ET-Intervals/06-2nd-9g6ymn/index.html`
- `ET-Intervals/07-7th-wns1er/index.html`
- `ET-Intervals/08-7th-f0m7ys/index.html`
- `ET-Intervals/09-3rd-hz86pk/index.html`
- `ET-Intervals/10-3rd-9sb0vu/index.html`
- `ET-Intervals/11-6th-z79m8y/index.html`
- `ET-Intervals/12-6th-020gcq/index.html`
- `ET-Intervals/13-4th-fdown4/index.html`
- `ET-Intervals/14-4th-gqx79i/index.html`
- `ET-Intervals/15-5th-4awj58/index.html`
- `ET-Intervals/16-5th-1d2mp0/index.html`
- `ET-Intervals/17-Compound-be0x3n/index.html`
- `ET-Intervals/18-Compound-1qoxm6/index.html`
- `ET-Intervals/shared/styles/base.css`
- `MT-Intervals/lesson01/index.html`
- `MT-Intervals/lesson01/practice/index.html`
- `MT-Intervals/lesson02/index.html`
- `MT-Intervals/lesson02/practice/index.html`
- `MT-Intervals/lesson03/index.html`
- `MT-Intervals/lesson04-x3n6cu/index.html`
- `MT-Intervals/lesson05-s2e2f4/index.html`
- `MT-Intervals/lesson06/index.html`
- `MT-Intervals/lesson06/lesson.css`
- `MT-Intervals/lesson06/lesson.js`
- `MT-Intervals/shared/styles/practice-base.css`
- `MT-Intervals/shared/utils/format-time.js`
- `articles/article.html`
- `articles/articles.css`
- `articles/articles.js`
- `articles/index.html`
- `assets/course-visual.css`
- `assets/practice-report.js`
- `assets/site-analytics.js`
- `assets/site-language.js`
- `assets/site-navigation.css`
- `assets/site-navigation.js`
- `assets/site-visual.css`
- `courses/courses.css`
- `courses/courses.js`
- `courses/index.html`
- `courses/interval-ear-training/index.html`
- `courses/interval-theory/index.html`
- `courses/private-lessons/index.html`
- `en/home.css`
- `en/index.html`
- `index.html`
- `learning-resources/course-catalog.js`
- `learning-resources/interval-theory.js`
- `learning-resources/resource-links.css`
- `learning-resources/resource-links.js`
- `scores/catalog-categories.css`
- `scores/catalog-categories.js`
- `scores/consent.css`
- `scores/consent.js`
- `scores/index.html`
- `scores/jiangnan/index.html`
- `scores/piano-intros/catalog.js`
- `scores/piano-intros/checkout.js`
- `scores/piano-intros/index.html`
- `scores/piano-intros/intro.css`
- `scores/piano-intros/pricing.js`
- `scores/pugongying-de-yueding/index.html`
- `scores/pusa-man/checkout.js`
- `scores/pusa-man/index.html`
- `scores/pusa-man/product.css`
- `scores/score-labels.js`
- `scores/scores.css`
- `student-profile/index.html`
- `student-profile/profile.css`
- `student-profile/profile.js`
- `students/470c56f6f65407f2cc3ce5e33be8ef2d/index.html`
- `students/470c56f6f65407f2cc3ce5e33be8ef2d/student-data.js`
- `students/samuel-b5def80cdaa55d42/index.html`
- `students/samuel-b5def80cdaa55d42/student-data.js`
- `students/shared/dashboard-logic.js`
- `students/shared/dashboard-template.js`
- `students/shared/dashboard.css`
- `students/shared/dashboard.js`
- `students/xiaoyu-d8bfbdb6f0b01b40/index.html`
- `students/xiaoyu-d8bfbdb6f0b01b40/student-data.js`
- `teacher/course-resources/index.html`
- `teacher/index.html`
- `teacher/script.js`
- `teacher/style.css`
- `teacher/teacher-data.js`
- `works/before-the-scream/index.html`
- `works/beyond-the-horizon/animated-score.css`
- `works/beyond-the-horizon/animated-score.js`
- `works/beyond-the-horizon/index.html`
- `works/guo-bu-qu/index.html`
- `works/haru-haru/index.html`
- `works/index.html`
- `works/opening-pulse/index.html`
- `works/poker-face/index.html`
- `works/shinunoga-ii-wa/index.html`
- `works/the-enchanted-box/index.html`
- `works/works.css`
- `works/works.js`

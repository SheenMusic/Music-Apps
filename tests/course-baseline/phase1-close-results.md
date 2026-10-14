# Phase 1 最终验收收尾（2026-10-14）

本次只修改测试、审核机制与说明/证据；不修改课程、Dashboard、Catalog、部署配置。原 Phase 0 基准仍为 `d4936c7ddbae8dfbd963c6880b1be983f2d96110`，非试点保护集成main仍为 `acd294069a670578d8bdb5ef1b0ea752e7ee2d52`。修复前集成HEAD为 `4ba6b9d3800eaa2f9e07640bd0195545b7bae9e4`，新提交以Git记录为准；提交后生成的审核请求绑定最终候选SHA。

## 修复与保护

- 统一截图 `caret: 'initial'`，包括参考采样和负向测试截图。不增加等待、不改变动画/字体/时钟规则、不降低DOM比较、不修改RGB/Alpha/数量/空间阈值，参考采样仍8次。
- 原生光标回归测试：三课截图前后DOM和控件状态相同，默认隐藏光标与原生光标没有真实可见内容差异；ET05新参考重建8/8有效。截图前若聚焦文本编辑控件则失败，防止未来可见光标被默默改变。
- 未能重现来源但满足全部严格检查及既定圆角条件的PNG为REVIEW_REQUIRED，不计PASS；参考状态/加载不一致仍FAIL，任何真实结构、样式、行为或不符合候选界限的差异不能人工豁免。
- 固定Phase0课程原始DOM、脚本、题库、资源路径保护保留；其他模块按集成main保护，合法Dashboard更新不会被旧全站基线误判。允许清单限于试点、共享CSS、测试/文档与明确审核证据文件。
- 原 `docs/course-phase1-visual-risk-review.md`、两项原FAIL JSON/PNG、原始日志和旧results.md都未覆盖。原审核材料在492KiB左右，无学生资料或凭据；原未跟踪架构审计报告原样保留且不纳入本提交。

## 最终自动化结果

| 项目 | 结果 |
|---|---|
| 行为与作用域 | 5通过、0失败、3既有TODO（不计通过） |
| CSS隔离 | 1测试通过，8页×Light/Dark，动态Dashboard确实加载 |
| 视觉负向 | 2测试通过；11个真实UI/变量变化不能放行，伪造圆角PNG只能待审，不能自动通过；主体/Alpha/超通道/结构变化仍FAIL |
| 光标夹具回归 | 1测试通过，三课保护及固定八次参考重建有效 |
| 人工门禁 | 2单元测试通过；无批准/拒绝/过期/改源码规则或证据/矩阵不完整/真实自动失败均阻塞；仅审批记录提交不造成SHA自引用循环 |
| 视觉矩阵 | 43用例断言通过，automaticFailures=0，378状态/84对PNG完成 |
| PNG PASS | 82 |
| PNG PASS_WITH_RASTER_VARIANCE | 1（ET06 430×932 Light 报告页11像素，固定8次中独立重现） |
| PNG REVIEW_REQUIRED | 1（ET06 430×932 Dark 报告页11像素，RGB最大差1，Alpha一致，同一右下圆角，8次有效状态但未独立重现） |
| PNG FAIL | 0 |
| 语法/资源/加载 | 8关键页57个大小写敏感资源引用、10 CSS、5内联脚本及43已跟踪外部JS检查通过；全部当前CJS另行语法检查；8关键页0资源404/0pageerror |
| Git范围/证据 | diff --check通过；相对任务起始HEAD生产文件零改动；原日志、图像、诊断、results哈希不变 |

视觉命令因REVIEW_REQUIRED退出1，是刻意的待审阻塞；Node总计44 tests，其中43用例PASS、1文件级test failed来自非零退出，不能把退出码说成通过。没有新的自动断言或真实PNG FAIL。独立门禁也退出1，状态BLOCKED，pending=3。

## 待人工审核（三项，不预填批准）

1. 历史 `ET05-390x844-dark-initial`：原九像素FAIL与原诊断保持，当前同名用例严格PASS；夹具问题已修复，原差异仍有独立历史审核请求。
2. 历史 `ET06-430x932-light-report`：原十一像素FAIL保留，本轮同名用例独立参考重现通过；旧图片/旧诊断不被本轮覆盖。
3. 当前 `ET06-430x932-dark-report`：同一reportCard右下角微差异的新主题用例，单独REVIEW_REQUIRED，未与历史Light合并，也未自动批准。

`visual-review-decisions.json` decisions为空。请求包含scope/用例、Phase0基准、候选集成SHA、源码和规则指纹、整轮证据指纹、原/新PNG哈希、原始诊断及其哈希；由授权人工填写reviewer、reviewedAt、APPROVED/REJECTED和reason。任何相关变化要求重新核验；校验器不认证审核人身份，不自动创建批准。原失败诊断中的FAIL不会被审批改写。

新运行证据目录 `/tmp/course-phase1-close/visual/`，日志 `/tmp/course-phase1-close-visual.log`，行为/隔离/负向 `/tmp/course-phase1-close-checks.log`，光标 `/tmp/course-phase1-close-fixture.log`，门禁单测 `/tmp/course-phase1-close-review-gate-tests.log`，路径/语法 `/tmp/course-phase1-close-static.log`，页面加载 `/tmp/course-phase1-close-smoke.log`。提交后运行：

```bash
node tests/course-baseline/visual-review.cjs /tmp/course-phase1-close/visual tests/course-baseline/visual-review-decisions.json
```

输出 `/tmp/course-phase1-close/visual/review-requests.json` 绑定最终候选提交；缺批准继续BLOCKED。审核材料充分，可以进入人工视觉/部署审批环节，但当前不满足实际部署门禁；未提交人工APPROVED，未推送、合并或部署，不进入Phase2。真实麦克风/音频/人声、剪贴板权限、iPhone/iPad/Safari验收仍需要人工完成；既有TODO不修复。

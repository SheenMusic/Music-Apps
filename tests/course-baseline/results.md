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

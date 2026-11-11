# Music-Apps · 给 Codex 的工作说明

静态网站（HTML/CSS/JS），GitHub Pages 部署，只有 push 到 main 才会上线。站点：sheenyang.com。

源码在私有仓库 `SheenMusic/Music-Apps-source`（本地 origin）。push 到它的 main 后，`.github/workflows/publish.yml` 校验并生成学员页面，再只把网站文件（不含 docs/、scripts/、tests/、各类 README 与本文件）推送到公开仓库 `SheenMusic/Music-Apps`，由 GitHub Pages 发布。公开仓库是自动生成的，不要直接修改或推送它。

## 开始任何任务前先读

- `docs/project-handover.md`：项目背景、已确认规则、待办（2026-10-25 从 ChatGPT/Codex 迁移时整理，历史状态需对照代码核验）
- `docs/interactive-theory-lesson-standard.md`：所有 Learning 页面的规范源
- `shared/README.md`：共享 Practice / 五线谱组件
- 和弦课：`docs/chord-theory/lesson01-v3.md`（定稿文案，由课件导出；V2 为历史稿）、`docs/chord-theory/lesson01-learning-steps.md`（各轮审核决定）
- 新课程的记谱、演示区、讲解节奏与 Quiz 规则：规范第 13、14 节（N01–N12、L01–L11）；共享实现在 `MT-Chord/shared/`

## 工作方式

1. 先讨论方案，用户确认后再改代码；教学内容、答案接受范围、重要视觉由用户最终决定。
2. 范围最小：不做无关重构，不动已验收的 MT、ET、Practice。
3. 学员文件（`students/*/student-data.js`）只做小范围数据修改；不加 Payment status；历史进度不等于当前进度。
4. 代码保持易读（用户常在手机上看）：不压缩、不堆空行、不引入构建系统和新框架。
5. 改规则时同步更新对应 Markdown 文档。
6. 报告状态时区分：已修改 / 已提交 / 已推送 / 已部署 / 未验证。没真正跑过的测试写「未验证」。
7. 推送 main 等于上线，推送前需用户明确同意。

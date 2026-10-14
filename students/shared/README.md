# Student Dashboard V2

Each student's independent directory contains only a lightweight `index.html` loader and their own `student-data.js`. Load only the current student's configuration, then the shared layout and behavior. Never put survey backgrounds, contact details or credentials in these public assets.

- `dashboard-template.js`: one shared page layout.
- `dashboard.css`: Samuel's existing styles, shared unchanged visually.
- `dashboard.js`: progress, independent allowed-resource filtering, default-collapsed course lists and UTC+8 period calculations. Expiry never disables links.
- Course titles and URLs remain in `/learning-resources/course-catalog.js`; student data has no duplicated lesson URLs.

To add a student: generate an independent cryptographically random directory suffix; create a lightweight loader matching the existing two students; add only that student's learning configuration. `currentLessons`, `accessibleLessons`, `accessibleSupplementary` and periods are independent. Do not infer prior lesson results or completion. `status: 'previous'` records participation without claiming completion. `showPeriodDuration: true` displays period length calculated from dates. Append a dated period to renew.

Teacher-directory entries may include each student's `dashboardURL` for direct navigation, as approved by the site owner. Keep background survey information and credentials out of public assets. A missing URL remains an informational pending entry. No frontend password or localStorage synchronization is implemented. Random paths/noindex are not identity verification.


## 报名课程与在线资源

Enrollment Course 表示实际报名或购买的教学课程，Learning Resource 表示关联的在线 App、PDF、课时和练习。二者不是同一层次；`courseCatalog.courses` 不要求覆盖所有报名课程。校验脚本直接认可 `chord-theory`（当前主要使用本地 PDF）与 `interval-theory`（对应开发中的 MT-Intervals），不将它们定义为废弃课程，不创建占位 App，也不修改学员 ID。其他未知 ID 仍报错。已有在线课时继续按 Catalog 或现有 MT 资源映射校验；开放配置不会自动改变 Dashboard 的现有资源解析方式。

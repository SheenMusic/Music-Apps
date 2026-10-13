# Student Dashboard V2

Each student's independent directory contains only a lightweight `index.html` loader and their own `student-data.js`. Load only the current student's configuration, then the shared layout and behavior. Never put survey backgrounds, contact details or credentials in these public assets.

- `dashboard-template.js`: one shared page layout.
- `dashboard.css`: Samuel's existing styles, shared unchanged visually.
- `dashboard.js`: progress, independent allowed-resource filtering, default-collapsed course lists and UTC+8 period calculations. Expiry never disables links.
- Course titles and URLs remain in `/learning-resources/course-catalog.js`; student data has no duplicated lesson URLs.

To add a student: generate an independent cryptographically random directory suffix; create a lightweight loader matching the existing two students; add only that student's learning configuration. `currentLessons`, `accessibleLessons`, `accessibleSupplementary` and periods are independent. Do not infer prior lesson results or completion. `status: 'previous'` records participation without claiming completion. `showPeriodDuration: true` displays period length calculated from dates. Append a dated period to renew.

Teacher-directory entries may include each student's `dashboardURL` for direct navigation, as approved by the site owner. Keep background survey information and credentials out of public assets. A missing URL remains an informational pending entry. No frontend password or localStorage synchronization is implemented. Random paths/noindex are not identity verification.

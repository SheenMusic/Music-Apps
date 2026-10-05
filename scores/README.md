# 乐铺屋 / Scores

- `/scores/`：出版物目录，不使用商品封面墙。
- `/scores/jiangnan/`：免费样本、原 Demo Video 和原样上传的 PDF。
- `/scores/piano-intros/`：曲库浏览、搜索、自选、扫码付款与订单提交。
- `scores.css`：仅 Scores 布局，继续引用主站视觉与 GA4 资源。

## 扩充曲库

修改 `data/piano-intros.json`，不需要改 HTML/CSS/JS：

- `tracks` 中增加 `number`、`title`、`artist`、`volume`。编号会自动排序和显示为三位数。
- 001–030 的 `volume` 固定为 1；031 起填 2。以后新增合辑时在 `volumes` 增加编号范围、标题、说明、价格；只有该范围曲目全部存在时才展示合辑购买入口。
- 免费样本设 `free: true` 并提供相对曲库页面的 `url`。不占付费自选名额。
- 自动计价统一由 `piano-intros/pricing.js` 管理，不限制勾选数量，前台仅显示当前优惠价。
- 1–4首每首 ¥2；5–9首 ¥9 + 超出5首的数量 × ¥2；10–15首 ¥17 + 超出10首的数量 × ¥2。16首起采用 Piano Intros Vol. 1 全30首 ¥29；继续勾选、搜索或取消不会丢失选择，降回15首恢复自选 ¥27。

## 支付流程

分类结构版本的恢复点：`62df45cdaafd4b2ed4038e59d2c407eaa5096986`。

`piano-intros/checkout.js` 沿用旧《江南》的支付宝链接、支付宝/微信收款码、Formspree JSON POST (`https://formspree.io/f/xyezovwb`)、12 秒 AbortController 超时和复制订单 fallback。支付后的订单仍需人工核对到账，**不是自动支付确认或自动发货**。

每次打开购买窗口会冻结所选曲目与价格，生成 `PI-日期-随机码` 订单号。同一订单重试沿用该编号，方便人工识别可能重复收到的提交。Formspree 字段：

- `_subject`、`order_id`、`product`、`amount`、`package_type` / `purchase_type`。
- `pricing_method`：单首、多选自动优惠或全辑说明。`selected_paid_count`：实际订单的付费曲目数；`requested_paid_count`：触发推荐前的自选数（直接购买全辑时为全辑付费曲目数）。
- `requested_tracks`：用户实际勾选的付费曲目“编号 歌名”清单；采用全辑时仍保留原勾选信息。
- `selected_tracks`：可直接阅读的“编号 歌名”逐行清单；`tracks`：结构化曲目数组；`track_count`。
- `buyer_email`、`payment_method`、`payment_name`、`submitted_at`。

原《江南》支付样式、控件和订单代码仍原样保留在免费详情页的 `template#legacy-jiangnan-checkout`，不显示、不执行；新购买流程只在曲库页面执行。付款二维码保持原色白底，不随 Dark Mode 反色。

在当前 Cloud 环境 Formspree 网络访问被阻止，浏览器测试验证的是完整请求数据、成功响应、失败/超时及同号重试。正式环境收件与支付宝/微信实际 App 付款需人工验证。

## 乐谱使用确认

`consent.js` / `consent.css` 提供 FREE / PAID 共用确认界面。免费入口标记 `data-score-consent="稳定且唯一的乐谱标识"`，同一乐谱的目录、预览和下载入口使用同一标识；原 `href`、`target`、`download` 保持原样。动态前奏曲库使用 `piano-intros:三位编号`。免费确认仅在当前浏览会话复用，未使用长期存储。

付费流程每次从 Email/订单详情进入付款前调用 `scoreConsent.request('paid')`，不保存确认状态；取消确认停留在订单详情，返回修改后需重新确认。计价、订单数据、收款码和提交逻辑继续由原模块控制。

# 乐铺屋 / Scores

本轮前版本：`ed39780a19d2a09b8c87dbdcc88d8743f1c17e66`。

- `/scores/`：出版物目录，不使用商品封面墙。
- `/scores/jiangnan/`：免费样本、原 Demo Video 和原样上传的 PDF。
- `/scores/piano-intros/`：曲库浏览、搜索、自选、扫码付款与订单提交。
- `scores.css`：仅 Scores 布局，继续引用主站视觉与 GA4 资源。

## 扩充曲库

修改 `data/piano-intros.json`，不需要改 HTML/CSS/JS：

- `tracks` 中增加 `number`、`title`、`artist`、`volume`。编号会自动排序和显示为三位数。
- 001–030 的 `volume` 固定为 1；031 起填 2。以后新增合辑时在 `volumes` 增加编号范围、标题、说明、价格；只有该范围曲目全部存在时才展示合辑购买入口。
- 免费样本设 `free: true` 并提供相对曲库页面的 `url`。不占付费自选名额。
- `selectionPackages` 保存 1、5、10 首套餐价格。其他数量不能确认，最多勾选 10 首。

## 支付流程

分类结构版本的恢复点：`62df45cdaafd4b2ed4038e59d2c407eaa5096986`。

`piano-intros/checkout.js` 沿用旧《江南》的支付宝链接、支付宝/微信收款码、Formspree JSON POST (`https://formspree.io/f/xyezovwb`)、12 秒 AbortController 超时和复制订单 fallback。支付后的订单仍需人工核对到账，**不是自动支付确认或自动发货**。

每次打开购买窗口会冻结所选曲目与价格，生成 `PI-日期-随机码` 订单号。同一订单重试沿用该编号，方便人工识别可能重复收到的提交。Formspree 字段：

- `_subject`、`order_id`、`product`、`amount`、`package_type` / `purchase_type`。
- `selected_tracks`：可直接阅读的“编号 歌名”逐行清单；`tracks`：结构化曲目数组；`track_count`。
- `buyer_email`、`payment_method`、`payment_name`、`submitted_at`。

原《江南》支付样式、控件和订单代码仍原样保留在免费详情页的 `template#legacy-jiangnan-checkout`，不显示、不执行；新购买流程只在曲库页面执行。付款二维码保持原色白底，不随 Dark Mode 反色。

在当前 Cloud 环境 Formspree 网络访问被阻止，浏览器测试验证的是完整请求数据、成功响应、失败/超时及同号重试。正式环境收件与支付宝/微信实际 App 付款需人工验证。

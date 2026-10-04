# 乐铺屋 / Scores

本轮前版本：`ed39780a19d2a09b8c87dbdcc88d8743f1c17e66`。

- `/scores/`：出版物目录，不使用商品封面墙。
- `/scores/jiangnan/`：免费样本、原 Demo Video 和原样上传的 PDF。
- `/scores/piano-intros/`：曲库浏览、搜索、自选与购买准备确认。
- `scores.css`：仅 Scores 布局，继续引用主站视觉与 GA4 资源。

## 扩充曲库

修改 `data/piano-intros.json`，不需要改 HTML/CSS/JS：

- `tracks` 中增加 `number`、`title`、`artist`、`volume`。编号会自动排序和显示为三位数。
- 001–030 的 `volume` 固定为 1；031 起填 2。以后新增合辑时在 `volumes` 增加编号范围、标题、说明、价格；只有该范围曲目全部存在时才展示合辑购买入口。
- 免费样本设 `free: true` 并提供相对曲库页面的 `url`。不占付费自选名额。
- `selectionPackages` 保存 1、5、10 首套餐价格。其他数量不能确认，最多勾选 10 首。

## 支付边界

新套餐目前仅生成确认清单和价格，**不收款、不提交订单**。旧流程的商品、金额与《江南》绑定，不能直接用于新套餐。

原《江南》支付样式、控件、支付宝链接、微信收款码引用和 Formspree 订单代码原样保存在详情页的 `template#legacy-jiangnan-checkout` 内；模板不显示、不执行，原支付素材也保留。完整旧页面可由以上 Git 恢复点取回。

接入正式付款前，需要专门适配新套餐的订单商品、选曲编号、金额与发货清单，并测试原支付/失败重试流程。当前确认弹窗已明确说明尚未发起付款。

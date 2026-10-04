# 普通文章维护

新增文章只需要两个文件操作，不需要改 HTML / CSS / JS：

1. 创建 `posts/<slug>.md`，slug 使用小写英文字母、数字和连字符。
2. 在 `articles.json` 数组中加入 metadata，例如：

```json
{"slug":"new-article","title":"文章标题","date":"2026-10-04","description":"简短介绍"}
```

列表按 JSON 数组顺序显示。`date`、`description` 可留空，不会生成额外文字。
阅读链接为 `article.html?slug=<slug>`，阅读页自动显示 metadata 标题；Markdown
可以直接写正文，支持 H1/H2/H3、段落、粗体、斜体、链接、引用、列表、图片。
图片和普通相对链接按 Markdown 文件所在的 `posts/` 目录解析；标题自动生成
锚点，重复标题使用数字后缀。正文始终经过 DOMPurify 清理再显示。

`about.md` 当前为空，页面仅显示 metadata 标题「关于我」。不要在占位文件中
添加示例或解释性正文。`articles.css` 只负责文章布局，字体、颜色、Light/Dark、
focus 和渐入时长继续来自 `../assets/site-visual.css`。

## 本地依赖

运行时无 CDN、无需构建。以下发行文件来自 npm 官方 registry，下载时核对了
registry 提供的完整性摘要；许可证保存在 `vendor/`。仅移除开发用 source map
引用，不改运行时代码。更新依赖时同时更新版本说明及许可证。

- marked 18.0.14: https://registry.npmjs.org/marked/-/marked-18.0.14.tgz
  - integrity: `sha512-mBHK6FBHuBAlhgRe88w9F0O1AbwwXJUcQibUbC/QcdTbVGAD7aWza+xt3N6oT/jCZx3/OMeS+8rnuiHZcQ9s7A==`
- dompurify 3.4.16: https://registry.npmjs.org/dompurify/-/dompurify-3.4.16.tgz
  - integrity: `sha512-sqo+pNp3qRhCIpbgRi1y8Tgk27Bo2Ry7w0dC1NBeNTdZChWjz9Xb/KOoZbRP/R6pQZ80Qw8YhXw13hWWBbMRnQ==`

> [English](README.md) | 中文

# Kosmos 文档与网站

这个仓库包含了[Kosmos 网站](https://kosmos-io.github.io/website/)的源代码以及所有的 Kosmos 文档。
它是由[Docusaurus](https://docusaurus.io/)构建的，一个现代的静态网站生成器。

- [Kosmos 网站](https://kosmos-io.github.io/website/)
- [Kosmos 文档](https://kosmos-io.github.io/website/getting-started/introduction)

欢迎加入我们，非常感谢您的贡献！

## 添加或更新文档

当您添加或修改文档时，应该考虑这两个文件夹([`docs/`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2FUsers%2Fduanmeng%2FCode%2Fgithub2%2Fwebsite%2Fdocs%2F%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/Users/duanmeng/Code/github2/website/docs/") 和 [`i18n/zh-Hans/docusaurus-plugin-content-docs/current`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2FUsers%2Fduanmeng%2FCode%2Fgithub2%2Fwebsite%2Fi18n%2Fzh-Hans%2Fdocusaurus-plugin-content-docs%2Fcurrent%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/Users/duanmeng/Code/github2/website/i18n/zh-Hans/docusaurus-plugin-content-docs/current"))。

## 使用 Node.js 运行

如果您有 Node.js 环境，可以在本地运行该网站。
- 推荐使用 Node.js v18.0.0+ 和 npm v8.6+
- 您可以下载 [Node.js](https://nodejs.org/download/release/v18.0.0)

```shell script
# 克隆仓库，或克隆您自己的分叉
git clone https://github.com/<YOUR_GITHUB_USERNAME>/website.git

# 构建
yarn

# 启动网站
yarn start
```

一旦网站在本地运行，您可以通过访问 <http://localhost:3111/website/> 预览网站。

## 如何提交文档到这个仓库

该项目的默认文档语言是英语。
- 英文文档提交路径：[`./docs`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2FUsers%2Fduanmeng%2FCode%2Fgithub2%2Fwebsite%2Fdocs%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/Users/duanmeng/Code/github2/website/docs")
- 中文文档提交路径：[`./i18n/zh-Hans/docusaurus-plugin-content-docs/current`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2FUsers%2Fduanmeng%2FCode%2Fgithub2%2Fwebsite%2Fi18n%2Fzh-Hans%2Fdocusaurus-plugin-content-docs%2Fcurrent%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/Users/duanmeng/Code/github2/website/i18n/zh-Hans/docusaurus-plugin-content-docs/current")

注意：中文和英文文档的目录结构必须完全相同。

## 发送您的拉取请求

在检查所有更改后，请[创建一个拉取请求](https://help.github.com/en/articles/creating-a-pull-request)并附上[DCO](https://github.com/apps/dco)。
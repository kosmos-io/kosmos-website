> English | [中文](README_ZH.md)
> 
# Kosmos Docs & Website

This repo contains the source code of [Kosmos website](https://kosmos-io.github.io/website/) and all of the docs for Kosmos.
It's built by [Docusaurus](https://docusaurus.io/), a modern static website generator.

- [Kosmos website](https://kosmos-io.github.io/website/)
- [Kosmos docs](https://kosmos-io.github.io/website/getting-started/introduction)

Welcome to join us and you are more than appreciated to contribute!

## Add or Update Docs

When you add or modify the docs, these two files(`docs/` and `i18n/zh-Hans/docusaurus-plugin-content-docs/current`) should be taken into consideration.

## Run with Node.js

If you have the Node.js environment, you can run the website locally.
- It is recommended to use version node v18.0.0+ and npm v8.6+
- You can download [Node.js](https://nodejs.org/download/release/v18.0.0)

```shell script
# Clone the repo, or your own fork
git clone https://github.com/<YOUR_GITHUB_USERNAME>/website.git

# build
yarn

# Start the site
yarn start
```

Once the site is running locally, you can preview the site by visiting <http://localhost:3111/website/>.

## How to Submit Documentation to this repo

The default documentation language for the project is English.
- English documentation submission path: `./docs`
- Chinese documentation submission path: `./i18n/zh-Hans/docusaurus-plugin-content-docs/current`

Note: The directory structures for both Chinese and English documentation must be completely identical.

## Send your pull request

After all changes checked well, please [creating a pull request](https://help.github.com/en/articles/creating-a-pull-request) with [DCO](https://github.com/apps/dco).
# Kosmos Docs & Website

This repo contains the source code of [Kosmos website](https://kosmos-io.github.io/website/) and all of the docs for Kosmos.
It's built by [Docusaurus](https://kosmos-io.github.io/website/v0.2.0/getting-started/introduction), a modern static website generator.

- [Kosmos website](https://kosmos-io.github.io/website/)
- [Kosmos docs](https://kosmos-io.github.io/website/v0.2.0/getting-started/introduction)

Welcome to join us and you are more than appreciated to contribute!

## Add or Update Docs

When you add or modify the docs, these two files(`docs/kosmos/docs/` and `sidebars.js`) should be taken into consideration.

## Run with Node.js

If you have the Node.js environment, you can run the website locally.

```shell script
# Clone the repo, or your own fork
git clone https://github.com/<YOUR_GITHUB_USERNAME>/website.git

# Confirm doc update
cd website/kosmos
npm i

# Start the site
npm start
```

Once the site is running locally, you can preview the site by visiting <http://localhost:3111/website/>.

## Build

This command generates static content into the `build` directory and can be served using any static contents hosting service.

````shell script
# Static website update
cd website/kosmos
npm run build -- --out-dir ../docs
````

## Send your pull request

After all changes checked well, please [creating a pull request](https://help.github.com/en/articles/creating-a-pull-request) with [DCO](https://github.com/apps/dco).
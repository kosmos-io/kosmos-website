//具体配置可以查看 https://docusaurus.io/docs/api/docusaurus-config
import { url } from "inspector";
import { type } from "os";
import { themes as prismThemes } from "prism-react-renderer";

// /** @type {import('@docusaurus/types').Config} */
const config = {
	title: "Kosmos", //网站标题
	tagline: "Flexible and scalable Kubernetes multi-cluster management solution. The limitless expansion of Kubernetes. Make Kubernetes without boundaries", //网站标语
	favicon: "img/favicon.ico", //你的网站图标的路径；必须是可以用于链接 href 的 URL

	// Set the production url of your site here
	url: "https://kosmos-io.github.io",

	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/kosmos-website/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "kosmos", // Usually your GitHub org/user name.
	projectName: "kosmos-website", // Usually your repo name.
	deploymentBranch: "gh-pages",
	trailingSlash: false,

	onBrokenLinks: "ignore", //Docusaurus 在检测到无效链接时的行为
	onBrokenMarkdownLinks: "warn",

	//i18n配置相关
	i18n: {
		defaultLocale: "en",
		locales: ["en", "zh-Hans"],
		localeConfigs: {
			en: {
				label: "English",
			},
			"zh-Hans": {
				label: "简体中文",
			},
		},
	},

	scripts: [], //一组要加载的脚本
	presets: [
		[
			"classic",
			// /** @type {import('@docusaurus/preset-classic').Options} */
			{
				docs: {
					sidebarPath: require.resolve("./sidebars.js"),
					showLastUpdateTime: true,
					showLastUpdateAuthor: true,
					editUrl:
						"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
				},
				blog: {
					showReadingTime: true,
					editUrl:
						"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
				},
				theme: {
					customCss: require.resolve("./src/css/custom.css"),
				},
				sitemap: {
					changefreq: "weekly",
					priority: 0.5,
				},
			},
		],
	],
	plugins: ["docusaurus-tailwindcss-loader", "docusaurus-plugin-image-zoom"],
	themeConfig: {
		image: "img/docusaurus-social-card.jpg",
		//切换主题按钮关闭
		colorMode: {
			defaultMode: "light",
			disableSwitch: true,
			respectPrefersColorScheme: false,
		},
		navbar: {
			title: "Kosmos",
			logo: {
				alt: "Kosmos Logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "tutorialSidebar",
					label: "Documentation",
					position: "left",
				},
				{
					type: "localeDropdown",
					position: "right",
				},
				{
					href: "https://kosmos-io.github.io/website/quick-start",
					label: "Examples",
					position: "right"
				},
				{
					href: "https://github.com/kosmos-io/kosmos",
					className: "header-github-link",
					"aria-label": "GitHub repository",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Documentation",
					items: [
						{
							label: "Getting Started",
							to: "getting-started/introduction",
						},
						{
							label: "Tutorials",
							to: "tutorials/mcs-discovery",
						},
						{
							label: "Proposals",
							to: "proposals/k8s-in-k8s",
						},
					],
				},
				{
					title: "Community",
					items: [
						{
							label: "Community Address Name",
							href: "https://github.com/kosmos-io/kosmos",
						},
					],
				},
				{
					title: "More",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/kosmos-io/kosmos",
						},
					],
				},
			],
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["cue", "powershell"],
		},
		zoom: {
			selector: ".markdown :not(em) > img",
			config: {
				background: {
					light: "rgb(255, 255, 255)",
					dark: "rgb(50, 50, 50)",
				},
			},
		},
	},
};

export default config;

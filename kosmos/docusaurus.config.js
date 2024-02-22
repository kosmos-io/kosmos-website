//具体配置可以查看 https://docusaurus.io/docs/api/docusaurus-config
import { themes as prismThemes } from "prism-react-renderer";

// /** @type {import('@docusaurus/types').Config} */
const config = {
	title: "Kosmos", //网站标题
	tagline: "文本标签", //网站标语
	favicon: "img/favicon.ico", //你的网站图标的路径；必须是可以用于链接 href 的 URL

	// Set the production url of your site here
	url: "https://kosmos-io.github.io",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/website/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "kosmos", // Usually your GitHub org/user name.
	projectName: "website", // Usually your repo name.
	deploymentBranch: "main",
	trailingSlash: false,

	onBrokenLinks: "throw", //Docusaurus 在检测到无效链接时的行为
	onBrokenMarkdownLinks: "warn",

	//i18n配置相关
	i18n: {
		defaultLocale: "zh",
		locales: ["zh"],
	},

	scripts: [], //一组要加载的脚本

	presets: [
		[
			"classic",
			// /** @type {import('@docusaurus/preset-classic').Options} */
			{
				docs: {
					sidebarPath: require.resolve("./sidebars.js"),
					routeBasePath: "/",
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
					position: "right",
					label: "文档",
				},
				{ to: "/blog", label: "参考案例", position: "right" },
				{
					href: "https://www.baidu.com",
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
					title: "文档",
					items: [
						{
							label: "快速开始",
							to: "/docs/intro",
						},
						{
							label: "实践教程",
							to: "/docs/intro",
						},
						{
							label: "核心概念",
							to: "/docs/intro",
						},
					],
				},
				{
					title: "社区",
					items: [
						{
							label: "社区地址1",
							href: "https://www.baidu.com",
						},
						{
							label: "社区地址2",
							href: "https://www.baidu.com",
						},
						{
							label: "社区地址3",
							href: "https://www.baidu.com",
						},
					],
				},
				{
					title: "更多",
					items: [
						{
							label: "GitHub1",
							href: "https://www.baidu.com",
						},
						{
							label: "GitHub2",
							href: "https://www.baidu.com",
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

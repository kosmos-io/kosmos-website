// 兼容旧版文档相关链接进行跳转
let hash = window.location.hash;


let hashMap = {
    '#/question?id=reset-pwd': '/config/config-debug',
    '#/advanced?id=onedrive-cf': 'advanced/cf-worker',
    '#/example': '/category/存储源示例配置',
    '#/example/': '/category/存储源示例配置',
    '#/pro': '/install/pro-linux',
}

if (hashMap[hash]) {
    window.location.href = hashMap[hash];
}

let path = window.location.href.replace(window.location.origin, "");

let pathMap = {
    '/zfile': '/',
    '/advanced#only-office': '/advanced/only-office',
    '/advanced/#only-office': '/advanced/only-office',
    '/advanced#google-drive-api': '/advanced/google-drive-api',
    '/advanced/#google-drive-api': '/advanced/google-drive-api',
    '/question#reset-pwd': '/config/config-debug',
    '/question/#reset-pwd': '/config/config-debug',
    '/example': '/category/存储源示例配置',
    '/example/': '/category/存储源示例配置'
}

if (pathMap[path]) {
    window.location.href = pathMap[path];
}


// 百度统计
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?e73e6c1d4f6b625ef90d78262c28cbb1";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();

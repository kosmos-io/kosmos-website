/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    tutorialSidebar: [
        // {
        //     id: 'testMd',
        //     type: 'doc',
        //     label: '测试1'
        // },
        {
            id: 'quick-start',
            type: 'doc',
        },
        {
            type: 'category',
            label: 'tutorials',
            items: [
                {
                    id: 'v0.2.0/tutorials/mcs-discovery',
                    type: 'doc',
                },
            ],
        },
        {
            id: 'example/describe2',
            type: 'doc',
        },
        {
            type: 'category',
            label: '第一种折叠',
            items: [
                {
                    id: 'example/list1/test1',
                    type: 'doc',
                },
            ],
        },
        {
            type: 'category',
            label: '第二种折叠',
            link: {
                type: 'generated-index',
                title: '第二种标题',
                description: '第二种标题描述不能写其他内容',
            },
            items: [
                {
                    id: 'example/list2/test2',
                    type: 'doc',
                },
            ],
        },
        {
            type: 'category',
            label: '第三种折叠',
            link: {
                type: 'doc',
                id: 'example/list3/list3Content',
            },
            items: [
                {
                    id: 'example/list3/test3',
                    type: 'doc',
                },
            ],
        }
    ],
};

export default sidebars;

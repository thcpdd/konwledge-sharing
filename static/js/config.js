window.$docsify = {
    // 自带的配置
    name: '知识分享库',
    homepage: 'index.md',
    repo: 'thcpdd',
    loadSidebar: true,
    subMaxLevel: 7,  // 自定义侧边栏后展示的最大目录深度
    auto2top: true,
    onlyCover: false,
    coverpage: true,
    loadNavbar: true,
    // 分页器插件
    pagination: {
        previousText: '上一部分',
        nextText: '下一部分',
        crossChapter: true,
        crossChapterText: true,
    },
    // 代码复制插件
    copyCode: {
        buttonText: 'copy',
        errorText: 'copied failed',
        successText: 'copied successful',
    },
    // 字数统计插件
    count: {
        countable: true,
        position: 'top',
        margin: '10px',
        float: 'right',
        fontsize: '0.9em',
        color: 'rgb(90, 90, 90)',
        language: 'chinese',
        localization: {
            words: "",
            minute: ""
        },
        isExpected: true
    },
    // 文本高亮插件
    'flexible-alerts': {
        style: 'callout' // flat
    },
    // 图片懒加载
    lazyImage: {
        placeholder: '/placeholder.png'
    }
}

(function () {
  var lazyLoadPlugin = function (hook, _) {
    // 在每次解析 Markdown 内容后调用
    hook.afterEach(function (html, next) {
      // 将 img 标签的 src 替换为懒加载属性
      const modifiedHtml = html.replace(/<img([^>]+)src="([^">]+)"([^>]*)>/g, (match, beforeSrc, src, afterSrc) => {
        return `<img${beforeSrc} src="${src}" loading="lazy"${afterSrc}>`;
      });
      next(modifiedHtml);
    });
  };

  // 将插件添加到 docsify 的插件数组中
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(lazyLoadPlugin, window.$docsify.plugins || []);
})();

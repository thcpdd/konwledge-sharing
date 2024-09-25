(function () {
  var lazyLoadPlugin = function (hook, vm) {
    let placeholder = vm.config.lazyImage.placeholder
    // 在每次解析 Markdown 内容后调用
    hook.afterEach(function (html, next) {
      // 将 img 标签的 src 替换为占位符，并存储真实 src
      const modifiedHtml = html.replace(/<img([^>]+)src="([^">]+)"([^>]*)>/g, (match, beforeSrc, src, afterSrc) => {
        return `<img${beforeSrc} src="${placeholder}" data-src="${src}"${afterSrc} class="lazyload">`;
      });
      next(modifiedHtml);
    });

    // 在所有内容加载完成后调用
    hook.doneEach(function () {
      const images = document.querySelectorAll('img.lazyload');

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.getAttribute('data-src');
              img.onload = () => img.classList.remove('lazyload');
              observer.unobserve(img);
            }
          });
        });

        images.forEach(img => observer.observe(img));
      } else {
        // 兼容旧浏览器
        images.forEach(img => {
          img.src = img.getAttribute('data-src');
          img.onload = () => img.classList.remove('lazyload');
        });
      }
    });
  };

  // 将插件添加到 docsify 的插件数组中
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = [].concat(lazyLoadPlugin, window.$docsify.plugins || []);
})();

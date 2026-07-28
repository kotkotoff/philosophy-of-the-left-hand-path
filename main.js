document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('js-enabled');

  var siteFooter = document.querySelector('[data-site-footer]');
  var reveals = document.querySelectorAll('.reveal');

  if (siteFooter) {
    siteFooter.innerHTML = '<p>&copy; 2026 Denys Spirin</p><p>Contact: <a href="mailto:denys.spirin@gmail.com">denys.spirin@gmail.com</a></p>';

    var analyticsScript = document.createElement('script');
    analyticsScript.defer = true;
    analyticsScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    analyticsScript.setAttribute('data-cf-beacon', '{"token": "d90965c1321948de8cd47d9a039782c3"}');
    siteFooter.insertBefore(analyticsScript, siteFooter.firstChild);
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(function(el) {
      observer.observe(el);
    });
  } else {
    reveals.forEach(function(el) {
      el.classList.add('visible');
    });
  }
});

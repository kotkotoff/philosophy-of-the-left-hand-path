document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('js-enabled');

  var siteFooter = document.querySelector('[data-site-footer]');
  var reveals = document.querySelectorAll('.reveal');
  var extraLinks = document.querySelectorAll('.extra-links');

  if (siteFooter) {
    siteFooter.innerHTML = '<p>&copy; 2026 Denys Spirin</p><p>Contact: <a href="mailto:denys.spirin@gmail.com">denys.spirin@gmail.com</a></p>';

    var analyticsScript = document.createElement('script');
    analyticsScript.defer = true;
    analyticsScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    analyticsScript.setAttribute('data-cf-beacon', '{"token": "d90965c1321948de8cd47d9a039782c3"}');
    siteFooter.insertBefore(analyticsScript, siteFooter.firstChild);
  }

  extraLinks.forEach(function(details) {
    if (details.hasAttribute('data-default-open')) {
      details.classList.add('hover-open');
      return;
    }

    var hoverOpenTimer = null;
    var hoverCloseTimer = null;
    var openDelay = 180;
    var closeDelay = 120;

    var setDetailsOpen = function(value) {
      details.open = value;
      details.classList.toggle('hover-open', value);
    };

    var openWithDelay = function() {
      clearTimeout(hoverCloseTimer);
      hoverOpenTimer = setTimeout(function() {
        setDetailsOpen(true);
      }, openDelay);
    };

    var closeWithDelay = function() {
      clearTimeout(hoverOpenTimer);
      hoverCloseTimer = setTimeout(function() {
        setDetailsOpen(false);
      }, closeDelay);
    };

    details.addEventListener('mouseenter', openWithDelay);
    details.addEventListener('mouseleave', closeWithDelay);

    details.addEventListener('focusin', function() {
      clearTimeout(hoverCloseTimer);
      setDetailsOpen(true);
    });

    details.addEventListener('focusout', function(event) {
      if (!details.contains(event.relatedTarget)) {
        closeWithDelay();
      }
    });
  });

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

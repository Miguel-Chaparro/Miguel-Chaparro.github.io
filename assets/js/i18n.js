// Simple i18n script
(function() {
  var userLang = (navigator.language || navigator.userLanguage).substring(0, 2);
  var supported = ['es', 'en'];
  var lang = supported.includes(userLang) ? userLang : 'en';
  var langFile = '/assets/js/lang/' + lang + '.json';

  function applyTranslations(translations) {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });
  }

  fetch(langFile)
    .then(function(response) { return response.json(); })
    .then(applyTranslations)
    .catch(function() { /* fallback: do nothing */ });
})();

/**
 * Optional: Lädt data.json für zukünftige dynamische Nutzung.
 * Die HTML-Seite hat bereits den statischen Inhalt eingebettet.
 */
(function () {
  fetch('data.json')
    .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
    .then(function (data) {
      if (data.header && data.header.firstName && data.header.lastName) {
        document.title = 'Bewerbungsdossier – ' + data.header.firstName + ' ' + data.header.lastName;
      }
    })
    .catch(function () {});
})();

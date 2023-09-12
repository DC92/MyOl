/**
 * Display misc values
 */
(async function() {
  let data = [];

  // myol storages in the subdomain
  ['localStorage', 'sessionStorage'].forEach(s => {
    if (window[s].length)
      data.push(s + ':');

    Object.keys(window[s])
      .forEach(k => data.push('  ' + k + ': ' + window[s].getItem(k)));
  });

  // Registered service workers in the scope
  if ('serviceWorker' in navigator)
    await navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length) {
        data.push('service-workers:'); //BEST BUG displayed event when we have nothing

        for (let registration of registrations)
          if (registration.active)
            data.push('  ' + registration.active.scriptURL);
      }
    });

  if (typeof caches == 'object')
    await caches.keys().then(function(names) {
      if (names.length) {
        data.push('caches:');

        for (let name of names)
          data.push('  ' + name);
      }
    });

  // Final display
  console.info(data.join('\n'));
})();
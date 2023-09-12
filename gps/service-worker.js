// Create/install cache
self.addEventListener('install', evt => {
	// Last file date will trigger the cache reload
	console.log('PWA install LAST_CHANGE_TIME');

	self.skipWaiting(); // Immediately activate the SW & trigger controllerchange

	const cacheName = 'myGpsCache';

	caches.delete(cacheName)
		.then(console.log('PWA ' + cacheName + ' deleted'))
		.catch(err => console.error(err));

	evt.waitUntil(
		caches.open(cacheName)
		.then(cache => {
			console.log('PWA open cache ' + cacheName);
			cache.addAll([
					'index.html',
					'manifest.json',
					'js.php?init',
					/*GPXFILES*/
				])
				.then(console.log('PWA files added to cache'))
				.catch(err => console.error(err));
		})
		.catch(err => console.error(err))
	);
});

// Serves required files
// Cache first, then browser cache, then network
self.addEventListener('fetch', evt => {
	//console.log('PWA fetch ' + evt.request.url);
	evt.respondWith(
		caches.match(evt.request)
		.then(found => found || fetch(evt.request))
		.catch(err => console.error(err + ' ' + evt.request.url))
	)
});
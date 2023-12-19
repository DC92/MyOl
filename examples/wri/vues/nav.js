var host = 'https://www.refuges.info/',
  initPermalink = false,
  layerOptions = false,
  mapKeys = {
    ign: 'iejxbx4obzhco6c8klxrfbto',
    thunderforest: 'ee751f43b3af4614b01d1bce72785369',
    os: 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF',
    bing: 'AldBMbaKNyat-j6CBRKxxH05uaxP7dvQu1RnMWCQEGGC3z0gjBu-bLniE_8WZvcC',
    kompass: '2ba8c124-38b6-11e7-ade1-e0cb4e28e847',
  };












// PARTIE A REPRENDRE
var contourMassif = coucheContourMassif({
    host: host,
    selectName: 'select-massif',
  }),

  map = new ol.Map({
    target: 'carte-nav',
    view: new ol.View({
      enableRotation: false,
      constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
    }),
    controls: [
      // Haut gauche
      new ol.control.Zoom(),
      new ol.control.FullScreen(),
      new myol.control.MyGeocoder(),
      new myol.control.MyGeolocation(),
      new myol.control.Load(),
      new myol.control.Download(),
      new myol.control.Print(),

      // Bas gauche
      new myol.control.MyMousePosition(),
      new ol.control.ScaleLine(),

      // Bas droit
      new ol.control.Attribution({ // Attribution doit être défini avant LayerSwitcher
        collapsed: false,
      }),
      new myol.control.Permalink({ // Permet de garder le même réglage de carte
        display: true, // Affiche le lien
        init: initPermalink, // On cadre le massif, s'il y a massif
      }),

      // Haut droit
      new myol.control.LayerSwitcher({
        layers: fondsCarte('nav', mapKeys),
      }),
    ],
    layers: [
      coucheMassifsColores({
        host: host,
        selectName: 'select-massifs',
      }),
      new myol.layer.vector.Chemineur({
        selectName: 'select-chem',
      }),
      new myol.layer.vector.Alpages({
        selectName: 'select-alpages',
      }),
      new myol.layer.vector.PRC({
        selectName: 'select-prc',
      }),
      new myol.layer.vector.C2C({
        selectName: 'select-c2c',
      }),
      new myol.layer.vector.Overpass({
        selectName: 'select-osm',
      }),

      contourMassif,

      couchePointsWRI({
        host: host, // Appeler la couche de CE serveur
        selectName: 'select-wri',
        selectMassif: contourMassif.options.selector,
      }, 'nav'),
      new myol.layer.Hover(), // Gère le survol du curseur
    ],
  });

myol.trace(map);
// FIN PARTIE A REPRENDRE

if (!initPermalink)
  map.getView().fit(ol.proj.transformExtent([5, 44.68, 5.72, 45.33], 'EPSG:4326', 'EPSG:3857'));
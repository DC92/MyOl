var host = 'https://www.refuges.info/',
  mapKeys = {},
  layerOptions = false,
  cadre = '../images/cadre.svg';

// PARTIE A REPRENDRE
var map = new ol.Map({
  target: 'carte-point',
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
      visible: false, // Mais on ne visualise pas le lien du permalink
      init: false, // Ici, on utilisera plutôt la position du point
    }),

    // Haut droit
    new myol.control.LayerSwitcher({
      layers: fondsCarte('point', mapKeys),
    }),
  ],
  layers: [
    // Les autres points refuges.info
    couchePointsWRI({
      host: host, // Appeler la couche de CE serveur
      browserClusterMinResolution: 4, // (mètres par pixel) pour ne pas générer de gigue à l'affichage du point
    }, 'point'),

    // Le cadre rouge autour du point de la fiche
    new myol.layer.Marker({
      prefix: 'cadre', // S'interface avec les <TAG id="cadre-xxx"...>
      // Prend la position qui est dans <input id="cadre-json">
      src: cadre,
      focus: 15, // Centrer
      zIndex: 300, // Above the features, under the hover label
    }),

    // Gère le survol du curseur
    new myol.layer.Hover(),
  ],
});

myol.trace(map);
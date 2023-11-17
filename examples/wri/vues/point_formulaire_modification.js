var host = 'https://www.refuges.info/',
  mapKeys = {},
  layerOptions = false,
  viseur = '../images/viseur.svg';







// PARTIE A REPRENDRE
// Gestion des cartes
var curseur = new myol.layer.Marker({
  src: viseur,
  prefix: 'marker', // S'interface avec les <TAG id="marker-xxx"...>
  dragable: true,
  focus: 17,
});

new ol.Map({
  target: 'carte-modif',
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

    // Bas gauche
    new myol.control.MyMousePosition(),
    new ol.control.ScaleLine(),

    // Bas droit
    new ol.control.Attribution({ // Attribution doit être défini avant LayerSwitcher
      collapsed: false,
    }),
    new myol.control.Permalink({ // Permet de garder le même réglage de carte en création de point
      init: !curseur.els.json.value, // On cadre le point si on est en modification
      //TODO à challenger
    }),

    // Haut droit
    new myol.control.LayerSwitcher({
      layers: fondsCarte('modif', mapKeys),
    }),
  ],
  layers: [
    couchePointsWRI({
      host: host, // Appeler la couche de CE serveur
    }), // Les autres points refuges.info
    curseur, // Le viseur jaune pour modifier la position du point
    new myol.layer.Hover(), // Gère le survol du curseur
  ],
});
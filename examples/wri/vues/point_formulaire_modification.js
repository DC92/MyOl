// Utilitaire de saisie
function affiche_et_set(el, affiche, valeur) {
  document.getElementById(el).style.visibility = affiche;
  document.getElementById(el).value = valeur;
  return false;
}

// Gestion des cartes
var mapKeys = {};
//var mapKeys = <?=json_encode($config_wri['mapKeys'])?>;

new ol.Map({
  target: 'carte-modif',
  view: new ol.View({
    center: ol.proj.transform([5.5067, 44.9844], 'EPSG:4326', 'EPSG:3857'),
    //WRI center: ol.proj.transform([<?=$vue->point->longitude?>, <?=$vue->point->latitude?>], 'EPSG:4326', 'EPSG:3857'),
    zoom: 13,
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
    new myol.control.Permalink({ // Permet de garder le même réglage de carte
      visible: false, // Mais on ne visualise pas le lien du permalink
      init: false, // Ici, on utilisera plutôt la position du point
    }),

    // Haut droit
    new myol.control.LayerSwitcher({
      layers: fondsCarte('modif', mapKeys),
    }),
  ],
  layers: [
    // Les autres points refuges.info
    couchePointsWRI({
      host: 'https://www.refuges.info/',
      //WRI host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de CE serveur
    }),
    // Le viseur jaune pour modifier la position du point
    new myol.layer.Marker({
      src: '../images/viseur.svg',
      //WRI src: '<?=$config_wri["sous_dossier_installation"]?>images/viseur.svg',
      prefix: 'marker', // S'interface avec les <TAG id="marker-xxx"...>
      dragable: true,
      focus: 15,
    }),
    new myol.layer.Hover(), // Gère le survol du curseur
  ],
});
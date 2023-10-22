// Forçage de l'init des coches
/*
<?php if ( $vue->polygone->id_polygone ) { ?>
  // Supprime toutes les sélections commençant par myol_selecteur
  Object.keys(localStorage)
    .filter(k => k.substring(0, 14) == 'myol_selecteur')
    .forEach(k => localStorage.removeItem(k));

  // Force tous les points et le contour
  localStorage.myol_selecteurwri = 'all';
  localStorage.myol_selecteurmassif = <?=$vue->polygone->id_polygone?>;
<?php } ?>
*/

var mapKeys = {
    ign: 'iejxbx4obzhco6c8klxrfbto',
    thunderforest: 'ee751f43b3af4614b01d1bce72785369',
    os: 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF',
    bing: 'AldBMbaKNyat-j6CBRKxxH05uaxP7dvQu1RnMWCQEGGC3z0gjBu-bLniE_8WZvcC',
    kompass: '2ba8c124-38b6-11e7-ade1-e0cb4e28e847',
  },
  host = 'https://www.refuges.info/',
  /*var mapKeys = <?=json_encode($config_wri['mapKeys'])?>,
    host = '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de CE serveur
  */
  contourMassif = coucheContourMassif({
    host: host,
    selectName: 'select-massif',
  }),

  map = new ol.Map({
    target: 'carte-nav',
    view: new ol.View({
      enableRotation: false,
    }),
    controls: [
      ...controlesCartes('nav'),
      new myol.control.Permalink({ // Permet de garder le même réglage de carte
        display: true, // Affiche le lien
        init: true,
        //init: <?=$vue->polygone->id_polygone?'false':'true'?>, // On cadre le massif, s'il y a massif
      }),
      new myol.control.LayerSwitcher({
        layers: fondsCarte('nav', mapKeys),
      }),
    ],
    layers: [
      coucheMassifsColores({
        host: host,
        selectName: 'select-massifs',
      }),
      ...couchesVectoriellesExternes(),
      contourMassif,
      couchePointsWRI({
        host: host,
        selectName: 'select-wri',
        selectMassif: contourMassif.options.selector,
      }),
      new myol.layer.Hover(), // Gère le survol du curseur
    ],
  });

// Centrer sur la zone du polygone
map.getView().fit(ol.proj.transformExtent([5, 44.68, 5.72, 45.33], 'EPSG:4326', 'EPSG:3857'));
/*
<?if ($vue->polygone->id_polygone) { ?>
  map.getView().fit(ol.proj.transformExtent([
    <?=$vue->polygone->ouest?>,
    <?=$vue->polygone->sud?>,
    <?=$vue->polygone->est?>,
    <?=$vue->polygone->nord?>,
  ], 'EPSG:4326', 'EPSG:3857'));
<? } ?>
*/
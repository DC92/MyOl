var mapKeys = {
    ign: 'iejxbx4obzhco6c8klxrfbto',
    thunderforest: 'ee751f43b3af4614b01d1bce72785369',
    os: 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF',
    bing: 'AldBMbaKNyat-j6CBRKxxH05uaxP7dvQu1RnMWCQEGGC3z0gjBu-bLniE_8WZvcC',
    kompass: '2ba8c124-38b6-11e7-ade1-e0cb4e28e847',
  },
  //var mapKeys = <?=json_encode($config_wri['mapKeys'])?>,

  map = new ol.Map({
    target: 'carte-point',
    view: new ol.View({
      center: ol.proj.transform([5.64581, 45.20231], 'EPSG:4326', 'EPSG:3857'),
      //center: ol.proj.transform([<?=$vue->point->longitude?>, <?=$vue->point->latitude?>], 'EPSG:4326', 'EPSG:3857'),
      zoom: 13,
      enableRotation: false,
      constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
    }),
    controls: [
      ...controlesCartes('point'),
      new myol.control.Permalink({ // Permet de garder le même réglage de carte
        visible: false, // Mais on ne visualise pas le lien du permalink
        init: false, // Ici, on utilisera plutôt la position du point
      }),
      new myol.control.LayerSwitcher({
        layers: fondsCarte('point', mapKeys),
      }),
    ],
    layers: [
      // Les autres points refuges.info
      couchePointsWRI({
        host: 'https://www.refuges.info/',
        //host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de CE serveur
      }),
      // Le cadre rouge autour du point de la fiche
      new myol.layer.Marker({
        src: '../images/cadre.svg',
        //src: '<?=$config_wri["sous_dossier_installation"]?>images/cadre.svg',
        prefix: 'cadre', // S'interface avec les <TAG id="cadre-xxx"...>
        focus: 15, // Centrer
      }),
      new myol.layer.Hover(), // Gère le survol du curseur
    ],
  });
var mapKeys = {
    ign: 'iejxbx4obzhco6c8klxrfbto',
    thunderforest: 'ee751f43b3af4614b01d1bce72785369',
    os: 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF',
    bing: 'AldBMbaKNyat-j6CBRKxxH05uaxP7dvQu1RnMWCQEGGC3z0gjBu-bLniE_8WZvcC',
    kompass: '2ba8c124-38b6-11e7-ade1-e0cb4e28e847',
  },
  //var mapKeys = <?=json_encode($config_wri['mapKeys'])?>,

  coucheContours = coucheContourMassif({
    host: 'https://www.refuges.info/',
    //host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de CE serveur
  }),
  editorlayer = new myol.layer.Editor({
    geoJsonId: 'edit-json',
    editOnly: 'poly',

    featuresToSave: function(coordinates) {
      return this.format.writeGeometry(
        new ol.geom.MultiPolygon(coordinates.polys), {
          featureProjection: 'EPSG:3857',
          decimals: 5,
        });
    },
  }),

  map = new ol.Map({
    target: 'carte-edit',
    view: new ol.View({
      enableRotation: false,
    }),
    controls: [
      ...controlesCartes('edit'),
      new myol.control.Download({
        savedLayer: editorlayer,
      }),
      new myol.control.Permalink({ // Permet de garder le même réglage de carte
        display: false, // Cache le lien
        init: false,
        //init: <?=$vue->polygone->id_polygone?'false':'true'?>, // On cadre le massif, s'il y a massif
      }),
      new myol.control.LayerSwitcher({
        layers: fondsCarte('edit', mapKeys),
      }),
    ],
    layers: [
      coucheContours,
      editorlayer,
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
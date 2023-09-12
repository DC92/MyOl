/**
 * Geolocation control
 * Display status, altitude & speed
 */

import ol from '../ol'; //BEST come back to direct import (optim ???)
import MyButton from './myButton';

export default class MyGeolocation extends MyButton {
  constructor(options) {
    const subMenu = location.href.match(/(https|localhost)/) ?
      //BEST use .html content / option
      '<p>Localisation GPS:</p>' +
      '<label>' +
      '<input type="radio" name="myol-gps-source" value="0" checked="checked">' +
      'Inactif</label><label>' +
      '<input type="radio" name="myol-gps-source" value="1">' +
      'Position GPS <span>(1) extérieur</span></label><label>' +
      '<input type="radio" name="myol-gps-source" value="2">' +
      'Position GPS ou IP <span>(2) intérieur</span></label><hr><label>' +
      '<input type="radio" name="myol-gps-display" value="0" checked="checked">' +
      'Graticule, carte libre</label><label>' +
      '<input type="radio" name="myol-gps-display" value="1">' +
      'Centre la carte, nord en haut</label><label>' +
      '<input type="radio" name="myol-gps-display" value="2">' +
      'Centre et oriente la carte <span>(3)</span></label>' +

      '<hr><p>(1) plus précis en extérieur mais plus lent à initialiser, ' +
      'nécessite un capteur et une réception GPS.</p>' +
      '<p>(2) plus précis et rapide en intérieur ou en zone urbaine ' +
      'mais peut être très erroné en extérieur à l&apos;initialisation. ' +
      'Utilise les position des points WiFi proches en plus du GPS dont il peut se passer.</p>' +
      '<p>(3) nécessite un capteur magnétique et un explorateur le supportant.</p>' :

      // Si on est en http
      '<p>L&apos;utilisation du GPS nécessite https</p>' +
      '<a href="' + document.location.href.replace('http:', 'https:') + '">Passer en https<a>';

    super({
      // MyButton options
      className: 'myol-button-gps',
      label: '&#8853;',
      subMenuHTML: subMenu,
      //BEST subMenuId: 'myol-gps',

      // ol.Geolocation options
      // https://www.w3.org/TR/geolocation/#position_options_interface
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 1000,

      ...options,
    });

    // Add status display element
    this.statusEl = document.createElement('p');
    this.element.appendChild(this.statusEl);

    // Register action listeners
    this.element.querySelectorAll('input')
      .forEach(el => {
        el.addEventListener('change', evt => this.action(evt));
      });

    // Graticule
    this.graticuleFeature = new ol.Feature(); //BEST Use layer Graticule
    this.northGraticuleFeature = new ol.Feature();

    this.graticuleLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [this.graticuleFeature, this.northGraticuleFeature],
      }),
      zIndex: 300, // Above the features
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(128,128,255,0.2)',
        }),
        stroke: new ol.style.Stroke({
          color: '#20b',
          lineDash: [16, 14],
          width: 1,
        }),
      }),
    });

    this.graticuleFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#000',
        lineDash: [16, 14],
        width: 1,
      }),
    }));

    this.northGraticuleFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#c00',
        lineDash: [16, 14],
        width: 1,
      }),
    }));

    window.gpsValues = {}; // Store the measures for internal use & other controls

    // Browser heading from the inertial & magnetic sensors
    window.addEventListener('deviceorientationabsolute', evt => {
      window.gpsValues.heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
      this.action(evt);
    });
  }

  setMap(map) {
    super.setMap(map);

    map.addLayer(this.graticuleLayer);
    map.on('moveend', evt => this.action(evt)); // Refresh graticule after map zoom

    this.geolocation = new ol.Geolocation({
      projection: map.getView().getProjection(),
      trackingOptions: this.options,
      ...this.options,
    });
    this.geolocation.on('change', evt => this.action(evt));
    this.geolocation.on('error', error => {
      console.log('Geolocation error: ' + error.message);
    });
  }

  action(evt) {
    const sourceLevelEl = document.querySelector('input[name="myol-gps-source"]:checked'),
      displayLevelEl = document.querySelector('input[name="myol-gps-display"]:checked'),
      displayEls = document.getElementsByName('myol-gps-display'),
      sourceLevel = sourceLevelEl ? parseInt(sourceLevelEl.value) : 0, // On/off, GPS, GPS&WiFi
      displayLevel = displayLevelEl ? parseInt(displayLevelEl.value) : 0, // Graticule & sourceLevel
      map = this.getMap(),
      view = map ? map.getView() : null;

    // Tune the tracking level
    if (evt.target.name == 'myol-gps-source') {
      this.geolocation.setTracking(sourceLevel > 0);
      this.graticuleLayer.setVisible(false);
      window.gpsValues = {}; // Reset the values
      if (!sourceLevel)
        displayEls[0].checked = true;
      if (sourceLevel && displayLevel == 0)
        displayEls[2].checked = true;
    }

    // Get geolocation values
    ['Position', 'AccuracyGeometry', 'Speed', 'Altitude'].forEach(valueName => {
      const value = this.geolocation['get' + valueName]();
      if (value)
        window.gpsValues[valueName.toLowerCase()] = value;
    });

    // State 1 only takes positions from the GPS (which have an altitude)
    if (sourceLevel == 1 && !window.gpsValues.altitude)
      window.gpsValues.position = null;

    // Render position & graticule
    if (map && view && sourceLevel && window.gpsValues.position) {
      // Estimate the viewport size to draw a visible graticule
      const p = window.gpsValues.position,
        hg = map.getCoordinateFromPixel([0, 0]),
        bd = map.getCoordinateFromPixel(map.getSize()),
        far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10,
        // The graticule
        geometry = [
          new ol.geom.MultiLineString([
            [
              [p[0] - far, p[1]],
              [p[0] + far, p[1]]
            ],
            [
              [p[0], p[1]],
              [p[0], p[1] - far]
            ],
          ]),
        ],
        // Color north in red
        northGeometry = [
          new ol.geom.LineString([
            [p[0], p[1]],
            [p[0], p[1] + far]
          ]),
        ];

      // The accuracy circle
      if (window.gpsValues.accuracygeometry)
        geometry.push(window.gpsValues.accuracygeometry);

      this.graticuleFeature.setGeometry(new ol.geom.GeometryCollection(geometry));
      this.northGraticuleFeature.setGeometry(new ol.geom.GeometryCollection(northGeometry));

      // Center the map
      if (displayLevel > 0)
        view.setCenter(p);

      // Orientation
      if (!sourceLevel || displayLevel == 1)
        view.setRotation(0);
      else if (window.gpsValues.heading && displayLevel == 2)
        view.setRotation(
          Math.PI / 180 * (window.gpsValues.heading - screen.orientation.angle) // Delivered ° reverse clockwize
        );

      // Zoom on the area
      if (!window.gpsValues.isZoomed) { // Only the first time after activation
        window.gpsValues.isZoomed = true;
        view.setZoom(17);

        // Close submenu when GPS locates
        this.element.classList.remove('myol-button-hover');
        this.element.classList.remove('myol-button-selected');
      }
      this.graticuleLayer.setVisible(true);
    } else
      view.setRotation(0); // Return to inactive state

    // Display data under the button
    let status = window.gpsValues.position ? '' : 'Sync...'; //TODO BUG never see Sync...
    if (window.gpsValues.altitude) {
      status = Math.round(window.gpsValues.altitude) + ' m';
      if (window.gpsValues.speed)
        status += ' ' + (Math.round(window.gpsValues.speed * 36) / 10) + ' km/h';
    }
    if (this.statusEl)
      this.statusEl.innerHTML = sourceLevel ? status : '';

    // Close the submenu
    if (evt.target.name) // Only when an input is hit
      this.element.classList.remove('myol-display-submenu');
  }
}
/**
 * GPX file loader control
 */

import ol from '../ol'; //BEST ??? come back to direct import (optim ???)
import MyButton from './MyButton.js';

export default class Load extends MyButton {
  constructor(options = {}) {
    super({
      // MyButton options
      label: '&#128194;',
      subMenuHTML: '<p>Importer un fichier de points ou de traces</p>' +
        '<input type="file" accept=".gpx,.kml,.geojson">',

      // Load options
      // initFileUrl, url of a gpx file to be uploaded at the init

      ...options, //HACK default when options is undefined
    });

    // Register action listeners
    this.element.querySelectorAll('input')
      .forEach(el =>
        el.addEventListener('change', evt => this.change(evt))
      );

    // Load file at init
    if (options.initFileUrl) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', options.initFileUrl);
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200)
          this.loadText(xhr.responseText, options.initFileUrl);
      };
      xhr.send();
    }

    this.reader = new FileReader();
  }

  change(evt) {
    const blob = evt.target.files[0];

    this.reader.readAsText(blob);
    this.reader.onload = () => this.loadText(this.reader.result, blob.name);
  }

  loadUrl(url) {
    if (url)
      fetch(url)
      .then(response => response.text())
      .then(text => this.loadText(text, url));
  }

  loadText(text, url) {
    const map = this.getMap(),
      formatName = url.split('.').pop().toUpperCase(), // Extract extension to be used as format name
      loadFormat = new ol.format[formatName in ol.format ? formatName : 'GeoJSON'](), // Find existing format
      receivedLat = text.match(/lat="-?([0-9]+)/), // Received projection depending on the first value
      receivedProjection = receivedLat && receivedLat.length && parseInt(receivedLat[1]) > 100 ? 'EPSG:3857' : 'EPSG:4326',
      features = loadFormat.readFeatures(text, {
        dataProjection: receivedProjection,
        featureProjection: map.getView().getProjection(), // Map projection
      }),
      added = map.dispatchEvent({
        type: 'myol:onfeatureload', // Warn Editor that we uploaded some features
        features: features,
      });

    if (added !== false) { // If none used the feature
      // Display the track on the map
      const gpxSource = new ol.source.Vector({
          format: loadFormat,
          features: features,
        }),
        gpxLayer = new ol.layer.Vector({
          source: gpxSource,
          style: feature => {
            const properties = feature.getProperties();

            return new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: 'blue',
                width: 2,
              }),
              image: properties.sym ? new ol.style.Icon({
                src: 'https://chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
              }) : null,
            });
          },
        });

      map.addLayer(gpxLayer);

      // Zoom the map on the added features
      const fileExtent = gpxSource.getExtent();

      if (ol.extent.isEmpty(fileExtent))
        alert(url + ' ne comporte pas de point ni de trace.');
      else
        map.getView().fit(
          fileExtent, {
            maxZoom: 17,
            padding: [5, 5, 5, 5],
          });
    }

    // Close the submenu
    this.element.classList.remove('myol-display-submenu');
  }
}
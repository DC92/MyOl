/**
 * File downloader control
 */

import ol from '../ol'; //BEST ??? come back to direct import (optim ???)
import Button from './Button.js';

//BEST BUG incompatible with clusters
export default class Download extends Button {
  constructor(options) {
    options = {
      // Button options
      label: '&#128427;',
      subMenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
        'contenant les éléments visibles dans la fenêtre:</p>' +
        '<label><a mime="application/gpx+xml">GPX</a></label>' +
        '<label><a mime="vnd.google-earth.kml+xml">KML</a></label>' +
        '<label><a mime="application/json">GeoJSON</a></label>',
      fileName: document.title || 'openlayers', // Name of the file to be downloaded //BEST name from feature

      ...options,
    };

    super(options);

    // Add a hidden element to handle the download
    this.hiddenEl = document.createElement('a');
    this.hiddenEl.target = '_self';
    this.hiddenEl.style = 'display:none';
    this.element.appendChild(this.hiddenEl);
  }

  subMenuAction(evt) {
    const map = this.getMap(),
      formatName = evt.target.innerText,
      downloadFormat = new ol.format[formatName](),
      mime = evt.target.getAttribute('mime');
    let features = [],
      extent = map.getView().calculateExtent();

    // Get all visible features
    if (this.savedLayer) //TODO KESAKO ? TEST
      getFeatures(this.savedLayer);
    else
      map.getLayers().forEach(getFeatures); //BEST what about (args)

    function getFeatures(savedLayer) { //BEST put in method
      if (savedLayer.getSource() &&
        savedLayer.getSource().forEachFeatureInExtent) // For vector layers only
        savedLayer.getSource().forEachFeatureInExtent(extent, feature => {
          if (!savedLayer.getProperties().dragable) // Don't save the cursor
            features.push(feature);
        });
    }

    if (formatName == 'GPX')
      // Transform *Polygons in linestrings
      for (let f in features) {
        const geometry = features[f].getGeometry();

        if (geometry.getType().includes('Polygon')) {
          geometry.getCoordinates().forEach(coords => {
            if (typeof coords[0][0] == 'number')
              // Polygon
              features.push(new ol.Feature(new ol.geom.LineString(coords)));
            else
              // MultiPolygon
              coords.forEach(subCoords =>
                features.push(new ol.Feature(new ol.geom.LineString(subCoords)))
              );
          });
        }
      }

    const data = downloadFormat.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: map.getView().getProjection(), // Map projection
        decimals: 5,
      })
      // Beautify the output
      .replace(/<[a-z]*>(0|null|[[object Object]|[NTZa:-]*)<\/[a-z]*>/g, '')
      .replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
      .replace(/<Data name="copy"><value>[a-z_.]*<\/value><\/Data>|,"copy":"[a-z_.]*"/g, '')
      .replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
      .replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
      .replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
      .replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
      .replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1')
      .replace(/ ([cvx])/g, '\n\t$1'),

      file = new Blob([data], {
        type: mime,
      });

    this.hiddenEl.download = this.fileName + '.' + formatName.toLowerCase();
    this.hiddenEl.href = URL.createObjectURL(file);
    this.hiddenEl.click();

    // Close the submenu
    this.element.classList.remove('myol-display-submenu');
  }
}
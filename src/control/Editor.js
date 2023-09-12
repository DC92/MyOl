/**
 * Editor.js
 * geoJson lines & polygons edit
 */

import ol from '../ol';
import MyButton from './MyButton';

// Editor
export default class Editor extends MyButton {
  constructor(options = {}) {
    super({
      // Mybutton options
      label: 'E', // To be defined by changeModeEdit
      subMenuHTML: '<p>Edition:</p>' +
        //BEST move in .html / generalize aids / translation
        '<label for="myol-edit0">' +
        '<input type="radio" name="myol-edit" id="myol-edit0" value="0" ctrlOnChange="changeModeEdit">' +
        'Modification &#x1F58D;' +
        '</label>' +
        (!options.help[1] ? '' :
          '<label for="myol-edit1">' +
          '<input type="radio" name="myol-edit" id="myol-edit1" value="1" ctrlOnChange="changeModeEdit">' +
          'Création ligne &#xD17;' +
          '</label>') +
        (!options.help[2] ? '' :
          '<label for="myol-edit2">' +
          '<input type="radio" name="myol-edit" id="myol-edit2" value="2" ctrlOnChange="changeModeEdit">' +
          'Création polygone &#X23E2;' +
          '</label>') +
        '<hr><div id="myol-help-edit"></div>',

      // Editor options
      format: new ol.format.GeoJSON(),
      projection: 'EPSG:4326',
      snapLayers: [], // Vector layers to snap on
      focus: false, // Zoom the map on the loaded features
      geoJsonId: 'editable-json', // id of an html element containing geoJson features to be edited
      // geoJsonUrl: 'url.geojson', // url of geoJson features to be edited
      labels: ['&#128397;', '&#3351;', '&#9186;'], // Modify, Line, Polygon
      help: ['Modification', 'New line', 'New polygon'],
      featuresToSave: coordinates => this.source.getFeatures(coordinates, this.options.format),

      ...options,
    });

    // Features display
    this.geoJsonEl = document.getElementById(this.options.geoJsonId); // Read data in an html element
    this.source = new ol.source.Vector({
      wrapX: false,
    });
    this.layer = new ol.layer.Vector({
      source: this.source,
      style: this.displayStyle,
      zIndex: 400, // Editor & cursor : above the features
    });

    // Register action listeners
    this.element.querySelectorAll('input')
      .forEach(el => {
        el.addEventListener('change', evt => this.changeModeEdit(evt));
      });

    this.interactions = [
      new ol.interaction.Modify({ // 0 Modify
        source: this.source,
        pixelTolerance: 16, // Default is 10
        style: this.editStyle,
      }),
      new ol.interaction.Draw({ // 1 drawLine
        source: this.source,
        type: 'LineString',
        style: this.editStyle,
        stopClick: true, // Avoid zoom when you finish drawing by doubleclick
      }),
      new ol.interaction.Draw({ // 2 drawPoly
        source: this.source,
        type: 'Polygon',
        style: this.editStyle,
        stopClick: true, // Avoid zoom when you finish drawing by doubleclick
      }),
      new ol.interaction.Snap({ // 3 snap
        source: this.source,
        pixelTolerance: 7.5, // 6 + line width / 2 : default is 10
      }),
    ];

    // Snap on vector layers
    this.options.snapLayers.forEach(layer => {
      layer.getSource().on('change', () => {
        const fs = layer.getSource().getFeatures();
        for (let f in fs)
          this.interactions[3].addFeature(fs[f]);
      });
    });

    // End of modify
    this.interactions[0].on('modifyend', evt => {
      //BEST move only one summit when dragging
      //BEST Ctrl+Alt+click on summit : delete the line or poly

      // Ctrl+Alt+click on segment : delete the line or poly
      if (evt.mapBrowserEvent.originalEvent.ctrlKey &&
        evt.mapBrowserEvent.originalEvent.altKey) {
        const selectedFeatures = this.getMap().getFeaturesAtPixel(
          evt.mapBrowserEvent.pixel, {
            hitTolerance: 6, // Default is 0
            layerFilter: l => {
              return l.ol_uid == this.layer.ol_uid;
            }
          });

        for (let f in selectedFeatures) // We delete the selected feature
          this.source.removeFeature(selectedFeatures[f]);
      }

      // Alt+click on segment : delete the segment & split the line
      const newFeature = this.interactions[3].snapTo(
        evt.mapBrowserEvent.pixel,
        evt.mapBrowserEvent.coordinate,
        this.getMap()
      );

      if (newFeature && evt.mapBrowserEvent.originalEvent.altKey)
        this.optimiseEdited(newFeature.vertex);

      else if (newFeature && evt.mapBrowserEvent.originalEvent.shiftKey)
        this.optimiseEdited(newFeature.vertex, true);
      else
        this.optimiseEdited();

      this.hoveredFeature = null;
    });

    // End of line & poly drawing
    [1, 2].forEach(i => this.interactions[i].on('drawend', () => {
      // Warn source 'on change' to save the feature
      // Don't do it now as it's not yet added to the source
      this.source.modified = true;

      // Reset interaction & button to modify
      this.changeModeEdit();
    }));

    // End of feature creation
    this.source.on('change', () => { // Call all sliding long
      if (this.source.modified) { // Awaiting adding complete to save it
        this.source.modified = false; // To avoid loops

        // Finish
        this.optimiseEdited();
        this.hoveredFeature = null; // Recover hovering
      }
    });
  } // End constructor

  // Initialisations when map is loaded
  setMap(map) {
    super.setMap(map);

    map.addLayer(this.layer);

    if (this.geoJsonEl)
      this.addGeoJson(this.geoJsonEl.value);
    this.addGeoJsonUrl(this.options.geoJsonUrl); // Add features in a separated file

    this.optimiseEdited(); // Treat the geoJson input as any other edit
    this.changeModeEdit(); // Display button & help

    map.on('pointermove', evt => this.hover(evt));

    // Add features loaded from GPX file
    map.on('myol:onfeatureload', evt => { //BEST RESORB
      this.addFeatures(evt.features);
      return false; // Warn control.load that the editor got the included feature
    });
  }

  addFeatures(features) {
    if (features) {
      this.source.addFeatures(features);
      this.optimiseEdited();

      const extent = this.source.getExtent();

      if (!ol.extent.isEmpty(extent))
        this.getMap().getView().fit(
          extent, {
            maxZoom: 17,
            padding: [5, 5, 5, 5],
          });
    }
  }

  addGeoJson(text) {
    if (text)
      this.addFeatures(
        this.options.format.readFeatures(
          text, {
            dataProjection: this.options.projection,
            featureProjection: this.getMap().getView().getProjection(),
          }));
  }

  addGeoJsonUrl(url) {
    if (url)
      fetch(url).then(response =>
        response.json().then(result =>
          this.addGeoJson(result)
        )
      );
  }

  displayStyle() {
    return new ol.style.Style({
      // Lines or polygons border
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 2,
      }),
      // Polygons
      fill: new ol.style.Fill({
        color: 'rgba(0,0,255,0.2)',
      }),
    });
  }

  editStyle(feature) {
    const textStyle = {
      scale: feature.getGeometry().getType() == 'LineString' ? 1.5 : 0,
      placement: 'line',
      offsetY: -7,
    };

    switch (feature.getGeometry().getType()) {
      // Marker
      case 'Point':
        return [
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 4,
              stroke: new ol.style.Stroke({
                color: 'red',
                width: 2,
              }),
            }),
          }),
        ];

      case 'LineString':
      case 'MultiLineString':
        return [
          new ol.style.Style({
            stroke: new ol.style.Stroke({ // Lines or polygons border
              color: 'red',
              width: 4,
            }),
            fill: new ol.style.Fill({ // Polygons
              color: 'rgba(255,0,0,0.3)',
            }),
            // Begining of line marking
            text: new ol.style.Text({
              ...textStyle,
              textAlign: 'start',
              text: 'D',
            }), // Direction
          }),
          // End of line marking
          new ol.style.Style({
            text: new ol.style.Text({
              ...textStyle,
              textAlign: 'end',
              text: 'A',
            }),
          }),
        ];

      default: // Polygon & MultiPolygon
        return [
          new ol.style.Style({
            stroke: new ol.style.Stroke({ // Lines or polygons border
              color: 'red',
              width: 4,
            }),
            fill: new ol.style.Fill({ // Polygons
              color: 'rgba(255,0,0,0.3)',
            }),
          }),
        ];
    }
  }

  changeModeEdit(evt) {
    const level = evt ? evt.target.value : 0,
      chidEls = this.element.children,
      inputEditEl = document.getElementById('myol-edit' + level),
      helpEditEl = document.getElementById('myol-help-edit');

    // Change button
    if (chidEls)
      chidEls[0].innerHTML = this.options.labels[level];

    // Change button
    if (inputEditEl)
      inputEditEl.checked = true;

    // Change specific help
    if (helpEditEl)
      helpEditEl.innerHTML = this.options.help[level];

    // Replace interactions
    this.interactions.forEach(i => this.getMap().removeInteraction(i));
    this.getMap().addInteraction(this.interactions[level]); // Add active interaction
    this.getMap().addInteraction(this.interactions[3]); // Snap must be added after the others
  }

  hover(evt) {
    let nbFeaturesAtPixel = 0;

    this.getMap().forEachFeatureAtPixel(evt.pixel, feature => {
      this.source.getFeatures().forEach(f => {
        if (f.ol_uid == feature.ol_uid) {
          nbFeaturesAtPixel++;
          if (!this.hoveredFeature) { // Hovering only one
            feature.setStyle(this.editStyle);
            this.hoveredFeature = feature; // Don't change it until there is no more hovered
          }
        }
      });
    }, {
      hitTolerance: 6, // Default is 0
    });

    // If no more hovered, return to the normal style
    if (!nbFeaturesAtPixel && !evt.originalEvent.buttons && this.hoveredFeature) {
      this.hoveredFeature.setStyle();
      this.hoveredFeature = null;
    }
  }

  optimiseEdited(selectedVertex, reverseLine) {
    const coordinates = this.optimiseFeatures(
      this.source.getFeatures(),
      this.options.help[1],
      this.options.help[2],
      true,
      true,
      selectedVertex,
      reverseLine
    );

    // Recreate features
    this.source.clear();

    for (let l in coordinates.lines)
      this.source.addFeature(new ol.Feature({
        geometry: new ol.geom.LineString(coordinates.lines[l]),
      }));
    for (let p in coordinates.polys)
      this.source.addFeature(new ol.Feature({
        geometry: new ol.geom.Polygon(coordinates.polys[p]),
      }));

    // Save geometries in <EL> as geoJSON at every change
    if (this.geoJsonEl)
      this.geoJsonEl.value = this.options.format.writeFeatures(
        this.options.featuresToSave(coordinates), {
          dataProjection: this.options.projection,
          featureProjection: this.getMap().getView().getProjection(),
          decimals: 5,
        })
      .replace(/,"properties":(\{[^}]*}|null)/, '');
  }

  // Refurbish Lines & Polygons
  // Split lines having a summit at selectedVertex
  optimiseFeatures(features, withLines, withPolygons, merge, holes, selectedVertex, reverseLine) {
    const points = [],
      lines = [],
      polys = [];

    // Get all edited features as array of coordinates
    for (let f in features)
      this.flatFeatures(features[f].getGeometry(), points, lines, polys, selectedVertex, reverseLine);

    for (let a in lines)
      // Exclude 1 coordinate features (points)
      if (lines[a].length < 2)
        delete lines[a];

      // Merge lines having a common end
      else if (merge)
      for (let b = 0; b < a; b++) // Once each combination
        if (lines[b]) {
          const m = [a, b];
          for (let i = 4; i; i--) // 4 times
            if (lines[m[0]] && lines[m[1]]) { // Test if the line has been removed
              // Shake lines end to explore all possibilities
              m.reverse();
              lines[m[0]].reverse();
              if (this.compareCoords(lines[m[0]][lines[m[0]].length - 1], lines[m[1]][0])) {
                // Merge 2 lines having 2 ends in common
                lines[m[0]] = lines[m[0]].concat(lines[m[1]].slice(1));
                delete lines[m[1]]; // Remove the line but don't renumber the array keys
              }
            }
        }

    // Make polygons with looped lines
    for (let a in lines)
      if (withPolygons && // Only if polygons are autorized
        lines[a]) {
        // Close open lines
        if (!withLines) // If only polygons are autorized
          if (!this.compareCoords(lines[a]))
            lines[a].push(lines[a][0]);

        if (this.compareCoords(lines[a])) { // If this line is closed
          // Split squeezed polygons
          // Explore all summits combinaison
          for (let i1 = 0; i1 < lines[a].length - 1; i1++)
            for (let i2 = 0; i2 < i1; i2++)
              if (lines[a][i1][0] == lines[a][i2][0] &&
                lines[a][i1][1] == lines[a][i2][1]) { // Find 2 identical summits
                let squized = lines[a].splice(i2, i1 - i2); // Extract the squized part
                squized.push(squized[0]); // Close the poly
                polys.push([squized]); // Add the squized poly
                i1 = i2 = lines[a].length; // End loop
              }

          // Convert closed lines into polygons
          polys.push([lines[a]]); // Add the polygon
          delete lines[a]; // Forget the line
        }
      }

    // Makes holes if a polygon is included in a biggest one
    for (let p1 in polys) // Explore all Polygons combinaison
      if (holes && // Make holes option
        polys[p1]) {
        const fs = new ol.geom.Polygon(polys[p1]);
        for (let p2 in polys)
          if (polys[p2] && p1 != p2) {
            let intersects = true;
            for (let c in polys[p2][0])
              if (!fs.intersectsCoordinate(polys[p2][0][c]))
                intersects = false;
            if (intersects) { // If one intersects a bigger
              polys[p1].push(polys[p2][0]); // Include the smaler in the bigger
              delete polys[p2]; // Forget the smaller
            }
          }
      }

    return {
      points: points,
      lines: lines.filter(Boolean), // Remove deleted array members
      polys: polys.filter(Boolean),
    };
  }

  flatFeatures(geom, points, lines, polys, selectedVertex, reverseLine) {
    // Expand geometryCollection
    if (geom.getType() == 'GeometryCollection') {
      const geometries = geom.getGeometries();
      for (let g in geometries)
        this.flatFeatures(geometries[g], points, lines, polys, selectedVertex, reverseLine);
    }
    // Point
    else if (geom.getType().match(/point$/i))
      points.push(geom.getCoordinates());

    // line & poly
    else
      // Get lines or polyons as flat array of coordinates
      this.flatCoord(lines, geom.getCoordinates(), selectedVertex, reverseLine);
  }

  // Get all lines fragments (lines, polylines, polygons, multipolygons, hole polygons, ...)
  // at the same level & split if one point = selectedVertex
  flatCoord(lines, coords, selectedVertex, reverseLine) {
    let begCoords = [], // Coords before the selectedVertex
      selectedLine = false;

    // Multi*
    if (typeof coords[0][0] == 'object')
      for (let c1 in coords)
        this.flatCoord(lines, coords[c1], selectedVertex, reverseLine);

    // 	LineString
    else if (selectedVertex) {
      while (coords.length) {
        const c = coords.shift();
        if (this.compareCoords(c, selectedVertex)) {
          selectedLine = true;
          break; // Ignore this point and stop selection
        } else
          begCoords.push(c);
      }
      if (selectedLine && reverseLine)
        lines.push(begCoords.concat(coords).reverse());
      else
        lines.push(begCoords, coords);
    } else
      lines.push(coords);
  }

  compareCoords(a, b) {
    if (!a)
      return false;
    if (!b)
      return this.compareCoords(a[0], a[a.length - 1]); // Compare start with end
    return a[0] == b[0] && a[1] == b[1]; // 2 coordinates
  }
}
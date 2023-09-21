/**
 * Editor.js
 * geoJson lines & polygons edit
 */

import ol from '../ol';
import Button from '../control/Button';

// Editor
export default class Editor extends ol.layer.Vector {
  constructor(options) {
    options = {
      geoJsonId: 'geojson',
      format: new ol.format.GeoJSON(),
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
      featuresToSave: coordinates => this.source.getFeatures(coordinates, this.options.format),
      snapLayers: [], // Vector layers to snap on
      ...options,
    };

    const geoJsonEl = document.getElementById(options.geoJsonId), // Read data in an html element
      geoJson = geoJsonEl ? geoJsonEl.value : {},
      source = new ol.source.Vector({
        features: options.format.readFeatures(geoJson, options),
        wrapX: false,
        ...options,
      });

    const style = new ol.style.Style({
      // Marker
      image: new ol.style.Circle({
        radius: 4,
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 2,
        }),
      }),
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

    super({
      source: source,
      style: style,
      zIndex: 400, // Editor & cursor : above the features
      ...options,
    });

    this.options = options;
    this.geoJsonEl = geoJsonEl;
    this.source = source;
    this.style = style;
  } // End constructor

  setMapInternal(map) {
    super.setMapInternal(map);
    this.map = map;

    this.interactions = [
      new ol.interaction.Modify({ // 0 Modify
        source: this.source,
        pixelTolerance: 16, // Default is 10
        style: this.style,
      }),
      new ol.interaction.Draw({ // 1 Draw line
        source: this.source,
        type: 'LineString',
        style: this.style,
        stopClick: true, // Avoid zoom when you finish drawing by doubleclick
      }),
      new ol.interaction.Draw({ // 2 Draw poly
        source: this.source,
        type: 'Polygon',
        style: this.style,
        stopClick: true, // Avoid zoom when you finish drawing by doubleclick
      }),
      new ol.interaction.Snap({ // 3 snap
        source: this.source,
        pixelTolerance: 7.5, // 6 + line width / 2 : default is 10
      }),
    ];

    // Add features loaded from GPX file
    map.on('myol:onfeatureload', evt => {
      this.getSource().addFeatures(evt.features);
      return false; // Warn control.load that the editor got the included feature
    });

    this.options.snapLayers.push(this);

    // Snap on vector layers
    //BEST snap when creating line or poly
    //TODO features & source are the same ! // Improve / Ces lignes sont bizares
    this.options.snapLayers.forEach(l => {
      l.getSource().on('change', () => { // Wait for layer end load
        const fs = l.getSource().getFeatures();
        for (let f in fs)
          this.interactions[3].addFeature(fs[f]);
      });
    });

    //TODO    this.optimiseEdited(); // Treat the geoJson input as any other edit

    // End of modify
    this.interactions[0].on('modifyend', evt => {
      //BEST move only one summit when dragging
      //BEST Ctrl+Alt+click on summit : delete the line or poly

      // Ctrl+Alt+click on segment : delete the line or poly
      if (evt.mapBrowserEvent.originalEvent.ctrlKey &&
        evt.mapBrowserEvent.originalEvent.altKey) {
        const selectedFeatures = map.getFeaturesAtPixel(
          evt.mapBrowserEvent.pixel, {
            hitTolerance: 6, // Default is 0
            layerFilter: l => {
              return l.ol_uid == this.ol_uid;
            }
          });

        for (let f in selectedFeatures) // We delete the selected feature
          this.source.removeFeature(selectedFeatures[f]);
      }

      // Alt+click on segment : delete the segment & split the line
      const newFeature = this.interactions[3].snapTo(
        evt.mapBrowserEvent.pixel,
        evt.mapBrowserEvent.coordinate,
        map
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
      this.changeInteraction(0); // Init to modify
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

    this.buttons = [
      new Button({
        label: '&#128397;',
        subMenuId: 'myol-edit-help-modify',
        subMenuHTML: '<p>Modification</p>',
        buttonAction: evt => this.changeInteraction(0, evt.type),
      }),
      new Button({
        label: '&#3351;',
        subMenuId: 'myol-edit-help-line',
        subMenuHTML: '<p>New line</p>',
        buttonAction: evt => this.changeInteraction(1, evt.type),
        subMenuAction: evt => this.changeInteraction(1, evt.type),
      }),
      new Button({
        label: '&#9186;',
        subMenuId: 'myol-edit-help-poly',
        subMenuHTML: '<p>New poly</p>',
        buttonAction: evt => this.changeInteraction(2, evt.type),
        subMenuAction: evt => this.changeInteraction(2, evt.type),
      }),
    ];

    this.buttons.forEach(b => this.map.addControl(b));
    this.changeInteraction(0); // Init to modify
  } // End setMapInternal

  changeInteraction(interaction, type = 'click') {
    if (type == 'click') {
      this.interactions.forEach(i => this.map.removeInteraction(i));
      this.map.addInteraction(this.interactions[interaction]);
      this.map.addInteraction(this.interactions[3]); // Snap must be added after the others
    }
  }

  optimiseEdited(selectedVertex, reverseLine) {
    const coordinates = this.optimiseFeatures(
      this.source.getFeatures(),
      true, //this.options.help[1],
      true, //this.options.help[2],
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
          featureProjection: this.map.getView().getProjection(),
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
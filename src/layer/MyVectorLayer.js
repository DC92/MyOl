/**
 * MyVectorLayer.js
 * Facilities to vector layers
 */

import ol from '../ol';
import * as stylesOptions from './stylesOptions';

/**
 * GeoJSON vector display
 * url calculation
 * display the loading status
 */
class MyVectorSource extends ol.source.Vector {
  constructor(opt) {
    const options = {
        url: url_, // (extent, resolution, projection) // Calculate the url
        // host: '',
        // query: (extent, resolution, projection ,options) => ({_path: '...'}),
        bbox: bbox_, // (extent, resolution, projection)
        strategy: ol.loadingstrategy.bbox,
        projection: 'EPSG:4326',

        addProperties: () => {}, // (default) properties => {} // add properties to each received features

        // Any ol.source.Vector options

        ...opt,
      },
      statusEl = document.getElementById(options.selectName + '-status');

    super({
      format: new ol.format.GeoJSON({ //BEST treat & display JSON errors
        dataProjection: options.projection,
      }),

      ...options,
    });

    // Display loading satus
    this.on(['featuresloadstart', 'featuresloadend', 'error', 'featuresloaderror'], evt => {
      if (statusEl) statusEl.innerHTML =
        evt.type == 'featuresloadstart' ? '&#8987;' :
        evt.type == 'featuresloadend' ? '' :
        '&#9888;'; // Symbol error
    });

    // Compute properties when the layer is loaded & before the cluster layer is computed
    this.on('change', () =>
      this.getFeatures().forEach(f => {
        if (!f._yetAdded) {
          f._yetAdded = true;
          f.setProperties(options.addProperties(f.getProperties()),
            true // Silent : add the feature without refresh the layer
          );
        }
      })
    );

    function url_() {
      const args = options.query(...arguments, options),
        url = options.host + args._path; // Mem _path

      if (options.strategy == ol.loadingstrategy.bbox)
        args.bbox = options.bbox(...arguments);

      // Clean null & not relative parameters
      Object.keys(args).forEach(k => {
        if (k == '_path' || args[k] == 'on' || !args[k] || !args[k].toString())
          delete args[k];
      });

      return url + '?' + new URLSearchParams(args).toString();
    }

    function bbox_(extent, resolution, projection) {
      return ol.proj.transformExtent(
        extent,
        projection,
        options.projection, // Received projection
      ).map(c => c.toPrecision(6)); // Limit the number of digits (10 m)
    }
  }

  // Redirection for cluster.source compatibility
  reload() {
    this.refresh();
  }
}

/**
 * Cluster source to manage clusters in the browser
 */
class MyClusterSource extends ol.source.Cluster {
  constructor(options) {
    // browserClusterMinDistance:50, // (pixels) distance above which the browser clusterises
    // browserClusterFeaturelMaxPerimeter: 300, // (pixels) perimeter of a line or poly above which we do not cluster

    // Any MyVectorSource options

    super({
      distance: options.browserClusterMinDistance,
      source: new MyVectorSource(options), // Origin of mfeatures to cluster
      geometryFunction: geometryFunction_,
      createCluster: createCluster_,
    });

    // Generate a center point where to display the cluster
    function geometryFunction_(feature) {
      const geometry = feature.getGeometry();

      if (geometry) {
        const ex = feature.getGeometry().getExtent(),
          featurePixelPerimeter = (ex[2] - ex[0] + ex[3] - ex[1]) *
          2 / this.resolution;

        // Don't cluster lines or polygons whose the extent perimeter is more than x pixels
        if (featurePixelPerimeter > options.browserClusterFeaturelMaxPerimeter)
          this.addFeature(feature);
        else
          return new ol.geom.Point(ol.extent.getCenter(feature.getGeometry().getExtent()));
      }
    }

    // Generate the features to render the cluster
    function createCluster_(point, features) {
      let nbClusters = 0,
        includeCluster = false,
        lines = [];

      features.forEach(f => {
        const properties = f.getProperties();

        lines.push(properties.name);
        nbClusters += parseInt(properties.cluster) || 1;
        if (properties.cluster)
          includeCluster = true;
      });

      // Single feature : display it
      if (nbClusters == 1)
        return features[0];

      if (includeCluster || lines.length > 5)
        lines = ['Cliquer pour zoomer'];

      // Display a cluster point
      return new ol.Feature({
        id: features[0].getId(), // Pseudo id = the id of the first feature in the cluster
        name: stylesOptions.agregateText(lines),
        geometry: point, // The gravity center of all the features in the cluster
        features: features,
        cluster: nbClusters, //BEST voir pourquoi on ne met pas ça dans properties
      });
    }
  }

  reload() {
    // Reload the wrapped source
    this.getSource().reload();
  }
}

/**
 * Browser & server clustered layer
 */
class MyBrowserClusterVectorLayer extends ol.layer.Vector {
  constructor(options) {
    // browserClusterMinDistance:50, // (pixels) distance above which the browser clusterises
    // serverClusterMinResolution: 100, // (map units per pixel) resolution above which we ask clusters to the server

    // Any ol.source.layer.Vector

    super({
      source: options.browserClusterMinDistance ?
        new MyClusterSource(options) : // Use a cluster source and a vector source to manages clusters
        new MyVectorSource(options), // or a vector source to get the data
      maxResolution: options.serverClusterMinResolution,

      ...options,
    });

    this.options = options; // Mem for further use
  }

  reload(visible) {
    this.setVisible(visible);
    if (visible && this.state_) //BEST find better than this.state_
      this.getSource().reload();
  }
}

class MyServerClusterVectorLayer extends MyBrowserClusterVectorLayer {
  constructor(options) {
    // serverClusterMinResolution: 100, // (map units per pixel) resolution above which we ask clusters to the server

    // Low resolutions layer to display the normal data
    super(options);

    // High resolutions layer to get and display the clusters delivered by the server at hight resolutions
    if (options.serverClusterMinResolution)
      this.altLayer = new MyBrowserClusterVectorLayer({
        maxResolution: undefined,
        minResolution: options.serverClusterMinResolution,

        ...options,
      });
  }

  setMapInternal(map) { //HACK execute actions on Map init
    super.setMapInternal(map);

    if (this.altLayer)
      map.addLayer(this.altLayer);
  }

  // Propagate the reload to the altLayer
  reload(visible) {
    super.reload(visible);

    if (this.altLayer)
      this.altLayer.reload(visible);
  }
}

/**
 * Facilities added vector layer
 * Style features
 * Layer & features selector
 */
export class MyVectorLayer extends MyServerClusterVectorLayer {
  constructor(opt) {
    const options = {
      // url: (extent, resolution, projection) => Calculate the url
      // host: '',
      // query: (extent, resolution, projection ,options) => ({_path: '...'}),
      // bbox: (extent, resolution, projection)
      // strategy: ol.loadingstrategy.bbox,
      // projection: 'EPSG:4326',
      // addProperties: (properties) => {properties => {}}, // add properties to each received features
      // browserClusterMinDistance:50, // (pixels) distance above which the browser clusterises
      // browserClusterFeaturelMaxPerimeter: 300, // (pixels) perimeter of a line or poly above which we do not cluster
      // serverClusterMinResolution: 100, // (map units per pixel) resolution above which we ask clusters to the server

      basicStylesOptions: stylesOptions.basic, // (feature, layer)
      hoverStylesOptions: stylesOptions.hover,
      zIndex: 100, // Above the tiles layers
      selector: new Selector(opt.selectName),

      // Any ol.source.Vector options
      // Any ol.source.layer.Vector

      ...opt,
    };

    super({
      ...options,

      style: (feature, resolution) => {
        // Function returning an array of styles options
        const sof = !feature.getProperties().cluster ? options.basicStylesOptions :
          resolution < opt.spreadClusterMaxResolution ? stylesOptions.spreadCluster :
          stylesOptions.cluster;

        return sof(feature, this) // Call the styleOptions function
          .map(so => new ol.style.Style(so)); // Transform into an array of Style objects
      },

      source: options.browserClusterMinDistance ?
        new MyClusterSource(options) : // Use a cluster source and a vector source to manages clusters
        new MyVectorSource(options), // or a vector source to get the data
      maxResolution: options.serverClusterMinResolution,
    });

    options.selector.callbacks.push(() => this.reload());
    this.reload();
  }

  reload() {
    super.reload(this.options.selector.getSelection().length);
  }
}

/**
 * Hover & click management
 * Display the hovered feature with the hover style
 * Go to the link property when click a feature
 */
export class Hover extends ol.layer.Vector {
  constructor() {
    super({
      source: new ol.source.Vector(),
      zIndex: 200, // Above the vector layers
    });
  }

  // Attach an hover & click listener to the map
  setMapInternal(map) { //HACK execute actions on Map init
    super.setMapInternal(map);

    const mapEl = map.getTargetElement();

    // Basic listeners
    map.on(['pointermove', 'click'], evt => this.mouseListener(evt));

    // Leaving the map reset hovering
    window.addEventListener('mousemove', evt => {
      if (mapEl) {
        const divRect = mapEl.getBoundingClientRect();

        // The mouse is outside of the map
        if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
          evt.clientY < divRect.top || divRect.bottom < evt.clientY)
          this.getSource().clear()
      }
    });
  }

  mouseListener(evt) {
    const map = evt.map,
      resolution = map.getView().getResolution(),
      source = this.getSource();

    // Find the first hovered feature & layer
    let hoveredLayer = null,
      hoveredFeature = map.forEachFeatureAtPixel(
        map.getEventPixel(evt.originalEvent),
        function(f, l) {
          if (l && l.options) {
            hoveredLayer = l;
            return f; // Return feature & stop the search
          }
        }, {
          hitTolerance: 6, // For lines / Default 0
        }
      ),
      hoveredSubFeature = hoveredFeature;

    if (hoveredFeature) {
      const hoveredProperties = hoveredFeature.getProperties(),
        featurePosition = map.getPixelFromCoordinate(
          ol.extent.getCenter(hoveredFeature.getGeometry().getExtent())
        );

      // Find sub-feature from a spread cluster
      if (hoveredProperties.cluster &&
        resolution < hoveredLayer.options.spreadClusterMaxResolution) {
        hoveredProperties.features.every(f => {
          const p = f.getProperties();

          // Only for spread clusters
          if (p.xLeft)
            hoveredSubFeature = f;

          // Stop when found
          return evt.originalEvent.layerX >
            featurePosition[0] + p.xLeft;
        });
      }

      const hoveredSubProperties = hoveredSubFeature.getProperties();

      // Click
      if (evt.type == 'click') {
        // Click cluster
        if (hoveredSubProperties.cluster)
          map.getView().animate({
            zoom: map.getView().getZoom() + 2,
            center: hoveredSubProperties.geometry.getCoordinates(),
          });
        // Click link
        else if (hoveredSubProperties.link) {
          // Open a new tag
          if (evt.originalEvent.ctrlKey)
            window.open(hoveredSubProperties.link, '_blank').focus();
          else
            // Open a new window
            if (evt.originalEvent.shiftKey)
              window.open(hoveredSubProperties.link, '_blank', 'resizable=yes').focus();
            // Go on the same window
            else
              window.location.href = hoveredSubProperties.link;
        }
      }
      // Hover
      else if (hoveredSubFeature != map.lastHoveredSubFeature) {
        const f = hoveredSubFeature.clone();

        if (hoveredLayer.options && hoveredLayer.options.hoverStylesOptions)
          f.setStyle(
            new ol.style.Style(hoveredLayer.options.hoverStylesOptions(f, hoveredLayer))
          );

        source.clear();
        source.addFeature(f);

        map.getViewport().style.cursor =
          hoveredProperties.link || hoveredProperties.cluster ?
          'pointer' :
          '';
      }
    }
    // Reset hoverLayer, style & cursor
    else {
      source.clear();
      map.getViewport().style.cursor = '';
    }

    // Mem hovered feature for next change
    map.lastHoveredSubFeature = hoveredSubFeature;
  }
}

/**
 * Manage a collection of checkboxes with the same name
 * name : name of all the related input checkbox
 * The checkbox without value (all) check / uncheck the others
 * Check all the checkboxes check the checkbox without value (all)
 * Current selection is saved in window.localStorage
 * You can force the values in window.localStorage[simplified name]
 * callback(selection) : function to call at init or click
 * getSelection() : returns an array of selected values
 * If no name is specified or there are no checkbox with this name, return []
 */
export class Selector {
  constructor(name) {
    if (name) {
      this.safeName = 'myol_' + name.replace(/[^a-z]/ig, '');
      this.init = (localStorage[this.safeName] || '').split(',');
      this.selectEls = [...document.getElementsByName(name)];
      this.selectEls.forEach(el => {
        el.addEventListener('click', evt => this.action(evt));
        el.checked =
          this.init.includes(el.value) ||
          this.init.includes('all') ||
          this.init.join(',') == el.value;
      });
      this.action(); // Init with "all"
    }
    this.callbacks = [];
  }

  action(evt) {
    // Test the "all" box & set other boxes
    if (evt && evt.target.value == 'all')
      this.selectEls
      .forEach(el => el.checked = evt.target.checked);

    // Test if all values are checked
    const allChecked = this.selectEls
      .filter(el => !el.checked && el.value != 'all');

    // Set the "all" box
    this.selectEls
      .forEach(el => {
        if (el.value == 'all')
          el.checked = !allChecked.length;
      });

    // Save the current status
    if (this.safeName && this.getSelection().length)
      localStorage[this.safeName] = this.getSelection().join(',');
    else
      delete localStorage[this.safeName];

    // Call the posted callbacks
    if (evt)
      this.callbacks.forEach(cb => cb(this.getSelection()));
  }

  getSelection() {
    if (this.selectEls)
      return this.selectEls
        .filter(el => el.checked && el.value != 'all')
        .map(el => el.value);

    return [null];
  }
}

export default MyVectorLayer;
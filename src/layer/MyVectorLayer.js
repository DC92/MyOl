/**
 * MyVectorLayer.js
 * Facilities to vector layers
 */

import ol from '../ol';

import Selector from './Selector';
import * as stylesOptions from './stylesOptions';

/**
 * GeoJSON vector display
 * display the loading status
 */
class MyVectorSource extends ol.source.Vector {
  constructor(options) {
    // selectName: '', // Name of checkbox inputs to tune the url parameters
    // browserGigue: 0, // (meters) Randomly shift a point around his position
    // addProperties: properties => {}, // Add properties to each received feature

    super(options);

    this.options = options;
    this.statusEl = document.getElementById(options.selectName + '-status');

    this.on(['featuresloadstart', 'featuresloadend', 'error', 'featuresloaderror'], evt => {
      // Display loading satus
      if (this.statusEl) this.statusEl.innerHTML =
        evt.type == 'featuresloadstart' ? '&#8987;' :
        evt.type == 'featuresloadend' ? '' :
        '&#9888;'; // Error symbol

      // Randomly shift a point around his position
      if (options.browserGigue &&
        evt.type == 'featuresloadend')
        evt.features.forEach(f => {
          f.getGeometry().translate(
            Math.cos(f.getId()) * options.browserGigue,
            Math.sin(f.getId()) * options.browserGigue,
          );
        });
    });

    // Compute properties when the layer is loaded & before the cluster layer is computed
    this.on('change', () =>
      this.getFeatures().forEach(f => {
        if (!f._yetAdded) {
          f._yetAdded = true;
          f.setProperties(
            options.addProperties(f.getProperties()),
            true // Silent : add the feature without refresh the layer
          );
        }
      })
    );
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
    options = {
      // browserClusterFeaturelMaxPerimeter: 300, // (pixels) perimeter of a line or poly above which we do not cluster
      // distance: 50, // (pixels) distance above which the browser clusters
      // minDistance: 16, // (pixels) minimum distance in pixels between clusters

      // Any MyVectorSource options
      ...options,
    };

    // Source to handle the features
    const initialSource = new MyVectorSource(options);

    // Source to handle the clusters & the isolated features
    super({
      source: initialSource,
      geometryFunction: f => this.geometryFunction_(f, options),
      createCluster: (p, f) => this.createCluster_(p, f),
      ...options, // distance, minDistance
    });

    this.options = options;
  }

  // Generate a center point where to display the cluster
  geometryFunction_(feature, options) {
    const geometry = feature.getGeometry();

    if (geometry) {
      const ex = feature.getGeometry().getExtent(),
        featurePixelPerimeter = (ex[2] - ex[0] + ex[3] - ex[1]) * 2 / this.resolution;

      // Don't cluster lines or polygons whose the extent perimeter is more than x pixels
      if (featurePixelPerimeter > options.browserClusterFeaturelMaxPerimeter)
        this.addFeature(feature); // And return null to not cluster this feature
      else
        return new ol.geom.Point(ol.extent.getCenter(feature.getGeometry().getExtent()));
    }
  }

  // Generate the features to render the cluster
  createCluster_(point, features) {

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
    // browserClusterMinResolution: 10, // (meters per pixel) resolution below which the browser no longer clusters
    // distance: 50, // (pixels) distance above which the browser clusters
    // minDistance: 16, // (pixels) minimum distance in pixels between clusters
    // Any ol.source.layer.Vector

    // High resolutions layer, can call for server clustering
    super({
      source: options.distance ?
        new MyClusterSource(options) : // Use a cluster source and a vector source to manages clusters
        new MyVectorSource(options), // or a vector source to get the data

      ...options,
      minResolution: Math.max(
        options.minResolution || 0,
        options.browserClusterMinResolution || 0,
      ),
    });

    this.options = options; // Mem for further use

    // Low resolutions layer without clustering
    if (options.browserClusterMinResolution) {
      this.lowResolutionLayer = new ol.layer.Vector({
        source: new MyVectorSource(options),

        ...options,
        maxResolution: Math.min(
          options.maxResolution || Infinity,
          options.browserClusterMinResolution || Infinity,
        ),
      });

      this.lowResolutionLayer.options = options;
    }
  }

  setMapInternal(map) {
    super.setMapInternal(map);

    if (this.lowResolutionLayer)
      map.addLayer(this.lowResolutionLayer);
  }

  // Propagate reload
  reload(visible) {
    this.setVisible(visible);

    if (visible && this.state_) //BEST find better than this.state_
      this.getSource().reload();

    if (this.lowResolutionLayer) {
      this.lowResolutionLayer.setVisible(visible);

      if (visible && this.lowResolutionLayer.state_)
        this.lowResolutionLayer.getSource().reload();
    }
  }
}

class MyServerClusterVectorLayer extends MyBrowserClusterVectorLayer {
  constructor(options) {
    // serverClusterMinResolution: 100, // (meters per pixel) resolution above which we ask clusters to the server

    // Low resolutions layer to display the normal data
    super({
      ...options,
      maxResolution: options.serverClusterMinResolution,
    });

    // High resolutions layer to get and display the clusters delivered by the server at hight resolutions
    if (options.serverClusterMinResolution)
      this.serverClusterLayer = new MyBrowserClusterVectorLayer({
        ...options,
        minResolution: options.serverClusterMinResolution,
      });
  }

  setMapInternal(map) {
    super.setMapInternal(map);

    if (this.serverClusterLayer)
      map.addLayer(this.serverClusterLayer);
  }

  // Propagate the reload to the serverClusterLayer
  reload(visible) {
    super.reload(visible);

    if (this.serverClusterLayer)
      this.serverClusterLayer.reload(visible);
  }
}

/**
 * Facilities added vector layer
 * Style features
 * Layer & features selector
 */
export class MyVectorLayer extends MyServerClusterVectorLayer {
  constructor(options) {
    options = {
      // host: '',
      strategy: ol.loadingstrategy.bbox,
      dataProjection: 'EPSG:4326',

      // Clusters:
      // serverClusterMinResolution: 100, // (meters per pixel) resolution above which we ask clusters to the server
      // distance: 50, // (pixels) distance above which the browser clusters
      // minDistance: 16, // (pixels) minimum distance in pixels between clusters
      // browserClusterMinResolution: 10, // (meters per pixel) resolution below which the browser no longer clusters
      // browserClusterFeaturelMaxPerimeter: 300, // (pixels) perimeter of a line or poly above which we do not cluster
      // browserGigue: 0, // (meters) Randomly shift a point around his position

      // addProperties: properties => {}, // Add properties to each received feature
      basicStylesOptions: stylesOptions.basic, // (feature, layer)
      hoverStylesOptions: stylesOptions.hover, // (feature, layer)
      // selectName: '', // Name of checkbox inputs to tune the url parameters
      selector: new Selector(options.selectName), // Tune the url parameters
      zIndex: 100, // Above tiles layers

      // Any ol.source.Vector options
      // Any ol.source.layer.Vector

      // Methods to instantiate
      // url (extent, resolution, mapProjection) // Calculate the url
      // query (extent, resolution, mapProjection, optioons) ({_path: '...'}),
      // bbox (extent, resolution, mapProjection) => {}
      // addProperties (properties) => {}, // Add properties to each received features

      ...options,
    };
    options.format ||= new ol.format.GeoJSON(options); //BEST treat & display JSON errors

    super({
      url: (e, r, p) => this.url(e, r, p),
      addProperties: p => this.addProperties(p),
      style: (f, r) => this.style(f, r, this),
      ...options,
    });

    this.host = options.host;
    this.url ||= options.url;
    this.query ||= options.query;
    this.bbox ||= options.bbox;
    this.addProperties ||= options.addProperties;
    this.style ||= options.style;
    this.strategy = options.strategy;
    this.dataProjection = options.dataProjection;
    this.format = options.format;
    this.selector = options.selector;

    // Define the selector action
    this.selector.callbacks.push(() => this.reload());
    this.reload();
  }

  url() {
    const args = this.query(...arguments, this.options),
      url = this.host + args._path; // Mem _path

    if (this.strategy == ol.loadingstrategy.bbox)
      args.bbox = this.bbox(...arguments);

    // Add a pseudo parameter if any marker or edit has been done
    const version = sessionStorage.myol_lastchange ?
      '&' + Math.round(sessionStorage.myol_lastchange / 2500 % 46600).toString(36) : '';

    // Clean null & not relative parameters
    Object.keys(args).forEach(k => {
      if (k == '_path' || args[k] == 'on' || !args[k] || !args[k].toString())
        delete args[k];
    });

    return url + '?' + new URLSearchParams(args).toString() + version;
  }

  bbox(extent, resolution, mapProjection) {
    return ol.proj.transformExtent(
      extent,
      mapProjection,
      this.dataProjection, // Received projection
    ).map(c => c.toPrecision(6)); // Limit the number of digits (10 m)
  }

  addProperties() {}

  // Function returning an array of styles options
  style(feature) {
    const sof = !feature.getProperties().cluster ? this.options.basicStylesOptions :
      stylesOptions.cluster;

    return sof(...arguments) // Call the styleOptions function
      .map(so => new ol.style.Style(so)); // Transform into an array of Style objects
  }

  // Define reload action
  reload() {
    super.reload(this.selector.getSelection().length);
  }
}

export default MyVectorLayer;
/**
 * TilesBuffer control
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */

import ol from '../ol';

export default class TilesBuffer extends ol.control.Control {
  constructor(options) {
    options = {
      depth: 2,
      ...options,
    };

    super({
      element: document.createElement('div'), //HACK button not visible
      ...options,
    });

    this.depth = options.depth;
  }

  setMap(map) {
    super.setMap(map);

    // Action on each layer
    //BEST too much load on basic browsing
    map.on('precompose', () => {
      map.getLayers().forEach(layer => {
        if (typeof layer.setPreload == 'function')
          layer.setPreload(this.depth);
      });
    });
  }
}
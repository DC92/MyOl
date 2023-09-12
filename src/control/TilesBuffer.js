/**
 * TilesBuffer control
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */

import MyControl from './MyControl.js';

export default class TilesBuffer extends MyControl {
  constructor(options) {
    super({
      depth: 2,
      ...options,
    });
  }

  setMap(map) {
    super.setMap(map);

    // Action on each layer
    //BEST too much load on basic browsing
    map.on('precompose', () => {
      map.getLayers().forEach(layer => {
        if (typeof layer.setPreload == 'function')
          layer.setPreload(this.options.depth);
      });
    });
  }
}
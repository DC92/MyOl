/**
 * Layer to show around partial layer
 * Outside of layer resolution or extent
 * Must be added to map before partial layers
 */

import ol from '../ol';
import * as layerTile from './TileLayerCollection';

export default class BackgroundLayer extends layerTile.StadiaMaps {
  constructor() {
    super({
      visible: false,
    });
  }

  setMapInternal(map) {
    //HACK execute actions on Map init
    super.setMapInternal(map);

    // Substitution for low resoltions
    map.addLayer(new layerTile.noTile({
      maxResolution: 10,
    }));

    map.once('precompose', () => this.action(map)); // Once at the init
    map.on('moveend', () => this.action(map));
  }

  action(map) {
    const mapExtent = map.getView().calculateExtent(map.getSize());
    let needed = true;

    map.getLayers().forEach(l => {
      if (l.getSource() && l.getSource().urls && // Is a tile layer
        l.isVisible && l.isVisible() && // Is visible
        l != this && // Not the background layer
        ol.extent.containsExtent(l.getExtent() || mapExtent, mapExtent)) // The layer covers the map extent or the entiere worl
        needed = false;
    });

    this.setVisible(needed);
  }
}
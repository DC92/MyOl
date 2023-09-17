/**
 * Layer to show around partial layer
 * Outside of layer resolution or extent
 * Must be added to map before partial layers
 */

import ol from '../ol';
import * as layerTile from './TileLayerCollection';

export default class BackgroundLayer extends layerTile.StadiaMaps {
  constructor(options) {
    // High resolution background layer
    super({
      minResolution: 10,
      visible: false,

      ...options,
    });

    // Low resolution background layer
    this.lowResLayer = new layerTile.noTile({
      maxResolution: this.getMinResolution(),
      visible: false,
    });
  }

  setMapInternal(map) {
    //HACK execute actions on Map init
    super.setMapInternal(map);

    // Substitution for low resoltions
    map.addLayer(this.lowResLayer);

    map.on('precompose', () => {
      const mapExtent = map.getView().calculateExtent(map.getSize());
      let needed = true;

      map.getLayers().forEach(l => {
        if (l.getSource() && l.getSource().urls && // Is a tile layer
          l.isVisible && l.isVisible() && // Is visible
          l != this && l != this.lowResLayer && // Not one of the background layers
          ol.extent.containsExtent(l.getExtent() || mapExtent, mapExtent)) // The layer covers the map extent or the entiere worl
          needed = false;
      });

      this.setVisible(needed);
      this.lowResLayer.setVisible(needed);
    });
  }
}
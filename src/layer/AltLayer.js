/**
 * Layer to show around partial layer
 * Outside of layer resolution or extent
 * Must be added to map before partial layers
 */

import ol from '../ol';
import * as layerTile from './TileLayerCollection';

export default class AltLayer extends layerTile.StadiaMaps {
  setMapInternal(map) { //HACK execute actions on Map init
    super.setMapInternal(map);

    map.on(['precompose'], () => {
      const mapExtent = map.getView().calculateExtent(map.getSize());

      this.setVisible(true); // Display it by default

      map.getLayers().forEach(l => {
        if (l.isVisible && l.isVisible() &&
          l != this &&
          l.getSource().urls && // Is a tile layer
          (!l.getExtent() || // The layer covers all the globe
            ol.extent.containsExtent(l.getExtent(), mapExtent))) // The layer covers the map extent
          this.setVisible(false); // Then, don't display the replacement layer
      });
    });
  }
}
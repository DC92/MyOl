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

    map.on('moveend', evt => {
      const mapExtent = map.getView().calculateExtent(map.getSize());
      let needed = true;

      map.getLayers().forEach(l => {
        if (l.getSource() && l.getSource().urls && // Is a tile layer
          l.isVisible && l.isVisible() && // It is visible
          l != this && // Not the alt layer
          ol.extent.containsExtent(l.getExtent() || mapExtent, mapExtent)) // The layer covers the map extent or the entiere worl
          needed = false;
      });

      this.setVisible(needed);
    });
  }
}
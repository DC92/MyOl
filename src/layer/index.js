/**
 * This file defines the myol.layer exports
 */

import Marker from './Marker';
import * as myVectorLayer from './MyVectorLayer';
import * as tileLayercollection from './TileLayerCollection';
import * as vectorLayerCollection from './VectorLayerCollection';
import BackgroundLayer from './BackgroundLayer';

export default {
  ...myVectorLayer,
  BackgroundLayer: BackgroundLayer,
  Marker: Marker,
  tile: tileLayercollection,
  vector: vectorLayerCollection,
};
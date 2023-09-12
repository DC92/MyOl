/**
 * This file defines the myol.control exports
 */

import Download from './Download';
import Editor from './Editor';
import LayerSwitcher from './LayerSwitcher';
import LengthLine from './LengthLine';
import Load from './Load';
import MyButton from './MyButton';
import MyControl from './MyControl';
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';
import MyMousePosition from './MyMousePosition';
import Permalink from './Permalink';
import Print from './Print';
import TilesBuffer from './TilesBuffer';
import ol from '../ol';

/**
 * Controls examples
 */
export function collection(opt) {
  const options = {
    supplementaryControls: [], //BEST resorb
    ...opt,
  };

  return [
    // Top left
    new ol.control.Zoom(options.zoom),
    new ol.control.FullScreen(options.fullScreen),
    new MyGeocoder(options.geocoder),
    new MyGeolocation(options.geolocation),
    new Load(options.load),
    new Download(options.download),
    new Print(options.print),

    // Bottom left
    new LengthLine(options.lengthLine),
    new MyMousePosition(options.myMouseposition),
    new ol.control.ScaleLine(options.scaleLine),

    // Bottom right
    new ol.control.Attribution(options.attribution),

    ...options.supplementaryControls,
  ];
}

export default {
  Download: Download,
  Editor: Editor,
  LayerSwitcher: LayerSwitcher,
  LengthLine: LengthLine,
  Load: Load,
  MyButton: MyButton,
  MyControl: MyControl,
  MyGeocoder: MyGeocoder,
  MyGeolocation: MyGeolocation,
  MyMousePosition: MyMousePosition,
  Permalink: Permalink,
  Print: Print,
  TilesBuffer: TilesBuffer,
  collection,
};
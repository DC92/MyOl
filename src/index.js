/**
 * This file defines the myol exports
 */

import control from './control';
import layer from './layer';
import * as stylesOptions from './layer/stylesOptions';

import './lang_frFR.js';

export default {
  control: control,
  layer: layer,
  Selector: layer.Selector,
  stylesOptions: stylesOptions,
};
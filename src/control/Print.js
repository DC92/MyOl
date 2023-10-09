/**
 * Print control
 */

import ol from '../ol';
import Button from './Button.js';

export class Print extends Button {
  constructor(options) {
    super({
      // Button options
      label: '&#128438;',
      subMenuId: 'myol-button-print',
      subMenuHTML: '<label><input type="radio" value="0">portrait</label>' +
        '<label><input type="radio" value="1">landscape</label>' +
        '<label><a id="print">Print</a></label>' +
        '<label><a onclick="location.reload()">Cancel</a></label>',

      ...options,
    });

    // To return without print
    document.addEventListener('keydown', evt => {
      if (evt.key == 'Escape')
        setTimeout(() => { // Delay reload for FF & Opera
          location.reload();
        });
    });
  }

  subMenuAction(evt) {
    const map = this.getMap(),
      mapEl = map.getTargetElement(),
      poElcs = this.element.querySelectorAll('input:checked'), // Selected orientation inputs
      orientation = poElcs.length ? parseInt(poElcs[0].value) : 0; // Selected orientation or portrait

    // Change map size & style
    mapEl.style.maxHeight = mapEl.style.maxWidth = mapEl.style.float = 'none';
    mapEl.style.width = orientation == 0 ? '208mm' : '295mm';
    mapEl.style.height = orientation == 0 ? '295mm' : '208mm';
    map.setSize([mapEl.clientWidth, mapEl.clientHeight]);

    // Set style portrait / landscape
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = '@page {size: ' + (orientation == 0 ? 'portrait' : 'landscape') + '}';
    document.head.appendChild(styleSheet);

    // Hide all but the map
    document.body.appendChild(mapEl);
    for (let child = document.body.firstElementChild; child !== null; child = child.nextSibling)
      if (child.style && child !== mapEl)
        child.style.display = 'none';

    // Finer zoom not dependent on the baselayer's levels
    map.getView().setConstrainResolution(false);
    map.addInteraction(new ol.interaction.MouseWheelZoom({
      maxDelta: 0.1,
    }));

    // Finally print if required
    if (evt.target.id == 'print')
      map.once('rendercomplete', () => {
        window.print();
        location.reload();
      });
  }
}

export default Print;
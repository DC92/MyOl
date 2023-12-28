/**
 * Print control
 */

import Button from './Button.js';
import './print.css';
//TODO voir layerswitcher button en mode format
//TODO bug filtres print dans chem

export class Print extends Button {
  constructor(options) {
    super({
      // Button options
      className: 'myol-button-print',
      subMenuId: 'myol-button-print',
      subMenuHTML: subMenuHTML,
      subMenuHTML_fr: subMenuHTML_fr,

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
      poEl = this.element.querySelector('input:checked'), // Selected orientation inputs
      orientation = poEl ? parseInt(poEl.value) : 0; // Selected orientation or portrait

    // Parent the map to the top of the page
    document.body.appendChild(mapEl);

    // Fix resolution to available tiles resolution
    map.getView().setConstrainResolution(true);

    // Set the page style
    document.head.insertAdjacentHTML('beforeend',
      '<style>@page{size:' + (orientation ? 'landscape' : 'portrait') + '}</style>');

    // Change map size & style
    mapEl.classList.add('myol-print-format');
    mapEl.style.width = orientation ? '297mm' : '210mm'; // 11.7 x 8.3 inches
    mapEl.style.height = orientation ? '210mm' : '297mm';

    // Finally print if required
    if (evt.target.id == 'myol-print') {
      if (poEl) { // If a format is set, the full page is already loaded
        window.print();
        location.reload();
      } else // Direct print : wait for full format rendering
        map.once('rendercomplete', () => {
          window.print();
          location.reload();
        });
    }
  }
}

var subMenuHTML = '\
  <label><input type="radio" name="myol-print-orientation" value="0">Portrait</label>\
  <label><input type="radio" name="myol-print-orientation" value="1">Landscape</label>\
  <p><a id="print">Print</a></p>',

  subMenuHTML_fr = '\
  <p style="float:right" title="Cancel"><a onclick="location.reload()">&#10006;</a></p>\
  <p style="width:175px">Choisir le format et recadrer</p>' +
  subMenuHTML
  .replace('Landscape', 'Paysage')
  .replace('Print', 'Imprimer');

export default Print;
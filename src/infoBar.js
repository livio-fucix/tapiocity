/* micropolisJS. Adapted by Graeme McCutcheon from Micropolis.
 *
 * This code is released under the GNU GPL v3, with some additional terms.
 * Please see the files LICENSE and COPYING for details. Alternatively,
 * consult http://micropolisjs.graememcc.co.uk/LICENSE and
 * http://micropolisjs.graememcc.co.uk/COPYING
 *
 * The name/term "MICROPOLIS" is a registered trademark of Micropolis (https://www.micropolis.com) GmbH
 * (Micropolis Corporation, the "licensor") and is licensed here to the authors/publishers of the "Micropolis"
 * city simulation game and its source code (the project or "licensee(s)") as a courtesy of the owner.
 *
 */

import $ from "jquery";

import * as Messages from './messages.ts';
import { MiscUtils } from './miscUtils.js';
import { Text } from './text.js';

// TODO L20N

// Formats a number with dot as thousands separator (Italian locale).
function fmt(n) {
  return Math.floor(n).toLocaleString('it-IT');
}

// Renders the gem-based funds breakdown below the population counter.
// Denominations: diamond=10000, gold=1000, silver=100, bronze=10.
function renderFundsGems(funds) {
  var f = Math.max(0, Math.floor(funds));
  var gems = [
    { cls: 'gem-diamond', value: 10000 },
    { cls: 'gem-gold',    value: 1000  },
    { cls: 'gem-silver',  value: 100   },
    { cls: 'gem-bronze',  value: 10    },
  ];

  var html = '';
  gems.forEach(function(gem) {
    var count = Math.floor(f / gem.value);
    f = f % gem.value;
    html +=
      '<div class="gem-line">' +
        '<span class="gem-icon ' + gem.cls + '"></span>' +
        '<span class="gem-count">' + count + '</span>' +
      '</div>';
  });

  $('#funds-gems').html(html);
}


var InfoBar = function(classification, population, score, funds, date, name) {
  var classificationSelector = MiscUtils.normaliseDOMid(classification);
  var populationSelector = MiscUtils.normaliseDOMid(population);
  var scoreSelector = MiscUtils.normaliseDOMid(score);
  var fundsSelector = MiscUtils.normaliseDOMid(funds);
  var dateSelector = MiscUtils.normaliseDOMid(date);
  var nameSelector = MiscUtils.normaliseDOMid(name);

  return function(dataSource, initialValues) {
    $(classificationSelector).text(Text.cityClass[initialValues.classification] || initialValues.classification);
    $(populationSelector).text(fmt(initialValues.population));
    $(scoreSelector).text(fmt(initialValues.score));
    $(fundsSelector).text(fmt(initialValues.funds));
    $(dateSelector).text([Text.months[initialValues.date.month], initialValues.date.year].join(' '));
    $(nameSelector).text(initialValues.name);
    renderFundsGems(initialValues.funds);

    // Add the various listeners
    dataSource.addEventListener(Messages.CLASSIFICATION_UPDATED, function(classification) {
      $(classificationSelector).text(Text.cityClass[classification] || classification);
    });

    dataSource.addEventListener(Messages.POPULATION_UPDATED, function(population) {
      $(populationSelector).text(fmt(population));
    });

    dataSource.addEventListener(Messages.SCORE_UPDATED, function(score) {
      $(scoreSelector).text(fmt(score));
    });

    dataSource.addEventListener(Messages.FUNDS_CHANGED, function(funds) {
      $(fundsSelector).text(fmt(funds));
      renderFundsGems(funds);
    });

    dataSource.addEventListener(Messages.DATE_UPDATED, function(date) {
      $(dateSelector).text([Text.months[date.month], date.year].join(' '));
    });
  };
};


export { InfoBar };

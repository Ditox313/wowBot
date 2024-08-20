const kb = require('./keyboard_buttons');

module.exports = {
   home: [
    [
        [kb.home.buy, kb.home.consulting],
        [kb.home.repair, kb.home.agreement],
    ],
   ],
   buy: [
    [
      [kb.buy.viveska_fasad, kb.buy.viveska_interier, kb.buy.viveska_neon],
      [kb.buy.tabl, kb.buy.banner, kb.buy.stella],
      [kb.buy.uknow, kb.buy.list, kb.buy.art],
      [kb.back]
    ]
   ]
 }
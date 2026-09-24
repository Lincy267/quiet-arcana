(function () {
  "use strict";

  var UINT32_RANGE = 0x100000000;

  function secureRandomInt(maxExclusive) {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
      throw new RangeError("maxExclusive must be an integer from 1 through 2^32.");
    }

    var rejectionLimit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
    var sample = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(sample);
    } while (sample[0] >= rejectionLimit);

    return sample[0] % maxExclusive;
  }

  function shuffleAndOrient(deck) {
    var shuffled = deck.map(function (card) {
      return { name: card.name, arcana: card.arcana, suit: card.suit, rank: card.rank };
    });

    for (var i = shuffled.length - 1; i > 0; i -= 1) {
      var j = secureRandomInt(i + 1);
      var temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    shuffled = shuffled.map(function (card) {
      return Object.freeze(Object.assign({}, card, {
        orientation: secureRandomInt(2) === 0 ? "upright" : "reversed"
      }));
    });

    return Object.freeze(shuffled);
  }

  window.TarotRNG = Object.freeze({
    secureRandomInt: secureRandomInt,
    shuffleAndOrient: shuffleAndOrient
  });
}());

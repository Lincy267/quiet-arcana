(function () {
  "use strict";

  var majorNames = [
    "愚者", "魔术师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车", "力量", "隐者",
    "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔", "高塔", "星星", "月亮", "太阳", "审判", "世界"
  ];
  var majorFiles = [
    "RWS Tarot 00 Fool.jpg", "RWS Tarot 01 Magician.jpg", "RWS Tarot 02 High Priestess.jpg",
    "RWS Tarot 03 Empress.jpg", "RWS Tarot 04 Emperor.jpg", "RWS Tarot 05 Hierophant.jpg",
    "RWS Tarot 06 Lovers.jpg", "RWS Tarot 07 Chariot.jpg", "RWS Tarot 08 Strength.jpg",
    "RWS Tarot 09 Hermit.jpg", "RWS Tarot 10 Wheel of Fortune.jpg", "RWS Tarot 11 Justice.jpg",
    "RWS Tarot 12 Hanged Man.jpg", "RWS Tarot 13 Death.jpg", "RWS Tarot 14 Temperance.jpg",
    "RWS Tarot 15 Devil.jpg", "RWS Tarot 16 Tower.jpg", "RWS Tarot 17 Star.jpg",
    "RWS Tarot 18 Moon.jpg", "RWS Tarot 19 Sun.jpg", "RWS Tarot 20 Judgement.jpg",
    "RWS Tarot 21 World.jpg"
  ];
  var suits = ["权杖", "圣杯", "宝剑", "星币"];
  var suitFiles = { "权杖": "Wands", "圣杯": "Cups", "宝剑": "Swords", "星币": "Pents" };
  var ranks = ["王牌", "二", "三", "四", "五", "六", "七", "八", "九", "十", "侍从", "骑士", "王后", "国王"];

  var major = majorNames.map(function (name, index) {
    return Object.freeze({
      name: name,
      arcana: "大阿尔卡那",
      suit: null,
      rank: index,
      image: "images/cards/" + majorFiles[index]
    });
  });

  var minor = [];
  suits.forEach(function (suit) {
    ranks.forEach(function (rank, index) {
      minor.push(Object.freeze({
        name: suit + rank,
        arcana: "小阿尔卡那",
        suit: suit,
        rank: index + 1,
        image: "images/cards/" + suitFiles[suit] + String(index + 1).padStart(2, "0") + ".jpg"
      }));
    });
  });

  window.TAROT_CARDS = Object.freeze(major.concat(minor));
}());

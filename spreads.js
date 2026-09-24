(function () {
  "use strict";

  function freezeSpread(spread) {
    spread.positions.forEach(function (position) { Object.freeze(position); });
    Object.freeze(spread.positions);
    return Object.freeze(spread);
  }

  var spreads = {
    single: freezeSpread({
      id: "single", type: "builtin", name: "一张牌", subtitle: "聚焦一个核心信息", cardCount: 1,
      positions: [{ id: "message", label: "核心启示" }], layout: "linear"
    }),
    pastPresentFuture: freezeSpread({
      id: "pastPresentFuture", type: "builtin", name: "过去 · 现在 · 未来", subtitle: "观察事情的发展脉络", cardCount: 3,
      positions: [{ id: "past", label: "过去" }, { id: "present", label: "现在" }, { id: "future", label: "未来" }], layout: "linear"
    }),
    situationChallengeAdvice: freezeSpread({
      id: "situationChallengeAdvice", type: "builtin", name: "现状 · 阻碍 · 建议", subtitle: "适合分析当前问题", cardCount: 3,
      positions: [{ id: "situation", label: "现状" }, { id: "challenge", label: "阻碍" }, { id: "advice", label: "建议" }], layout: "linear"
    }),
    fiveCardInsight: freezeSpread({
      id: "fiveCardInsight", type: "builtin", name: "五张深入牌阵", subtitle: "从多个角度探索问题", cardCount: 5,
      positions: [{ id: "situation", label: "现状" }, { id: "pastInfluence", label: "过去影响" }, { id: "hiddenInfluence", label: "隐藏因素" }, { id: "advice", label: "建议" }, { id: "outcome", label: "潜在结果" }], layout: "linear"
    }),
    relationship: freezeSpread({
      id: "relationship", type: "builtin", name: "关系牌阵", subtitle: "观察双方与关系动态", cardCount: 5,
      positions: [{ id: "self", label: "你" }, { id: "other", label: "对方" }, { id: "connection", label: "关系现状" }, { id: "challenge", label: "阻碍" }, { id: "direction", label: "发展趋势" }], layout: "relationship"
    }),
    celticCross: freezeSpread({
      id: "celticCross", type: "builtin", name: "凯尔特十字", subtitle: "完整分析复杂问题", cardCount: 10,
      positions: [
        { id: "present", label: "现状" }, { id: "crossing", label: "挑战" }, { id: "foundation", label: "根基" },
        { id: "past", label: "过去" }, { id: "possibility", label: "可能性" }, { id: "nearFuture", label: "近期未来" },
        { id: "self", label: "自身状态" }, { id: "environment", label: "外在环境" },
        { id: "hopesFears", label: "希望 / 恐惧" }, { id: "outcome", label: "最终趋势" }
      ], layout: "celtic-cross"
    })
  };

  window.TAROT_SPREADS = Object.freeze(spreads);
}());

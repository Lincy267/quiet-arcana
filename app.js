(function () {
  "use strict";

  var STORAGE_KEY = "quiet-arcana-custom-spreads-v1";
  var HISTORY_STORAGE_KEY = "quiet-arcana-reading-history-v1";
  var COMPARISON_STORAGE_KEY = "quiet-arcana-comparisons-v1";
  var BACKUP_FORMAT = "quiet-arcana-backup";
  var BACKUP_VERSION = 1;
  var DEFAULT_SPREAD_ID = "pastPresentFuture";
  var EDITOR_GRID_X = 12;
  var EDITOR_GRID_Y = 10;
  var EDITOR_MIN_CANVAS_WIDTH = 600;
  var SPATIAL_SOURCE_WIDTH = 840;
  var SPATIAL_SOURCE_HEIGHT = 360;
  var SPATIAL_CARD_WIDTH = 42;
  var SPATIAL_CARD_HEIGHT = 68;
  var LABEL_PLACEMENTS = ["auto", "top", "bottom", "left", "right", "hidden"];
  var fallbackPositionLabels = [
    "第一张", "第二张", "第三张", "第四张", "第五张", "第六张", "第七张", "第八张",
    "第九张", "第十张", "第十一张", "第十二张", "第十三张", "第十四张", "第十五张"
  ];
  var idFallbackCounter = 0;
  var historyIdFallbackCounter = 0;
  var comparisonIdFallbackCounter = 0;

  var state = {
    lockedDeck: null,
    spreadId: DEFAULT_SPREAD_ID,
    currentSpread: window.TAROT_SPREADS[DEFAULT_SPREAD_ID],
    selectedIndexes: new Set(),
    selectedCards: [],
    readingQuestion: "",
    lastCopiedExport: null,
    copyPreviewOpen: false,
    historyEntries: [],
    historyWritable: true,
    savedHistoryId: null,
    historyActiveId: null,
    pendingDeleteHistoryId: null,
    comparisons: [],
    comparisonsWritable: true,
    historyTab: "readings",
    historyView: "root",
    comparisonActiveId: null,
    comparisonEditingEventId: null,
    pendingComparisonDelete: null,
    pendingBulkClear: null,
    quickComparisonHistoryId: null,
    pendingRestore: null,
    temporarySpread: null,
    savedSpreads: [],
    savedSpreadsWritable: true,
    editingSpreadId: null,
    pendingDeleteId: null,
    revealTimer: null,
    scrollTimer: null,
    meaningTrigger: null
  };

  var setupPanel = document.getElementById("setupPanel");
  var selectionPanel = document.getElementById("selectionPanel");
  var shuffleButton = document.getElementById("shuffleButton");
  var questionInput = document.getElementById("questionInput");
  var deckGrid = document.getElementById("deckGrid");
  var deckSelection = document.getElementById("deckSelection");
  var deckViewport = document.getElementById("deckViewport");
  var deckCompleteSummary = document.getElementById("deckCompleteSummary");
  var resultRegion = document.getElementById("resultRegion");
  var revealedSpread = document.getElementById("revealedSpread");
  var readingExport = document.getElementById("readingExport");
  var copyReadingInfoButton = document.getElementById("copyReadingInfo");
  var copyReadingPromptButton = document.getElementById("copyReadingPrompt");
  var readingExportStatus = document.getElementById("readingExportStatus");
  var readingExportFeedback = document.getElementById("readingExportFeedback");
  var toggleExportPreview = document.getElementById("toggleExportPreview");
  var readingExportPreview = document.getElementById("readingExportPreview");
  var readingExportPreviewText = document.getElementById("readingExportPreviewText");
  var readingSave = document.getElementById("readingSave");
  var saveReadingButton = document.getElementById("saveReading");
  var readingSaveFeedback = document.getElementById("readingSaveFeedback");
  var viewSavedReadingButton = document.getElementById("viewSavedReading");
  var addSavedToComparisonButton = document.getElementById("addSavedToComparison");
  var readingSaveStatus = document.getElementById("readingSaveStatus");
  var openHistoryButton = document.getElementById("openHistory");
  var openComparisonsButton = document.getElementById("openComparisons");
  var historyDialog = document.getElementById("historyDialog");
  var historyListHeading = document.getElementById("historyListHeading");
  var historyBack = document.getElementById("historyBack");
  var historyListView = document.getElementById("historyListView");
  var historyDetailView = document.getElementById("historyDetailView");
  var historyEmpty = document.getElementById("historyEmpty");
  var historyList = document.getElementById("historyList");
  var historyBulkClearFooter = document.getElementById("historyBulkClearFooter");
  var historyDetailDate = document.getElementById("historyDetailDate");
  var historyDetailSpreadName = document.getElementById("historyDetailSpreadName");
  var historyDetailQuestion = document.getElementById("historyDetailQuestion");
  var historySpreadViewport = document.getElementById("historySpreadViewport");
  var historySpread = document.getElementById("historySpread");
  var historyMeanings = document.getElementById("historyMeanings");
  var historyCopyStatus = document.getElementById("historyCopyStatus");
  var historyNote = document.getElementById("historyNote");
  var historyDetailStatus = document.getElementById("historyDetailStatus");
  var deleteHistoryDialog = document.getElementById("deleteHistoryDialog");
  var deleteHistoryStatus = document.getElementById("deleteHistoryStatus");
  var historyTabs = document.getElementById("historyTabs");
  var historyReadingsTab = document.getElementById("historyReadingsTab");
  var historyComparisonsTab = document.getElementById("historyComparisonsTab");
  var comparisonListView = document.getElementById("comparisonListView");
  var comparisonCreateView = document.getElementById("comparisonCreateView");
  var comparisonDetailView = document.getElementById("comparisonDetailView");
  var comparisonLinksView = document.getElementById("comparisonLinksView");
  var comparisonList = document.getElementById("comparisonList");
  var comparisonBulkClearFooter = document.getElementById("comparisonBulkClearFooter");
  var comparisonEmpty = document.getElementById("comparisonEmpty");
  var comparisonCreatePicker = document.getElementById("comparisonCreatePicker");
  var comparisonAddPicker = document.getElementById("comparisonAddPicker");
  var comparisonLinkedList = document.getElementById("comparisonLinkedList");
  var comparisonReadings = document.getElementById("comparisonReadings");
  var comparisonEvents = document.getElementById("comparisonEvents");
  var comparisonEventForm = document.getElementById("comparisonEventForm");
  var comparisonEventReadingPicker = document.getElementById("comparisonEventReadingPicker");
  var comparisonConfirmDialog = document.getElementById("comparisonConfirmDialog");
  var bulkClearDialog = document.getElementById("bulkClearDialog");
  var bulkClearStatus = document.getElementById("bulkClearStatus");
  var quickComparisonDialog = document.getElementById("quickComparisonDialog");
  var quickComparisonList = document.getElementById("quickComparisonList");
  var restoreBackupFile = document.getElementById("restoreBackupFile");
  var restoreBackupDialog = document.getElementById("restoreBackupDialog");
  var dataManagementStatus = document.getElementById("dataManagementStatus");
  var restoreBackupStatus = document.getElementById("restoreBackupStatus");
  var progressLabel = document.getElementById("progressLabel");
  var currentPositionEyebrow = document.getElementById("currentPositionEyebrow");
  var positionMap = document.getElementById("positionMap");
  var selectionGuideSpacer = document.getElementById("selectionGuideSpacer");
  var cardsRemaining = document.getElementById("cardsRemaining");
  var savedQuestion = document.getElementById("savedQuestion");
  var stickyQuestion = document.getElementById("stickyQuestion");
  var newReadingButton = document.getElementById("newReadingButton");
  var newReadingTop = document.getElementById("newReadingTop");
  var builtinSpreadOptions = document.getElementById("builtinSpreadOptions");
  var savedSpreadSection = document.getElementById("savedSpreadSection");
  var savedSpreadOptions = document.getElementById("savedSpreadOptions");
  var temporarySpreadSection = document.getElementById("temporarySpreadSection");
  var temporarySpreadOptions = document.getElementById("temporarySpreadOptions");
  var selectedSpreadSummary = document.getElementById("selectedSpreadSummary");
  var customSpreadDialog = document.getElementById("customSpreadDialog");
  var customSpreadStatus = document.getElementById("customSpreadStatus");
  var customSpreadTitle = document.getElementById("customSpreadTitle");
  var customSpreadName = document.getElementById("customSpreadName");
  var customCardCount = document.getElementById("customCardCount");
  var customPositionInputs = document.getElementById("customPositionInputs");
  var layoutEditorViewport = document.getElementById("layoutEditorViewport");
  var layoutCanvas = document.getElementById("layoutCanvas");
  var layoutPreview = document.getElementById("layoutPreview");
  var selectedPositionControls = document.getElementById("selectedPositionControls");
  var selectedPositionTitle = document.getElementById("selectedPositionTitle");
  var overlapStatus = document.getElementById("overlapStatus");
  var rotatePositionButton = document.getElementById("rotatePosition");
  var raisePositionButton = document.getElementById("raisePosition");
  var lowerPositionButton = document.getElementById("lowerPosition");
  var labelPlacementSelect = document.getElementById("labelPlacement");
  var undoLayoutButton = document.getElementById("undoLayout");
  var redoLayoutButton = document.getElementById("redoLayout");
  var previewToggleButton = document.getElementById("toggleLayoutPreview");
  var deleteSpreadDialog = document.getElementById("deleteSpreadDialog");
  var deleteSpreadMessage = document.getElementById("deleteSpreadMessage");
  var deleteSpreadStatus = document.getElementById("deleteSpreadStatus");
  var meaningPanel = document.getElementById("meaningPanel");
  var meaningBackdrop = document.getElementById("meaningBackdrop");
  var closeMeaningButton = document.getElementById("closeMeaningPanel");
  var meaningTitle = document.getElementById("meaningTitle");
  var meaningPosition = document.getElementById("meaningPosition");
  var meaningKeywords = document.getElementById("meaningKeywords");
  var meaningSummary = document.getElementById("meaningSummary");
  var meaningsByName = new Map(window.TAROT_MEANINGS.map(function (entry) { return [entry.name, entry]; }));
  var editor = { positions: [], count: 3, selected: 0, undo: [], redo: [], initial: [], initialManual: [], openedSaved: false, layoutMode: "auto", preview: false, drag: null };

  function spatialCardFootprint(layout) {
    return layout.rotation === 90 ? { width: SPATIAL_CARD_HEIGHT, height: SPATIAL_CARD_WIDTH } :
      { width: SPATIAL_CARD_WIDTH, height: SPATIAL_CARD_HEIGHT };
  }

  function spatialOccupiedBounds(positions, padding) {
    var bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    positions.forEach(function (position) {
      var size = spatialCardFootprint(position.layout);
      var x = position.layout.x * SPATIAL_SOURCE_WIDTH;
      var y = position.layout.y * SPATIAL_SOURCE_HEIGHT;
      bounds.left = Math.min(bounds.left, x - size.width / 2);
      bounds.right = Math.max(bounds.right, x + size.width / 2);
      bounds.top = Math.min(bounds.top, y - size.height / 2);
      bounds.bottom = Math.max(bounds.bottom, y + size.height / 2);
    });
    return {
      left: bounds.left - padding, top: bounds.top - padding,
      right: bounds.right + padding, bottom: bounds.bottom + padding
    };
  }

  function fitSpatialGeometry(positions, options) {
    var bounds = spatialOccupiedBounds(positions, options.padding);
    var occupiedWidth = bounds.right - bounds.left;
    var occupiedHeight = bounds.bottom - bounds.top;
    var scale = Math.min(options.maxCardWidth / SPATIAL_CARD_WIDTH,
      options.width / occupiedWidth,
      options.height ? options.height / occupiedHeight : Infinity);
    if (options.minCardWidth) scale = Math.max(scale, options.minCardWidth / SPATIAL_CARD_WIDTH);
    var width = Math.max(options.width, occupiedWidth * scale);
    var height = options.height || occupiedHeight * scale;
    var originX = (width - occupiedWidth * scale) / 2 - bounds.left * scale;
    var originY = (height - occupiedHeight * scale) / 2 - bounds.top * scale;
    return {
      width: width, height: height, cardWidth: SPATIAL_CARD_WIDTH * scale,
      cards: positions.map(function (position) {
        var size = spatialCardFootprint(position.layout);
        return {
          x: originX + position.layout.x * SPATIAL_SOURCE_WIDTH * scale,
          y: originY + position.layout.y * SPATIAL_SOURCE_HEIGHT * scale,
          width: size.width * scale, height: size.height * scale
        };
      })
    };
  }

  function clampCardCount(value) {
    return Math.min(15, Math.max(1, Number.parseInt(value, 10) || 1));
  }

  function createUniqueId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return "custom-" + window.crypto.randomUUID();
    }
    idFallbackCounter += 1;
    return "custom-" + Date.now().toString(36) + "-" + idFallbackCounter.toString(36);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function editorGridPoint(column, row, rotation) {
    var minX = rotation === 90 ? 2 : 1;
    var minY = rotation === 90 ? 1 : 2;
    return {
      x: clamp(Math.round(column), minX, EDITOR_GRID_X - minX) / EDITOR_GRID_X,
      y: clamp(Math.round(row), minY, EDITOR_GRID_Y - minY) / EDITOR_GRID_Y
    };
  }

  function normalizedLayout(layout, index, fallback) {
    layout = layout && typeof layout === "object" ? layout : {};
    fallback = fallback || { x: .5, y: .5, rotation: 0, z: index + 1, labelPlacement: "auto" };
    var rotation = Number(layout.rotation) === 90 ? 90 : 0;
    var rawX = Number(layout.x);
    var rawY = Number(layout.y);
    var rawZ = Number(layout.z);
    return {
      x: clamp(Number.isFinite(rawX) ? rawX : fallback.x, rotation === 90 ? 2 / EDITOR_GRID_X : 1 / EDITOR_GRID_X, 1 - (rotation === 90 ? 2 / EDITOR_GRID_X : 1 / EDITOR_GRID_X)),
      y: clamp(Number.isFinite(rawY) ? rawY : fallback.y, rotation === 90 ? 1 / EDITOR_GRID_Y : 2 / EDITOR_GRID_Y, 1 - (rotation === 90 ? 1 / EDITOR_GRID_Y : 2 / EDITOR_GRID_Y)),
      rotation: rotation,
      z: Number.isFinite(rawZ) && rawZ > 0 ? Math.round(rawZ) : fallback.z,
      labelPlacement: LABEL_PLACEMENTS.indexOf(layout.labelPlacement) >= 0 ? layout.labelPlacement : fallback.labelPlacement
    };
  }

  function generatedLayouts(count, legacyLayout) {
    var columns;
    if (count === 1) columns = 1;
    else if (legacyLayout === "linear" && count <= 5) columns = count;
    else if (count <= 3) columns = count;
    else if (count <= 8) columns = count <= 5 ? 3 : 4;
    else columns = 5;
    var rows = Math.ceil(count / columns);
    return Array.from({ length: count }, function (_, index) {
      var row = Math.floor(index / columns);
      var rowCount = Math.min(columns, count - row * columns);
      var column = index - row * columns;
      var point = editorGridPoint((column + 1) * EDITOR_GRID_X / (rowCount + 1),
        rows === 1 ? 5 : 2 + row * 6 / (rows - 1), 0);
      return Object.assign(point, { rotation: 0, z: index + 1, labelPlacement: "auto" });
    });
  }

  function autoRowCounts(count) {
    return [
      null, [1], [2], [3], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4],
      [3, 3, 3], [4, 3, 3], [4, 4, 3], [4, 4, 4],
      [5, 4, 4], [5, 5, 4], [5, 5, 5]
    ][count];
  }

  function compactColumnsForRowSize(size) {
    return [null, [6], [5, 6], [5, 6, 7], [4, 5, 6, 7], [4, 5, 6, 7, 8]][size];
  }

  function compactRowsForRowCount(count) {
    return [null, [5], [4, 6], [3, 5, 7]][count];
  }

  function autoGeneratedLayouts(count) {
    var rowCounts = autoRowCounts(count);
    var rowNumbers = compactRowsForRowCount(rowCounts.length);
    var layouts = [];
    rowCounts.forEach(function (rowSize, rowIndex) {
      compactColumnsForRowSize(rowSize).forEach(function (column) {
        var point = editorGridPoint(column, rowNumbers[rowIndex], 0);
        layouts.push(Object.assign(point, { rotation: 0, z: layouts.length + 1, labelPlacement: "auto" }));
      });
    });
    return layouts;
  }

  function editorFootprint(layout, minimumCanvas) {
    if (minimumCanvas) {
      return layout.rotation === 90 ? { width: 68 / EDITOR_MIN_CANVAS_WIDTH, height: 42 / 360 } :
        { width: 42 / EDITOR_MIN_CANVAS_WIDTH, height: 68 / 360 };
    }
    var sample = layoutCanvas.querySelector(".editor-slot");
    var style = sample && window.getComputedStyle(sample);
    var shortSide = style ? Math.min(parseFloat(style.width), parseFloat(style.height)) : 42;
    var longSide = style ? Math.max(parseFloat(style.width), parseFloat(style.height)) : 68;
    var width = layoutCanvas.clientWidth || layoutPreview.clientWidth || 800;
    var height = layoutCanvas.clientHeight || layoutPreview.clientHeight || 360;
    return layout.rotation === 90 ? { width: longSide / width, height: shortSide / height } :
      { width: shortSide / width, height: longSide / height };
  }

  function editorOverlapRatio(first, second, minimumCanvas) {
    var firstSize = editorFootprint(first, minimumCanvas);
    var secondSize = editorFootprint(second, minimumCanvas);
    var width = Math.max(0, (firstSize.width + secondSize.width) / 2 - Math.abs(first.x - second.x));
    var height = Math.max(0, (firstSize.height + secondSize.height) / 2 - Math.abs(first.y - second.y));
    return width * height / Math.min(firstSize.width * firstSize.height, secondSize.width * secondSize.height);
  }

  function freeGeneratedLayout(preferred, occupied) {
    var minX = preferred.rotation === 90 ? 2 : 1;
    var minY = preferred.rotation === 90 ? 1 : 2;
    var candidates = [];
    for (var y = minY; y <= EDITOR_GRID_Y - minY; y += 1) {
      for (var x = minX; x <= EDITOR_GRID_X - minX; x += 1) {
        candidates.push(editorGridPoint(x, y, preferred.rotation));
      }
    }
    candidates.sort(function (a, b) {
      var aDistance = Math.pow(a.x - preferred.x, 2) + Math.pow(a.y - preferred.y, 2);
      var bDistance = Math.pow(b.x - preferred.x, 2) + Math.pow(b.y - preferred.y, 2);
      return aDistance - bDistance || Math.abs(a.y - preferred.y) - Math.abs(b.y - preferred.y) || a.y - b.y || a.x - b.x;
    });
    var free = candidates.find(function (point) {
      var candidate = Object.assign({}, preferred, point);
      return occupied.every(function (position) { return editorOverlapRatio(candidate, position.layout, true) < .05; });
    });
    return Object.assign({}, preferred, free || candidates[0]);
  }

  function cleanGeneratedLayouts(count, legacyLayout) {
    var layouts = legacyLayout ? generatedLayouts(count, legacyLayout) : autoGeneratedLayouts(count);
    var occupied = [];
    return layouts.map(function (layout) {
      var placed = occupied.every(function (position) {
        return editorOverlapRatio(layout, position.layout, true) < .05;
      }) ? layout : freeGeneratedLayout(layout, occupied);
      occupied.push({ layout: placed });
      return placed;
    });
  }

  function normalizePosition(position, index, fallbackLayout) {
    position = position || {};
    var normalized = {
      id: "position-" + (index + 1),
      label: typeof position.label === "string" && position.label.trim() ? position.label.trim() : fallbackPositionLabels[index]
    };
    if (fallbackLayout || position.layout) normalized.layout = normalizedLayout(position.layout, index, fallbackLayout);
    return normalized;
  }

  function normalizeCustomSpread(spread) {
    if (!spread || typeof spread !== "object") return null;
    var count = clampCardCount(spread.cardCount);
    var positions = Array.isArray(spread.positions) ? spread.positions.slice(0, count) : [];
    while (positions.length < count) positions.push({});
    var spatial = spread.layout === "spatial" || Number(spread.layoutVersion) >= 2;
    var defaults = spatial ? generatedLayouts(count) : null;
    var normalized = {
      id: typeof spread.id === "string" && spread.id.indexOf("custom-") === 0 ? spread.id : createUniqueId(),
      type: "custom",
      name: typeof spread.name === "string" && spread.name.trim() ? spread.name.trim() : "自定义牌阵",
      subtitle: "自定义牌阵",
      cardCount: count,
      positions: positions.map(function (position, index) { return normalizePosition(position, index, defaults && defaults[index]); }),
      layout: spatial ? "spatial" : spread.layout === "grid" ? "grid" : "linear"
    };
    if (spatial) normalized.layoutVersion = 2;
    return normalized;
  }

  function loadSavedSpreads() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) throw new Error("Invalid custom spread store");
      var ids = new Set();
      return parsed.map(function (spread) {
        var spatial = spread && (spread.layout === "spatial" || Number(spread.layoutVersion) >= 2);
        if (!spread || typeof spread !== "object" || Array.isArray(spread) ||
          typeof spread.id !== "string" || !spread.id.startsWith("custom-") || ids.has(spread.id) ||
          (spread.type !== undefined && spread.type !== "custom") ||
          typeof spread.name !== "string" || !spread.name.trim() ||
          !Number.isInteger(spread.cardCount) || spread.cardCount < 1 || spread.cardCount > 15 ||
          !Array.isArray(spread.positions) || spread.positions.length !== spread.cardCount ||
          (spread.layout !== undefined && ["linear", "grid", "spatial"].indexOf(spread.layout) < 0) ||
          (spatial && (spread.layout !== "spatial" || spread.layoutVersion !== 2)) ||
          spread.positions.some(function (position) {
            return !position || typeof position !== "object" ||
              typeof position.label !== "string" || !position.label.trim() ||
              (spatial ? !validBackupLayout(position.layout) :
                (position.layout !== undefined && !validBackupLayout(position.layout)));
          })) throw new Error("Invalid custom spread record");
        ids.add(spread.id);
        return normalizeCustomSpread(spread);
      });
    } catch (error) {
      state.savedSpreadsWritable = false;
      return [];
    }
  }

  function persistSavedSpreads(entries) {
    if (!state.savedSpreadsWritable) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      state.savedSpreads = entries;
      return true;
    } catch (error) {
      return false;
    }
  }

  function getSpreadById(spreadId) {
    if (window.TAROT_SPREADS[spreadId]) return window.TAROT_SPREADS[spreadId];
    if (state.temporarySpread && state.temporarySpread.id === spreadId) return state.temporarySpread;
    return state.savedSpreads.find(function (spread) { return spread.id === spreadId; }) || null;
  }

  function getSelectedSpread() {
    return getSpreadById(state.spreadId) || window.TAROT_SPREADS[DEFAULT_SPREAD_ID];
  }

  function selectSpread(spreadId) {
    var spread = getSpreadById(spreadId);
    if (!spread) return;
    state.spreadId = spread.id;
    state.currentSpread = spread;
    renderSpreadPicker();
  }

  function createSpreadOption(spread, includeActions) {
    var shell = document.createElement("div");
    shell.className = "spread-option-shell";
    var button = document.createElement("button");
    button.className = "spread-option";
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(state.spreadId === spread.id));
    button.classList.toggle("is-selected", state.spreadId === spread.id);
    button.addEventListener("click", function () { selectSpread(spread.id); });

    var name = document.createElement("strong");
    name.textContent = spread.name;
    var subtitle = document.createElement("span");
    subtitle.textContent = spread.subtitle;
    var count = document.createElement("small");
    count.textContent = spread.cardCount + " 张牌";
    button.append(name, subtitle, count);
    shell.appendChild(button);

    if (includeActions) {
      var actions = document.createElement("div");
      actions.className = "spread-option-actions";
      var editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "编辑";
      editButton.setAttribute("aria-label", "编辑“" + spread.name + "”");
      editButton.addEventListener("click", function () { openCustomEditor(spread); });
      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", "删除“" + spread.name + "”");
      deleteButton.addEventListener("click", function () { openDeleteConfirmation(spread); });
      actions.append(editButton, deleteButton);
      shell.appendChild(actions);
    }
    return shell;
  }

  function createCustomBuilderOption() {
    var shell = document.createElement("div");
    shell.className = "spread-option-shell";
    var button = document.createElement("button");
    button.className = "spread-option custom-builder-option";
    button.type = "button";
    button.innerHTML = '<strong>自定义牌阵</strong><span>设置牌位并设计空间布局</span><small>1–15 张牌</small>';
    button.addEventListener("click", function () { openCustomEditor(null); });
    shell.appendChild(button);
    return shell;
  }

  function renderSpreadPicker() {
    var builtins = document.createDocumentFragment();
    Object.keys(window.TAROT_SPREADS).forEach(function (id) {
      builtins.appendChild(createSpreadOption(window.TAROT_SPREADS[id], false));
    });
    builtins.appendChild(createCustomBuilderOption());
    builtinSpreadOptions.replaceChildren(builtins);

    if (state.temporarySpread) {
      temporarySpreadSection.hidden = false;
      temporarySpreadOptions.replaceChildren(createSpreadOption(state.temporarySpread, false));
    } else {
      temporarySpreadSection.hidden = true;
      temporarySpreadOptions.replaceChildren();
    }

    if (state.savedSpreads.length) {
      var saved = document.createDocumentFragment();
      state.savedSpreads.forEach(function (spread) { saved.appendChild(createSpreadOption(spread, true)); });
      savedSpreadOptions.replaceChildren(saved);
      savedSpreadSection.hidden = false;
    } else {
      savedSpreadOptions.replaceChildren();
      savedSpreadSection.hidden = true;
    }
    state.currentSpread = getSelectedSpread();
    selectedSpreadSummary.textContent = state.currentSpread.name + " · " + state.currentSpread.cardCount + " 张";
    updateSelectionGuide();
  }

  var modalPageScrollY = null;

  function lockPageScroll() {
    if (modalPageScrollY !== null) return;
    modalPageScrollY = window.scrollY;
    document.documentElement.style.setProperty("--modal-page-width", document.documentElement.clientWidth + "px");
    document.body.style.setProperty("--modal-page-top", -modalPageScrollY + "px");
    document.documentElement.classList.add("modal-scroll-locked");
    document.body.classList.add("modal-scroll-locked");
  }

  function syncPageScrollLock() {
    if (document.querySelector("dialog[open]")) {
      lockPageScroll();
      return;
    }
    if (modalPageScrollY === null) return;
    var restoreY = modalPageScrollY;
    modalPageScrollY = null;
    document.body.classList.remove("modal-scroll-locked");
    document.documentElement.classList.remove("modal-scroll-locked");
    document.body.style.removeProperty("--modal-page-top");
    document.documentElement.style.removeProperty("--modal-page-width");
    window.scrollTo(0, restoreY);
  }

  function openDialog(dialog) {
    if (dialog.open) return;
    lockPageScroll();
    try {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } catch (error) {
      syncPageScrollLock();
      throw error;
    }
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      syncPageScrollLock();
    }
  }

  document.querySelectorAll("dialog").forEach(function (dialog) {
    dialog.addEventListener("close", syncPageScrollLock);
  });

  function collectEditorLabels() {
    return Array.from(customPositionInputs.querySelectorAll("input")).map(function (input) { return input.value; });
  }

  function editorSnapshot() {
    return {
      count: editor.count,
      selected: editor.selected,
      layouts: editor.positions.map(function (position) { return Object.assign({}, position.layout); }),
      manuals: editor.positions.map(function (position) { return Boolean(position.manual); })
    };
  }

  function rememberEditorChange(before) {
    if (JSON.stringify(before) === JSON.stringify(editorSnapshot())) return;
    editor.undo.push(before);
    if (editor.undo.length > 40) editor.undo.shift();
    editor.redo = [];
    updateEditorControls();
  }

  function restoreEditorSnapshot(snapshot) {
    editor.count = snapshot.count;
    editor.selected = Math.min(snapshot.selected, editor.count - 1);
    snapshot.layouts.forEach(function (layout, index) {
      if (editor.positions[index]) {
        editor.positions[index].layout = Object.assign({}, layout);
        editor.positions[index].manual = Boolean(snapshot.manuals && snapshot.manuals[index]);
      }
    });
    customCardCount.value = String(editor.count);
    renderPositionInputs();
    renderEditorCanvas();
  }

  function syncEditorLabels() {
    collectEditorLabels().forEach(function (label, index) {
      if (editor.positions[index]) editor.positions[index].label = label.trim() || fallbackPositionLabels[index];
    });
  }

  function renderPositionInputs() {
    var fragment = document.createDocumentFragment();
    for (var index = 0; index < editor.count; index += 1) {
      var label = document.createElement("label");
      label.className = "position-input-row";
      var number = document.createElement("span");
      number.textContent = (index + 1) + ".";
      var input = document.createElement("input");
      input.type = "text";
      input.maxLength = 40;
      input.value = editor.positions[index].label === fallbackPositionLabels[index] ? "" : editor.positions[index].label;
      input.placeholder = fallbackPositionLabels[index];
      input.setAttribute("aria-label", "第 " + (index + 1) + " 个牌位名称");
      (function (positionIndex, positionInput) {
        positionInput.addEventListener("focus", function () {
          editor.selected = positionIndex;
          renderEditorCanvas();
        });
        positionInput.addEventListener("input", function () {
          editor.positions[positionIndex].label = positionInput.value.trim() || fallbackPositionLabels[positionIndex];
          renderEditorCanvas();
        });
      }(index, input));
      label.append(number, input);
      fragment.appendChild(label);
    }
    customPositionInputs.replaceChildren(fragment);
  }

  function setEditorCardCount(value) {
    syncEditorLabels();
    var count = clampCardCount(value);
    if (count === editor.count) { customCardCount.value = String(count); return; }
    var before = editorSnapshot();
    var defaults = editor.layoutMode === "auto" ? cleanGeneratedLayouts(count) : generatedLayouts(count);
    if (editor.layoutMode === "auto") {
      for (var autoIndex = 0; autoIndex < count; autoIndex += 1) {
        if (editor.positions[autoIndex]) {
          editor.positions[autoIndex].layout = Object.assign({}, defaults[autoIndex], {
            labelPlacement: editor.positions[autoIndex].layout.labelPlacement
          });
          editor.positions[autoIndex].manual = false;
        } else {
          editor.positions.push({
            id: "position-" + (autoIndex + 1), label: fallbackPositionLabels[autoIndex],
            layout: Object.assign({}, defaults[autoIndex]), manual: false
          });
        }
      }
    } else {
      for (var index = editor.count; index < count; index += 1) {
        var occupied = editor.positions.slice(0, index);
        if (editor.positions[index]) {
          if (!editor.positions[index].manual && occupied.some(function (position) {
            return editorOverlapRatio(editor.positions[index].layout, position.layout, true) >= .05;
          })) editor.positions[index].layout = freeGeneratedLayout(defaults[index], occupied);
        } else {
          editor.positions.push({
            id: "position-" + (index + 1), label: fallbackPositionLabels[index],
            layout: freeGeneratedLayout(defaults[index], occupied), manual: false
          });
        }
      }
    }
    editor.count = count;
    editor.selected = Math.min(editor.selected, count - 1);
    customCardCount.value = String(count);
    renderPositionInputs();
    renderEditorCanvas();
    if (editor.layoutMode === "auto") centerEditorViewport();
    rememberEditorChange(before);
  }

  function layoutsOverlap(first, second) {
    var firstHalfWidth = first.rotation === 90 ? .10 : .06;
    var secondHalfWidth = second.rotation === 90 ? .10 : .06;
    var firstHalfHeight = first.rotation === 90 ? .06 : .11;
    var secondHalfHeight = second.rotation === 90 ? .06 : .11;
    return Math.abs(first.x - second.x) < (firstHalfWidth + secondHalfWidth) * .78 &&
      Math.abs(first.y - second.y) < (firstHalfHeight + secondHalfHeight) * .78;
  }

  function overlappingEditorIndexes(index) {
    var first = editor.positions[index].layout;
    return editor.positions.slice(0, editor.count).reduce(function (indexes, position, otherIndex) {
      if (otherIndex !== index && editorOverlapRatio(first, position.layout, false) >= .15) indexes.push(otherIndex);
      return indexes;
    }, []);
  }

  function overlapsEditorPosition(index) {
    return overlappingEditorIndexes(index).length > 0;
  }

  function raiseAboveNewEditorOverlaps(index, newIndexes) {
    if (!newIndexes.length) return false;
    var current = editor.positions[index];
    var ordered = editor.positions.slice().sort(function (a, b) {
      return a.layout.z - b.layout.z || editor.positions.indexOf(a) - editor.positions.indexOf(b);
    });
    var highestNew = Math.max.apply(null, newIndexes.map(function (otherIndex) {
      return ordered.indexOf(editor.positions[otherIndex]);
    }));
    if (ordered.indexOf(current) > highestNew) return false;
    ordered.splice(ordered.indexOf(current), 1);
    var target = Math.max.apply(null, newIndexes.map(function (otherIndex) {
      return ordered.indexOf(editor.positions[otherIndex]);
    }));
    ordered.splice(target + 1, 0, current);
    ordered.forEach(function (position, layer) { position.layout.z = layer + 1; });
    return true;
  }

  function overlappingLayerNeighbor(direction) {
    var current = editor.positions[editor.selected];
    if (!current) return null;
    var overlapping = editor.positions.slice(0, editor.count).filter(function (position) {
      return position === current || editorOverlapRatio(current.layout, position.layout, false) >= .15;
    }).sort(function (a, b) { return a.layout.z - b.layout.z; });
    return overlapping[overlapping.indexOf(current) + direction] || null;
  }

  function normalizeEditorLayers() {
    editor.positions.slice().sort(function (a, b) {
      return a.layout.z - b.layout.z || editor.positions.indexOf(a) - editor.positions.indexOf(b);
    }).forEach(function (position, index) { position.layout.z = index + 1; });
  }

  function spatialRectOverlap(first, second) {
    return Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left)) *
      Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  }

  function spatialMetadataRect(card, width, height, direction) {
    var gap = 5;
    var left = direction === "left" ? card.x - card.width / 2 - gap - width :
      direction === "right" ? card.x + card.width / 2 + gap : card.x - width / 2;
    var top = direction === "top" ? card.y - card.height / 2 - gap - height :
      direction === "bottom" ? card.y + card.height / 2 + gap : card.y - height / 2;
    return { left: left, top: top, right: left + width, bottom: top + height };
  }

  function chooseSpatialMetadata(positions, cards, details, viewport) {
    var cardRects = cards.map(function (card) {
      return { left: card.x - card.width / 2, top: card.y - card.height / 2,
        right: card.x + card.width / 2, bottom: card.y + card.height / 2 };
    });
    var placed = [];
    var choices = [];
    var order = positions.map(function (_, index) { return index; }).sort(function (a, b) {
      return positions[b].layout.z - positions[a].layout.z || a - b;
    });
    order.forEach(function (index) {
      var placement = positions[index].layout.labelPlacement;
      if (placement === "hidden") { choices[index] = { direction: "hidden", rect: null }; return; }
      var width = details[index].offsetWidth;
      var height = details[index].offsetHeight;
      var directions = placement === "auto" ? ["bottom", "top", "right", "left"] : [placement];
      var best = null;
      directions.forEach(function (direction) {
        var rect = spatialMetadataRect(cards[index], width, height, direction);
        var area = Math.max(1, width * height);
        var cardCollision = cardRects.reduce(function (sum, cardRect, otherIndex) {
          return sum + (otherIndex === index ? 0 : spatialRectOverlap(rect, cardRect));
        }, 0) / area;
        var labelCollision = placed.reduce(function (sum, other) {
          return sum + spatialRectOverlap(rect, other);
        }, 0) / area;
        var outside = Math.max(0, -rect.left) * height + Math.max(0, rect.right - viewport.width) * height +
          Math.max(0, -rect.top) * width +
          (viewport.allowBottomGrowth ? 0 : Math.max(0, rect.bottom - viewport.height) * width);
        var score = cardCollision * 10 + labelCollision * 4 + outside / area * 3;
        if (!best || score < best.score) best = { direction: direction, rect: rect, score: score };
      });
      choices[index] = best;
      placed.push(best.rect);
    });
    return choices;
  }

  function normalResultCardWidth(host) {
    var probe = document.createElement("div");
    probe.className = "revealed-card";
    probe.style.cssText = "height:0;opacity:0;animation:none;pointer-events:none";
    host.appendChild(probe);
    var width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function layoutSpatialCards(container, positions, context) {
    var isPreview = context === "preview";
    var resultHost = isPreview ? null : container.parentElement;
    var wasCentered = !isPreview && (!resultHost.dataset.spatialFitted ||
      Math.abs(resultHost.scrollLeft - Number(resultHost.dataset.spatialCenter || 0)) < 3);
    var viewportWidth = isPreview ? container.clientWidth : resultHost.clientWidth;
    var viewportHeight = isPreview ? container.clientHeight : null;
    var maxCardWidth = isPreview ? 46 : normalResultCardWidth(resultHost);
    var minimumResultWidth = window.innerWidth <= 360 ? 40 : window.innerWidth <= 800 ? 48 : 54;
    var minCardWidth = isPreview ? 0 : Math.min(maxCardWidth, minimumResultWidth);
    var geometry = fitSpatialGeometry(positions, {
      width: viewportWidth, height: viewportHeight, maxCardWidth: maxCardWidth,
      minCardWidth: minCardWidth, padding: isPreview ? 32 : 26
    });
    var elements = Array.from(container.querySelectorAll(".spatial-card"));
    var details = elements.map(function (element, index) {
      var card = geometry.cards[index];
      element.style.left = card.x + "px";
      element.style.top = card.y + "px";
      element.style.width = card.width + "px";
      element.style.height = card.height + "px";
      element.style.zIndex = String(positions[index].layout.z);
      element.style.setProperty("--spatial-card-width", geometry.cardWidth + "px");
      element.classList.toggle("is-horizontal", positions[index].layout.rotation === 90);
      LABEL_PLACEMENTS.forEach(function (placement) { element.classList.remove("label-" + placement); });
      var detail = element.querySelector(".card-details");
      detail.style.width = (isPreview ? Math.max(44, Math.min(72, geometry.cardWidth * 1.3)) :
        Math.max(62, Math.min(108, geometry.cardWidth * 1.22))) + "px";
      return detail;
    });
    var choices = chooseSpatialMetadata(positions, geometry.cards, details,
      Object.assign({ allowBottomGrowth: !isPreview }, geometry));
    var minX = Math.min.apply(null, geometry.cards.map(function (card) { return card.x - card.width / 2; }));
    var minY = Math.min.apply(null, geometry.cards.map(function (card) { return card.y - card.height / 2; }));
    var maxX = Math.max.apply(null, geometry.cards.map(function (card) { return card.x + card.width / 2; }));
    var maxY = Math.max.apply(null, geometry.cards.map(function (card) { return card.y + card.height / 2; }));
    choices.forEach(function (choice, index) {
      elements[index].classList.add("label-" + choice.direction);
      if (!choice.rect) return;
      minX = Math.min(minX, choice.rect.left);
      minY = Math.min(minY, choice.rect.top);
      maxX = Math.max(maxX, choice.rect.right);
      maxY = Math.max(maxY, choice.rect.bottom);
    });
    if (!isPreview) {
      var shiftX = Math.max(0, 8 - minX);
      var shiftY = Math.max(0, 8 - minY);
      elements.forEach(function (element, index) {
        element.style.left = (geometry.cards[index].x + shiftX) + "px";
        element.style.top = (geometry.cards[index].y + shiftY) + "px";
      });
      container.style.width = Math.max(geometry.width, maxX + shiftX + 8) + "px";
      container.style.height = Math.max(geometry.height, maxY + shiftY + 8) + "px";
      if (wasCentered) {
        resultHost.scrollLeft = Math.max(0, (container.offsetWidth - resultHost.clientWidth) / 2);
      }
      resultHost.dataset.spatialFitted = "true";
      resultHost.dataset.spatialCenter = String(Math.max(0, (container.offsetWidth - resultHost.clientWidth) / 2));
    }
  }

  function renderEditorCanvas() {
    var fragment = document.createDocumentFragment();
    editor.positions.slice(0, editor.count).forEach(function (position, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "editor-slot" + (index === editor.selected ? " is-selected" : "") +
        (position.layout.rotation === 90 ? " is-horizontal" : "") +
        (overlapsEditorPosition(index) ? " is-overlapping" : "");
      button.dataset.positionIndex = String(index);
      button.style.left = (position.layout.x * 100) + "%";
      button.style.top = (position.layout.y * 100) + "%";
      button.style.zIndex = String(position.layout.z);
      button.setAttribute("aria-label", "第 " + (index + 1) + " 个牌位：" + position.label);
      var number = document.createElement("strong");
      number.textContent = formatPositionNumber(index);
      var name = document.createElement("small");
      name.textContent = position.label;
      button.append(number, name);
      fragment.appendChild(button);
    });
    layoutCanvas.replaceChildren(fragment);
    updateEditorControls();
    if (editor.preview) renderEditorPreview();
  }

  function centerEditorViewport() {
    layoutEditorViewport.scrollLeft = (layoutEditorViewport.scrollWidth - layoutEditorViewport.clientWidth) / 2;
  }

  function updateEditorControls() {
    var position = editor.positions[editor.selected];
    if (!position) return;
    selectedPositionTitle.textContent = formatPositionNumber(editor.selected) + " " + position.label;
    overlapStatus.textContent = overlapsEditorPosition(editor.selected) ? "与其他牌位重叠（可保留）" : "";
    rotatePositionButton.textContent = position.layout.rotation === 90 ? "旋转为竖向 0°" : "旋转为横向 90°";
    labelPlacementSelect.value = position.layout.labelPlacement;
    raisePositionButton.disabled = !overlappingLayerNeighbor(1);
    lowerPositionButton.disabled = !overlappingLayerNeighbor(-1);
    undoLayoutButton.disabled = editor.undo.length === 0;
    redoLayoutButton.disabled = editor.redo.length === 0;
  }

  function renderEditorPreview() {
    var fragment = document.createDocumentFragment();
    editor.positions.slice(0, editor.count).forEach(function (position, index) {
      var card = document.createElement("div");
      card.className = "preview-card spatial-card";
      var face = document.createElement("div");
      face.className = "preview-face";
      var marker = document.createElement("span");
      marker.textContent = formatPositionNumber(index);
      face.appendChild(marker);
      var details = document.createElement("div");
      details.className = "card-details preview-meta";
      details.textContent = position.label;
      card.append(face, details);
      fragment.appendChild(card);
    });
    layoutPreview.replaceChildren(fragment);
    layoutSpatialCards(layoutPreview, editor.positions.slice(0, editor.count), "preview");
  }

  function setEditorPreview(show) {
    editor.preview = show;
    layoutCanvas.hidden = show;
    layoutPreview.hidden = !show;
    selectedPositionControls.hidden = show;
    previewToggleButton.textContent = show ? "返回编辑" : "预览牌阵";
    previewToggleButton.setAttribute("aria-pressed", String(show));
    if (show) renderEditorPreview();
  }

  function snapEditorPosition(layout, x, y) {
    var point = editorGridPoint(x * EDITOR_GRID_X, y * EDITOR_GRID_Y, layout.rotation);
    layout.x = point.x;
    layout.y = point.y;
  }

  function moveEditorPosition(dx, dy) {
    var before = editorSnapshot();
    var position = editor.positions[editor.selected];
    var layout = position.layout;
    snapEditorPosition(layout, layout.x + dx / EDITOR_GRID_X, layout.y + dy / EDITOR_GRID_Y);
    if (layout.x !== before.layouts[editor.selected].x || layout.y !== before.layouts[editor.selected].y) {
      position.manual = true;
      editor.layoutMode = "custom";
    }
    renderEditorCanvas();
    rememberEditorChange(before);
  }

  function rotateEditorPosition() {
    var before = editorSnapshot();
    var position = editor.positions[editor.selected];
    var layout = position.layout;
    layout.rotation = layout.rotation === 90 ? 0 : 90;
    snapEditorPosition(layout, layout.x, layout.y);
    position.manual = true;
    editor.layoutMode = "custom";
    renderEditorCanvas();
    rememberEditorChange(before);
  }

  function moveEditorLayer(direction) {
    var neighbor = overlappingLayerNeighbor(direction);
    if (!neighbor) return;
    var before = editorSnapshot();
    var current = editor.positions[editor.selected];
    var level = current.layout.z;
    current.layout.z = neighbor.layout.z;
    neighbor.layout.z = level;
    editor.layoutMode = "custom";
    normalizeEditorLayers();
    renderEditorCanvas();
    rememberEditorChange(before);
  }

  function autoArrangeEditor() {
    var before = editorSnapshot();
    var defaults = cleanGeneratedLayouts(editor.count);
    editor.positions.slice(0, editor.count).forEach(function (position, index) {
      position.layout = Object.assign({}, defaults[index], { labelPlacement: position.layout.labelPlacement });
      position.manual = false;
    });
    editor.layoutMode = "auto";
    renderEditorCanvas();
    centerEditorViewport();
    rememberEditorChange(before);
  }

  function resetEditorLayout() {
    var before = editorSnapshot();
    var defaults = cleanGeneratedLayouts(editor.count);
    editor.positions.slice(0, editor.count).forEach(function (position, index) {
      position.layout = editor.openedSaved && editor.initial[index] ?
        Object.assign({}, editor.initial[index]) :
        Object.assign({}, defaults[index]);
      position.manual = editor.openedSaved && Boolean(editor.initialManual[index]);
    });
    editor.layoutMode = editor.openedSaved ? "custom" : "auto";
    renderEditorCanvas();
    if (!editor.openedSaved) centerEditorViewport();
    rememberEditorChange(before);
  }

  function openCustomEditor(spread) {
    backupStatus(customSpreadStatus, "", false);
    state.editingSpreadId = spread ? spread.id : null;
    editor.openedSaved = Boolean(spread);
    editor.layoutMode = spread ? "custom" : "auto";
    customSpreadTitle.textContent = spread ? "编辑牌阵" : "设计你的牌阵";
    customSpreadName.value = spread ? spread.name : "";
    editor.count = spread ? spread.cardCount : 3;
    editor.selected = 0;
    editor.undo = [];
    editor.redo = [];
    var defaults = spread ? generatedLayouts(editor.count, spread.layout !== "spatial" ? spread.layout : null) : cleanGeneratedLayouts(editor.count);
    editor.positions = defaults.map(function (layout, index) {
      var source = spread && spread.positions[index];
      return {
        id: "position-" + (index + 1),
        label: source ? source.label : fallbackPositionLabels[index],
        layout: spread && spread.layout === "spatial" && source && source.layout ?
          normalizedLayout(source.layout, index, layout) : Object.assign({}, layout),
        manual: Boolean(spread)
      };
    });
    normalizeEditorLayers();
    editor.initial = editor.positions.map(function (position) { return Object.assign({}, position.layout); });
    editor.initialManual = editor.positions.map(function (position) { return position.manual; });
    customCardCount.value = String(editor.count);
    renderPositionInputs();
    setEditorPreview(false);
    renderEditorCanvas();
    openDialog(customSpreadDialog);
    centerEditorViewport();
    customSpreadName.focus();
  }

  function spreadFromEditor(persist) {
    syncEditorLabels();
    var existing = state.editingSpreadId ? getSpreadById(state.editingSpreadId) : null;
    return normalizeCustomSpread({
      id: persist && existing ? existing.id : createUniqueId(),
      name: customSpreadName.value,
      cardCount: editor.count,
      positions: editor.positions.slice(0, editor.count).map(function (position, index) {
        return { id: "position-" + (index + 1), label: position.label, layout: Object.assign({}, position.layout) };
      }),
      layout: "spatial",
      layoutVersion: 2
    });
  }

  function useTemporaryCustomSpread() {
    var spread = spreadFromEditor(false);
    state.temporarySpread = spread;
    state.spreadId = spread.id;
    state.currentSpread = spread;
    state.editingSpreadId = null;
    closeDialog(customSpreadDialog);
    renderSpreadPicker();
  }

  function saveCustomSpread() {
    var spread = spreadFromEditor(true);
    var existingIndex = state.savedSpreads.findIndex(function (item) { return item.id === spread.id; });
    var next = state.savedSpreads.slice();
    if (existingIndex >= 0) next.splice(existingIndex, 1, spread);
    else next.push(spread);
    if (!persistSavedSpreads(next)) {
      backupStatus(customSpreadStatus, state.savedSpreadsWritable ?
        "保存失败，请检查本机浏览器的存储空间或权限。" :
        "本地牌阵数据无法安全读取。为避免覆盖原数据，当前无法保存更改。可通过数据管理恢复有效备份。", true);
      return;
    }
    state.spreadId = spread.id;
    state.currentSpread = spread;
    state.editingSpreadId = null;
    closeDialog(customSpreadDialog);
    renderSpreadPicker();
  }

  function openDeleteConfirmation(spread) {
    backupStatus(deleteSpreadStatus, "", false);
    state.pendingDeleteId = spread.id;
    deleteSpreadMessage.textContent = "删除“" + spread.name + "”？此操作只会移除保存在本机的牌阵。";
    openDialog(deleteSpreadDialog);
  }

  function deletePendingSpread() {
    if (!state.pendingDeleteId) return;
    var next = state.savedSpreads.filter(function (spread) { return spread.id !== state.pendingDeleteId; });
    if (!persistSavedSpreads(next)) {
      backupStatus(deleteSpreadStatus, state.savedSpreadsWritable ?
        "删除失败，请检查本机浏览器的存储空间或权限。" :
        "本地牌阵数据无法安全读取。为避免覆盖原数据，当前无法删除。可通过数据管理恢复有效备份。", true);
      return;
    }
    if (state.spreadId === state.pendingDeleteId) {
      state.spreadId = DEFAULT_SPREAD_ID;
      state.currentSpread = window.TAROT_SPREADS[DEFAULT_SPREAD_ID];
    }
    state.pendingDeleteId = null;
    closeDialog(deleteSpreadDialog);
    renderSpreadPicker();
  }

  function makeDeckCard(card, index) {
    var button = document.createElement("button");
    button.className = "deck-card";
    button.type = "button";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", "选择第 " + (index + 1) + " 张背面朝上的牌");
    var inner = document.createElement("span");
    inner.className = "deck-card-inner";
    inner.innerHTML = '<span class="card-back"><i>✦</i><b>☾</b><i>✦</i></span>' +
      '<span class="card-picked"><i>已选择</i><b>' + (state.selectedIndexes.size + 1) + "</b></span>";
    button.appendChild(inner);
    button.addEventListener("click", function () { selectCard(card, index, button); });
    return button;
  }

  function renderLockedDeck() {
    var fragment = document.createDocumentFragment();
    state.lockedDeck.forEach(function (card, index) { fragment.appendChild(makeDeckCard(card, index)); });
    deckGrid.replaceChildren(fragment);
  }

  function formatPositionNumber(index) {
    var circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
    return circled[index] || String(index + 1);
  }

  function fitSpatialPositionMap() {
    if (state.currentSpread.layout !== "spatial" || positionMap.hidden) return;
    var styles = window.getComputedStyle(positionMap);
    var width = positionMap.clientWidth || parseFloat(styles.width);
    var height = positionMap.clientHeight || parseFloat(styles.height);
    if (!width || !height) return;
    var geometry = fitSpatialGeometry(state.currentSpread.positions, {
      width: width, height: height, maxCardWidth: 17, padding: 8
    });
    positionMap.querySelectorAll(".spatial-map-slot").forEach(function (slot, index) {
      var card = geometry.cards[index];
      slot.style.left = card.x + "px";
      slot.style.top = card.y + "px";
      slot.style.width = card.width + "px";
      slot.style.height = card.height + "px";
    });
  }

  function renderPositionMap(selectedCount) {
    var layout = state.currentSpread.layout;
    if (layout !== "relationship" && layout !== "celtic-cross" && layout !== "spatial") {
      positionMap.hidden = true;
      positionMap.replaceChildren();
      positionMap.className = "position-map";
      return;
    }

    var fragment = document.createDocumentFragment();
    if (layout === "spatial") {
      state.currentSpread.positions.forEach(function (position, index) {
        var slot = document.createElement("span");
        slot.className = "position-map-slot spatial-map-slot" + (position.layout.rotation === 90 ? " is-horizontal" : "");
        slot.textContent = formatPositionNumber(index);
        slot.style.zIndex = String(position.layout.z);
        slot.classList.add(index < selectedCount ? "is-complete" : index === selectedCount ? "is-current" : "is-future");
        fragment.appendChild(slot);
      });
      positionMap.className = "position-map spatial-map";
      positionMap.replaceChildren(fragment);
      positionMap.hidden = false;
      fitSpatialPositionMap();
      return;
    }
    var crossedCenter = null;
    if (layout === "celtic-cross") {
      crossedCenter = document.createElement("span");
      crossedCenter.className = "celtic-cross-center";
      fragment.appendChild(crossedCenter);
    }
    state.currentSpread.positions.forEach(function (_, index) {
      var slot = document.createElement("span");
      slot.className = "position-map-slot map-position-" + (index + 1);
      slot.textContent = formatPositionNumber(index);
      if (index < selectedCount) slot.classList.add("is-complete");
      else if (index === selectedCount) slot.classList.add("is-current");
      else slot.classList.add("is-future");
      if (crossedCenter && index < 2) crossedCenter.appendChild(slot);
      else fragment.appendChild(slot);
    });
    positionMap.className = "position-map " + (layout === "relationship" ? "relationship-map" : "celtic-map");
    positionMap.replaceChildren(fragment);
    positionMap.hidden = false;
  }

  function updateSelectionGuide() {
    var selectedCount = state.selectedCards.length;
    var requiredCount = state.currentSpread.cardCount;
    selectionPanel.classList.toggle("is-selecting-complete", selectedCount >= requiredCount);
    progressLabel.hidden = false;
    progressLabel.textContent = "已选择 " + selectedCount + " / " + requiredCount;

    if (selectedCount >= requiredCount) {
      currentPositionEyebrow.textContent = "抽取完成";
      document.getElementById("selectionTitle").textContent = "牌阵即将揭晓";
      positionMap.hidden = true;
      updateCompactSelectionGuide();
      return;
    }

    var position = state.currentSpread.positions[selectedCount];
    currentPositionEyebrow.textContent = "当前抽取";
    document.getElementById("selectionTitle").textContent = formatPositionNumber(selectedCount) + " " + position.label;
    renderPositionMap(selectedCount);
    updateCompactSelectionGuide();
  }

  function updateCompactSelectionGuide(remeasure) {
    var heading = selectionPanel.querySelector(".selection-heading");
    if (remeasure && heading.classList.contains("is-compact")) {
      heading.classList.remove("is-compact");
      selectionGuideSpacer.hidden = true;
    }
    var selecting = !selectionPanel.hidden && !selectionPanel.classList.contains("is-revealed") &&
      !selectionPanel.classList.contains("is-selecting-complete");
    var originalTop = selectionPanel.getBoundingClientRect().top + parseFloat(window.getComputedStyle(selectionPanel).paddingTop);
    var shouldCompact = selecting && originalTop <= 0 && deckSelection.getBoundingClientRect().bottom > 0;
    if (!shouldCompact) {
      heading.classList.remove("is-compact");
      selectionGuideSpacer.hidden = true;
      fitSpatialPositionMap();
      return;
    }
    if (heading.classList.contains("is-compact")) return;
    var fullHeight = heading.offsetHeight;
    heading.classList.add("is-compact");
    selectionGuideSpacer.style.height = Math.max(0, fullHeight - heading.offsetHeight) + "px";
    selectionGuideSpacer.hidden = false;
    fitSpatialPositionMap();
  }

  function usesMeaningSheet() {
    return window.matchMedia && window.matchMedia("(max-width: 600px)").matches;
  }

  function positionMeaningPanel(trigger) {
    meaningPanel.style.removeProperty("left");
    meaningPanel.style.removeProperty("top");
    if (usesMeaningSheet()) return;

    var gap = 12;
    var edge = 12;
    var triggerRect = trigger.getBoundingClientRect();
    var cardRects = Array.from(revealedSpread.querySelectorAll(".revealed-card")).map(function (card) {
      return card.getBoundingClientRect();
    });
    var spreadLeft = Math.min.apply(null, cardRects.map(function (rect) { return rect.left; }));
    var spreadRight = Math.max.apply(null, cardRects.map(function (rect) { return rect.right; }));
    var panelWidth = meaningPanel.offsetWidth;
    var panelHeight = meaningPanel.offsetHeight;
    var left = spreadRight + gap;
    var top = triggerRect.top;

    if (left + panelWidth > window.innerWidth - edge) left = spreadLeft - panelWidth - gap;
    if (left < edge) {
      left = triggerRect.right + gap;
      if (left + panelWidth > window.innerWidth - edge) left = triggerRect.left - panelWidth - gap;
    }
    left = Math.max(edge, Math.min(left, window.innerWidth - panelWidth - edge));
    top = Math.max(edge, Math.min(top, window.innerHeight - panelHeight - edge));
    meaningPanel.style.left = left + "px";
    meaningPanel.style.top = top + "px";
  }

  function closeMeaningPanel(restoreFocus) {
    if (meaningPanel.hidden) return;
    var trigger = state.meaningTrigger;
    meaningPanel.hidden = true;
    meaningBackdrop.hidden = true;
    meaningPanel.style.removeProperty("left");
    meaningPanel.style.removeProperty("top");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    state.meaningTrigger = null;
    if (restoreFocus && trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
  }

  function openMeaningPanel(trigger, card, position) {
    var record = meaningsByName.get(card.name);
    if (!record) return;
    var orientationKey = card.orientation === "upright" ? "upright" : "reversed";
    var orientationLabel = orientationKey === "upright" ? "正位" : "逆位";
    var selectedMeaning = record[orientationKey];

    if (state.meaningTrigger && state.meaningTrigger !== trigger) {
      state.meaningTrigger.setAttribute("aria-expanded", "false");
    }
    state.meaningTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    meaningTitle.textContent = card.name + " · " + orientationLabel;
    meaningPosition.textContent = position.label;
    meaningKeywords.textContent = selectedMeaning.keywords.join(" · ");
    meaningSummary.textContent = selectedMeaning.summary;
    meaningPanel.setAttribute("aria-label", card.name + orientationLabel + "基础牌义");
    meaningPanel.hidden = false;
    meaningBackdrop.hidden = !usesMeaningSheet();
    positionMeaningPanel(trigger);
    closeMeaningButton.focus({ preventScroll: true });
  }

  function getInlineMeaningMode(spread) {
    spread = spread || state.currentSpread;
    if (spread.layout !== "linear") return "none";
    if (spread.cardCount <= 3) return "always";
    if (spread.id === "fiveCardInsight" && spread.cardCount === 5) return "wide";
    if (spread.type === "custom" && spread.cardCount === 4) return "wide";
    return "none";
  }

  function currentLayoutUsesMeaningPanel() {
    var mode = getInlineMeaningMode();
    return mode === "none" || (mode === "wide" && window.matchMedia("(max-width: 1199px)").matches);
  }

  function setCardMeaningInteraction(article, card, position) {
    var enabled = currentLayoutUsesMeaningPanel();
    if (enabled) {
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.setAttribute("aria-haspopup", "dialog");
      article.setAttribute("aria-expanded", "false");
      article.setAttribute("aria-controls", "meaningPanel");
      article.setAttribute("aria-label", "查看" + card.name + (card.orientation === "upright" ? "正位" : "逆位") + "牌义，牌位" + position.label);
    } else {
      article.removeAttribute("tabindex");
      article.removeAttribute("role");
      article.removeAttribute("aria-haspopup");
      article.removeAttribute("aria-expanded");
      article.removeAttribute("aria-controls");
      article.removeAttribute("aria-label");
    }
    article.classList.toggle("has-meaning-panel", enabled);
  }

  function updateCardMeaningInteractions() {
    revealedSpread.querySelectorAll(".revealed-card").forEach(function (article, order) {
      var selection = state.selectedCards[order];
      var position = state.currentSpread.positions[order];
      if (selection && position) setCardMeaningInteraction(article, selection.card, position);
    });
  }

  function makeInlineMeaning(card) {
    var record = meaningsByName.get(card.name);
    var selectedMeaning = record[card.orientation === "upright" ? "upright" : "reversed"];
    var preview = document.createElement("div");
    preview.className = "card-meaning-preview";
    var keywords = document.createElement("p");
    keywords.className = "card-meaning-keywords";
    keywords.textContent = selectedMeaning.keywords.slice(0, 3).join(" · ");
    var summary = document.createElement("p");
    summary.className = "card-meaning-summary";
    summary.textContent = selectedMeaning.summary;
    preview.append(keywords, summary);
    return preview;
  }

  function makeRevealedCard(card, position, order, spread, historyOnly) {
    spread = spread || state.currentSpread;
    var article = document.createElement("article");
    article.className = "revealed-card position-" + (order + 1);
    if (spread.layout === "spatial") {
      article.classList.add("spatial-card");
    }
    article.dataset.positionId = position.id;
    article.dataset.positionIndex = String(order);
    article.dataset.cardName = card.name;
    article.dataset.orientation = card.orientation;
    article.style.setProperty("--delay", (order * 70) + "ms");
    var face = document.createElement("div");
    face.className = "revealed-face " + card.orientation;
    var sourceCard = window.TAROT_CARDS.find(function (entry) { return entry.name === card.name; });
    var image = document.createElement("img");
    image.className = "tarot-art";
    image.src = sourceCard.image;
    image.alt = card.name + " 塔罗牌图像";
    var details = document.createElement("div");
    details.className = "card-details";
    var copy = document.createElement("div");
    copy.className = "card-copy";
    var arcana = document.createElement("small");
    arcana.textContent = card.arcana;
    var title = document.createElement("h3");
    title.textContent = card.name;
    copy.append(arcana, title);
    face.appendChild(image);
    var caption = document.createElement("footer");
    var positionLabel = document.createElement("span");
    positionLabel.textContent = position.label;
    var orientation = document.createElement("strong");
    orientation.textContent = card.orientation === "upright" ? "正位" : "逆位";
    caption.append(positionLabel, orientation);
    details.append(copy, caption);
    var inlineMeaningMode = historyOnly ? "none" : getInlineMeaningMode(spread);
    if (inlineMeaningMode !== "none") {
      details.appendChild(makeInlineMeaning(card));
      if (inlineMeaningMode === "wide") {
        var hint = document.createElement("small");
        hint.className = "meaning-hint";
        hint.textContent = "查看释义";
        hint.setAttribute("aria-hidden", "true");
        details.appendChild(hint);
      }
    }
    article.append(face, details);
    if (!historyOnly) {
      setCardMeaningInteraction(article, card, position);
      article.addEventListener("click", function () {
        if (currentLayoutUsesMeaningPanel()) openMeaningPanel(article, card, position);
      });
      article.addEventListener("keydown", function (event) {
        if (currentLayoutUsesMeaningPanel() && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openMeaningPanel(article, card, position);
        }
      });
    }
    return article;
  }

  function makeCelticCenterDetails(spread, selectedCards) {
    spread = spread || state.currentSpread;
    selectedCards = selectedCards || state.selectedCards;
    var container = document.createElement("div");
    container.className = "celtic-center-details";
    selectedCards.slice(0, 2).forEach(function (selection, order) {
      var position = spread.positions[order];
      var row = document.createElement("div");
      row.className = "celtic-center-detail-row";
      var marker = document.createElement("strong");
      marker.textContent = order === 0 ? "①" : "②";
      var name = document.createElement("span");
      name.className = "celtic-center-name";
      name.textContent = selection.card.name;
      var meaning = document.createElement("span");
      meaning.textContent = position.label;
      var orientation = document.createElement("span");
      orientation.className = "celtic-center-orientation";
      orientation.textContent = selection.card.orientation === "upright" ? "正位" : "逆位";
      row.append(marker, name, meaning, orientation);
      container.appendChild(row);
    });
    return container;
  }

  function documentTop(element) {
    var top = 0;
    while (element) {
      top += element.offsetTop;
      element = element.offsetParent;
    }
    return top;
  }

  function scrollResultRegionIntoView() {
    var topMargin = 20;
    var firstResultElement = resultRegion.firstElementChild;
    var lastResultElement = resultRegion.lastElementChild;
    var regionTop = documentTop(firstResultElement);
    var regionBottom = documentTop(lastResultElement) + lastResultElement.offsetHeight;
    var regionHeight = Math.max(0, regionBottom - regionTop);
    var fitsComfortably = regionHeight <= window.innerHeight - 96;
    var targetTop;

    if (fitsComfortably) {
      targetTop = regionTop - Math.max(topMargin, (window.innerHeight - regionHeight) / 2);
    } else {
      targetTop = regionTop - topMargin;
    }

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function readingExportEntries() {
    return state.selectedCards.map(function (selection, index) {
      var card = selection.card;
      var orientation = card.orientation;
      if (orientation !== "upright" && orientation !== "reversed") throw new Error("Missing card orientation");
      return {
        number: String.fromCodePoint(0x2460 + index),
        position: state.currentSpread.positions[index].label,
        name: card.name,
        orientation: orientation === "upright" ? "正位" : "逆位"
      };
    });
  }

  function readingQuestionForExport() {
    return state.readingQuestion || "开放式占卜";
  }

  function hasCustomSpatialExport() {
    return state.currentSpread.type === "custom" && state.currentSpread.layout === "spatial";
  }

  function spatialExportSections() {
    if (!hasCustomSpatialExport()) return [];
    var layout = customSpatialExportLayout();
    var sections = ["【牌阵布局】", layout.map, ""];
    if (layout.special.length) sections.push("【特殊布局】", layout.special.join("\n"), "");
    return sections;
  }

  function formatReadingInfo() {
    var lines = readingExportEntries().map(function (entry) {
      return entry.number + " " + entry.position + "：" + entry.name + " · " + entry.orientation;
    });
    var output = ["问题：" + readingQuestionForExport(), "", "牌阵：" + state.currentSpread.name, ""];
    if (hasCustomSpatialExport()) {
      output.push.apply(output, spatialExportSections());
      output.push("【抽到的牌】");
    }
    output.push(lines.join("\n"));
    return output.join("\n");
  }

  function customSpatialExportLayout() {
    var positions = state.currentSpread.positions;
    var parents = positions.map(function (_, index) { return index; });

    function root(index) {
      while (parents[index] !== index) index = parents[index];
      return index;
    }

    positions.forEach(function (position, first) {
      for (var second = first + 1; second < positions.length; second += 1) {
        if (editorOverlapRatio(position.layout, positions[second].layout, true) < .15) continue;
        parents[root(second)] = root(first);
      }
    });

    var groupsByRoot = new Map();
    positions.forEach(function (position, index) {
      var groupRoot = root(index);
      if (!groupsByRoot.has(groupRoot)) groupsByRoot.set(groupRoot, { members: [], x: 0, y: 0 });
      var group = groupsByRoot.get(groupRoot);
      group.members.push(index);
      group.x += position.layout.x;
      group.y += position.layout.y;
    });
    var groups = Array.from(groupsByRoot.values());
    var mapPositions = groups.map(function (group) {
      return {
        index: group.members[0], members: group.members,
        x: group.x / group.members.length, y: group.y / group.members.length
      };
    });

    // Fit only the occupied centers into a bounded 9 × 5 text grid.
    var xValues = mapPositions.map(function (position) { return position.x; });
    var yValues = mapPositions.map(function (position) { return position.y; });
    var minX = Math.min.apply(null, xValues);
    var maxX = Math.max.apply(null, xValues);
    var minY = Math.min.apply(null, yValues);
    var maxY = Math.max.apply(null, yValues);
    var cells = new Map();
    var placed = [];
    mapPositions.sort(function (a, b) { return a.y - b.y || a.x - b.x || a.index - b.index; });
    mapPositions.forEach(function (position) {
      var targetX = maxX === minX ? 4 : (position.x - minX) / (maxX - minX) * 8;
      var targetY = maxY === minY ? 2 : (position.y - minY) / (maxY - minY) * 4;
      var choices = [];
      for (var row = 0; row < 5; row += 1) {
        for (var column = 0; column < 9; column += 1) {
          choices.push({ row: row, column: column, distance: Math.pow(column - targetX, 2) + Math.pow(row - targetY, 2) * 4 });
        }
      }
      choices.sort(function (a, b) {
        return a.distance - b.distance || Math.abs(a.row - targetY) - Math.abs(b.row - targetY) || a.row - b.row || a.column - b.column;
      });
      var free = choices.find(function (choice) { return !cells.has(choice.row + "," + choice.column); });
      cells.set(free.row + "," + free.column, position.members.map(function (index) {
        return String.fromCodePoint(0x2460 + index);
      }).join("/"));
      placed.push(free);
    });
    var firstRow = Math.min.apply(null, placed.map(function (cell) { return cell.row; }));
    var lastRow = Math.max.apply(null, placed.map(function (cell) { return cell.row; }));
    var firstColumn = Math.min.apply(null, placed.map(function (cell) { return cell.column; }));
    var lastColumn = Math.max.apply(null, placed.map(function (cell) { return cell.column; }));
    var cellWidth = Math.max.apply(null, [3].concat(Array.from(cells.values()).map(function (label) { return label.length + 2; })));
    var mapLines = [];
    for (var mapRow = firstRow; mapRow <= lastRow; mapRow += 1) {
      var line = "";
      for (var mapColumn = firstColumn; mapColumn <= lastColumn; mapColumn += 1) {
        line += (cells.get(mapRow + "," + mapColumn) || "").padEnd(cellWidth, " ");
      }
      mapLines.push(line.trimEnd());
    }
    mapLines = mapLines.filter(function (line, index) {
      return line || index === 0 || mapLines[index - 1] !== "";
    });

    var special = [];
    groups.forEach(function (group) {
      var members = group.members;
      if (members.length === 1) {
        var only = members[0];
        if (positions[only].layout.rotation === 90) special.push(String.fromCodePoint(0x2460 + only) + "横向 90°。");
        return;
      }
      var numbers = members.map(function (index) { return String.fromCodePoint(0x2460 + index); });
      var prefix = members.length === 2 ? numbers.join("与") + "重叠" : numbers.join("、") + "位于同一重叠区域";
      var layers = members.slice().sort(function (a, b) { return positions[a].layout.z - positions[b].layout.z || a - b; });
      var distinctLayers = positions[layers[0]].layout.z !== positions[layers[layers.length - 1]].layout.z;
      if (members.length === 2 && distinctLayers) {
        var lower = layers[0];
        var upper = layers[1];
        var lowerNumber = String.fromCodePoint(0x2460 + lower);
        var upperNumber = String.fromCodePoint(0x2460 + upper);
        special.push(prefix + "；" + lowerNumber + (positions[lower].layout.rotation === 90 ? "横向 90°并" : "") +
          "位于下层，" + upperNumber + (positions[upper].layout.rotation === 90 ? "横向 90°并" : "") + "位于上层。");
        return;
      }
      var parts = [prefix];
      members.forEach(function (index) {
        if (positions[index].layout.rotation === 90) parts.push(String.fromCodePoint(0x2460 + index) + "横向 90°");
      });
      if (distinctLayers) parts.push("层级从下到上为" + layers.map(function (index) {
        return String.fromCodePoint(0x2460 + index);
      }).join("、"));
      special.push(parts.join("；") + "。");
    });
    return { map: mapLines.join("\n"), special: special };
  }

  function formatReadingPrompt() {
    var entries = readingExportEntries();
    var cards = entries.map(function (entry) {
      return entry.number + " " + entry.position + "：" + entry.name + " · " + entry.orientation;
    }).join("\n");
    var isCustomSpatial = hasCustomSpatialExport();
    var lines = [
      "请帮我整体解读这次塔罗牌阵。", "",
      "【问题】", readingQuestionForExport(), "",
      "【牌阵】", state.currentSpread.name, ""
    ];
    lines.push.apply(lines, spatialExportSections());
    lines.push(
      "【抽到的牌】", cards, "",
      "【解读要求】",
      "请不要只逐张重复牌义，而是结合：",
      "- 我的问题",
      "- 每张牌所在的牌位",
      "- 正位 / 逆位",
      "- 牌与牌之间的关系"
    );
    if (isCustomSpatial) lines.push("- 自定义牌阵中各位置的空间关系");
    lines.push(
      "- 整个牌阵的结构和整体趋势", "",
      "先解释各个牌位在这个问题中的含义，再综合分析牌与牌之间如何互相支持、冲突或补充。", "",
      "请重点说明：",
      "1. 这个牌阵最核心的信息是什么",
      "2. 哪些牌之间存在明显呼应或矛盾",
      "3. 当前状态、阻碍/张力和可能的发展方向"
    );
    if (isCustomSpatial) lines.push("4. 如果空间位置本身具有明显中心 / 对照 / 上下关系，请结合这种布局说明");
    lines.push(
      (isCustomSpatial ? "5." : "4.") + " 如果牌阵包含建议位，请把建议和其他牌联系起来解释", "",
      "不要把塔罗结果表述成确定事实或绝对预测。",
      "如果信息存在多种合理解释，请说明主要的不同解读，而不是强行给出唯一答案。"
    );
    return lines.join("\n");
  }

  function resetCopyFeedback() {
    state.lastCopiedExport = null;
    state.copyPreviewOpen = false;
    copyReadingInfoButton.classList.remove("is-copied");
    copyReadingPromptButton.classList.remove("is-copied");
    readingExportFeedback.hidden = true;
    toggleExportPreview.textContent = "查看";
    toggleExportPreview.setAttribute("aria-expanded", "false");
    readingExportPreview.hidden = true;
    readingExportPreviewText.textContent = "";
    readingExportStatus.textContent = "";
    readingExportStatus.hidden = true;
  }

  function renderCopiedExport() {
    readingExportFeedback.hidden = !state.lastCopiedExport;
    readingExportPreview.hidden = !state.copyPreviewOpen;
    toggleExportPreview.textContent = state.copyPreviewOpen ? "收起" : "查看";
    toggleExportPreview.setAttribute("aria-expanded", String(state.copyPreviewOpen));
    readingExportPreviewText.textContent = state.lastCopiedExport ? state.lastCopiedExport.text : "";
  }

  async function writeReadingToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Try the local legacy copy path if clipboard permission is unavailable.
      }
    }
    var field = document.createElement("textarea");
    var previousFocus = document.activeElement;
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      field.remove();
      if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
    }
    return copied;
  }

  async function copyReading(button, formatter) {
    if (readingExport.hidden || revealedSpread.hidden || !state.lockedDeck ||
      state.selectedCards.length !== state.currentSpread.cardCount) return;
    var lockedDeck = state.lockedDeck;
    try {
      var text = formatter();
      if (!await writeReadingToClipboard(text)) throw new Error("Clipboard write failed");
      if (state.lockedDeck !== lockedDeck || readingExport.hidden) return;
      state.lastCopiedExport = { type: button.id, text: text };
      copyReadingInfoButton.classList.toggle("is-copied", button === copyReadingInfoButton);
      copyReadingPromptButton.classList.toggle("is-copied", button === copyReadingPromptButton);
      renderCopiedExport();
      readingExportStatus.textContent = "";
      readingExportStatus.hidden = true;
    } catch (error) {
      if (state.lockedDeck !== lockedDeck || readingExport.hidden) return;
      readingExportStatus.textContent = "复制失败，请重试或检查浏览器的剪贴板权限。";
      readingExportStatus.hidden = false;
    }
  }

  // History is deliberately separate from the locked deck and the custom-spread store.
  function historyRecord(raw) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id ||
      typeof raw.createdAt !== "string" || !Number.isFinite(Date.parse(raw.createdAt)) ||
      typeof raw.question !== "string" || !raw.spread || typeof raw.spread !== "object" ||
      !raw.exports || typeof raw.exports.readingInfo !== "string" || typeof raw.exports.prompt !== "string") return null;
    var spread = raw.spread;
    var count = spread.cardCount;
    if (!Number.isInteger(count) || count < 1 || count > 15 ||
      ["linear", "grid", "relationship", "celtic-cross", "spatial"].indexOf(spread.layout) < 0 ||
      typeof spread.name !== "string" || !spread.name.trim() ||
      !Array.isArray(spread.positions) || spread.positions.length !== count ||
      !Array.isArray(raw.cards) || raw.cards.length !== count) return null;
    var positions = spread.positions.map(function (position) {
      if (!position || typeof position.id !== "string" || typeof position.label !== "string" || !position.label.trim()) return null;
      var result = { id: position.id, label: position.label };
      if (spread.layout === "spatial") {
        var layout = position.layout;
        if (!layout || !Number.isFinite(layout.x) || !Number.isFinite(layout.y) ||
          layout.x < 0 || layout.x > 1 || layout.y < 0 || layout.y > 1 ||
          [0, 90].indexOf(layout.rotation) < 0 || !Number.isFinite(layout.z) || layout.z < 1 ||
          LABEL_PLACEMENTS.indexOf(layout.labelPlacement) < 0) return null;
        result.layout = {
          x: layout.x, y: layout.y, rotation: layout.rotation, z: layout.z,
          labelPlacement: layout.labelPlacement
        };
      }
      return result;
    });
    if (positions.some(function (position) { return !position; })) return null;
    var cards = raw.cards.map(function (card, index) {
      if (!card || typeof card.name !== "string" ||
        ["upright", "reversed"].indexOf(card.orientation) < 0 ||
        card.positionId !== positions[index].id) return null;
      var source = window.TAROT_CARDS.find(function (item) { return item.name === card.name; });
      if (!source) return null;
      return { name: card.name, arcana: source.arcana, orientation: card.orientation, positionId: card.positionId };
    });
    if (cards.some(function (card) { return !card; })) return null;
    return {
      id: raw.id, createdAt: raw.createdAt, question: raw.question,
      spread: {
        id: typeof spread.id === "string" ? spread.id : "",
        type: spread.type === "custom" ? "custom" : "builtin",
        name: spread.name, subtitle: typeof spread.subtitle === "string" ? spread.subtitle : "",
        cardCount: count, layout: spread.layout,
        layoutVersion: Number.isInteger(spread.layoutVersion) ? spread.layoutVersion : null,
        positions: positions
      },
      cards: cards,
      exports: { readingInfo: raw.exports.readingInfo, prompt: raw.exports.prompt },
      note: typeof raw.note === "string" ? raw.note : ""
    };
  }

  function loadHistory() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) throw new Error("Invalid History store");
      var ids = new Set();
      return parsed.map(function (raw) {
        var entry = historyRecord(raw);
        if (!entry || ids.has(entry.id)) throw new Error("Invalid History record");
        ids.add(entry.id);
        return entry;
      }).sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt); });
    } catch (error) {
      state.historyWritable = false;
      return [];
    }
  }

  function persistHistory(entries) {
    if (!state.historyWritable) return false;
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
      state.historyEntries = entries;
      return true;
    } catch (error) {
      return false;
    }
  }

  function historyWriteError(fallback) {
    return state.historyWritable ? fallback :
      "本地历史记录数据无法安全读取。为避免覆盖原数据，当前无法保存更改。可通过数据管理恢复有效备份。";
  }

  function createHistoryId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return "history-" + window.crypto.randomUUID();
    historyIdFallbackCounter += 1;
    return "history-" + Date.now().toString(36) + "-" + historyIdFallbackCounter.toString(36);
  }

  function snapshotCurrentReading() {
    var spread = state.currentSpread;
    return {
      id: createHistoryId(), createdAt: new Date().toISOString(), question: state.readingQuestion,
      spread: {
        id: spread.id, type: spread.type, name: spread.name, subtitle: spread.subtitle,
        cardCount: spread.cardCount, layout: spread.layout,
        layoutVersion: spread.layoutVersion || null,
        positions: spread.positions.map(function (position) {
          var copy = { id: position.id, label: position.label };
          if (position.layout) copy.layout = {
            x: position.layout.x, y: position.layout.y, rotation: position.layout.rotation,
            z: position.layout.z, labelPlacement: position.layout.labelPlacement
          };
          return copy;
        })
      },
      cards: state.selectedCards.map(function (selection, index) {
        return {
          name: selection.card.name, arcana: selection.card.arcana,
          orientation: selection.card.orientation, positionId: spread.positions[index].id
        };
      }),
      exports: { readingInfo: formatReadingInfo(), prompt: formatReadingPrompt() },
      note: ""
    };
  }

  function resetCurrentSaveState() {
    state.savedHistoryId = null;
    saveReadingButton.hidden = false;
    readingSaveFeedback.hidden = true;
    readingSaveStatus.textContent = "";
    readingSaveStatus.hidden = true;
  }

  function saveCurrentReading() {
    if (state.savedHistoryId || readingSave.hidden || revealedSpread.hidden || !state.lockedDeck ||
      state.selectedCards.length !== state.currentSpread.cardCount) return;
    try {
      var entry = snapshotCurrentReading();
      var next = [entry].concat(state.historyEntries);
      if (!persistHistory(next)) throw new Error("History write failed");
      state.savedHistoryId = entry.id;
      saveReadingButton.hidden = true;
      readingSaveFeedback.hidden = false;
      readingSaveStatus.textContent = "";
      readingSaveStatus.hidden = true;
    } catch (error) {
      readingSaveStatus.textContent = historyWriteError("保存失败，请检查本机浏览器的存储空间或权限。");
      readingSaveStatus.hidden = false;
    }
  }

  function localHistoryDate(iso) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso));
  }

  function historyEntryById(id) {
    return state.historyEntries.find(function (entry) { return entry.id === id; }) || null;
  }

  function notePreview(text) {
    if (!text || !text.trim()) return null;
    var preview = document.createElement("span");
    preview.className = "list-note-preview";
    var label = document.createElement("small");
    label.textContent = "备注";
    var excerpt = document.createElement("span");
    excerpt.textContent = text.trim();
    preview.append(label, excerpt);
    return preview;
  }

  function renderHistoryList() {
    historyList.replaceChildren();
    var ordered = state.historyEntries.slice().sort(function (a, b) {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    historyEmpty.hidden = ordered.length > 0;
    historyBulkClearFooter.hidden = ordered.length === 0;
    ordered.forEach(function (entry) {
      var card = document.createElement("div");
      card.className = "history-list-card";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "history-list-item";
      var date = document.createElement("time");
      date.dateTime = entry.createdAt;
      date.textContent = localHistoryDate(entry.createdAt);
      var name = document.createElement("strong");
      name.textContent = entry.spread.name;
      var question = document.createElement("span");
      question.className = "history-list-question";
      question.textContent = entry.question || "开放式占卜";
      var cards = document.createElement("span");
      cards.className = "history-list-cards";
      cards.textContent = entry.cards.map(function (card) {
        return card.name + " · " + (card.orientation === "upright" ? "正位" : "逆位");
      }).join("　/　");
      button.append(date, name, question, cards);
      var preview = notePreview(entry.note);
      if (preview) button.appendChild(preview);
      button.addEventListener("click", function () { openHistoryEntry(entry.id); });
      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "history-list-delete";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", "删除历史记录：" + entry.spread.name + "，" + (entry.question || "开放式占卜"));
      deleteButton.addEventListener("click", function (event) {
        event.stopPropagation();
        openDeleteHistoryConfirmation(entry.id);
      });
      card.append(button, deleteButton);
      historyList.appendChild(card);
    });
  }

  function renderHistoryMeanings(entry) {
    var fragment = document.createDocumentFragment();
    entry.cards.forEach(function (card, index) {
      var record = meaningsByName.get(card.name);
      var meaning = record && record[card.orientation];
      var item = document.createElement("article");
      item.className = "history-meaning";
      var title = document.createElement("h4");
      title.textContent = formatPositionNumber(index) + " " + entry.spread.positions[index].label + " · " +
        card.name + " · " + (card.orientation === "upright" ? "正位" : "逆位");
      var keywords = document.createElement("p");
      keywords.className = "history-keywords";
      keywords.textContent = meaning ? meaning.keywords.join(" · ") : "暂无基础牌义";
      var summary = document.createElement("p");
      summary.textContent = meaning ? meaning.summary : "";
      item.append(title, keywords, summary);
      fragment.appendChild(item);
    });
    historyMeanings.replaceChildren(fragment);
  }

  function showHistoryList() {
    state.historyActiveId = null;
    state.historyTab = "readings";
    setHistoryView("root");
    renderHistoryList();
  }

  function openHistory() {
    showHistoryList();
    openDialog(historyDialog);
  }

  function openComparisons() {
    showHistoryTab("comparisons");
    openDialog(historyDialog);
  }

  function openHistoryEntry(id) {
    var entry = historyEntryById(id);
    if (!entry) return;
    if (!historyDialog.open) openDialog(historyDialog);
    state.historyActiveId = id;
    setHistoryView("history-detail");
    historyDetailDate.textContent = localHistoryDate(entry.createdAt);
    historyDetailSpreadName.textContent = entry.spread.name;
    historyDetailQuestion.textContent = entry.question || "开放式占卜";
    historyNote.value = entry.note;
    historyCopyStatus.textContent = "";
    historyCopyStatus.hidden = true;
    historyDetailStatus.textContent = "";
    historyDetailStatus.hidden = true;
    document.getElementById("saveHistoryNote").textContent = "保存备注";
    historySpread.className = "revealed-spread layout-" + entry.spread.layout;
    historySpreadViewport.classList.toggle("is-celtic", entry.spread.layout === "celtic-cross");
    historySpread.dataset.cardCount = String(entry.spread.cardCount);
    historySpread.removeAttribute("data-spatial-fitted");
    historySpread.removeAttribute("data-spatial-center");
    renderReadingCards(historySpread, entry.spread, entry.cards.map(function (card) { return { card: card }; }), true);
    renderHistoryMeanings(entry);
    historyDialog.scrollTop = 0;
  }

  async function copyHistoryExport(type) {
    var entry = historyEntryById(state.historyActiveId);
    if (!entry) return;
    var text = entry.exports[type];
    try {
      if (!await writeReadingToClipboard(text)) throw new Error("Clipboard write failed");
      if (state.historyActiveId !== entry.id) return;
      historyCopyStatus.textContent = "复制成功 ✓";
    } catch (error) {
      if (state.historyActiveId !== entry.id) return;
      historyCopyStatus.textContent = "复制失败，请检查浏览器的剪贴板权限。";
    }
    historyCopyStatus.hidden = false;
  }

  function saveHistoryNote() {
    var entry = historyEntryById(state.historyActiveId);
    if (!entry) return;
    var next = state.historyEntries.map(function (item) {
      return item.id === entry.id ? Object.assign({}, item, { note: historyNote.value }) : item;
    });
    var saved = persistHistory(next);
    document.getElementById("saveHistoryNote").textContent = saved ? "已保存 ✓" : "保存备注";
    historyDetailStatus.textContent = saved ? "" : historyWriteError("备注保存失败，请检查本机浏览器的存储空间或权限。");
    historyDetailStatus.hidden = saved;
  }

  function openDeleteHistoryConfirmation(id) {
    if (!historyEntryById(id)) return;
    state.pendingDeleteHistoryId = id;
    deleteHistoryStatus.textContent = "";
    deleteHistoryStatus.hidden = true;
    openDialog(deleteHistoryDialog);
  }

  function deleteHistoryEntry() {
    var id = state.pendingDeleteHistoryId;
    if (!historyEntryById(id)) return;
    var wasListView = !historyListView.hidden;
    var listScrollTop = wasListView ? historyDialog.scrollTop : 0;
    var next = state.historyEntries.filter(function (entry) { return entry.id !== id; });
    if (!persistHistory(next)) {
      deleteHistoryStatus.textContent = historyWriteError("删除失败，请检查本机浏览器的存储空间或权限。");
      deleteHistoryStatus.hidden = false;
      return;
    }
    if (state.savedHistoryId === id) {
      readingSaveFeedback.hidden = true;
      readingSaveStatus.textContent = "本次占卜的保存记录已删除。";
      readingSaveStatus.hidden = false;
    }
    state.pendingDeleteHistoryId = null;
    closeDialog(deleteHistoryDialog);
    showHistoryList();
    if (wasListView) historyDialog.scrollTop = listScrollTop;
  }

  // Comparisons are a separate local archive. A link keeps an exact copy of its History entry.
  function validIso(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
  }

  function validEventDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validFrozenReading(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || typeof snapshot.id !== "string" || !snapshot.id ||
      !validIso(snapshot.createdAt) || typeof snapshot.question !== "string" ||
      !snapshot.spread || typeof snapshot.spread.name !== "string" || !snapshot.spread.name ||
      !Array.isArray(snapshot.spread.positions) || !Array.isArray(snapshot.cards) ||
      !snapshot.cards.length || snapshot.cards.length !== snapshot.spread.positions.length ||
      !snapshot.exports || typeof snapshot.exports.readingInfo !== "string" ||
      typeof snapshot.exports.prompt !== "string" || typeof snapshot.note !== "string") return false;
    return snapshot.cards.every(function (card, index) {
      return card && typeof card.name === "string" && card.name &&
        ["upright", "reversed"].indexOf(card.orientation) >= 0 &&
        snapshot.spread.positions[index] && typeof snapshot.spread.positions[index].label === "string";
    });
  }

  function comparisonRecord(raw) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id ||
      typeof raw.title !== "string" || !raw.title.trim() || !validIso(raw.createdAt) ||
      !validIso(raw.updatedAt) || !Array.isArray(raw.readings) || !raw.readings.length ||
      !Array.isArray(raw.events) || typeof raw.note !== "string") return null;
    var linkedIds = new Set();
    var eventIds = new Set();
    if (raw.readings.some(function (link) {
      if (!link || typeof link.historyId !== "string" || !link.historyId ||
        linkedIds.has(link.historyId) || !validIso(link.linkedAt) ||
        !validFrozenReading(link.snapshot) || link.snapshot.id !== link.historyId) return true;
      linkedIds.add(link.historyId);
      return false;
    })) return null;
    if (raw.events.some(function (event) {
      if (!event || typeof event.id !== "string" || !event.id || eventIds.has(event.id) ||
        !validEventDate(event.date) || typeof event.text !== "string" || !event.text.trim() ||
        !validIso(event.createdAt) || !validIso(event.updatedAt) ||
        (event.comparisonNote !== undefined && typeof event.comparisonNote !== "string") ||
        (event.readingHistoryIds !== undefined && (!Array.isArray(event.readingHistoryIds) ||
          new Set(event.readingHistoryIds).size !== event.readingHistoryIds.length ||
          event.readingHistoryIds.some(function (id) { return typeof id !== "string" || !linkedIds.has(id); })))) return true;
      eventIds.add(event.id);
      return false;
    })) return null;
    return Object.assign({}, raw, { events: raw.events.map(function (event) {
      return Object.assign({}, event, {
        readingHistoryIds: event.readingHistoryIds || [], comparisonNote: event.comparisonNote || ""
      });
    }) });
  }

  function loadComparisons() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(COMPARISON_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) throw new Error("Invalid comparison store");
      var ids = new Set();
      var entries = [];
      parsed.forEach(function (raw) {
        var entry = comparisonRecord(raw);
        if (!entry || ids.has(entry.id)) { state.comparisonsWritable = false; return; }
        ids.add(entry.id);
        entries.push(entry);
      });
      return entries;
    } catch (error) {
      state.comparisonsWritable = false;
      return [];
    }
  }

  function persistComparisons(entries) {
    if (!state.comparisonsWritable) return false;
    try {
      window.localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(entries));
      state.comparisons = entries;
      return true;
    } catch (error) {
      return false;
    }
  }

  function backupStatus(element, message, error) {
    element.textContent = message;
    element.hidden = !message;
    element.classList.toggle("is-error", Boolean(error));
  }

  function validBackupTimestamp(value) {
    if (typeof value !== "string") return false;
    var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
    if (!match) return false;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var hour = Number(match[4]);
    var minute = Number(match[5]);
    var second = Number(match[6]);
    var offsetHour = match[8] ? Number(match[8]) : 0;
    var offsetMinute = match[9] ? Number(match[9]) : 0;
    if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 ||
      offsetHour > 23 || offsetMinute > 59) return false;
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day && Number.isFinite(Date.parse(value));
  }

  function validBackupLayout(layout) {
    if (!layout || typeof layout !== "object" || [0, 90].indexOf(layout.rotation) < 0 ||
      !Number.isFinite(layout.x) || !Number.isFinite(layout.y) ||
      !Number.isInteger(layout.z) || layout.z < 1 ||
      LABEL_PLACEMENTS.indexOf(layout.labelPlacement) < 0) return false;
    var minX = layout.rotation === 90 ? 2 / EDITOR_GRID_X : 1 / EDITOR_GRID_X;
    var minY = layout.rotation === 90 ? 1 / EDITOR_GRID_Y : 2 / EDITOR_GRID_Y;
    return layout.x >= minX && layout.x <= 1 - minX &&
      layout.y >= minY && layout.y <= 1 - minY;
  }

  function validBackupCustomSpread(spread) {
    if (!spread || typeof spread !== "object" || typeof spread.id !== "string" ||
      !spread.id.startsWith("custom-") || spread.type !== "custom" ||
      typeof spread.name !== "string" || !spread.name.trim() ||
      !Number.isInteger(spread.cardCount) || spread.cardCount < 1 || spread.cardCount > 15 ||
      ["linear", "grid", "spatial"].indexOf(spread.layout) < 0 ||
      !Array.isArray(spread.positions) || spread.positions.length !== spread.cardCount ||
      (spread.layout === "spatial" && spread.layoutVersion !== 2)) return false;
    return spread.positions.every(function (position, index) {
      return position && position.id === "position-" + (index + 1) &&
        typeof position.label === "string" && Boolean(position.label.trim()) &&
        (spread.layout === "spatial" ? validBackupLayout(position.layout) :
          (position.layout === undefined || validBackupLayout(position.layout)));
    });
  }

  function validateBackupData(data) {
    if (!data || typeof data !== "object" ||
      !Array.isArray(data.customSpreads) || !Array.isArray(data.history) ||
      !Array.isArray(data.comparisons)) throw new Error("无法恢复：备份文件中的数据格式无效。");
    var spreadIds = new Set();
    if (data.customSpreads.some(function (spread) {
      if (!validBackupCustomSpread(spread) || spreadIds.has(spread.id)) return true;
      spreadIds.add(spread.id);
      return false;
    })) throw new Error("无法恢复：自定义牌阵数据格式无效。");
    var historyIds = new Set();
    var history = data.history.map(function (raw) {
      var entry = historyRecord(raw);
      if (!entry || historyIds.has(entry.id)) throw new Error("无法恢复：历史记录数据格式无效。");
      historyIds.add(entry.id);
      return entry;
    });
    var comparisonIds = new Set();
    var comparisons = data.comparisons.map(function (raw) {
      var entry = comparisonRecord(raw);
      if (!entry || comparisonIds.has(entry.id)) throw new Error("无法恢复：现实对照数据格式无效。");
      comparisonIds.add(entry.id);
      return entry;
    });
    return { customSpreads: data.customSpreads, history: history, comparisons: comparisons };
  }

  function validateBackupEnvelope(raw) {
    if (!raw || typeof raw !== "object" || raw.format !== BACKUP_FORMAT) {
      throw new Error("这不是有效的 Quiet Arcana 备份文件。");
    }
    if (raw.version !== BACKUP_VERSION) throw new Error("这个备份版本暂不受支持。");
    if (!validBackupTimestamp(raw.exportedAt)) {
      throw new Error("无法恢复：备份时间或文件结构无效。");
    }
    return { exportedAt: raw.exportedAt, data: validateBackupData(raw.data) };
  }

  function currentBackupEnvelope() {
    if (!state.comparisonsWritable) throw new Error("当前现实对照存储格式异常，无法安全导出。");
    var data = validateBackupData({
      customSpreads: state.savedSpreads,
      history: state.historyEntries,
      comparisons: state.comparisons
    });
    return {
      format: BACKUP_FORMAT, version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(), app: { name: "Quiet Arcana" }, data: data
    };
  }

  function hasPersistentUserData(data) {
    return data.customSpreads.length > 0 || data.history.length > 0 || data.comparisons.length > 0;
  }

  function backupFilename(prefix, date) {
    var pad = function (number) { return String(number).padStart(2, "0"); };
    return prefix + "-" + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" +
      pad(date.getDate()) + "-" + pad(date.getHours()) + pad(date.getMinutes()) + ".json";
  }

  function downloadBackup(envelope, prefix) {
    var blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = backupFilename(prefix, new Date());
    try {
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  }

  function exportLocalBackup(targetStatus) {
    var status = targetStatus || dataManagementStatus;
    try {
      downloadBackup(currentBackupEnvelope(), "quiet-arcana-backup");
      backupStatus(status, "备份已导出 ✓", false);
      return true;
    } catch (error) {
      backupStatus(status, "备份导出失败：" + error.message, true);
      return false;
    }
  }

  async function selectRestoreBackup() {
    var file = restoreBackupFile.files[0];
    restoreBackupFile.value = "";
    if (!file) return;
    state.pendingRestore = null;
    backupStatus(dataManagementStatus, "", false);
    try {
      var parsed = JSON.parse(await file.text());
      var backup = validateBackupEnvelope(parsed);
      var current = currentBackupEnvelope();
      document.getElementById("restoreBackupDate").textContent =
        "备份时间：" + localHistoryDate(backup.exportedAt);
      var counts = document.getElementById("restoreBackupCounts");
      counts.replaceChildren();
      [
        backup.data.customSpreads.length + " 个自定义牌阵",
        backup.data.history.length + " 条占卜记录",
        backup.data.comparisons.length + " 个现实对照"
      ].forEach(function (text) {
        var item = document.createElement("li");
        item.textContent = text;
        counts.appendChild(item);
      });
      document.getElementById("restoreSafetyNotice").textContent = hasPersistentUserData(current.data) ?
        "继续恢复前，会先下载一份当前数据的安全备份。浏览器开始下载后才能继续，但请自行确认文件已妥善保存。" :
        "当前浏览器没有需要备份的本地记录，因此不会下载恢复前安全备份。";
      backupStatus(restoreBackupStatus, "", false);
      state.pendingRestore = backup;
      openDialog(restoreBackupDialog);
    } catch (error) {
      backupStatus(dataManagementStatus, error instanceof SyntaxError ?
        "无法恢复：JSON 文件格式无效。" : error.message, true);
    }
  }

  function replaceManagedStorage(data, storage) {
    var changes = [
      [STORAGE_KEY, JSON.stringify(data.customSpreads)],
      [HISTORY_STORAGE_KEY, JSON.stringify(data.history)],
      [COMPARISON_STORAGE_KEY, JSON.stringify(data.comparisons)]
    ];
    var previous = changes.map(function (change) { return [change[0], storage.getItem(change[0])]; });
    try {
      changes.forEach(function (change) { storage.setItem(change[0], change[1]); });
    } catch (error) {
      var rollbackFailed = false;
      previous.forEach(function (saved) {
        try {
          if (saved[1] === null) storage.removeItem(saved[0]);
          else storage.setItem(saved[0], saved[1]);
        } catch (rollbackError) {
          rollbackFailed = true;
        }
      });
      throw new Error(rollbackFailed ?
        "写入失败，且本机存储阻止完整回滚。请保留刚下载的安全备份，不要刷新页面。" :
        "写入失败，原有本机数据已恢复。");
    }
  }

  function confirmRestoreBackup() {
    if (!state.pendingRestore) return;
    var button = document.getElementById("confirmRestoreBackup");
    button.disabled = true;
    try {
      var current = currentBackupEnvelope();
      if (hasPersistentUserData(current.data)) {
        backupStatus(restoreBackupStatus, "正在生成并下载当前数据的安全备份…", false);
        downloadBackup(current, "quiet-arcana-before-restore");
        backupStatus(restoreBackupStatus, "安全备份已开始下载，正在恢复…", false);
      } else {
        backupStatus(restoreBackupStatus, "当前没有需要备份的本地记录，正在恢复…", false);
      }
      replaceManagedStorage(state.pendingRestore.data, window.localStorage);
      state.pendingRestore = null;
      backupStatus(restoreBackupStatus, "恢复完成 ✓", false);
      backupStatus(dataManagementStatus, "恢复完成 ✓", false);
      window.setTimeout(function () { window.location.reload(); }, 1200);
    } catch (error) {
      backupStatus(restoreBackupStatus, "恢复失败：" + error.message, true);
      button.disabled = false;
    }
  }

  function createComparisonId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return prefix + window.crypto.randomUUID();
    comparisonIdFallbackCounter += 1;
    return prefix + Date.now().toString(36) + "-" + comparisonIdFallbackCounter.toString(36);
  }

  function comparisonById(id) {
    return state.comparisons.find(function (entry) { return entry.id === id; }) || null;
  }

  function frozenHistoryLink(entry) {
    return { historyId: entry.id, linkedAt: new Date().toISOString(), snapshot: JSON.parse(JSON.stringify(entry)) };
  }

  function renderQuickComparisonList() {
    quickComparisonList.replaceChildren();
    var source = historyEntryById(state.quickComparisonHistoryId);
    if (!source) return;
    var ordered = state.comparisons.slice().sort(function (a, b) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
    if (!ordered.length) {
      var empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "还没有现实对照。为这条占卜新建一个即可开始。";
      quickComparisonList.appendChild(empty);
    }
    ordered.forEach(function (comparison) {
      var row = document.createElement("div");
      row.className = "quick-comparison-case";
      var info = document.createElement("span");
      var title = document.createElement("strong");
      title.textContent = comparison.title;
      var meta = document.createElement("small");
      meta.textContent = comparison.readings.length + " 次占卜 · 更新于 " + localHistoryDate(comparison.updatedAt);
      info.append(title, meta);
      var add = document.createElement("button");
      add.type = "button";
      add.className = "secondary-button";
      var linked = comparison.readings.some(function (link) { return link.historyId === source.id; });
      add.textContent = linked ? "已加入" : "加入";
      add.disabled = linked;
      add.addEventListener("click", function () { quickAddToComparison(comparison.id); });
      row.append(info, add);
      quickComparisonList.appendChild(row);
    });
    document.getElementById("quickNewComparison").hidden = !ordered.length;
  }

  function openQuickComparison(historyId) {
    var source = historyEntryById(historyId);
    if (!source) return;
    state.quickComparisonHistoryId = source.id;
    document.getElementById("quickComparisonSource").textContent =
      localHistoryDate(source.createdAt) + " · " + source.spread.name + " · " + (source.question || "开放式占卜");
    document.getElementById("quickComparisonName").value = "";
    document.getElementById("quickComparisonCreate").hidden = state.comparisons.length > 0;
    showComparisonStatus("quickComparisonStatus", "");
    renderQuickComparisonList();
    openDialog(quickComparisonDialog);
  }

  function quickAddToComparison(comparisonId) {
    var source = historyEntryById(state.quickComparisonHistoryId);
    var comparison = comparisonById(comparisonId);
    if (!source || !comparison) return;
    if (comparison.readings.some(function (link) { return link.historyId === source.id; })) {
      renderQuickComparisonList();
      return;
    }
    if (!saveComparisonChange(comparison.id, function (current) {
      return { readings: current.readings.concat(frozenHistoryLink(source)) };
    })) {
      showComparisonStatus("quickComparisonStatus", "加入失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    renderQuickComparisonList();
    showComparisonStatus("quickComparisonStatus", "已加入「" + comparison.title + "」✓");
  }

  function quickCreateComparison() {
    var source = historyEntryById(state.quickComparisonHistoryId);
    var title = document.getElementById("quickComparisonName").value.trim();
    if (!source || !title) {
      showComparisonStatus("quickComparisonStatus", "请填写对照标题。");
      return;
    }
    var now = new Date().toISOString();
    var comparison = {
      id: createComparisonId("comparison-"), title: title, createdAt: now, updatedAt: now,
      readings: [frozenHistoryLink(source)], events: [], note: ""
    };
    if (!persistComparisons([comparison].concat(state.comparisons))) {
      showComparisonStatus("quickComparisonStatus", "建立失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    document.getElementById("quickComparisonCreate").hidden = true;
    renderQuickComparisonList();
    showComparisonStatus("quickComparisonStatus", "已加入「" + comparison.title + "」✓");
  }

  function showComparisonStatus(id, message) {
    var status = document.getElementById(id);
    status.textContent = message;
    status.hidden = !message;
  }

  function setHistoryView(view) {
    state.historyView = view;
    var root = view === "root";
    historyListHeading.hidden = !root;
    historyBack.hidden = root;
    historyTabs.hidden = !root;
    historyReadingsTab.setAttribute("aria-selected", String(state.historyTab === "readings"));
    historyComparisonsTab.setAttribute("aria-selected", String(state.historyTab === "comparisons"));
    historyListView.hidden = !root || state.historyTab !== "readings";
    comparisonListView.hidden = !root || state.historyTab !== "comparisons";
    historyDetailView.hidden = view !== "history-detail";
    comparisonCreateView.hidden = view !== "comparison-create";
    comparisonDetailView.hidden = view !== "comparison-detail";
    comparisonLinksView.hidden = view !== "comparison-links";
    if (view === "history-detail") historyBack.textContent = "← 返回历史记录";
    if (view === "comparison-detail" || view === "comparison-create") historyBack.textContent = "← 返回现实对照";
    if (view === "comparison-links") historyBack.textContent = "← 返回对照";
  }

  function showHistoryTab(tab) {
    state.historyActiveId = null;
    state.historyTab = tab;
    setHistoryView("root");
    if (tab === "readings") renderHistoryList();
    else renderComparisonList();
    historyDialog.scrollTop = 0;
  }

  function historyBackAction() {
    if (state.historyView === "comparison-links") openComparisonEntry(state.comparisonActiveId);
    else if (state.historyView === "comparison-detail" || state.historyView === "comparison-create") showHistoryTab("comparisons");
    else showHistoryList();
  }

  function renderComparisonList() {
    comparisonList.replaceChildren();
    var ordered = state.comparisons.slice().sort(function (a, b) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
    comparisonEmpty.hidden = ordered.length > 0;
    comparisonBulkClearFooter.hidden = ordered.length === 0;
    ordered.forEach(function (entry) {
      var card = document.createElement("div");
      card.className = "history-list-card";
      var open = document.createElement("button");
      open.type = "button";
      open.className = "history-list-item";
      var title = document.createElement("strong");
      title.textContent = entry.title;
      var counts = document.createElement("span");
      counts.className = "comparison-list-meta";
      counts.textContent = entry.readings.length + " 次占卜 · " + entry.events.length + " 条现实事件";
      var date = document.createElement("time");
      date.textContent = "更新于 " + localHistoryDate(entry.updatedAt);
      open.append(title, counts, date);
      var preview = notePreview(entry.note);
      if (preview) open.appendChild(preview);
      open.addEventListener("click", function () { openComparisonEntry(entry.id); });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "history-list-delete";
      remove.textContent = "删除";
      remove.setAttribute("aria-label", "删除现实对照：" + entry.title);
      remove.addEventListener("click", function (event) {
        event.stopPropagation();
        requestComparisonDelete("comparison", entry.id);
      });
      card.append(open, remove);
      comparisonList.appendChild(card);
    });
  }

  function renderComparisonPicker(host, excluded) {
    host.replaceChildren();
    var available = state.historyEntries.filter(function (entry) { return !excluded.has(entry.id); });
    if (!available.length) {
      var empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "没有可添加的占卜记录。";
      host.appendChild(empty);
    }
    available.forEach(function (entry) {
      var label = document.createElement("label");
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = entry.id;
      var content = document.createElement("span");
      var title = document.createElement("strong");
      title.textContent = localHistoryDate(entry.createdAt) + " · " + entry.spread.name;
      var question = document.createElement("small");
      question.textContent = entry.question || "开放式占卜";
      var cards = document.createElement("small");
      cards.textContent = entry.cards.map(function (card) { return card.name + (card.orientation === "upright" ? " 正位" : " 逆位"); }).join(" / ");
      content.append(title, question, cards);
      label.append(checkbox, content);
      host.appendChild(label);
    });
  }

  function selectedPickerEntries(host) {
    return Array.from(host.querySelectorAll('input[type="checkbox"]:checked')).map(function (input) {
      return historyEntryById(input.value);
    }).filter(Boolean);
  }

  function openComparisonCreate() {
    setHistoryView("comparison-create");
    document.getElementById("comparisonTitle").value = "";
    showComparisonStatus("comparisonCreateStatus", "");
    renderComparisonPicker(comparisonCreatePicker, new Set());
    historyDialog.scrollTop = 0;
  }

  function createComparison() {
    var title = document.getElementById("comparisonTitle").value.trim();
    var selected = selectedPickerEntries(comparisonCreatePicker);
    if (!title || !selected.length) {
      showComparisonStatus("comparisonCreateStatus", "请填写标题，并至少选择一条已保存的占卜。");
      return;
    }
    var now = new Date().toISOString();
    var entry = {
      id: createComparisonId("comparison-"), title: title, createdAt: now, updatedAt: now,
      readings: selected.map(frozenHistoryLink), events: [], note: ""
    };
    if (!persistComparisons([entry].concat(state.comparisons))) {
      showComparisonStatus("comparisonCreateStatus", "保存失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    openComparisonEntry(entry.id);
  }

  function comparisonReadingNode(link) {
    var entry = link.snapshot;
    var article = document.createElement("article");
    article.className = "comparison-reading";
    var date = document.createElement("time");
    date.textContent = localHistoryDate(entry.createdAt);
    var title = document.createElement("h5");
    title.textContent = entry.spread.name;
    var question = document.createElement("p");
    question.textContent = entry.question || "开放式占卜";
    article.append(date, title, question);
    if (!historyEntryById(link.historyId)) {
      var missing = document.createElement("p");
      missing.className = "comparison-deleted-source";
      missing.textContent = "原历史记录已删除 · 冻结快照仍保留";
      article.appendChild(missing);
    }
    var cards = document.createElement("ul");
    entry.cards.forEach(function (card, index) {
      var item = document.createElement("li");
      item.textContent = formatPositionNumber(index) + " " + entry.spread.positions[index].label + " · " +
        card.name + " · " + (card.orientation === "upright" ? "正位" : "逆位");
      cards.appendChild(item);
    });
    article.appendChild(cards);
    if (entry.note) {
      var note = document.createElement("p");
      note.className = "comparison-frozen-note";
      note.textContent = "关联时备注：" + entry.note;
      article.appendChild(note);
    }
    var details = document.createElement("details");
    var summary = document.createElement("summary");
    summary.innerHTML = '<span class="comparison-expand">展开原始牌阵信息</span><span class="comparison-collapse">收起原始牌阵信息</span>';
    var original = document.createElement("pre");
    original.textContent = entry.exports.readingInfo;
    details.append(summary, original);
    article.appendChild(details);
    return article;
  }

  function renderComparisonDetail(entry) {
    document.getElementById("comparisonDetailDate").textContent = "建立于 " + localHistoryDate(entry.createdAt) + " · 更新于 " + localHistoryDate(entry.updatedAt);
    document.getElementById("comparisonDetailTitle").textContent = entry.title;
    comparisonReadings.replaceChildren();
    entry.readings.forEach(function (link) { comparisonReadings.appendChild(comparisonReadingNode(link)); });
    comparisonEvents.replaceChildren();
    var ordered = entry.events.slice().sort(function (a, b) {
      return a.date.localeCompare(b.date) || Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });
    document.getElementById("comparisonEventsEmpty").hidden = ordered.length > 0;
    ordered.forEach(function (event) {
      var article = document.createElement("article");
      article.className = "comparison-event";
      var grid = document.createElement("div");
      grid.className = "comparison-event-grid";
      var reality = document.createElement("div");
      reality.className = "comparison-reality";
      var head = document.createElement("div");
      head.className = "comparison-event-head";
      var label = document.createElement("span");
      label.className = "comparison-side-label";
      label.textContent = "现实";
      var date = document.createElement("time");
      date.textContent = event.date.replace(/-/g, "/");
      var description = document.createElement("p");
      description.textContent = event.text;
      var actions = document.createElement("div");
      actions.className = "comparison-event-actions";
      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary-button";
      edit.textContent = "编辑";
      edit.addEventListener("click", function () { openComparisonEventForm(event.id); });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger-button";
      remove.textContent = "删除";
      remove.addEventListener("click", function () { requestComparisonDelete("event", event.id); });
      actions.append(edit, remove);
      head.append(label, actions);
      reality.append(head, date, description);
      var tarot = document.createElement("div");
      tarot.className = "comparison-tarot";
      var tarotLabel = document.createElement("span");
      tarotLabel.className = "comparison-side-label";
      tarotLabel.textContent = "关联占卜";
      tarot.appendChild(tarotLabel);
      var linked = entry.readings.filter(function (link) { return event.readingHistoryIds.indexOf(link.historyId) >= 0; });
      if (!linked.length) {
        var unlinked = document.createElement("p");
        unlinked.className = "comparison-unlinked";
        unlinked.textContent = "尚未关联占卜";
        tarot.appendChild(unlinked);
      }
      linked.forEach(function (link) {
        var reading = document.createElement("div");
        reading.className = "comparison-event-reading";
        var readingTitle = document.createElement("strong");
        readingTitle.textContent = localHistoryDate(link.snapshot.createdAt) + " · " + link.snapshot.spread.name;
        var readingQuestion = document.createElement("span");
        readingQuestion.textContent = link.snapshot.question || "开放式占卜";
        var readingCards = document.createElement("small");
        readingCards.textContent = link.snapshot.cards.map(function (card) {
          return card.name + (card.orientation === "upright" ? " 正位" : " 逆位");
        }).join(" / ");
        reading.append(readingTitle, readingQuestion, document.createElement("br"), readingCards);
        tarot.appendChild(reading);
      });
      grid.append(reality, tarot);
      article.appendChild(grid);
      if (event.comparisonNote) {
        var note = document.createElement("div");
        note.className = "comparison-user-note";
        var noteLabel = document.createElement("span");
        noteLabel.className = "comparison-side-label";
        noteLabel.textContent = "我的对照";
        var noteText = document.createElement("p");
        noteText.textContent = event.comparisonNote;
        note.append(noteLabel, noteText);
        article.appendChild(note);
      }
      comparisonEvents.appendChild(article);
    });
    document.getElementById("comparisonNote").value = entry.note;
  }

  function renderEventReadingPicker(entry, selectedIds) {
    comparisonEventReadingPicker.replaceChildren();
    entry.readings.forEach(function (link) {
      var label = document.createElement("label");
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = link.historyId;
      checkbox.checked = selectedIds.indexOf(link.historyId) >= 0;
      var text = document.createElement("span");
      var heading = document.createElement("strong");
      heading.textContent = localHistoryDate(link.snapshot.createdAt) + " · " + link.snapshot.spread.name;
      var question = document.createElement("small");
      question.textContent = link.snapshot.question || "开放式占卜";
      text.append(heading, question);
      label.append(checkbox, text);
      comparisonEventReadingPicker.appendChild(label);
    });
  }

  function openComparisonEntry(id) {
    var entry = comparisonById(id);
    if (!entry) return;
    state.comparisonActiveId = id;
    setHistoryView("comparison-detail");
    comparisonEventForm.hidden = true;
    state.comparisonEditingEventId = null;
    showComparisonStatus("comparisonDetailStatus", "");
    document.getElementById("saveComparisonNote").textContent = "保存备注";
    renderComparisonDetail(entry);
    historyDialog.scrollTop = 0;
  }

  function saveComparisonChange(id, transform) {
    var entry = comparisonById(id);
    if (!entry) return false;
    var changed = transform(entry);
    var next = state.comparisons.map(function (item) {
      return item.id === id ? Object.assign({}, item, changed, { updatedAt: new Date().toISOString() }) : item;
    });
    return persistComparisons(next);
  }

  function openComparisonLinks() {
    var entry = comparisonById(state.comparisonActiveId);
    if (!entry) return;
    setHistoryView("comparison-links");
    renderComparisonLinks(entry);
    historyDialog.scrollTop = 0;
  }

  function renderComparisonLinks(entry) {
    comparisonLinkedList.replaceChildren();
    entry.readings.forEach(function (link) {
      var row = document.createElement("div");
      row.className = "comparison-linked-row";
      var summary = document.createElement("span");
      var title = document.createElement("strong");
      title.textContent = link.snapshot.spread.name;
      var detail = document.createElement("small");
      detail.textContent = localHistoryDate(link.snapshot.createdAt) + " · " + (link.snapshot.question || "开放式占卜") +
        (historyEntryById(link.historyId) ? "" : " · 原历史记录已删除");
      summary.append(title, detail);
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary-button";
      remove.textContent = "移除关联";
      remove.disabled = entry.readings.length === 1;
      remove.addEventListener("click", function () {
        if (!saveComparisonChange(entry.id, function (current) {
          return {
            readings: current.readings.filter(function (item) { return item.historyId !== link.historyId; }),
            events: current.events.map(function (event) {
              return Object.assign({}, event, {
                readingHistoryIds: event.readingHistoryIds.filter(function (id) { return id !== link.historyId; })
              });
            })
          };
        })) {
          showComparisonStatus("comparisonLinksStatus", "移除失败，请检查本机浏览器存储空间或记录格式。");
          return;
        }
        showComparisonStatus("comparisonLinksStatus", "");
        renderComparisonLinks(comparisonById(entry.id));
      });
      row.append(summary, remove);
      comparisonLinkedList.appendChild(row);
    });
    renderComparisonPicker(comparisonAddPicker, new Set(entry.readings.map(function (link) { return link.historyId; })));
  }

  function addComparisonLinks() {
    var entry = comparisonById(state.comparisonActiveId);
    if (!entry) return;
    var existing = new Set(entry.readings.map(function (link) { return link.historyId; }));
    var selected = selectedPickerEntries(comparisonAddPicker).filter(function (item) { return !existing.has(item.id); });
    if (!selected.length) {
      showComparisonStatus("comparisonLinksStatus", "请选择尚未关联的占卜记录。");
      return;
    }
    if (!saveComparisonChange(entry.id, function (current) {
      return { readings: current.readings.concat(selected.map(frozenHistoryLink)) };
    })) {
      showComparisonStatus("comparisonLinksStatus", "添加失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    showComparisonStatus("comparisonLinksStatus", "已添加 ✓");
    renderComparisonLinks(comparisonById(entry.id));
  }

  function openComparisonEventForm(id) {
    var entry = comparisonById(state.comparisonActiveId);
    if (!entry) return;
    var event = id && entry.events.find(function (item) { return item.id === id; });
    state.comparisonEditingEventId = event ? event.id : null;
    document.getElementById("comparisonEventDate").value = event ? event.date : new Date().toISOString().slice(0, 10);
    document.getElementById("comparisonEventText").value = event ? event.text : "";
    document.getElementById("comparisonEventNote").value = event ? event.comparisonNote : "";
    renderEventReadingPicker(entry, event ? event.readingHistoryIds :
      (entry.readings.length === 1 ? [entry.readings[0].historyId] : []));
    document.getElementById("saveComparisonEvent").textContent = event ? "保存修改" : "保存事件";
    showComparisonStatus("comparisonEventStatus", "");
    comparisonEventForm.hidden = false;
  }

  function saveComparisonEvent() {
    var entry = comparisonById(state.comparisonActiveId);
    if (!entry) return;
    var date = document.getElementById("comparisonEventDate").value;
    var description = document.getElementById("comparisonEventText").value.trim();
    var readingHistoryIds = Array.from(comparisonEventReadingPicker.querySelectorAll('input[type="checkbox"]:checked')).map(function (input) {
      return input.value;
    });
    var comparisonNote = document.getElementById("comparisonEventNote").value;
    if (!validEventDate(date) || !description) {
      showComparisonStatus("comparisonEventStatus", "请填写有效日期和事件描述。");
      return;
    }
    var editingId = state.comparisonEditingEventId;
    var now = new Date().toISOString();
    if (!saveComparisonChange(entry.id, function (current) {
      return { events: editingId ? current.events.map(function (event) {
        return event.id === editingId ? Object.assign({}, event, {
          date: date, text: description, readingHistoryIds: readingHistoryIds,
          comparisonNote: comparisonNote, updatedAt: now
        }) : event;
      }) : current.events.concat({
        id: createComparisonId("event-"), date: date, text: description,
        readingHistoryIds: readingHistoryIds, comparisonNote: comparisonNote,
        createdAt: now, updatedAt: now
      }) };
    })) {
      showComparisonStatus("comparisonEventStatus", "保存失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    comparisonEventForm.hidden = true;
    state.comparisonEditingEventId = null;
    renderComparisonDetail(comparisonById(entry.id));
    showComparisonStatus("comparisonDetailStatus", "事件已保存 ✓");
  }

  function saveComparisonNote() {
    var entry = comparisonById(state.comparisonActiveId);
    if (!entry) return;
    var note = document.getElementById("comparisonNote").value;
    var saved = saveComparisonChange(entry.id, function () {
      return { note: note };
    });
    document.getElementById("saveComparisonNote").textContent = saved ? "已保存 ✓" : "保存备注";
    showComparisonStatus("comparisonDetailStatus", saved ? "" : "保存失败，请检查本机浏览器存储空间或记录格式。");
    if (saved) renderComparisonDetail(comparisonById(entry.id));
  }

  function requestComparisonDelete(kind, id) {
    if (kind === "comparison" && !comparisonById(id)) return;
    if (kind === "event" && !(comparisonById(state.comparisonActiveId) || { events: [] }).events.some(function (event) { return event.id === id; })) return;
    state.pendingComparisonDelete = { kind: kind, id: id, comparisonId: state.comparisonActiveId };
    document.getElementById("comparisonConfirmTitle").textContent = kind === "comparison" ? "删除这个现实对照？" : "删除这条现实事件？";
    document.getElementById("comparisonConfirmMessage").textContent = kind === "comparison" ?
      "仅删除此对照，不会删除任何占卜历史记录。" : "仅删除这条手动记录的事件。";
    showComparisonStatus("comparisonConfirmStatus", "");
    openDialog(comparisonConfirmDialog);
  }

  function confirmComparisonDelete() {
    var pending = state.pendingComparisonDelete;
    if (!pending) return;
    var scrollTop = historyDialog.scrollTop;
    var saved;
    if (pending.kind === "comparison") {
      saved = persistComparisons(state.comparisons.filter(function (entry) { return entry.id !== pending.id; }));
    } else {
      saved = saveComparisonChange(pending.comparisonId, function (entry) {
        return { events: entry.events.filter(function (event) { return event.id !== pending.id; }) };
      });
    }
    if (!saved) {
      showComparisonStatus("comparisonConfirmStatus", "删除失败，请检查本机浏览器存储空间或记录格式。");
      return;
    }
    state.pendingComparisonDelete = null;
    closeDialog(comparisonConfirmDialog);
    if (pending.kind === "comparison") renderComparisonList();
    else renderComparisonDetail(comparisonById(pending.comparisonId));
    historyDialog.scrollTop = scrollTop;
  }

  function requestBulkClear(kind) {
    if (state.historyView !== "root" ||
      (kind === "history" && (state.historyTab !== "readings" || !state.historyEntries.length)) ||
      (kind === "comparisons" && (state.historyTab !== "comparisons" || !state.comparisons.length))) return;
    var count = kind === "history" ? state.historyEntries.length : state.comparisons.length;
    state.pendingBulkClear = kind;
    document.getElementById("bulkClearTitle").textContent = kind === "history" ?
      "清空全部历史记录？" : "清空全部现实对照？";
    document.getElementById("bulkClearMessage").textContent = kind === "history" ?
      "将永久删除 " + count + " 条占卜记录。现实对照中已经保存的冻结占卜不会受到影响。" :
      "将永久删除 " + count + " 个现实对照，包括其中的现实事件和对照备注。占卜历史不会受到影响。";
    document.getElementById("confirmBulkClear").textContent = kind === "history" ?
      "清空 " + count + " 条记录" : "清空 " + count + " 个现实对照";
    backupStatus(bulkClearStatus, "", false);
    openDialog(bulkClearDialog);
  }

  function confirmBulkClear() {
    var kind = state.pendingBulkClear;
    if (!kind) return;
    var saved = kind === "history" ? persistHistory([]) : persistComparisons([]);
    if (!saved) {
      backupStatus(bulkClearStatus, kind === "history" ?
        historyWriteError("清空失败，请检查本机浏览器的存储空间或权限。") :
        "清空失败，请检查本机浏览器的存储空间或权限。", true);
      return;
    }
    if (kind === "history") {
      if (state.savedHistoryId) {
        readingSaveFeedback.hidden = true;
        readingSaveStatus.textContent = "本次占卜的保存记录已删除。";
        readingSaveStatus.hidden = false;
      }
      state.historyActiveId = null;
      state.historyTab = "readings";
    } else {
      state.comparisonActiveId = null;
      state.comparisonEditingEventId = null;
      state.historyTab = "comparisons";
    }
    state.pendingBulkClear = null;
    closeDialog(bulkClearDialog);
    setHistoryView("root");
    if (kind === "history") renderHistoryList();
    else renderComparisonList();
  }

  function renderReadingCards(host, spread, selectedCards, historyOnly) {
    var fragment = document.createDocumentFragment();
    selectedCards.forEach(function (selection, order) {
      fragment.appendChild(makeRevealedCard(selection.card, spread.positions[order], order, spread, historyOnly));
    });
    if (spread.layout === "celtic-cross") fragment.appendChild(makeCelticCenterDetails(spread, selectedCards));
    if (spread.layout === "spatial") {
      var stage = document.createElement("div");
      stage.className = "spatial-stage";
      stage.appendChild(fragment);
      host.replaceChildren(stage);
      host.hidden = false;
      layoutSpatialCards(stage, spread.positions, "result");
    } else {
      host.replaceChildren(fragment);
      host.hidden = false;
    }
  }

  function revealCompletedReading() {
    var requiredCount = state.currentSpread.cardCount;
    if (!state.lockedDeck || state.selectedCards.length !== requiredCount) return;
    state.revealTimer = null;
    closeMeaningPanel(false);

    renderReadingCards(revealedSpread, state.currentSpread, state.selectedCards, false);
    resetCopyFeedback();
    readingExport.hidden = false;
    resetCurrentSaveState();
    readingSave.hidden = false;
    selectionPanel.classList.add("is-revealed");
    updateCompactSelectionGuide();
    currentPositionEyebrow.textContent = "占卜完成";
    document.getElementById("selectionTitle").textContent = "你的牌阵已揭晓";
    progressLabel.hidden = true;
    positionMap.hidden = true;
    deckCompleteSummary.textContent = "抽牌完成 · 已从 78 张牌中选择 " + requiredCount + " 张";
    deckCompleteSummary.hidden = false;
    deckSelection.classList.add("is-collapsed");

    state.scrollTimer = window.setTimeout(function () {
      state.scrollTimer = null;
      scrollResultRegionIntoView();
    }, 420);
  }

  function selectCard(card, index, button) {
    var requiredCount = state.currentSpread.cardCount;
    if (!state.lockedDeck || state.selectedIndexes.has(index) || state.selectedCards.length >= requiredCount) return;
    var order = state.selectedCards.length;
    state.selectedIndexes.add(index);
    state.selectedCards.push({ deckIndex: index, card: card });
    button.classList.add("is-picked");
    button.disabled = true;
    button.setAttribute("aria-label", "已选择，第 " + (order + 1) + " 张");
    button.querySelector(".card-picked b").textContent = String(order + 1);
    updateProgress();
    if (state.selectedCards.length === requiredCount) {
      deckGrid.classList.add("reading-complete");
      deckGrid.querySelectorAll("button:not(.is-picked)").forEach(function (item) { item.disabled = true; });
      state.revealTimer = window.setTimeout(revealCompletedReading, 360);
    }
  }

  function updateProgress() {
    var chosen = state.selectedCards.length;
    updateSelectionGuide();
    cardsRemaining.textContent = (78 - chosen) + " 张牌";
  }

  function beginReading() {
    state.currentSpread = getSelectedSpread();
    resetCopyFeedback();
    resetCurrentSaveState();
    readingExport.hidden = true;
    readingSave.hidden = true;
    shuffleButton.disabled = true;
    shuffleButton.classList.add("is-shuffling");
    shuffleButton.querySelector("span:last-child").textContent = "正在洗牌…";
    window.setTimeout(function () {
      state.selectedIndexes = new Set();
      state.selectedCards = [];
      state.lockedDeck = window.TarotRNG.shuffleAndOrient(window.TAROT_CARDS);
      revealedSpread.dataset.spreadId = state.currentSpread.id;
      revealedSpread.dataset.layout = state.currentSpread.layout;
      revealedSpread.dataset.cardCount = String(state.currentSpread.cardCount);
      revealedSpread.removeAttribute("data-spatial-fitted");
      revealedSpread.removeAttribute("data-spatial-center");
      revealedSpread.className = "revealed-spread layout-" + state.currentSpread.layout;
      revealedSpread.hidden = true;
      if (state.currentSpread.layout === "spatial" && state.currentSpread.cardCount >= 9) revealedSpread.classList.add("spatial-dense");
      revealedSpread.classList.add("inline-meaning-" + getInlineMeaningMode());
      state.readingQuestion = questionInput.value.trim();
      savedQuestion.textContent = state.readingQuestion ? "“" + state.readingQuestion + "”" : state.currentSpread.name;
      savedQuestion.hidden = false;
      stickyQuestion.textContent = state.readingQuestion ? "“" + state.readingQuestion + "”" : "";
      stickyQuestion.hidden = !state.readingQuestion;
      deckSelection.classList.remove("is-collapsed");
      deckCompleteSummary.hidden = true;
      deckCompleteSummary.textContent = "";
      deckViewport.scrollTop = 0;
      renderLockedDeck();
      selectionPanel.classList.remove("is-revealed");
      updateProgress();
      setupPanel.hidden = true;
      selectionPanel.hidden = false;
      newReadingTop.hidden = false;
      updateCompactSelectionGuide();
      selectionPanel.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 520);
  }

  function resetReading() {
    var selectedTemporarySpread = state.temporarySpread && state.spreadId === state.temporarySpread.id;
    window.clearTimeout(state.revealTimer);
    window.clearTimeout(state.scrollTimer);
    state.revealTimer = null;
    state.scrollTimer = null;
    closeMeaningPanel(false);
    state.lockedDeck = null;
    state.selectedIndexes = new Set();
    state.selectedCards = [];
    deckGrid.replaceChildren();
    deckGrid.classList.remove("reading-complete");
    deckSelection.classList.remove("is-collapsed");
    deckCompleteSummary.hidden = true;
    deckCompleteSummary.textContent = "";
    deckViewport.scrollTop = 0;
    revealedSpread.replaceChildren();
    revealedSpread.removeAttribute("data-spread-id");
    revealedSpread.removeAttribute("data-layout");
    revealedSpread.removeAttribute("data-card-count");
    revealedSpread.removeAttribute("data-spatial-fitted");
    revealedSpread.removeAttribute("data-spatial-center");
    revealedSpread.className = "revealed-spread";
    resetCopyFeedback();
    resetCurrentSaveState();
    readingExport.hidden = true;
    readingSave.hidden = true;
    state.readingQuestion = "";
    stickyQuestion.textContent = "";
    stickyQuestion.hidden = true;
    selectionPanel.classList.remove("is-revealed");
    selectionPanel.hidden = true;
    updateCompactSelectionGuide();
    setupPanel.hidden = false;
    newReadingTop.hidden = true;
    shuffleButton.disabled = false;
    shuffleButton.classList.remove("is-shuffling");
    shuffleButton.querySelector("span:last-child").textContent = "洗牌";
    state.temporarySpread = null;
    if (selectedTemporarySpread) {
      state.spreadId = DEFAULT_SPREAD_ID;
      state.currentSpread = window.TAROT_SPREADS[DEFAULT_SPREAD_ID];
    }
    renderSpreadPicker();
    questionInput.focus();
  }

  function pointerToEditorGrid(event) {
    var rect = layoutCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  }

  layoutCanvas.addEventListener("pointerdown", function (event) {
    var slot = event.target.closest(".editor-slot");
    if (!slot) return;
    event.preventDefault();
    editor.selected = Number(slot.dataset.positionIndex);
    editor.drag = {
      pointerId: event.pointerId,
      before: editorSnapshot(),
      triggeredOverlaps: new Set(overlappingEditorIndexes(editor.selected))
    };
    layoutCanvas.setPointerCapture(event.pointerId);
    renderEditorCanvas();
  });
  layoutCanvas.addEventListener("pointermove", function (event) {
    if (!editor.drag || editor.drag.pointerId !== event.pointerId) return;
    var point = pointerToEditorGrid(event);
    var layout = editor.positions[editor.selected].layout;
    snapEditorPosition(layout, point.x, point.y);
    var newOverlaps = overlappingEditorIndexes(editor.selected).filter(function (otherIndex) {
      return !editor.drag.triggeredOverlaps.has(otherIndex);
    });
    newOverlaps.forEach(function (otherIndex) { editor.drag.triggeredOverlaps.add(otherIndex); });
    if (raiseAboveNewEditorOverlaps(editor.selected, newOverlaps)) {
      layoutCanvas.querySelectorAll(".editor-slot").forEach(function (visibleSlot) {
        visibleSlot.style.zIndex = String(editor.positions[Number(visibleSlot.dataset.positionIndex)].layout.z);
      });
    }
    var slot = layoutCanvas.querySelector('[data-position-index="' + editor.selected + '"]');
    if (slot) {
      slot.style.left = (layout.x * 100) + "%";
      slot.style.top = (layout.y * 100) + "%";
    }
  });
  function finishEditorDrag(event) {
    if (!editor.drag || editor.drag.pointerId !== event.pointerId) return;
    var before = editor.drag.before;
    editor.drag = null;
    var layout = editor.positions[editor.selected].layout;
    if (layout.x !== before.layouts[editor.selected].x || layout.y !== before.layouts[editor.selected].y) {
      editor.positions[editor.selected].manual = true;
    }
    if (layout.x !== before.layouts[editor.selected].x || layout.y !== before.layouts[editor.selected].y ||
        editor.positions.some(function (position, index) { return position.layout.z !== before.layouts[index].z; })) {
      editor.layoutMode = "custom";
    }
    if (layoutCanvas.hasPointerCapture(event.pointerId)) layoutCanvas.releasePointerCapture(event.pointerId);
    renderEditorCanvas();
    rememberEditorChange(before);
  }
  layoutCanvas.addEventListener("pointerup", finishEditorDrag);
  layoutCanvas.addEventListener("pointercancel", finishEditorDrag);
  layoutCanvas.addEventListener("keydown", function (event) {
    var slot = event.target.closest(".editor-slot");
    if (!slot) return;
    editor.selected = Number(slot.dataset.positionIndex);
    var movement = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key];
    if (!movement) return;
    event.preventDefault();
    moveEditorPosition(movement[0], movement[1]);
    var replacement = layoutCanvas.querySelector('[data-position-index="' + editor.selected + '"]');
    if (replacement) replacement.focus();
  });
  document.querySelectorAll(".nudge-controls [data-move]").forEach(function (button) {
    button.addEventListener("click", function () {
      var movement = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[button.dataset.move];
      moveEditorPosition(movement[0], movement[1]);
    });
  });
  rotatePositionButton.addEventListener("click", rotateEditorPosition);
  raisePositionButton.addEventListener("click", function () { moveEditorLayer(1); });
  lowerPositionButton.addEventListener("click", function () { moveEditorLayer(-1); });
  labelPlacementSelect.addEventListener("change", function () {
    var before = editorSnapshot();
    editor.positions[editor.selected].layout.labelPlacement = labelPlacementSelect.value;
    renderEditorCanvas();
    rememberEditorChange(before);
  });
  document.getElementById("autoArrangeLayout").addEventListener("click", autoArrangeEditor);
  document.getElementById("resetLayout").addEventListener("click", resetEditorLayout);
  undoLayoutButton.addEventListener("click", function () {
    if (!editor.undo.length) return;
    editor.redo.push(editorSnapshot());
    restoreEditorSnapshot(editor.undo.pop());
  });
  redoLayoutButton.addEventListener("click", function () {
    if (!editor.redo.length) return;
    editor.undo.push(editorSnapshot());
    restoreEditorSnapshot(editor.redo.pop());
  });
  previewToggleButton.addEventListener("click", function () { setEditorPreview(!editor.preview); });

  document.getElementById("decreaseCardCount").addEventListener("click", function () { setEditorCardCount(Number(customCardCount.value) - 1); });
  document.getElementById("increaseCardCount").addEventListener("click", function () { setEditorCardCount(Number(customCardCount.value) + 1); });
  customCardCount.addEventListener("input", function () {
    if (customCardCount.value !== "") setEditorCardCount(customCardCount.value);
  });
  customCardCount.addEventListener("change", function () { setEditorCardCount(customCardCount.value); });
  document.getElementById("closeCustomEditor").addEventListener("click", function () { closeDialog(customSpreadDialog); });
  document.getElementById("useTemporarySpread").addEventListener("click", useTemporaryCustomSpread);
  document.getElementById("saveCustomSpread").addEventListener("click", saveCustomSpread);
  document.getElementById("cancelDeleteSpread").addEventListener("click", function () { state.pendingDeleteId = null; closeDialog(deleteSpreadDialog); });
  document.getElementById("confirmDeleteSpread").addEventListener("click", deletePendingSpread);
  document.getElementById("customSpreadForm").addEventListener("submit", function (event) { event.preventDefault(); });
  shuffleButton.addEventListener("click", beginReading);
  copyReadingInfoButton.addEventListener("click", function () { copyReading(copyReadingInfoButton, formatReadingInfo); });
  copyReadingPromptButton.addEventListener("click", function () { copyReading(copyReadingPromptButton, formatReadingPrompt); });
  toggleExportPreview.addEventListener("click", function () {
    if (!state.lastCopiedExport) return;
    state.copyPreviewOpen = !state.copyPreviewOpen;
    renderCopiedExport();
  });
  saveReadingButton.addEventListener("click", saveCurrentReading);
  viewSavedReadingButton.addEventListener("click", function () { openHistoryEntry(state.savedHistoryId); });
  addSavedToComparisonButton.addEventListener("click", function () { openQuickComparison(state.savedHistoryId); });
  openHistoryButton.addEventListener("click", openHistory);
  openComparisonsButton.addEventListener("click", openComparisons);
  document.getElementById("addHistoryToComparison").addEventListener("click", function () {
    openQuickComparison(state.historyActiveId);
  });
  document.getElementById("closeQuickComparison").addEventListener("click", function () { closeDialog(quickComparisonDialog); });
  document.getElementById("quickNewComparison").addEventListener("click", function () {
    document.getElementById("quickComparisonCreate").hidden = false;
    document.getElementById("quickComparisonName").focus();
  });
  document.getElementById("quickCreateComparison").addEventListener("click", quickCreateComparison);
  quickComparisonDialog.addEventListener("close", function () { state.quickComparisonHistoryId = null; });
  document.getElementById("closeHistory").addEventListener("click", function () { closeDialog(historyDialog); });
  document.getElementById("historyBack").addEventListener("click", historyBackAction);
  historyReadingsTab.addEventListener("click", function () { showHistoryTab("readings"); });
  historyComparisonsTab.addEventListener("click", function () { showHistoryTab("comparisons"); });
  document.getElementById("newComparison").addEventListener("click", openComparisonCreate);
  document.getElementById("createComparison").addEventListener("click", createComparison);
  document.getElementById("manageComparisonLinks").addEventListener("click", openComparisonLinks);
  document.getElementById("addComparisonLinks").addEventListener("click", addComparisonLinks);
  document.getElementById("addComparisonEvent").addEventListener("click", function () { openComparisonEventForm(null); });
  document.getElementById("saveComparisonEvent").addEventListener("click", saveComparisonEvent);
  document.getElementById("cancelComparisonEvent").addEventListener("click", function () {
    comparisonEventForm.hidden = true;
    state.comparisonEditingEventId = null;
  });
  document.getElementById("saveComparisonNote").addEventListener("click", saveComparisonNote);
  document.getElementById("comparisonNote").addEventListener("input", function () {
    document.getElementById("saveComparisonNote").textContent = "保存备注";
    showComparisonStatus("comparisonDetailStatus", "");
  });
  document.getElementById("cancelComparisonDelete").addEventListener("click", function () {
    state.pendingComparisonDelete = null;
    closeDialog(comparisonConfirmDialog);
  });
  document.getElementById("confirmComparisonDelete").addEventListener("click", confirmComparisonDelete);
  comparisonConfirmDialog.addEventListener("close", function () { state.pendingComparisonDelete = null; });
  document.getElementById("clearHistory").addEventListener("click", function () { requestBulkClear("history"); });
  document.getElementById("clearComparisons").addEventListener("click", function () { requestBulkClear("comparisons"); });
  document.getElementById("bulkClearBackup").addEventListener("click", function () { exportLocalBackup(bulkClearStatus); });
  document.getElementById("cancelBulkClear").addEventListener("click", function () { closeDialog(bulkClearDialog); });
  document.getElementById("confirmBulkClear").addEventListener("click", confirmBulkClear);
  bulkClearDialog.addEventListener("close", function () { state.pendingBulkClear = null; });
  document.getElementById("historyCopyInfo").addEventListener("click", function () { copyHistoryExport("readingInfo"); });
  document.getElementById("historyCopyPrompt").addEventListener("click", function () { copyHistoryExport("prompt"); });
  document.getElementById("saveHistoryNote").addEventListener("click", saveHistoryNote);
  historyNote.addEventListener("input", function () {
    document.getElementById("saveHistoryNote").textContent = "保存备注";
    historyDetailStatus.textContent = "";
    historyDetailStatus.hidden = true;
  });
  document.getElementById("deleteHistoryEntry").addEventListener("click", function () {
    openDeleteHistoryConfirmation(state.historyActiveId);
  });
  document.getElementById("cancelDeleteHistory").addEventListener("click", function () {
    state.pendingDeleteHistoryId = null;
    closeDialog(deleteHistoryDialog);
  });
  document.getElementById("confirmDeleteHistory").addEventListener("click", deleteHistoryEntry);
  deleteHistoryDialog.addEventListener("close", function () { state.pendingDeleteHistoryId = null; });
  document.getElementById("exportLocalBackup").addEventListener("click", function () { exportLocalBackup(); });
  document.getElementById("chooseRestoreBackup").addEventListener("click", function () {
    restoreBackupFile.click();
  });
  restoreBackupFile.addEventListener("change", selectRestoreBackup);
  document.getElementById("cancelRestoreBackup").addEventListener("click", function () {
    closeDialog(restoreBackupDialog);
  });
  document.getElementById("confirmRestoreBackup").addEventListener("click", confirmRestoreBackup);
  restoreBackupDialog.addEventListener("close", function () { state.pendingRestore = null; });
  newReadingButton.addEventListener("click", resetReading);
  newReadingTop.addEventListener("click", resetReading);
  closeMeaningButton.addEventListener("click", function () { closeMeaningPanel(true); });
  meaningBackdrop.addEventListener("click", function () { closeMeaningPanel(true); });
  document.addEventListener("click", function (event) {
    if (meaningPanel.hidden || meaningPanel.contains(event.target) || event.target.closest(".revealed-card")) return;
    closeMeaningPanel(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !meaningPanel.hidden) closeMeaningPanel(true);
  });
  window.addEventListener("resize", function () {
    updateCompactSelectionGuide(true);
    if (editor.preview && customSpreadDialog.open) renderEditorPreview();
    if (state.currentSpread.layout === "spatial" && !revealedSpread.hidden) {
      var stage = revealedSpread.querySelector(".spatial-stage");
      if (stage) layoutSpatialCards(stage, state.currentSpread.positions, "result");
    }
    var historyEntry = historyEntryById(state.historyActiveId);
    if (historyDialog.open && historyEntry && historyEntry.spread.layout === "spatial") {
      var historyStage = historySpread.querySelector(".spatial-stage");
      if (historyStage) layoutSpatialCards(historyStage, historyEntry.spread.positions, "result");
    }
    if (!currentLayoutUsesMeaningPanel()) closeMeaningPanel(false);
    updateCardMeaningInteractions();
    if (meaningPanel.hidden || !state.meaningTrigger) return;
    meaningBackdrop.hidden = !usesMeaningSheet();
    positionMeaningPanel(state.meaningTrigger);
  });
  window.addEventListener("scroll", function () { updateCompactSelectionGuide(); }, { passive: true });

  state.savedSpreads = loadSavedSpreads();
  state.historyEntries = loadHistory();
  state.comparisons = loadComparisons();
  renderSpreadPicker();
}());

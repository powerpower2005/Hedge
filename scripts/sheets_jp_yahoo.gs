/**
 * Japan prices for PriceLookup-jp-v1 (Yahoo chart API via UrlFetchApp).
 *
 * Columns: D = previousClose, E = longName (fallback shortName), F = session date.
 * Do NOT use =yahooF() in cells — UrlFetchApp is not allowed in custom functions (#ERROR!).
 *
 * Setup: paste into Apps Script → authorize URLs. GitHub register_pick also refreshes
 * each new row once (D/E/F). Use refreshAllJpPrices / hourly trigger to update all JP rows daily.
 */

var JP_TAB = 'PriceLookup-jp-v1';

/**
 * One chart request per row: close + instrument name from meta.
 * @return {{ok: boolean, price?: number, name?: string, error?: string}}
 */
function yahooFetchQuote_(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return { ok: false, error: '종목코드 입력 오류' };
  }
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker);
  try {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      },
    });
    var data = JSON.parse(res.getContentText());
    if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
      return { ok: false, error: '데이터 없음 (API 변경)' };
    }
    var meta = data.chart.result[0].meta;
    var price;
    if (meta.previousClose !== undefined && meta.previousClose !== null) {
      price = meta.previousClose;
    } else if (meta.chartPreviousClose !== undefined) {
      price = meta.chartPreviousClose;
    } else {
      return { ok: false, error: '전일 종가 없음' };
    }
    if (typeof price !== 'number' || isNaN(price)) {
      return { ok: false, error: '전일 종가 없음' };
    }
    var name = '';
    if (meta.longName) {
      name = String(meta.longName);
    } else if (meta.shortName) {
      name = String(meta.shortName);
    }
    if (name.length > 280) {
      name = name.substring(0, 280);
    }
    return { ok: true, price: price, name: name };
  } catch (error) {
    return { ok: false, error: '오류: ' + error.toString() };
  }
}

/** Refresh D (close), E (name), F (session date) for one row; B = Yahoo symbol e.g. 7012.T */
function refreshJpRow(row) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JP_TAB);
  if (!sh) throw new Error('Missing tab: ' + JP_TAB);
  var ticker = String(sh.getRange(row, 2).getValue()).trim();
  if (!ticker) return;
  var result = yahooFetchQuote_(ticker);
  if (result.ok) {
    sh.getRange(row, 4).setValue(result.price);
    if (result.name) {
      sh.getRange(row, 5).setValue(result.name);
    }
    var tz = Session.getScriptTimeZone() || 'Asia/Tokyo';
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    sh.getRange(row, 6).setValue(Utilities.formatDate(yesterday, tz, 'yyyy-MM-dd'));
  } else {
    sh.getRange(row, 4).setValue(result.error);
  }
}

/** Refresh all data rows (row 2 .. last). */
function refreshAllJpPrices() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JP_TAB);
  if (!sh) throw new Error('Missing tab: ' + JP_TAB);
  var last = sh.getLastRow();
  for (var r = 2; r <= last; r++) {
    refreshJpRow(r);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('JP prices')
    .addItem('Refresh all (PriceLookup-jp-v1)', 'refreshAllJpPrices')
    .addToUi();
}

/** Run once from the script editor to refresh every hour. */
function installJpPriceTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshAllJpPrices') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshAllJpPrices').timeBased().everyHours(1).create();
}

/**
 * Japan prices for PriceLookup-jp-v1 (Yahoo chart API via UrlFetchApp).
 *
 * IMPORTANT: Do NOT use yahooF as a =CELL() custom function — Google Sheets custom
 * functions cannot call UrlFetchApp (you get #ERROR!). Use refreshJpRow / refreshAllJpPrices
 * (menu or time-driven trigger) to write numeric closes into column D.
 *
 * Setup:
 * 1. Extensions → Apps Script → paste this file (merge with existing project).
 * 2. Run refreshAllJpPrices once → authorize external URL access.
 * 3. Optional: run installJpPriceTrigger() once for hourly refresh, or add menu only.
 */

var JP_TAB = 'PriceLookup-jp-v1';

function yahooFetchClose_(ticker, attribute) {
  attribute = attribute || 'previousClose';
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
    if (meta.hasOwnProperty(attribute) && meta[attribute] !== undefined) {
      price = meta[attribute];
    } else if (meta.chartPreviousClose !== undefined) {
      price = meta.chartPreviousClose;
    } else {
      return { ok: false, error: '전일 종가 없음' };
    }
    if (typeof price !== 'number' || isNaN(price)) {
      return { ok: false, error: '전일 종가 없음' };
    }
    return { ok: true, price: price };
  } catch (error) {
    return { ok: false, error: '오류: ' + error.toString() };
  }
}

/** Refresh column D (close) for one row; B = Yahoo symbol e.g. 7203.T */
function refreshJpRow(row) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JP_TAB);
  if (!sh) throw new Error('Missing tab: ' + JP_TAB);
  var ticker = String(sh.getRange(row, 2).getValue()).trim();
  if (!ticker) return;
  var result = yahooFetchClose_(ticker, 'previousClose');
  if (result.ok) {
    sh.getRange(row, 4).setValue(result.price);
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

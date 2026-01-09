/**
 * Utilities.gs
 * ヘルパー関数・ユーティリティ関数集
 *
 * 機能:
 * - 日付フォーマット
 * - 配列操作
 * - リトライ処理
 * - エラーログ
 * - メール通知
 */

// ============================================
// 日付・時刻ユーティリティ
// ============================================

/**
 * 日付を指定形式でフォーマット
 * @param {Date} date - フォーマットする日付
 * @param {string} format - フォーマット文字列（'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss'等）
 * @return {string} フォーマットされた日付文字列
 */
function formatDate(date, format) {
  if (!date) {
    return '';
  }

  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  return Utilities.formatDate(date, DEFAULTS.TIMEZONE, format);
}

/**
 * N日前の日付を取得
 * @param {number} days - 日数
 * @param {Date} baseDate - 基準日（省略時は今日）
 * @return {Date} N日前の日付
 */
function getDaysAgo(days, baseDate) {
  const date = baseDate || new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * 月初日を取得
 * @param {Date} date - 基準日
 * @return {Date} 月初日
 */
function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月末日を取得
 * @param {Date} date - 基準日
 * @return {Date} 月末日
 */
function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// ============================================
// 配列操作
// ============================================

/**
 * 配列を指定サイズのチャンクに分割
 * APIのバッチ処理で使用
 * @param {Array} array - 分割する配列
 * @param {number} size - チャンクサイズ
 * @return {Array<Array>} チャンク化された配列
 */
function chunkArray(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

/**
 * 配列から重複を削除
 * @param {Array} array - 元の配列
 * @return {Array} 重複削除後の配列
 */
function uniqueArray(array) {
  return array.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

// ============================================
// エラーハンドリング・リトライ
// ============================================

/**
 * 指数バックオフ付きリトライ処理
 * API呼び出しのレート制限対策
 * @param {Function} func - 実行する関数
 * @param {number} maxRetries - 最大リトライ回数（省略時は3回）
 * @return {*} 関数の戻り値
 */
function exponentialBackoff(func, maxRetries) {
  maxRetries = maxRetries || YOUTUBE_API.MAX_RETRIES;
  let retries = 0;
  let delay = YOUTUBE_API.INITIAL_BACKOFF_MS;

  while (retries < maxRetries) {
    try {
      return func();
    } catch (error) {
      retries++;

      if (retries >= maxRetries) {
        throw error;
      }

      // エラーメッセージから判定
      const errorMessage = error.message || error.toString();

      // レート制限エラーの場合のみリトライ
      if (errorMessage.indexOf('rate') > -1 ||
        errorMessage.indexOf('quota') > -1 ||
        errorMessage.indexOf('429') > -1 ||
        errorMessage.indexOf('503') > -1) {

        Logger.log('リトライ ' + retries + '/' + maxRetries + ' (' + delay + 'ms待機)');
        Utilities.sleep(delay);
        delay *= 2; // 指数バックオフ
      } else {
        // その他のエラーはリトライしない
        throw error;
      }
    }
  }
}

/**
 * エラーをLOGシートに記録
 * @param {string} functionName - エラーが発生した関数名
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 */
function logError(functionName, error) {
  try {
    const errorMessage = error.message || error.toString();
    const stackTrace = error.stack || '';

    Logger.log('❌ エラー [' + functionName + ']: ' + errorMessage);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(SHEETS.LOG);

    // LOGシートが存在しない場合は作成
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEETS.LOG);
      logSheet.getRange('A1:D1').setValues([['timestamp', 'function', 'error_message', 'stack_trace']]);
      logSheet.getRange('A1:D1').setFontWeight('bold');
      logSheet.hideSheet(); // デフォルトで非表示
    }

    // エラーを追記
    logSheet.appendRow([
      new Date(),
      functionName,
      errorMessage,
      stackTrace
    ]);

  } catch (logError) {
    // ログ記録自体がエラーになった場合はconsoleのみ
    Logger.log('ログ記録エラー: ' + logError.message);
  }
}

/**
 * エラー通知メールを送信
 * 重大なエラー時に管理者に通知
 * @param {string} subject - メール件名
 * @param {string} body - メール本文
 */
function sendEmailAlert(subject, body) {
  try {
    const email = Session.getActiveUser().getEmail();

    if (!email) {
      Logger.log('メール送信スキップ: ユーザーメールアドレスが取得できません');
      return;
    }

    MailApp.sendEmail({
      to: email,
      subject: '[Shorts Analytics Pro] ' + subject,
      body: body + '\n\n---\n送信日時: ' + new Date().toString() + '\nスプレッドシート: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });

    Logger.log('エラー通知メールを送信しました: ' + email);

  } catch (error) {
    Logger.log('メール送信エラー: ' + error.message);
  }
}

// ============================================
// データ変換
// ============================================

/**
 * 2次元配列をオブジェクト配列に変換
 * @param {Array<Array>} data - 2次元配列（1行目がヘッダー）
 * @return {Array<Object>} オブジェクト配列
 */
function arrayToObjects(data) {
  if (!data || data.length < 2) {
    return [];
  }

  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    objects.push(obj);
  }

  return objects;
}

/**
 * オブジェクト配列を2次元配列に変換
 * @param {Array<Object>} objects - オブジェクト配列
 * @param {Array<string>} headers - ヘッダー配列（省略時は最初のオブジェクトのキーを使用）
 * @return {Array<Array>} 2次元配列（1行目がヘッダー）
 */
function objectsToArray(objects, headers) {
  if (!objects || objects.length === 0) {
    return [];
  }

  // ヘッダーが指定されていない場合は最初のオブジェクトから取得
  if (!headers) {
    headers = Object.keys(objects[0]);
  }

  const data = [headers];

  objects.forEach(function(obj) {
    const row = [];
    headers.forEach(function(header) {
      row.push(obj[header] !== undefined ? obj[header] : '');
    });
    data.push(row);
  });

  return data;
}

// ============================================
// 進捗表示・デバッグ
// ============================================

/**
 * 進捗をログ出力
 * @param {string} message - メッセージ
 * @param {number} current - 現在の進捗
 * @param {number} total - 全体数
 */
function logProgress(message, current, total) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  Logger.log('[' + percentage + '%] ' + message + ' (' + current + '/' + total + ')');
}

/**
 * 処理時間を計測
 * @param {Function} func - 計測する関数
 * @param {string} label - ラベル
 * @return {*} 関数の戻り値
 */
function measureTime(func, label) {
  const startTime = new Date().getTime();

  const result = func();

  const endTime = new Date().getTime();
  const elapsed = ((endTime - startTime) / 1000).toFixed(2);

  Logger.log('⏱️ ' + label + ': ' + elapsed + '秒');

  return result;
}

// ============================================
// バリデーション
// ============================================

/**
 * 日付の妥当性チェック
 * @param {Date} date - チェックする日付
 * @return {boolean} 有効な日付の場合true
 */
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * YouTub動画IDの形式チェック
 * @param {string} videoId - 動画ID
 * @return {boolean} 有効な形式の場合true
 */
function isValidVideoId(videoId) {
  // YouTube動画IDは11文字の英数字とハイフン・アンダースコア
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * 空文字列・null・undefinedのチェック
 * @param {*} value - チェックする値
 * @return {boolean} 空の場合true
 */
function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

// ============================================
// スプレッドシートユーティリティ
// ============================================

/**
 * シート名が存在するかチェック
 * @param {string} sheetName - シート名
 * @return {boolean} 存在する場合true
 */
function sheetExists(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName) !== null;
}

/**
 * シートのデータをクリア（ヘッダー行は保持）
 * @param {string} sheetName - シート名
 */
function clearSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

/**
 * シート全体をクリア
 * @param {string} sheetName - シート名
 */
function clearSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return;
  }

  sheet.clear();
}

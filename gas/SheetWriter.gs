/**
 * SheetWriter.gs
 * スプレッドシートへのデータ書き込み処理
 *
 * 機能:
 * - シート構造の作成
 * - データの書き込み・追記
 * - フォーマット設定
 */

// ============================================
// シート構造作成
// ============================================

/**
 * 全シートの構造を作成
 * 初回セットアップ時に実行
 */
function createSheetStructure() {
  Logger.log('シート構造を作成中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 各シートを作成
  createConfigSheet(ss);
  createRawVideoDataSheet(ss);
  createRawDailyMetricsSheet(ss);
  createVideoMasterSheet(ss);
  createDailySummarySheet(ss);
  createMonthlyKPISheet(ss);
  createVideoTagsSheet(ss);
  createLogSheet(ss);

  Logger.log('✅ シート構造の作成完了');
}

/**
 * CONFIGシート作成
 */
function createConfigSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.CONFIG);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CONFIG);
  }

  // ヘッダー設定
  sheet.getRange('A1:B1').setValues([['key', 'value']]);
  sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');

  // 列幅調整
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 300);

  Logger.log('✓ CONFIGシート作成');
}

/**
 * RAW_VIDEO_DATAシート作成
 */
function createRawVideoDataSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.RAW_VIDEO);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.RAW_VIDEO);
  }

  // ヘッダー設定
  const headers = [[
    'video_id',
    'title',
    'published_at',
    'duration_seconds',
    'thumbnail_url',
    'views',
    'watch_time_minutes',
    'avg_view_duration',
    'avg_view_percentage',
    'subscribers_gained',
    'likes',
    'comments',
    'shares',
    'playlists_added',
    'playlists_removed',
    'impressions',
    'ctr',
    'fetched_at'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  sheet.setFrozenRows(1);

  // 列幅調整
  sheet.setColumnWidth(1, 120); // video_id
  sheet.setColumnWidth(2, 250); // title
  sheet.setColumnWidth(3, 150); // published_at

  Logger.log('✓ RAW_VIDEO_DATAシート作成');
}

/**
 * RAW_DAILY_METRICSシート作成
 */
function createRawDailyMetricsSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.RAW_DAILY);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.RAW_DAILY);
  }

  // ヘッダー設定
  const headers = [[
    'date',
    'views',
    'watch_time_minutes',
    'subscribers_gained',
    'subscribers_lost',
    'estimated_revenue',
    'fetched_at'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  sheet.setFrozenRows(1);

  Logger.log('✓ RAW_DAILY_METRICSシート作成');
}

/**
 * VIDEO_MASTERシート作成
 * 数式を含む加工済みデータシート
 */
function createVideoMasterSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.VIDEO_MASTER);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.VIDEO_MASTER);
  }

  // ヘッダー設定
  const headers = [[
    'video_id',
    'title',
    'published_at',
    'published_date',
    'published_weekday',
    'published_hour',
    'duration_seconds',
    'duration_bucket',
    'thumbnail_url',
    'views',
    'avg_view_percentage',
    'subscribers_gained',
    'likes',
    'comments',
    'shares',
    'impressions',
    'ctr',
    'watch_time_minutes',
    'tag_category'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
  sheet.setFrozenRows(1);

  Logger.log('✓ VIDEO_MASTERシート作成');
}

/**
 * DAILY_SUMMARYシート作成
 */
function createDailySummarySheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.DAILY_SUMMARY);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.DAILY_SUMMARY);
  }

  // ヘッダー設定
  const headers = [[
    'date',
    'views',
    'watch_time_minutes',
    'subscribers_gained',
    'subscribers_lost',
    'subscribers_net',
    'estimated_revenue',
    'views_7day_avg'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
  sheet.setFrozenRows(1);

  Logger.log('✓ DAILY_SUMMARYシート作成');
}

/**
 * MONTHLY_KPIシート作成
 */
function createMonthlyKPISheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.MONTHLY_KPI);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.MONTHLY_KPI);
  }

  // ヘッダー設定
  const headers = [[
    'month',
    'videos_published',
    'total_views',
    'total_watch_time',
    'subscribers_gained',
    'avg_retention',
    'avg_impressions',
    'total_revenue',
    'prev_month_views',
    'mom_views_change',
    'mom_views_change_pct'
  ]];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
  sheet.setFrozenRows(1);

  Logger.log('✓ MONTHLY_KPIシート作成');
}

/**
 * VIDEO_TAGSシート作成（ユーザー入力用）
 */
function createVideoTagsSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.VIDEO_TAGS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.VIDEO_TAGS);
  }

  // ヘッダー設定
  const headers = [['video_id', 'tag_category', 'notes']];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  sheet.setFrozenRows(1);

  // 説明を追加
  sheet.getRange('E1').setValue('【使い方】このシートで動画にタグを付けてください');
  sheet.getRange('E2').setValue('1. video_idカラムには、RAW_VIDEO_DATAから動画IDをコピー');
  sheet.getRange('E3').setValue('2. tag_categoryに分類名を入力（例: ダンス、解説、裏話）');
  sheet.getRange('E4').setValue('3. notes（任意）に気付きメモを記入');

  Logger.log('✓ VIDEO_TAGSシート作成');
}

/**
 * LOGシート作成（非表示）
 */
function createLogSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.LOG);

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.LOG);
  }

  // ヘッダー設定
  const headers = [['timestamp', 'function', 'error_message', 'stack_trace']];

  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setFontWeight('bold').setBackground('#666666').setFontColor('white');
  sheet.setFrozenRows(1);

  // シートを非表示
  sheet.hideSheet();

  Logger.log('✓ LOGシート作成');
}

// ============================================
// データ書き込み
// ============================================

/**
 * シートにデータを書き込み（既存データをクリア）
 * @param {string} sheetName - シート名
 * @param {Array<Array>} data - 2次元配列データ（ヘッダー含む）
 */
function writeToSheet(sheetName, data) {
  if (!data || data.length === 0) {
    Logger.log('書き込むデータがありません: ' + sheetName);
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('シートが見つかりません: ' + sheetName);
    }

    // データ部分をクリア（ヘッダーは保持）
    clearSheetData(sheetName);

    // データを書き込み（2行目から）
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
      Logger.log('✓ ' + sheetName + ' に ' + data.length + ' 行書き込み');
    }

  } catch (error) {
    logError('writeToSheet', error);
    throw error;
  }
}

/**
 * シートにデータを追記（既存データを保持）
 * @param {string} sheetName - シート名
 * @param {Array<Array>} data - 2次元配列データ
 */
function appendToSheet(sheetName, data) {
  if (!data || data.length === 0) {
    Logger.log('追記するデータがありません: ' + sheetName);
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('シートが見つかりません: ' + sheetName);
    }

    // 追記
    data.forEach(function(row) {
      sheet.appendRow(row);
    });

    Logger.log('✓ ' + sheetName + ' に ' + data.length + ' 行追記');

  } catch (error) {
    logError('appendToSheet', error);
    throw error;
  }
}

/**
 * RAW_VIDEO_DATAシートにデータを書き込み
 * @param {Array<Object>} videoDetails - 動画詳細オブジェクト配列
 * @param {Object} analyticsData - 動画IDをキーとした分析データ
 */
function writeVideoData(videoDetails, analyticsData) {
  const data = [];
  const fetchedAt = new Date();

  videoDetails.forEach(function(video) {
    const analytics = analyticsData[video.videoId] || {};

    data.push([
      video.videoId,
      video.title,
      video.publishedAt,
      video.durationSeconds,
      video.thumbnailUrl,
      analytics.views || 0,
      analytics.estimatedMinutesWatched || 0,
      analytics.averageViewDuration || 0,
      analytics.averageViewPercentage || 0,
      analytics.subscribersGained || 0,
      analytics.likes || 0,
      analytics.comments || 0,
      analytics.shares || 0,
      analytics.videosAddedToPlaylists || 0,
      analytics.videosRemovedFromPlaylists || 0,
      analytics.impressions || 0,
      analytics.ctr || 0,
      fetchedAt
    ]);
  });

  writeToSheet(SHEETS.RAW_VIDEO, data);
}

/**
 * RAW_DAILY_METRICSシートにデータを書き込み
 * @param {Array<Object>} dailyMetrics - 日次指標オブジェクト配列
 */
function writeDailyMetrics(dailyMetrics) {
  const data = [];
  const fetchedAt = new Date();

  dailyMetrics.forEach(function(metric) {
    data.push([
      metric.date,
      metric.views,
      metric.estimatedMinutesWatched,
      metric.subscribersGained,
      metric.subscribersLost,
      metric.estimatedRevenue || 0,
      fetchedAt
    ]);
  });

  writeToSheet(SHEETS.RAW_DAILY, data);
}

// ============================================
// 加工シート更新
// ============================================

/**
 * VIDEO_MASTERシートを更新（数式設定）
 */
function updateVideoMasterSheet() {
  Logger.log('VIDEO_MASTERシートを更新中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName(SHEETS.RAW_VIDEO);
  const masterSheet = ss.getSheetByName(SHEETS.VIDEO_MASTER);
  const tagsSheet = ss.getSheetByName(SHEETS.VIDEO_TAGS);

  if (!rawSheet || !masterSheet) {
    throw new Error('必要なシートが見つかりません');
  }

  // RAW_VIDEO_DATAからデータ取得
  const rawData = rawSheet.getDataRange().getValues();

  if (rawData.length <= 1) {
    Logger.log('RAW_VIDEO_DATAにデータがありません');
    return;
  }

  // ヘッダー行をスキップ
  const dataRows = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];

    dataRows.push([
      row[0],  // video_id
      row[1],  // title
      row[2],  // published_at
      '=DATE(YEAR(C' + (i + 1) + '),MONTH(C' + (i + 1) + '),DAY(C' + (i + 1) + '))',  // published_date
      '=WEEKDAY(C' + (i + 1) + ')',  // published_weekday (1=日, 2=月...)
      '=HOUR(C' + (i + 1) + ')',  // published_hour
      row[3],  // duration_seconds
      '=IF(G' + (i + 1) + '<=15,"0-15s",IF(G' + (i + 1) + '<=30,"15-30s","30-60s"))',  // duration_bucket
      row[4],  // thumbnail_url
      row[5],  // views
      row[8],  // avg_view_percentage
      row[9],  // subscribers_gained
      row[10], // likes
      row[11], // comments
      row[12], // shares
      row[15], // impressions
      row[16], // ctr
      row[6],  // watch_time_minutes
      '=IFERROR(VLOOKUP(A' + (i + 1) + ',VIDEO_TAGS!A:B,2,FALSE),"Untagged")'  // tag_category
    ]);
  }

  // データを書き込み
  masterSheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);

  Logger.log('✅ VIDEO_MASTER更新完了: ' + dataRows.length + ' 行');
}

/**
 * DAILY_SUMMARYシートを更新（数式設定）
 */
function updateDailySummarySheet() {
  Logger.log('DAILY_SUMMARYシートを更新中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName(SHEETS.RAW_DAILY);
  const summarySheet = ss.getSheetByName(SHEETS.DAILY_SUMMARY);

  if (!rawSheet || !summarySheet) {
    throw new Error('必要なシートが見つかりません');
  }

  // RAW_DAILY_METRICSからデータ取得
  const rawData = rawSheet.getDataRange().getValues();

  if (rawData.length <= 1) {
    Logger.log('RAW_DAILY_METRICSにデータがありません');
    return;
  }

  // データ行を作成
  const dataRows = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];

    // subscribers_net = subscribers_gained - subscribers_lost
    const subscribersNet = (row[3] || 0) - (row[4] || 0);

    // 7日移動平均（最初の7行は計算できない）
    let views7dayAvg = '';
    if (i >= 7) {
      views7dayAvg = '=AVERAGE(B' + (i - 5) + ':B' + (i + 1) + ')';
    }

    dataRows.push([
      row[0],  // date
      row[1],  // views
      row[2],  // watch_time_minutes
      row[3],  // subscribers_gained
      row[4],  // subscribers_lost
      subscribersNet,  // subscribers_net
      row[5] || 0,  // estimated_revenue
      views7dayAvg  // views_7day_avg
    ]);
  }

  // データを書き込み
  summarySheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);

  Logger.log('✅ DAILY_SUMMARY更新完了: ' + dataRows.length + ' 行');
}

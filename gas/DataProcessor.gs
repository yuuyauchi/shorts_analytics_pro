/**
 * DataProcessor.gs
 * データ変換・集計処理
 *
 * 機能:
 * - 月次KPI計算
 * - 前月比計算
 * - データ統合
 */

// ============================================
// 月次KPI計算
// ============================================

/**
 * 月次KPIを計算してMONTHLY_KPIシートに書き込み
 */
function calculateMonthlyKPIs() {
  Logger.log('月次KPIを計算中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.VIDEO_MASTER);
  const dailySheet = ss.getSheetByName(SHEETS.RAW_DAILY);
  const kpiSheet = ss.getSheetByName(SHEETS.MONTHLY_KPI);

  if (!masterSheet || !dailySheet || !kpiSheet) {
    throw new Error('必要なシートが見つかりません');
  }

  // VIDEO_MASTERからデータ取得
  const masterData = masterSheet.getDataRange().getValues();

  if (masterData.length <= 1) {
    Logger.log('VIDEO_MASTERにデータがありません');
    return;
  }

  // RAW_DAILY_METRICSからデータ取得
  const dailyData = dailySheet.getDataRange().getValues();

  // 月別にグループ化
  const monthlyData = {};

  // 動画データを月別に集計
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const publishedAt = row[2]; // published_at

    if (!publishedAt || !(publishedAt instanceof Date)) {
      continue;
    }

    const monthKey = formatDate(getLastDayOfMonth(publishedAt), 'yyyy-MM-dd');

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: getLastDayOfMonth(publishedAt),
        videosPublished: 0,
        totalViews: 0,
        totalWatchTime: 0,
        totalSubscribers: 0,
        totalImpressions: 0,
        retentionSum: 0,
        retentionCount: 0
      };
    }

    monthlyData[monthKey].videosPublished++;
    monthlyData[monthKey].totalViews += row[9] || 0;  // views
    monthlyData[monthKey].totalWatchTime += row[17] || 0;  // watch_time_minutes
    monthlyData[monthKey].totalSubscribers += row[11] || 0;  // subscribers_gained
    monthlyData[monthKey].totalImpressions += row[15] || 0;  // impressions

    const retention = row[10];  // avg_view_percentage
    if (retention && retention > 0) {
      monthlyData[monthKey].retentionSum += retention;
      monthlyData[monthKey].retentionCount++;
    }
  }

  // 日次データから収益を月別に集計
  const monthlyRevenue = {};
  for (let i = 1; i < dailyData.length; i++) {
    const row = dailyData[i];
    const date = row[0];

    if (!date || !(date instanceof Date)) {
      continue;
    }

    const monthKey = formatDate(getLastDayOfMonth(date), 'yyyy-MM-dd');
    const revenue = row[5] || 0;  // estimated_revenue

    if (!monthlyRevenue[monthKey]) {
      monthlyRevenue[monthKey] = 0;
    }

    monthlyRevenue[monthKey] += revenue;
  }

  // 月次データを配列に変換してソート
  const monthKeys = Object.keys(monthlyData).sort();

  if (monthKeys.length === 0) {
    Logger.log('月次データがありません');
    return;
  }

  const kpiData = [];

  monthKeys.forEach(function(monthKey, index) {
    const data = monthlyData[monthKey];

    // 平均維持率を計算
    const avgRetention = data.retentionCount > 0 ?
      data.retentionSum / data.retentionCount : 0;

    // 平均インプレッション数を計算
    const avgImpressions = data.videosPublished > 0 ?
      data.totalImpressions / data.videosPublished : 0;

    // 前月のビュー数を取得
    let prevMonthViews = 0;
    if (index > 0) {
      const prevMonthKey = monthKeys[index - 1];
      prevMonthViews = monthlyData[prevMonthKey].totalViews;
    }

    // 前月比を計算
    const momViewsChange = data.totalViews - prevMonthViews;
    const momViewsChangePct = prevMonthViews > 0 ?
      (momViewsChange / prevMonthViews) * 100 : 0;

    kpiData.push([
      data.month,
      data.videosPublished,
      data.totalViews,
      data.totalWatchTime,
      data.totalSubscribers,
      avgRetention,
      avgImpressions,
      monthlyRevenue[monthKey] || 0,
      prevMonthViews,
      momViewsChange,
      momViewsChangePct
    ]);
  });

  // MONTHLY_KPIシートに書き込み
  kpiSheet.getRange(2, 1, kpiData.length, kpiData[0].length).setValues(kpiData);

  Logger.log('✅ 月次KPI計算完了: ' + kpiData.length + ' か月分');
}

// ============================================
// データ統合
// ============================================

/**
 * 全ての加工シートを更新
 * initialSetup()とscheduledDailyUpdate()から呼び出される
 */
function refreshProcessedSheets() {
  Logger.log('加工シートを更新中...');

  try {
    updateVideoMasterSheet();
    updateDailySummarySheet();
    calculateMonthlyKPIs();

    Logger.log('✅ 全ての加工シート更新完了');
  } catch (error) {
    logError('refreshProcessedSheets', error);
    throw error;
  }
}

// ============================================
// データ検証
// ============================================

/**
 * データの整合性をチェック
 * @return {Object} チェック結果
 */
function validateData() {
  Logger.log('データ検証中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  // RAW_VIDEO_DATAのチェック
  const rawVideoSheet = ss.getSheetByName(SHEETS.RAW_VIDEO);
  if (rawVideoSheet) {
    const rowCount = rawVideoSheet.getLastRow() - 1;  // ヘッダー除く

    if (rowCount === 0) {
      result.warnings.push('RAW_VIDEO_DATAにデータがありません');
    } else {
      Logger.log('✓ RAW_VIDEO_DATA: ' + rowCount + ' 件');
    }
  } else {
    result.errors.push('RAW_VIDEO_DATAシートが見つかりません');
    result.valid = false;
  }

  // RAW_DAILY_METRICSのチェック
  const rawDailySheet = ss.getSheetByName(SHEETS.RAW_DAILY);
  if (rawDailySheet) {
    const rowCount = rawDailySheet.getLastRow() - 1;

    if (rowCount === 0) {
      result.warnings.push('RAW_DAILY_METRICSにデータがありません');
    } else {
      Logger.log('✓ RAW_DAILY_METRICS: ' + rowCount + ' 日分');
    }
  } else {
    result.errors.push('RAW_DAILY_METRICSシートが見つかりません');
    result.valid = false;
  }

  // VIDEO_MASTERのチェック
  const masterSheet = ss.getSheetByName(SHEETS.VIDEO_MASTER);
  if (masterSheet) {
    const rowCount = masterSheet.getLastRow() - 1;

    if (rowCount === 0) {
      result.warnings.push('VIDEO_MASTERにデータがありません');
    } else {
      Logger.log('✓ VIDEO_MASTER: ' + rowCount + ' 件');
    }
  } else {
    result.errors.push('VIDEO_MASTERシートが見つかりません');
    result.valid = false;
  }

  // MONTHLY_KPIのチェック
  const kpiSheet = ss.getSheetByName(SHEETS.MONTHLY_KPI);
  if (kpiSheet) {
    const rowCount = kpiSheet.getLastRow() - 1;

    if (rowCount === 0) {
      result.warnings.push('MONTHLY_KPIにデータがありません');
    } else {
      Logger.log('✓ MONTHLY_KPI: ' + rowCount + ' か月分');
    }
  } else {
    result.errors.push('MONTHLY_KPIシートが見つかりません');
    result.valid = false;
  }

  // 結果サマリー
  if (result.valid) {
    Logger.log('✅ データ検証: 問題なし');
  } else {
    Logger.log('❌ データ検証: エラーあり');
    result.errors.forEach(function(error) {
      Logger.log('  エラー: ' + error);
    });
  }

  if (result.warnings.length > 0) {
    Logger.log('⚠️ 警告:');
    result.warnings.forEach(function(warning) {
      Logger.log('  ' + warning);
    });
  }

  return result;
}

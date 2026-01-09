/**
 * Code.gs
 * メイン実行関数
 *
 * 主要機能:
 * - 初回セットアップ (initialSetup)
 * - 日次自動更新 (scheduledDailyUpdate)
 * - 手動更新 (manualRefresh)
 */

// ============================================
// 初回セットアップ
// ============================================

/**
 * 初回セットアップウィザード
 *
 * 実行内容:
 * 1. OAuth2設定の検証
 * 2. YouTube API認証
 * 3. チャンネルID取得・保存
 * 4. シート構造作成
 * 5. 過去90日分のデータ取得
 * 6. データ書き込み
 * 7. 加工シート更新
 * 8. 日次トリガー設定
 *
 * 【注意】
 * - 実行前にConfig.gsのCLIENT_IDとCLIENT_SECRETを設定してください
 * - 初回実行時はOAuth認証画面が表示されます
 * - 動画数が多い場合、5-10分かかることがあります
 */
function initialSetup() {
  Logger.log('========================================');
  Logger.log('初回セットアップを開始します');
  Logger.log('========================================');

  try {
    // Step 1: OAuth2設定の検証
    Logger.log('\n[Step 1/8] OAuth2設定を検証中...');
    if (!validateOAuthConfig()) {
      throw new Error('OAuth2設定が正しくありません。Config.gsのCLIENT_IDとCLIENT_SECRETを設定してください。');
    }
    Logger.log('✅ OAuth2設定OK');

    // Step 2: YouTube API認証
    Logger.log('\n[Step 2/8] YouTube APIに接続中...');
    const service = getYouTubeService();

    if (!service.hasAccess()) {
      Logger.log('認証が必要です。showAuthUrl()を実行して認証してください。');
      showAuthUrl();
      return;
    }

    Logger.log('✅ 認証済み');

    // Step 3: チャンネルID取得
    Logger.log('\n[Step 3/8] チャンネルIDを取得中...');
    const channelId = getChannelId();
    setConfig('CHANNEL_ID', channelId);
    Logger.log('✅ チャンネルID: ' + channelId);

    // Step 4: シート構造作成
    Logger.log('\n[Step 4/8] シート構造を作成中...');
    createSheetStructure();
    Logger.log('✅ シート作成完了');

    // Step 5: 初期データ範囲を設定
    Logger.log('\n[Step 5/8] データ取得範囲を設定中...');
    const endDate = new Date();
    const startDate = getDaysAgo(DEFAULTS.INITIAL_FETCH_DAYS, endDate);

    setConfig('DATA_START_DATE', formatDate(startDate, 'yyyy-MM-dd'));
    Logger.log('✅ 取得期間: ' + formatDate(startDate, 'yyyy-MM-dd') + ' ~ ' + formatDate(endDate, 'yyyy-MM-dd'));

    // Step 6: データ取得
    Logger.log('\n[Step 6/8] YouTubeデータを取得中...');
    Logger.log('（動画数が多い場合、数分かかります）');

    measureTime(function() {
      // 動画リスト取得
      Logger.log('  - 動画リストを取得中...');
      const videoIds = fetchVideosList(startDate, endDate);
      Logger.log('    取得: ' + videoIds.length + ' 件');

      if (videoIds.length === 0) {
        Logger.log('⚠️ 指定期間にShorts動画が見つかりませんでした');
        return;
      }

      // 動画詳細取得
      Logger.log('  - 動画詳細を取得中...');
      const videoDetails = fetchVideoDetails(videoIds);
      Logger.log('    Shorts動画: ' + videoDetails.length + ' 件');

      if (videoDetails.length === 0) {
        Logger.log('⚠️ 60秒以下のShorts動画が見つかりませんでした');
        return;
      }

      // 分析データ取得
      Logger.log('  - 分析データを取得中...');
      const shortsIds = videoDetails.map(function(v) { return v.videoId; });
      const analyticsData = fetchVideoAnalytics(shortsIds, startDate, endDate);
      Logger.log('    分析データ: ' + Object.keys(analyticsData).length + ' 件');

      // 日次指標取得
      Logger.log('  - 日次チャンネル指標を取得中...');
      const dailyMetrics = fetchDailyChannelMetrics(startDate, endDate);
      Logger.log('    日次データ: ' + dailyMetrics.length + ' 日分');

      // データ書き込み
      Logger.log('  - データを書き込み中...');
      writeVideoData(videoDetails, analyticsData);
      writeDailyMetrics(dailyMetrics);
      Logger.log('    書き込み完了');

    }, 'データ取得');

    // Step 7: 加工シート更新
    Logger.log('\n[Step 7/8] 加工シートを更新中...');
    refreshProcessedSheets();
    Logger.log('✅ 加工シート更新完了');

    // Step 8: トリガー設定
    Logger.log('\n[Step 8/8] 自動更新トリガーを設定中...');
    setupDailyTrigger();
    Logger.log('✅ トリガー設定完了（毎朝' + DEFAULTS.DAILY_TRIGGER_HOUR + '時に自動更新）');

    // 最終更新日時を記録
    setConfig('LAST_UPDATE', formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss'));

    // データ検証
    Logger.log('\n[検証] データをチェック中...');
    const validation = validateData();

    Logger.log('\n========================================');
    Logger.log('✅ 初回セットアップ完了！');
    Logger.log('========================================');
    Logger.log('次のステップ:');
    Logger.log('1. VIDEO_TAGSシートで動画にタグを付ける');
    Logger.log('2. Looker Studioでダッシュボードを作成');
    Logger.log('3. 毎朝自動更新されます（手動更新: manualRefresh()）');
    Logger.log('========================================');

  } catch (error) {
    Logger.log('\n❌ セットアップエラー: ' + error.message);
    Logger.log(error.stack);
    logError('initialSetup', error);

    // エラー通知メール
    sendEmailAlert(
      'セットアップエラー',
      'Shorts Analytics Proのセットアップ中にエラーが発生しました。\n\n' +
      'エラー: ' + error.message + '\n\n' +
      '対処法:\n' +
      '1. Config.gsのCLIENT_IDとCLIENT_SECRETが正しいか確認\n' +
      '2. YouTube API が有効になっているか確認\n' +
      '3. OAuth2認証が完了しているか確認（showAuthUrl()を実行）\n\n' +
      'ログを確認: スクリプトエディタ → 実行ログ'
    );

    throw error;
  }
}

// ============================================
// 日次自動更新
// ============================================

/**
 * 日次自動更新処理
 *
 * 実行内容:
 * 1. 前回更新日時以降の新規動画を取得
 * 2. 過去7日分の動画の分析データを再取得（指標が確定するため）
 * 3. 昨日の日次指標を取得
 * 4. データを追記/更新
 * 5. 加工シートを再計算
 *
 * 【注意】
 * - トリガーにより毎朝自動実行されます
 * - エラー時はメールで通知されます
 */
function scheduledDailyUpdate() {
  Logger.log('========================================');
  Logger.log('日次自動更新を開始: ' + new Date());
  Logger.log('========================================');

  try {
    // 前回更新日時を取得
    const lastUpdateStr = getConfig('LAST_UPDATE');
    const lastUpdate = lastUpdateStr ? new Date(lastUpdateStr) : getDaysAgo(1);

    Logger.log('前回更新: ' + lastUpdate);

    const today = new Date();

    // 1. 新規動画の取得
    Logger.log('\n[1/5] 新規動画を確認中...');
    const newVideoIds = fetchVideosList(lastUpdate, today);

    if (newVideoIds.length > 0) {
      Logger.log('新規動画: ' + newVideoIds.length + ' 件');

      const videoDetails = fetchVideoDetails(newVideoIds);
      const analyticsData = fetchVideoAnalytics(
        videoDetails.map(function(v) { return v.videoId; }),
        lastUpdate,
        today
      );

      // 新規動画を追記
      appendVideoData(videoDetails, analyticsData);
    } else {
      Logger.log('新規動画なし');
    }

    // 2. 過去7日分の動画の指標を再取得
    Logger.log('\n[2/5] 過去7日分の動画指標を更新中...');
    const lookbackDate = getDaysAgo(DEFAULTS.DAILY_LOOKBACK_DAYS);

    const recentVideoIds = fetchVideosList(lookbackDate, today);

    if (recentVideoIds.length > 0) {
      Logger.log('更新対象: ' + recentVideoIds.length + ' 件');

      const videoDetails = fetchVideoDetails(recentVideoIds);
      const analyticsData = fetchVideoAnalytics(
        videoDetails.map(function(v) { return v.videoId; }),
        lookbackDate,
        today
      );

      // 既存データを上書き
      writeVideoData(videoDetails, analyticsData);
    }

    // 3. 昨日の日次指標を取得
    Logger.log('\n[3/5] 日次指標を取得中...');
    const yesterday = getDaysAgo(1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59);

    const dailyMetrics = fetchDailyChannelMetrics(yesterday, yesterdayEnd);

    if (dailyMetrics.length > 0) {
      Logger.log('日次データ: ' + dailyMetrics.length + ' 日分');
      appendDailyMetrics(dailyMetrics);
    }

    // 4. 加工シート更新
    Logger.log('\n[4/5] 加工シートを更新中...');
    refreshProcessedSheets();

    // 5. 最終更新日時を記録
    Logger.log('\n[5/5] 更新情報を記録中...');
    setConfig('LAST_UPDATE', formatDate(today, 'yyyy-MM-dd HH:mm:ss'));

    Logger.log('\n========================================');
    Logger.log('✅ 日次更新完了: ' + new Date());
    Logger.log('========================================');

  } catch (error) {
    Logger.log('\n❌ 更新エラー: ' + error.message);
    Logger.log(error.stack);
    logError('scheduledDailyUpdate', error);

    // エラー通知メール
    sendEmailAlert(
      '日次更新エラー',
      'Shorts Analytics Proの日次更新中にエラーが発生しました。\n\n' +
      'エラー: ' + error.message + '\n\n' +
      '対処法:\n' +
      '1. YouTube APIの認証が有効か確認（resetAuth()で再認証）\n' +
      '2. APIクォータ制限に達していないか確認\n' +
      '3. スプレッドシートが削除されていないか確認\n\n' +
      '手動更新: manualRefresh()を実行\n' +
      'ログを確認: スクリプトエディタ → 実行ログ'
    );

    throw error;
  }
}

// ============================================
// 手動更新
// ============================================

/**
 * 手動でデータを更新
 * scheduledDailyUpdate()と同じ処理を即座に実行
 */
function manualRefresh() {
  Logger.log('手動更新を実行します...\n');
  scheduledDailyUpdate();
}

/**
 * 全データを再取得（フルリフレッシュ）
 *
 * 【警告】
 * - 既存データを全て削除して再取得します
 * - APIクォータを大量に消費します
 * - データ不整合が発生した場合のみ使用してください
 */
function fullRefresh() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '全データ再取得',
    '既存データを全て削除して再取得します。よろしいですか？\n（APIクォータを大量に消費します）',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('キャンセルされました');
    return;
  }

  Logger.log('全データを再取得します...\n');

  try {
    // 既存データをクリア
    Logger.log('既存データをクリア中...');
    clearSheetData(SHEETS.RAW_VIDEO);
    clearSheetData(SHEETS.RAW_DAILY);
    clearSheetData(SHEETS.VIDEO_MASTER);
    clearSheetData(SHEETS.DAILY_SUMMARY);
    clearSheetData(SHEETS.MONTHLY_KPI);

    // 再セットアップ（トリガーは再作成しない）
    Logger.log('\nデータ再取得中...');

    const endDate = new Date();
    const startDate = getDaysAgo(DEFAULTS.INITIAL_FETCH_DAYS, endDate);

    // データ取得と書き込み
    const videoIds = fetchVideosList(startDate, endDate);
    const videoDetails = fetchVideoDetails(videoIds);
    const shortsIds = videoDetails.map(function(v) { return v.videoId; });
    const analyticsData = fetchVideoAnalytics(shortsIds, startDate, endDate);
    const dailyMetrics = fetchDailyChannelMetrics(startDate, endDate);

    writeVideoData(videoDetails, analyticsData);
    writeDailyMetrics(dailyMetrics);
    refreshProcessedSheets();

    setConfig('LAST_UPDATE', formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss'));

    Logger.log('\n✅ 全データ再取得完了');

  } catch (error) {
    Logger.log('\n❌ エラー: ' + error.message);
    logError('fullRefresh', error);
    throw error;
  }
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * VIDEO_TAGSシートに動画IDを自動入力
 * ユーザーがタグを付けやすくするヘルパー
 */
function populateVideoTags() {
  Logger.log('VIDEO_TAGSシートに動画IDを入力中...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(SHEETS.VIDEO_MASTER);
  const tagsSheet = ss.getSheetByName(SHEETS.VIDEO_TAGS);

  if (!masterSheet || !tagsSheet) {
    throw new Error('必要なシートが見つかりません');
  }

  // VIDEO_MASTERから動画ID・タイトルを取得
  const masterData = masterSheet.getDataRange().getValues();
  const videoData = [];

  for (let i = 1; i < masterData.length; i++) {
    const videoId = masterData[i][0];
    const title = masterData[i][1];

    if (videoId) {
      videoData.push([videoId, '', '']);  // tag_categoryとnotesは空欄
    }
  }

  if (videoData.length > 0) {
    tagsSheet.getRange(2, 1, videoData.length, 3).setValues(videoData);
    Logger.log('✅ ' + videoData.length + ' 件の動画IDを入力しました');
    Logger.log('VIDEO_TAGSシートでtag_categoryカラムにタグを入力してください');
  } else {
    Logger.log('動画データがありません');
  }
}

/**
 * データを追記（新規動画用）
 */
function appendVideoData(videoDetails, analyticsData) {
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

  appendToSheet(SHEETS.RAW_VIDEO, data);
}

/**
 * 日次データを追記
 */
function appendDailyMetrics(dailyMetrics) {
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

  appendToSheet(SHEETS.RAW_DAILY, data);
}

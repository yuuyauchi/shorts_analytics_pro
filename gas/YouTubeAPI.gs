/**
 * YouTubeAPI.gs
 * YouTube Data API v3 と YouTube Analytics API の呼び出し層
 *
 * 主要機能:
 * - チャンネルID取得
 * - Shorts動画一覧取得
 * - 動画詳細情報取得
 * - 動画別分析指標取得
 * - 日次チャンネル指標取得
 */

// ============================================
// 認証・基本機能
// ============================================

/**
 * 認証済みユーザーのチャンネルIDを取得
 * @return {string} チャンネルID
 */
function getChannelId() {
  const service = getYouTubeService();

  if (!service.hasAccess()) {
    throw new Error('YouTube APIの認証が必要です。showAuthUrl()を実行してください。');
  }

  try {
    const url = 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true';
    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.items && result.items.length > 0) {
      return result.items[0].id;
    } else {
      throw new Error('チャンネルが見つかりませんでした');
    }
  } catch (error) {
    logError('getChannelId', error);
    throw error;
  }
}

/**
 * YouTube APIのテスト接続
 * 初回セットアップ時の動作確認用
 */
function testYouTubeConnection() {
  try {
    const channelId = getChannelId();
    Logger.log('✅ 接続成功！チャンネルID: ' + channelId);
    return channelId;
  } catch (error) {
    Logger.log('❌ 接続失敗: ' + error.message);
    throw error;
  }
}

// ============================================
// 動画データ取得
// ============================================

/**
 * 指定期間のShorts動画ID一覧を取得
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @return {Array<string>} 動画IDの配列
 */
function fetchVideosList(startDate, endDate) {
  const service = getYouTubeService();
  const channelId = getConfig('CHANNEL_ID');

  if (!channelId) {
    throw new Error('チャンネルIDが設定されていません。initialSetup()を実行してください。');
  }

  const videoIds = [];
  let pageToken = null;

  try {
    do {
      // YouTube Data API: search.list
      // 注意: 厳密なShorts判定は難しいため、duration < 60秒で後フィルター
      let url = 'https://www.googleapis.com/youtube/v3/search?' +
        'part=id&' +
        'channelId=' + channelId + '&' +
        'type=video&' +
        'order=date&' +
        'maxResults=50&' +
        'publishedAfter=' + startDate.toISOString() + '&' +
        'publishedBefore=' + endDate.toISOString();

      if (pageToken) {
        url += '&pageToken=' + pageToken;
      }

      const response = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        },
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());

      if (result.error) {
        throw new Error('API Error: ' + result.error.message);
      }

      if (result.items) {
        result.items.forEach(function(item) {
          if (item.id && item.id.videoId) {
            videoIds.push(item.id.videoId);
          }
        });
      }

      pageToken = result.nextPageToken;

    } while (pageToken);

    Logger.log('取得した動画数: ' + videoIds.length);
    return videoIds;

  } catch (error) {
    logError('fetchVideosList', error);
    throw error;
  }
}

/**
 * 動画の詳細情報を取得
 * @param {Array<string>} videoIds - 動画IDの配列
 * @return {Array<Object>} 動画詳細オブジェクトの配列
 */
function fetchVideoDetails(videoIds) {
  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  const service = getYouTubeService();
  const allDetails = [];

  try {
    // 50件ずつバッチ処理
    const batches = chunkArray(videoIds, YOUTUBE_API.VIDEO_BATCH_SIZE);

    batches.forEach(function(batch) {
      const url = 'https://www.googleapis.com/youtube/v3/videos?' +
        'part=snippet,contentDetails,statistics&' +
        'id=' + batch.join(',');

      const response = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        },
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());

      if (result.error) {
        throw new Error('API Error: ' + result.error.message);
      }

      if (result.items) {
        result.items.forEach(function(item) {
          const durationSeconds = parseDuration(item.contentDetails.duration);

          // Shorts判定: 60秒以下のみ
          if (durationSeconds <= YOUTUBE_API.SHORTS_MAX_DURATION) {
            allDetails.push({
              videoId: item.id,
              title: item.snippet.title,
              publishedAt: new Date(item.snippet.publishedAt),
              durationSeconds: durationSeconds,
              thumbnailUrl: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url,
              description: item.snippet.description || ''
            });
          }
        });
      }

      // レート制限対策: 少し待機
      Utilities.sleep(100);
    });

    Logger.log('Shorts動画数（60秒以下）: ' + allDetails.length);
    return allDetails;

  } catch (error) {
    logError('fetchVideoDetails', error);
    throw error;
  }
}

/**
 * ISO 8601形式のdurationを秒数に変換
 * 例: "PT1M30S" → 90, "PT45S" → 45
 * @param {string} isoDuration - ISO 8601形式の期間文字列
 * @return {number} 秒数
 */
function parseDuration(isoDuration) {
  // PT1H2M3S形式をパース
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

// ============================================
// YouTube Analytics API
// ============================================

/**
 * 動画別の分析指標を取得
 * @param {Array<string>} videoIds - 動画IDの配列
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @return {Object} 動画IDをキーとした指標オブジェクト
 */
function fetchVideoAnalytics(videoIds, startDate, endDate) {
  if (!videoIds || videoIds.length === 0) {
    return {};
  }

  const service = getYouTubeService();
  const analytics = {};

  try {
    // YouTube Analytics APIは最大200件のフィルター
    const batches = chunkArray(videoIds, YOUTUBE_API.ANALYTICS_BATCH_SIZE);

    batches.forEach(function(batch) {
      const url = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
        'ids=channel==MINE&' +
        'startDate=' + formatDate(startDate, 'yyyy-MM-dd') + '&' +
        'endDate=' + formatDate(endDate, 'yyyy-MM-dd') + '&' +
        'metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,' +
        'subscribersGained,likes,comments,shares,' +
        'videosAddedToPlaylists,videosRemovedFromPlaylists&' +
        'dimensions=video&' +
        'filters=video==' + batch.join(',');

      const response = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        },
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());

      if (result.error) {
        // 一部の指標が取得できない場合がある（収益化していない等）
        Logger.log('Analytics API警告: ' + result.error.message);
      }

      if (result.rows) {
        result.rows.forEach(function(row) {
          const videoId = row[0];
          analytics[videoId] = {
            views: row[1] || 0,
            estimatedMinutesWatched: row[2] || 0,
            averageViewDuration: row[3] || 0,
            averageViewPercentage: row[4] || 0,
            subscribersGained: row[5] || 0,
            likes: row[6] || 0,
            comments: row[7] || 0,
            shares: row[8] || 0,
            videosAddedToPlaylists: row[9] || 0,
            videosRemovedFromPlaylists: row[10] || 0
          };
        });
      }

      Utilities.sleep(100);
    });

    // impressions, ctrは別途取得（収益化チャンネルのみ）
    fetchImpressionMetrics(videoIds, startDate, endDate, analytics);

    Logger.log('Analytics取得完了: ' + Object.keys(analytics).length + ' 動画');
    return analytics;

  } catch (error) {
    logError('fetchVideoAnalytics', error);
    throw error;
  }
}

/**
 * インプレッション関連指標を取得（収益化チャンネルのみ）
 * @param {Array<string>} videoIds - 動画IDの配列
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {Object} analytics - 既存のanalyticsオブジェクト（更新される）
 */
function fetchImpressionMetrics(videoIds, startDate, endDate, analytics) {
  const service = getYouTubeService();

  try {
    const batches = chunkArray(videoIds, YOUTUBE_API.ANALYTICS_BATCH_SIZE);

    batches.forEach(function(batch) {
      const url = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
        'ids=channel==MINE&' +
        'startDate=' + formatDate(startDate, 'yyyy-MM-dd') + '&' +
        'endDate=' + formatDate(endDate, 'yyyy-MM-dd') + '&' +
        'metrics=impressions,impressionClickThroughRate&' +
        'dimensions=video&' +
        'filters=video==' + batch.join(',');

      const response = UrlFetchApp.fetch(url, {
        headers: {
          Authorization: 'Bearer ' + service.getAccessToken()
        },
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());

      if (result.error) {
        // 収益化していない場合はこれらの指標が取得できない
        Logger.log('Impression指標は取得できませんでした（収益化要件）');
        return;
      }

      if (result.rows) {
        result.rows.forEach(function(row) {
          const videoId = row[0];
          if (analytics[videoId]) {
            analytics[videoId].impressions = row[1] || 0;
            analytics[videoId].ctr = row[2] || 0;
          }
        });
      }

      Utilities.sleep(100);
    });

  } catch (error) {
    Logger.log('Impression指標の取得をスキップしました: ' + error.message);
  }
}

/**
 * 日次チャンネル指標を取得
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @return {Array<Object>} 日次指標オブジェクトの配列
 */
function fetchDailyChannelMetrics(startDate, endDate) {
  const service = getYouTubeService();

  try {
    const url = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
      'ids=channel==MINE&' +
      'startDate=' + formatDate(startDate, 'yyyy-MM-dd') + '&' +
      'endDate=' + formatDate(endDate, 'yyyy-MM-dd') + '&' +
      'metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost&' +
      'dimensions=day';

    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      throw new Error('API Error: ' + result.error.message);
    }

    const dailyMetrics = [];

    if (result.rows) {
      result.rows.forEach(function(row) {
        dailyMetrics.push({
          date: new Date(row[0]),
          views: row[1] || 0,
          estimatedMinutesWatched: row[2] || 0,
          subscribersGained: row[3] || 0,
          subscribersLost: row[4] || 0
        });
      });
    }

    // 推定収益を取得（収益化チャンネルのみ）
    fetchDailyRevenue(startDate, endDate, dailyMetrics);

    Logger.log('日次指標取得完了: ' + dailyMetrics.length + ' 日分');
    return dailyMetrics;

  } catch (error) {
    logError('fetchDailyChannelMetrics', error);
    throw error;
  }
}

/**
 * 日次収益を取得（収益化チャンネルのみ）
 * @param {Date} startDate - 開始日
 * @param {Date} endDate - 終了日
 * @param {Array<Object>} dailyMetrics - 既存のdailyMetrics配列（更新される）
 */
function fetchDailyRevenue(startDate, endDate, dailyMetrics) {
  const service = getYouTubeService();

  try {
    const url = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
      'ids=channel==MINE&' +
      'startDate=' + formatDate(startDate, 'yyyy-MM-dd') + '&' +
      'endDate=' + formatDate(endDate, 'yyyy-MM-dd') + '&' +
      'metrics=estimatedRevenue&' +
      'dimensions=day';

    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      },
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      Logger.log('収益指標は取得できませんでした（収益化要件）');
      return;
    }

    if (result.rows) {
      const revenueMap = {};
      result.rows.forEach(function(row) {
        const dateStr = row[0];
        revenueMap[dateStr] = row[1] || 0;
      });

      // dailyMetricsに収益を追加
      dailyMetrics.forEach(function(metric) {
        const dateStr = formatDate(metric.date, 'yyyy-MM-dd');
        metric.estimatedRevenue = revenueMap[dateStr] || 0;
      });
    }

  } catch (error) {
    Logger.log('収益指標の取得をスキップしました: ' + error.message);
  }
}

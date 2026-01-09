/**
 * Triggers.gs
 * トリガー管理
 *
 * 機能:
 * - 日次自動更新トリガーの設定・削除
 * - トリガー一覧表示
 */

// ============================================
// トリガー設定
// ============================================

/**
 * 日次自動更新トリガーを設定
 * 毎朝指定時刻にscheduledDailyUpdate()を実行
 */
function setupDailyTrigger() {
  try {
    // 既存の同名トリガーを削除（重複防止）
    removeDailyTriggers();

    // 新しいトリガーを作成
    ScriptApp.newTrigger('scheduledDailyUpdate')
      .timeBased()
      .atHour(DEFAULTS.DAILY_TRIGGER_HOUR)
      .everyDays(1)
      .create();

    Logger.log('✅ 日次トリガー設定完了: 毎朝' + DEFAULTS.DAILY_TRIGGER_HOUR + '時に実行');

  } catch (error) {
    logError('setupDailyTrigger', error);
    throw error;
  }
}

/**
 * 日次更新トリガーを削除
 */
function removeDailyTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let removedCount = 0;

  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'scheduledDailyUpdate') {
      ScriptApp.deleteTrigger(trigger);
      removedCount++;
    }
  });

  if (removedCount > 0) {
    Logger.log('日次トリガーを削除しました: ' + removedCount + ' 件');
  }
}

/**
 * 全てのトリガーを削除
 * トラブルシューティング用
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  Logger.log('全てのトリガーを削除しました: ' + triggers.length + ' 件');
}

// ============================================
// トリガー情報表示
// ============================================

/**
 * 現在設定されているトリガー一覧を表示
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  Logger.log('========================================');
  Logger.log('トリガー一覧 (' + triggers.length + ' 件)');
  Logger.log('========================================');

  if (triggers.length === 0) {
    Logger.log('トリガーが設定されていません');
    return;
  }

  triggers.forEach(function(trigger, index) {
    Logger.log('\n[' + (index + 1) + '] ' + trigger.getHandlerFunction());

    // トリガーの種類
    const eventType = trigger.getEventType();
    Logger.log('  種類: ' + eventType);

    // 時間ベーストリガーの場合
    if (eventType === ScriptApp.EventType.CLOCK) {
      const triggerSource = trigger.getTriggerSource();

      if (triggerSource === ScriptApp.TriggerSource.CLOCK) {
        Logger.log('  実行: 時間ベース');

        try {
          // 実行時刻の取得（可能な場合）
          const hour = trigger.getHour ? trigger.getHour() : 'N/A';
          Logger.log('  時刻: ' + hour + '時');
        } catch (e) {
          Logger.log('  時刻: 設定済み');
        }
      }
    }

    // 作成日時
    const uid = trigger.getUniqueId();
    Logger.log('  ID: ' + uid);
  });

  Logger.log('\n========================================');
}

/**
 * トリガー設定状況をチェック
 * @return {boolean} 日次トリガーが設定されている場合true
 */
function checkDailyTriggerExists() {
  const triggers = ScriptApp.getProjectTriggers();

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'scheduledDailyUpdate') {
      Logger.log('✅ 日次トリガーは設定されています');
      return true;
    }
  }

  Logger.log('❌ 日次トリガーが設定されていません');
  Logger.log('setupDailyTrigger()を実行してください');
  return false;
}

// ============================================
// エラーハンドリング用トリガー
// ============================================

/**
 * エラー発生時の通知トリガーを設定
 * トリガー実行時のエラーをメール通知
 */
function setupErrorNotificationTrigger() {
  try {
    // 既存のエラー通知トリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'onTriggerError') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // 新しいエラー通知トリガーを作成
    // 注: Apps Scriptには直接的なエラートリガーがないため、
    // scheduledDailyUpdate()内でtry-catchして通知する方式を採用

    Logger.log('エラー通知はscheduledDailyUpdate()内のtry-catchで処理されます');

  } catch (error) {
    logError('setupErrorNotificationTrigger', error);
  }
}

// ============================================
// メンテナンス用トリガー
// ============================================

/**
 * 週次メンテナンストリガーを設定（オプション）
 * 毎週日曜日にデータクリーンアップを実行
 */
function setupWeeklyMaintenanceTrigger() {
  try {
    // 既存の週次トリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'weeklyMaintenance') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // 新しい週次トリガーを作成
    ScriptApp.newTrigger('weeklyMaintenance')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(3)  // 日曜日午前3時
      .create();

    Logger.log('✅ 週次メンテナンストリガー設定完了: 毎週日曜3時に実行');

  } catch (error) {
    logError('setupWeeklyMaintenanceTrigger', error);
  }
}

/**
 * 週次メンテナンス処理
 * LOGシートの古いエラーログを削除
 */
function weeklyMaintenance() {
  Logger.log('週次メンテナンスを開始: ' + new Date());

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SHEETS.LOG);

    if (!logSheet) {
      Logger.log('LOGシートが見つかりません');
      return;
    }

    // 30日以前のログを削除
    const cutoffDate = getDaysAgo(30);
    const logData = logSheet.getDataRange().getValues();
    let deletedRows = 0;

    for (let i = logData.length - 1; i >= 1; i--) {
      const timestamp = logData[i][0];

      if (timestamp instanceof Date && timestamp < cutoffDate) {
        logSheet.deleteRow(i + 1);
        deletedRows++;
      }
    }

    Logger.log('古いログを削除しました: ' + deletedRows + ' 行');
    Logger.log('✅ 週次メンテナンス完了');

  } catch (error) {
    logError('weeklyMaintenance', error);
  }
}

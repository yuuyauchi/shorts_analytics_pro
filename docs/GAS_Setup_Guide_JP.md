# Google Apps Script セットアップマニュアル

このガイドでは、Google Apps Script（GAS）のコードをスプレッドシートに設定し、YouTube APIと連携させる手順を説明します。

**所要時間**: 約20分

**前提条件**: [API設定ガイド](./API_Setup_Guide_JP.md)が完了していること

---

## 📋 目次

1. [スプレッドシートの準備](#1-スプレッドシートの準備)
2. [Apps Scriptプロジェクトを開く](#2-apps-scriptプロジェクトを開く)
3. [GASコードの追加](#3-gasコードの追加)
4. [OAuth2ライブラリの追加](#4-oauth2ライブラリの追加)
5. [認証情報の設定](#5-認証情報の設定)
6. [OAuth認証の実行](#6-oauth認証の実行)
7. [初回セットアップの実行](#7-初回セットアップの実行)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. スプレッドシートの準備

### 手順

1. **新しいGoogleスプレッドシートを作成**
   - Google Driveにアクセス: https://drive.google.com/
   - 「新規」→「Googleスプレッドシート」→「空白のスプレッドシート」

2. **スプレッドシート名を変更**
   - 左上の「無題のスプレッドシート」をクリック
   - 「Shorts Analytics Data」と入力
   - Enterキーで確定

3. **スプレッドシートのURLをコピー**（後で使用）
   - アドレスバーのURLをコピー
   - 例: `https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxx/edit`

---

## 2. Apps Scriptプロジェクトを開く

### 手順

1. **スクリプトエディタを開く**
   - スプレッドシート上部メニュー →「拡張機能」→「Apps Script」
   - 新しいタブでApps Scriptエディタが開く

2. **プロジェクト名を変更**
   - 左上の「無題のプロジェクト」をクリック
   - 「Shorts Analytics Automation」と入力
   - 「名前を変更」をクリック

3. **デフォルトのCode.gsを削除**
   - エディタに表示されている `function myFunction() { ... }` を全て削除
   - 空の状態にする

---

## 3. GASコードの追加

### 手順

以下の順序で、`gas/`フォルダ内の各ファイルの内容をコピー&ペーストします。

#### 3-1. Config.gsを追加

1. **新しいファイルを作成**
   - 左側の「ファイル」セクションで「+」ボタンをクリック
   - 「スクリプト」を選択
   - ファイル名を「Config」に変更（.gsは自動追加）

2. **コードをコピー**
   - ローカルの `gas/Config.gs` ファイルの内容を全てコピー
   - Apps Scriptエディタの「Config.gs」にペースト

#### 3-2. Utilities.gsを追加

1. 左側「+」→「スクリプト」→ 名前を「Utilities」に変更
2. `gas/Utilities.gs` の内容をコピー&ペースト

#### 3-3. YouTubeAPI.gsを追加

1. 左側「+」→「スクリプト」→ 名前を「YouTubeAPI」に変更
2. `gas/YouTubeAPI.gs` の内容をコピー&ペースト

#### 3-4. SheetWriter.gsを追加

1. 左側「+」→「スクリプト」→ 名前を「SheetWriter」に変更
2. `gas/SheetWriter.gs` の内容をコピー&ペースト

#### 3-5. DataProcessor.gsを追加

1. 左側「+」→「スクリプト」→ 名前を「DataProcessor」に変更
2. `gas/DataProcessor.gs` の内容をコピー&ペースト

#### 3-6. Code.gsを追加

1. **最初のCode.gsファイルを使用**
   - デフォルトで作成されている「コード.gs」または「Code.gs」をクリック
2. `gas/Code.gs` の内容をコピー&ペースト

#### 3-7. Triggers.gsを追加

1. 左側「+」→「スクリプト」→ 名前を「Triggers」に変更
2. `gas/Triggers.gs` の内容をコピー&ペースト

### 確認

左側のファイル一覧に以下のファイルが表示されていればOK:

- Code.gs
- Config.gs
- Utilities.gs
- YouTubeAPI.gs
- SheetWriter.gs
- DataProcessor.gs
- Triggers.gs

---

## 4. OAuth2ライブラリの追加

Google Apps ScriptからOAuth2認証を行うために、専用ライブラリを追加します。

### 手順

1. **ライブラリ画面を開く**
   - 左側メニューの「ライブラリ +」（本のアイコン）をクリック

2. **ライブラリIDを入力**
   - 「スクリプトID」欄に以下を入力:
     ```
     1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
     ```
   - 「検索」をクリック

3. **バージョンを選択**
   - ライブラリ名: 「OAuth2」が表示される
   - バージョン: 最新版（一番数字が大きいもの）を選択
   - 識別子: 「OAuth2」のまま（変更しない）

4. **追加をクリック**
   - 「追加」ボタンをクリック
   - 左側「ライブラリ」セクションに「OAuth2」が表示されればOK

---

## 5. 認証情報の設定

API設定ガイドで取得したクライアントIDとシークレットを設定します。

### 手順

1. **Config.gsを開く**
   - 左側のファイル一覧から「Config.gs」をクリック

2. **CLIENT_IDを設定**
   - 11行目あたりの以下の行を見つける:
     ```javascript
     const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
     ```
   - `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` を、API設定ガイドでコピーした **クライアントID** に置き換え

   **例**:
   ```javascript
   const CLIENT_ID = '123456789-abcdefg.apps.googleusercontent.com';
   ```

3. **CLIENT_SECRETを設定**
   - 18行目あたりの以下の行を見つける:
     ```javascript
     const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
     ```
   - `YOUR_CLIENT_SECRET_HERE` を、API設定ガイドでコピーした **クライアントシークレット** に置き換え

   **例**:
   ```javascript
   const CLIENT_SECRET = 'GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ';
   ```

4. **保存**
   - Ctrl+S（Windows）または Cmd+S（Mac）で保存
   - または上部の「💾」アイコンをクリック

---

## 6. OAuth認証の実行

YouTube APIにアクセスするための認証を行います。

### 手順

1. **showAuthUrl関数を実行**
   - 上部のメニューバーで関数選択ドロップダウンをクリック
   - 「showAuthUrl」を選択
   - 「実行」ボタン（▶）をクリック

2. **権限の確認**
   - 「承認が必要です」ダイアログが表示される
   - 「権限を確認」をクリック

3. **Googleアカウントを選択**
   - YouTubeチャンネルを持っているGoogleアカウントを選択

4. **警告画面が表示される場合**
   - 「このアプリは確認されていません」と表示される
   - 「詳細」をクリック
   - 「Shorts Analytics Automation（安全ではないページ）に移動」をクリック
   - ※自分で作成したアプリなので安全です

5. **権限を許可**
   - 「Shorts Analytics Automationが次の許可をリクエストしています」と表示される
   - 以下の権限が表示されていることを確認:
     - YouTube アカウントの表示
     - YouTube 分析レポートの表示
   - 「許可」をクリック

6. **認証URLダイアログが表示される**
   - 「YouTube APIを認証」というリンクが表示される
   - そのリンクをクリック

7. **再度権限を許可**
   - 手順5と同じ画面が表示される
   - 「許可」をクリック

8. **認証成功**
   - 「認証成功！このタブを閉じて、スクリプトエディタに戻ってください。」と表示される
   - タブを閉じる

### 認証確認

1. **testYouTubeConnection関数を実行**
   - 上部のメニューバーで「testYouTubeConnection」を選択
   - 「実行」ボタンをクリック

2. **実行ログを確認**
   - 下部の「実行ログ」タブをクリック
   - 以下のようなログが表示されればOK:
     ```
     ✅ 接続成功！チャンネルID: UCxxxxxxxxxxxxxxxxxx
     ```

**エラーが表示される場合**:
- [トラブルシューティング](#8-トラブルシューティング)を参照

---

## 7. 初回セットアップの実行

すべての設定が完了したら、初回データ取得を実行します。

### 手順

1. **initialSetup関数を実行**
   - 上部のメニューバーで「initialSetup」を選択
   - 「実行」ボタンをクリック

2. **実行ログを監視**
   - 下部の「実行ログ」タブで進捗を確認
   - 以下のようなログが順次表示されます:

   ```
   [Step 1/8] OAuth2設定を検証中...
   ✅ OAuth2設定OK

   [Step 2/8] YouTube APIに接続中...
   ✅ 認証済み

   [Step 3/8] チャンネルIDを取得中...
   ✅ チャンネルID: UCxxxxxxxxx

   [Step 4/8] シート構造を作成中...
   ✓ CONFIGシート作成
   ✓ RAW_VIDEO_DATAシート作成
   ...
   ✅ シート作成完了

   [Step 5/8] データ取得範囲を設定中...
   ✅ 取得期間: 2025-10-11 ~ 2026-01-09

   [Step 6/8] YouTubeデータを取得中...
   （動画数が多い場合、数分かかります）
     - 動画リストを取得中...
       取得: 45 件
     - 動画詳細を取得中...
       Shorts動画: 42 件
     - 分析データを取得中...
       分析データ: 42 件
     - 日次チャンネル指標を取得中...
       日次データ: 90 日分
     - データを書き込み中...
       書き込み完了
   ⏱️ データ取得: 45.23秒

   [Step 7/8] 加工シートを更新中...
   ✅ 加工シート更新完了

   [Step 8/8] 自動更新トリガーを設定中...
   ✅ トリガー設定完了（毎朝6時に自動更新）

   ========================================
   ✅ 初回セットアップ完了！
   ========================================
   次のステップ:
   1. VIDEO_TAGSシートで動画にタグを付ける
   2. Looker Studioでダッシュボードを作成
   3. 毎朝自動更新されます（手動更新: manualRefresh()）
   ========================================
   ```

3. **スプレッドシートを確認**
   - スプレッドシートのタブに戻る
   - 以下のシートが作成されていることを確認:
     - CONFIG
     - RAW_VIDEO_DATA
     - RAW_DAILY_METRICS
     - VIDEO_MASTER
     - DAILY_SUMMARY
     - MONTHLY_KPI
     - VIDEO_TAGS

4. **データが入っていることを確認**
   - RAW_VIDEO_DATAシートを開く
   - 動画データが入力されていればOK

---

## 8. トラブルシューティング

### エラー: 「CLIENT_IDが設定されていません」

**原因**: Config.gsのCLIENT_IDまたはCLIENT_SECRETが正しく設定されていない

**解決方法**:
1. Config.gsを開く
2. CLIENT_IDとCLIENT_SECRETの値を確認
3. `YOUR_CLIENT_ID_HERE` や `YOUR_CLIENT_SECRET_HERE` のままになっていないか確認
4. API設定ガイドで取得した値を正しく貼り付ける
5. 保存後、再度実行

### エラー: 「YouTube APIの認証が必要です」

**原因**: OAuth認証が完了していない

**解決方法**:
1. `showAuthUrl()` を実行
2. 表示されるリンクをクリック
3. 権限を許可
4. `testYouTubeConnection()` で接続確認
5. 成功したら `initialSetup()` を再実行

### エラー: 「API Error: The request cannot be completed because you have exceeded your quota」

**原因**: YouTube APIのクォータ制限に達した

**解決方法**:
- 1日あたりのクォータ制限: 10,000ユニット
- 翌日（太平洋時間午前0時）にリセットされるまで待つ
- 初回セットアップの取得期間を短くする:
  1. Config.gsを開く
  2. `INITIAL_FETCH_DAYS: 90` を `INITIAL_FETCH_DAYS: 30` に変更
  3. 保存後、再実行

### エラー: 「Exception: Service invoked too many times」

**原因**: Apps Scriptの実行時間制限（6分）に達した

**解決方法**:
- 動画数が非常に多い場合に発生
- 取得期間を短くする（上記参照）
- または複数回に分けて実行:
  1. 最初は30日分
  2. 完了後、さらに30日分を追加取得

### エラー: 「OAuth2ライブラリが見つかりません」

**原因**: OAuth2ライブラリが正しく追加されていない

**解決方法**:
1. 左側「ライブラリ」セクションを確認
2. 「OAuth2」が表示されているか確認
3. ない場合は、「ライブラリ +」で再追加
4. ライブラリID: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF`
5. 識別子が「OAuth2」になっているか確認（他の名前だとエラー）

### エラー: 「チャンネルが見つかりませんでした」

**原因**: 認証したGoogleアカウントがYouTubeチャンネルを持っていない

**解決方法**:
1. YouTubeチャンネルを作成済みか確認
2. 正しいGoogleアカウントで認証しているか確認
3. `resetAuth()` を実行して認証をリセット
4. `showAuthUrl()` で再認証
5. 正しいアカウントを選択

---

## 次のステップ

GASセットアップが完了したら、次は **[Looker Studioセットアップガイド](./Looker_Setup_Guide_JP.md)** に進んでください。

---

## 📝 チェックリスト

完了したら☑をつけてください:

- [ ] Googleスプレッドシート「Shorts Analytics Data」を作成した
- [ ] Apps Scriptプロジェクトを開いた
- [ ] 7つのGASファイル（Code, Config, Utilities, YouTubeAPI, SheetWriter, DataProcessor, Triggers）を追加した
- [ ] OAuth2ライブラリを追加した
- [ ] Config.gsのCLIENT_IDとCLIENT_SECRETを設定した
- [ ] showAuthUrl()でOAuth認証を完了した
- [ ] testYouTubeConnection()で接続確認した
- [ ] initialSetup()で初回データ取得を完了した
- [ ] スプレッドシートに8つのシートが作成された
- [ ] RAW_VIDEO_DATAとRAW_DAILY_METRICSにデータが入った

---

**作成日**: 2026-01-09
**バージョン**: 1.0
**問い合わせ**: LOGシートのエラーログを確認するか、スクリプトエディタの実行ログを確認してください

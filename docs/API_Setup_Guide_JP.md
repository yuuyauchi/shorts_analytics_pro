# YouTube API 初期設定マニュアル

Shorts Analytics Proを使用するには、YouTube Data API v3とYouTube Analytics APIを有効化し、OAuth 2.0認証情報を取得する必要があります。

**所要時間**: 約15分

---

## 📋 目次

1. [Google Cloud Projectの作成](#1-google-cloud-projectの作成)
2. [YouTube APIの有効化](#2-youtube-apiの有効化)
3. [OAuth同意画面の設定](#3-oauth同意画面の設定)
4. [OAuth 2.0クライアントIDの作成](#4-oauth-20クライアントidの作成)
5. [認証情報の取得](#5-認証情報の取得)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. Google Cloud Projectの作成

### 手順

1. **Google Cloud Consoleにアクセス**
   - URL: https://console.cloud.google.com/
   - Googleアカウントでログイン

2. **新しいプロジェクトを作成**
   - 画面上部の「プロジェクト選択」をクリック
   - 「新しいプロジェクト」をクリック
   - プロジェクト名: `Shorts Analytics` （任意）
   - 組織: なし（個人利用の場合）
   - 「作成」をクリック

3. **プロジェクトが作成されたことを確認**
   - 画面上部に作成したプロジェクト名が表示される

---

## 2. YouTube APIの有効化

### 手順

1. **API ライブラリに移動**
   - 左側メニュー →「APIとサービス」→「ライブラリ」

2. **YouTube Data API v3を有効化**
   - 検索ボックスに「YouTube Data API v3」と入力
   - 検索結果から「YouTube Data API v3」をクリック
   - 「有効にする」ボタンをクリック

3. **YouTube Analytics APIを有効化**
   - 左上の「←」ボタンでライブラリに戻る
   - 検索ボックスに「YouTube Analytics API」と入力
   - 検索結果から「YouTube Analytics API」をクリック
   - 「有効にする」ボタンをクリック

4. **有効化の確認**
   - 左側メニュー →「APIとサービス」→「有効なAPIとサービス」
   - 「YouTube Data API v3」と「YouTube Analytics API」が表示されていればOK

---

## 3. OAuth同意画面の設定

### 手順

1. **OAuth同意画面に移動**
   - 左側メニュー →「APIとサービス」→「OAuth同意画面」

2. **User Typeを選択**
   - 「外部」を選択（個人利用の場合）
   - 「作成」をクリック

3. **アプリ情報を入力**
   - **アプリ名**: `Shorts Analytics Pro` （任意）
   - **ユーザーサポートメール**: 自分のGmailアドレスを選択
   - **デベロッパーの連絡先情報**: 自分のメールアドレスを入力
   - 「保存して次へ」をクリック

4. **スコープを設定**
   - 「スコープを追加または削除」をクリック
   - フィルタに以下を入力して検索・追加:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - 2つのスコープが追加されたことを確認
   - 「保存して次へ」をクリック

5. **テストユーザーを追加**
   - 「+ ADD USERS」をクリック
   - 自分のGmailアドレスを入力
   - 「追加」をクリック
   - 「保存して次へ」をクリック

6. **概要を確認**
   - 設定内容を確認
   - 「ダッシュボードに戻る」をクリック

---

## 4. OAuth 2.0クライアントIDの作成

### 重要な準備

先にGoogle Apps Scriptのプロジェクトを作成し、**デプロイID**を取得する必要があります。

#### Apps Scriptプロジェクトの準備

1. Google Sheetsで新しいスプレッドシートを作成
2. 「拡張機能」→「Apps Script」をクリック
3. プロジェクト名を「Shorts Analytics Automation」に変更
4. 画面右上の「デプロイ」→「新しいデプロイ」をクリック
5. 「種類の選択」で「ウェブアプリ」を選択
6. 以下を設定:
   - **説明**: 初回デプロイ
   - **次のユーザーとして実行**: 自分
   - **アクセスできるユーザー**: 全員
7. 「デプロイ」をクリック
8. **デプロイID**をコピー（後で使用）

### 手順

1. **認証情報画面に移動**
   - 左側メニュー →「APIとサービス」→「認証情報」

2. **OAuth クライアントIDを作成**
   - 画面上部の「+ 認証情報を作成」をクリック
   - 「OAuth クライアント ID」を選択

3. **アプリケーションの種類を選択**
   - アプリケーションの種類: 「ウェブ アプリケーション」
   - 名前: `Shorts Analytics OAuth Client` （任意）

4. **承認済みのリダイレクトURIを追加**
   - 「承認済みのリダイレクト URI」セクションで「+ URIを追加」をクリック
   - 以下のURLを入力:
     ```
     https://script.google.com/macros/d/{DEPLOY_ID}/usercallback
     ```
     ※ `{DEPLOY_ID}` は先ほどコピーしたデプロイIDに置き換え

   **例**:
   ```
   https://script.google.com/macros/d/AKfycbx1234567890abcdefg/usercallback
   ```

5. **作成をクリック**
   - 「作成」ボタンをクリック

---

## 5. 認証情報の取得

### 手順

1. **OAuth クライアントが作成されました**ダイアログが表示される
   - **クライアントID**: `xxxxx.apps.googleusercontent.com`
   - **クライアントシークレット**: `xxxxxxxxx`
   - この2つをコピーして安全な場所に保存

2. **後から確認する場合**
   - 「認証情報」画面に戻る
   - 作成したOAuth 2.0クライアントIDの名前をクリック
   - クライアントIDとクライアントシークレットが表示される

---

## 6. トラブルシューティング

### よくあるエラーと解決方法

#### エラー: 「リダイレクトURIが一致しません」

**原因**: リダイレクトURIが正しく設定されていない

**解決方法**:
1. Google Cloud Consoleの「認証情報」画面を開く
2. OAuth 2.0クライアントIDをクリック
3. 「承認済みのリダイレクト URI」を確認
4. Apps ScriptのデプロイIDが正しいか確認
5. URLの末尾に余分なスペースがないか確認

#### エラー: 「このアプリは確認されていません」

**原因**: OAuth同意画面が「外部」モードで、Googleの確認を受けていない

**解決方法**:
- これは正常な動作です
- 「詳細」→「Shorts Analytics Pro（安全ではないページ）に移動」をクリック
- 自分で作成したアプリなので安全です

#### エラー: 「アクセスがブロックされました」

**原因**: テストユーザーに自分のメールアドレスが追加されていない

**解決方法**:
1. Google Cloud Consoleの「OAuth同意画面」を開く
2. 「テストユーザー」セクションで自分のGmailアドレスを追加
3. 保存後、再度認証を試行

#### エラー: 「API has not been used in project before」

**原因**: YouTube APIが有効化されていない

**解決方法**:
1. 「APIとサービス」→「ライブラリ」を開く
2. 「YouTube Data API v3」と「YouTube Analytics API」を検索
3. 両方とも「有効にする」

---

## 次のステップ

API設定が完了したら、次は **[GASセットアップガイド](./GAS_Setup_Guide_JP.md)** に進んでください。

---

## 📝 チェックリスト

完了したら☑をつけてください:

- [ ] Google Cloud Projectを作成した
- [ ] YouTube Data API v3を有効化した
- [ ] YouTube Analytics APIを有効化した
- [ ] OAuth同意画面を設定した
- [ ] スコープ（youtube.readonly, yt-analytics.readonly）を追加した
- [ ] テストユーザーに自分を追加した
- [ ] Apps ScriptプロジェクトをデプロイしてIDを取得した
- [ ] OAuth 2.0クライアントIDを作成した
- [ ] リダイレクトURIを正しく設定した
- [ ] クライアントIDとシークレットをコピーした

---

**作成日**: 2026-01-09
**バージョン**: 1.0
**問い合わせ**: LOGシートのエラーログを確認するか、Google Apps Scriptコミュニティで質問してください

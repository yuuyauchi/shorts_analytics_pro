# ダミーデータ使用方法

このフォルダには、Looker Studioダッシュボードのテスト用ダミーデータが含まれています。

## ファイル一覧

### 生データ
1. **RAW_VIDEO_DATA_dummy.csv** - 動画データ（12本分）
2. **RAW_DAILY_METRICS_dummy.csv** - 日次指標データ（29日分）

### 加工データ
3. **VIDEO_MASTER_dummy.csv** - 加工済み動画データ（12本分）
4. **DAILY_SUMMARY_dummy.csv** - 日次サマリーデータ（29日分）
5. **MONTHLY_KPI_dummy.csv** - 月次KPIデータ（3ヶ月分）

### 手動入力データ
6. **VIDEO_TAGS_dummy.csv** - 動画タグデータ（12本分）

### 設定データ
7. **CONFIG_dummy.csv** - 設定情報

---

## Google Sheetsへのインポート方法

### Step 1: CSVファイルを開く

1. Finderで `dummy_data` フォルダを開く
2. `RAW_VIDEO_DATA_dummy.csv` をダブルクリックしてExcelまたはテキストエディタで開く
3. **全てのデータを選択**（Cmd+A）
4. **コピー**（Cmd+C）

### Step 2: Google Sheetsに貼り付け

1. ブラウザで「Shorts Analytics Data」スプレッドシートを開く
2. **RAW_VIDEO_DATA** シートを開く
3. **既存のデータを削除**（2行目以降を全て選択して削除）
4. **A2セル**（ヘッダーの下の最初のセル）をクリック
5. **貼り付け**（Cmd+V）
6. データが正しく貼り付けられたか確認

### Step 3: 他のシートも同様に

同じ手順で以下も実施：

#### RAW_DAILY_METRICS シート
- `RAW_DAILY_METRICS_dummy.csv` の内容をコピー
- **RAW_DAILY_METRICS** シートのA2セルに貼り付け

#### VIDEO_MASTER シート
- `VIDEO_MASTER_dummy.csv` の内容をコピー
- **VIDEO_MASTER** シートのA2セルに貼り付け

#### DAILY_SUMMARY シート
- `DAILY_SUMMARY_dummy.csv` の内容をコピー
- **DAILY_SUMMARY** シートのA2セルに貼り付け

#### MONTHLY_KPI シート
- `MONTHLY_KPI_dummy.csv` の内容をコピー
- **MONTHLY_KPI** シートのA2セルに貼り付け

#### VIDEO_TAGS シート
- `VIDEO_TAGS_dummy.csv` の内容をコピー
- **VIDEO_TAGS** シートのA2セルに貼り付け

#### CONFIG シート
- `CONFIG_dummy.csv` の内容をコピー
- **CONFIG** シートのA2セルに貼り付け

---

## データ更新後の確認

### 1. VIDEO_MASTERシートの更新

VIDEO_MASTERシートは数式で自動計算されるため、RAW_VIDEO_DATAにデータを入れると自動的に更新されます。

確認方法：
1. **VIDEO_MASTER** シートを開く
2. データが表示されているか確認

### 2. DAILY_SUMMARYシートの更新

DAILY_SUMMARYシートも数式で自動計算されます。

確認方法：
1. **DAILY_SUMMARY** シートを開く
2. 日付とデータが表示されているか確認

### 3. Looker Studioでの確認

1. Looker Studioのダッシュボードを開く
2. データが反映されない場合は、右上の **「更新」** ボタンをクリック
3. スコアカードやグラフにデータが表示されることを確認

---

## トラブルシューティング

### データが表示されない場合

1. **Google Sheetsでデータを確認**
   - RAW_VIDEO_DATAにデータが入っているか
   - VIDEO_MASTERに数式エラーがないか

2. **Looker Studioでデータソースを更新**
   - 「リソース」→「追加したデータソースを管理」
   - 各データソースの横にある「更新」アイコンをクリック

3. **キャッシュをクリア**
   - Looker Studioで「表示」→「データを更新」

---

## ダミーデータの内容

### 動画データ（RAW_VIDEO_DATA, VIDEO_MASTER）
- 12本のShorts動画（2025年12月15日〜2026年1月10日）
- 再生回数: 8,000〜26,000回
- 平均視聴維持率: 69%〜79%
- 動画の長さ: 30〜58秒
- ジャンル: ダンス、料理、筋トレ、メイク、ペット、旅行、ゲーム、DIY、ファッション、英語、掃除、スイーツ

### 日次データ（RAW_DAILY_METRICS, DAILY_SUMMARY）
- 29日分のチャンネル指標（2025年12月15日〜2026年1月12日）
- 1日あたり12,000〜26,000回の再生
- 登録者増加: 98〜245人/日
- 7日間移動平均を含む
- 曜日別データあり

### 月次データ（MONTHLY_KPI）
- 3ヶ月分のKPI（2025年11月〜2026年1月）
- 月間動画投稿数: 8〜12本
- 月間再生回数: 89,000〜234,000回
- 前月比データあり

### 動画タグデータ（VIDEO_TAGS）
- 12本の動画にカテゴリタグ付け
- タグ: ダンス、料理、筋トレ、美容、ペット、旅行、ゲーム、DIY、ファッション、英語、掃除
- 各動画にメモ（企画の特徴）付き

### 設定データ（CONFIG）
- チャンネルID
- 最終更新日時
- データ開始日
- セットアップ完了フラグ

---

## 注意事項

⚠️ このダミーデータは**テスト専用**です。実際のYouTubeデータとは無関係です。

⚠️ ダッシュボードの動作確認が完了したら、実際のYouTubeデータに切り替えてください。

⚠️ Google Apps Scriptの `initialSetup()` または `manualRefresh()` を実行すると、ダミーデータは上書きされます。

---

**作成日**: 2026-01-12

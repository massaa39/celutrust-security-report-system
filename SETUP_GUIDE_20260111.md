# 警備報告書電子化システム セットアップガイド（2026年1月11日版）

## 完成内容

本日の更新により、以下の機能が追加・改善されました：

1. PDF出力フォーマットの完全再現
   - 実際の警備報告書の雛形に準拠
   - 表形式のレイアウト
   - チェックボックス形式の業務内容選択
   - 会社情報フッター（セリュートラスト株式会社）

2. 新規フィールドの追加
   - 特記事項の詳細内容
   - 交通誘導検定合格者氏名
   - 雑踏警備検定合格者氏名
   - 備考欄

3. ファイル名フォーマットの統一
   - `セリュートラスト株式会社_YYYYMMDD_HHMMSS.pdf`

## セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - Name: security-report-system
   - Database Password: 強力なパスワードを設定
   - Region: Tokyo (asia-northeast1)
4. 「Create new project」をクリック

### 2. データベースセットアップ

1. Supabaseダッシュボードの「SQL Editor」を開く
2. 「New query」をクリック
3. `/supabase/migrations/001_initial_schema.sql`の内容を全てコピー＆ペースト
4. 「Run」をクリックしてマイグレーションを実行

### 3. ストレージバケット作成

1. Supabaseダッシュボードの「Storage」を開く
2. 「Create a new bucket」をクリック
3. バケット情報を入力：
   - Name: `report-photos`
   - Public bucket: `ON`（公開設定）
4. 「Create bucket」をクリック

### 4. ストレージポリシー設定

1. 作成した`report-photos`バケットを選択
2. 「Policies」タブを開く
3. 以下のポリシーを作成：

**アップロードポリシー:**
```sql
CREATE POLICY "認証済みユーザーは写真をアップロード可能"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-photos' 
    AND auth.role() = 'authenticated'
  );
```

**参照ポリシー:**
```sql
CREATE POLICY "全ユーザーは写真を参照可能"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-photos');
```

### 5. 管理者アカウント作成

1. Supabaseダッシュボードの「Authentication」→「Users」を開く
2. 「Add user」→「Create new user」をクリック
3. ユーザー情報を入力：
   - Email: `admin@example.com`（お好みのメールアドレス）
   - Password: 強力なパスワードを設定
   - Auto Confirm User: `ON`
4. 「Create user」をクリック
5. 作成したユーザーをクリックして編集画面を開く
6. 「User Metadata」セクションに以下のJSON形式でロールを追加：
```json
{
  "role": "admin"
}
```
7. 「Save」をクリック

### 6. 従業員アカウント作成（テスト用）

同じ手順で従業員アカウントを作成：
- Email: `employee@example.com`
- Password: 強力なパスワード
- User Metadata:
```json
{
  "role": "employee"
}
```

### 7. プロジェクト情報の取得

1. Supabaseダッシュボードの「Settings」→「API」を開く
2. 以下の情報をコピー：
   - Project URL
   - anon public key

### 8. 環境変数設定（ローカル開発）

1. プロジェクトルートで`.env.example`をコピー：
```bash
cp .env.example .env
```

2. `.env`ファイルを編集：
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9. ローカル開発サーバー起動

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` を開く

### 10. 動作確認

#### 管理者ログイン
1. メールアドレス: `admin@example.com`
2. パスワード: 設定したパスワード
3. ダッシュボードで全報告書を確認できることを確認
4. PDF出力機能が動作することを確認

#### 従業員ログイン
1. メールアドレス: `employee@example.com`
2. パスワード: 設定したパスワード
3. 「新規報告書作成」をクリック
4. 報告書フォームに必要事項を入力：
   - 契約先: 積水ハウス建設事務所(株) 御中
   - 警備場所: 大阪市都島区星陵ビル7m
   - 勤務時間: 適当な日時を選択
   - 業務内容: いずれかを選択
   - 担当業務詳細: 施設 工受
   - 写真: テスト用の画像ファイルをアップロード
   - 特記事項: 「なし」または「あり」を選択
   - 検定合格者配置: 該当する場合はチェック
5. 「報告書を送信」をクリック
6. ダッシュボードで提出した報告書を確認
7. PDF出力をクリックして、フォーマットが正しいことを確認

## Vercelデプロイ手順

### 1. GitHubリポジトリ作成

1. GitHubで新しいリポジトリを作成
2. ローカルでGit初期化とプッシュ：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/security-report-system.git
git push -u origin main
```

### 2. Vercelプロジェクト作成

1. [Vercel](https://vercel.com/)にアクセスしてログイン
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリをインポート
4. プロジェクト設定：
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: dist

### 3. 環境変数設定（Vercel）

1. 「Environment Variables」セクションで環境変数を追加：
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
2. 「Deploy」をクリック

### 4. デプロイ完了

デプロイが完了したら、Vercelが提供するURLでシステムにアクセスできます。

## 助成金申請用の証跡資料

助成金申請に必要な以下の資料を準備してください：

### 1. 導入物の写真
- PCまたはスマートフォンの画面で、本システムのログイン画面を表示した写真
- システムのタイトル「警備報告書電子化・管理システム」が表示されている画面の写真
- 報告書入力画面のスクリーンショット
- PDF出力結果のスクリーンショット

### 2. 出力した帳票類
- 実際にシステムから出力したPDFファイル
- ファイル名: `セリュートラスト株式会社_YYYYMMDD_HHMMSS.pdf`

### 3. システム仕様書
- 本READMEファイル
- `IMPLEMENTATION_REPORT.md`ファイル

## トラブルシューティング

### ログインできない
- Supabaseでユーザーが正しく作成されているか確認
- User Metadataにroleが設定されているか確認
- メールアドレスとパスワードが正しいか確認

### 写真がアップロードできない
- Storageバケット`report-photos`が作成されているか確認
- ポリシーが正しく設定されているか確認
- ファイルサイズが5MB以下か確認
- ファイル形式がJPEG、PNGか確認

### PDF出力時にエラーが発生する
- ブラウザのコンソールでエラーメッセージを確認
- 報告書データが正しく保存されているか確認

### データが表示されない
- Row Level Security (RLS)ポリシーが正しく設定されているか確認
- Supabaseのログを確認

## サポート情報

セリュートラスト株式会社  
〒674-0058 兵庫県明石市大久保町駅前二丁目1番地の10  
TEL: 078-945-5628  
FAX: 078-945-5629

## ライセンス

Copyright © 2026 セリュートラスト株式会社

---

**作成日:** 2026年1月11日  
**バージョン:** 2.0  
**作成者:** AI Assistant (Claude Sonnet 4.5)  
**発注者:** 柴田昌国様

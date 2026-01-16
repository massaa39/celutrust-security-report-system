# 警備報告書電子化・管理システム

警備報告書を電子化し、スマートフォンやPCから送信・管理できるWebアプリケーションです。

## 主要機能

- 報告書撮影・送信機能（写真アップロード）
- データ受信・保存機能（クラウドサーバー）
- 管理者画面：一覧表示、検索、PDF出力
- 利用履歴ログ（提出時間、提出者ID）

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite + TailwindCSS
- **バックエンド**: Supabase (BaaS)
- **認証**: Supabase Auth
- **データベース**: PostgreSQL (Supabase)
- **ストレージ**: Supabase Storage
- **PDF生成**: jsPDF
- **ホスティング**: Vercel
- **テスト**: Vitest + Testing Library

## セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から以下の情報を取得：
   - Project URL
   - Anon key

### 2. データベースセットアップ

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase/migrations/001_initial_schema.sql`の内容をコピーして実行
3. テーブルとRLSポリシーが作成されます

### 3. ストレージバケット作成

1. Supabaseダッシュボードの「Storage」を開く
2. 新しいバケットを作成：
   - バケット名: `report-photos`
   - Public: `true`
3. ポリシーを設定（認証済みユーザーのみアップロード可能）

### 4. 環境変数設定

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

`.env`に以下の値を設定：

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. 依存関係インストール

```bash
npm install
```

### 6. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く

## ユーザー作成

### 従業員アカウント作成

Supabaseダッシュボードの「Authentication」から新規ユーザーを作成：

1. Email: `employee@example.com`
2. Password: 任意のパスワード
3. User Metadata に追加：
   ```json
   {
     "role": "employee"
   }
   ```

### 管理者アカウント作成

1. Email: `admin@example.com`
2. Password: 任意のパスワード
3. User Metadata に追加：
   ```json
   {
     "role": "admin"
   }
   ```

## テスト実行

```bash
npm run test
```

## ビルド

```bash
npm run build
```

## デプロイ（Vercel）

### 1. Vercelアカウント作成

[Vercel](https://vercel.com/)でアカウント作成

### 2. GitHubリポジトリ連携

1. GitHubにリポジトリを作成
2. コードをプッシュ
3. VercelでGitHubリポジトリをインポート

### 3. 環境変数設定

Vercelのプロジェクト設定で環境変数を追加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. デプロイ

自動的にデプロイが開始されます。

## 使い方

### 従業員

1. ログインページでメールアドレスとパスワードを入力
2. 「新規報告書作成」ボタンをクリック
3. 報告書フォームに必要事項を入力
4. 写真をアップロード（最大5MB/枚）
5. 「報告書を送信」をクリック
6. ダッシュボードで過去の報告書を確認

### 管理者

1. ログインページでメールアドレスとパスワードを入力
2. ダッシュボードで全従業員の報告書を確認
3. 検索フィルターで絞り込み
4. 個別PDF出力または一括PDF出力

## データ保存期間

報告書データは1年間保存されます。Supabaseの自動バックアップにより過去7日分のデータが保護されます。

## セキュリティ

- Row Level Security (RLS) による権限管理
- HTTPS通信の強制
- 画像ファイルのみアップロード可能（JPEG, PNG）
- 最大ファイルサイズ制限: 5MB/枚

## サポート

セリュートラスト株式会社  
〒674-0058 兵庫県明石市大久保町駅前二丁目1番地の10  
TEL: 078-945-5628  
FAX: 078-945-5629

## ライセンス

Copyright © 2026 セリュートラスト株式会社

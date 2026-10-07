# my_webpage

STELAQ に在籍する小口 悠の情報を掲載するウェブページです。

## 概要

- **目的**: 小口 悠のプロフィール・スキル・お知らせを掲載する
- **所属**: 株式会社STELAQ ソフトウェアエンジニアリング事業部 開発第３課 第４チーム
- **運用方針**: 今後、必要に応じて内容を追加・更新していく
- **構成**: HTML / CSS / JavaScript のみの静的サイト（ビルド不要・外部ライブラリなし）
- **公開**: Cloudflare Workers（GitHub の `master` ブランチへの push で自動デプロイ）

## ページ構成

| セクション | 内容 |
| --- | --- |
| トップ | 名前と肩書き。マウス操作で遊べるボール状のキャラクター。画面下部に「下にスクロール」の案内 |
| News | お知らせ一覧（日付順） |
| Skills | OS・言語・DB・ツール・保有資格、担当工程と経験年数 |
| About | 所属・役職・学位 |

### トップ画面のキャラクター

- 目がマウスカーソルを追いかける
- カーソルを近づけると照れる、なでると跳ねる
- ドラッグでつかんで投げられる（ボール同士もぶつかる）
- クリックするとジャンプして話しかけてくる
- スマートフォンではタッチ操作に対応

## ファイル構成

```
my_webpage/
├── public/              # 公開されるファイル（この中身だけがウェブに配信される）
│   ├── index.html       # ページ本体（各セクションの内容）
│   ├── css/style.css    # デザイン（配色・レイアウト）
│   └── js/balls.js      # トップ画面のキャラクター（Canvas による描画と物理演算）
├── wrangler.jsonc       # Cloudflare Workers の設定
└── README.md
```

公開したいファイル（画像など）は必ず `public/` の中に置いてください。`public/` の外にあるファイルは公開されません。

## ローカルでの実行方法

ローカルサーバーを起動して確認します。ビルドは不要で、Python 3 が入っていれば追加のインストールも不要です。

```bash
cd ~/work/my_webpage
python3 -m http.server 8000 -d public
```

起動したら、ブラウザで <http://localhost:8000> を開きます（WSL の場合も Windows 側のブラウザからこの URL で開けます）。
終了するときはターミナルで `Ctrl + C` を押します。

ポート 8000 が使用中の場合は、`python3 -m http.server 8080 -d public` のように別の番号を指定してください。

## 公開（Cloudflare Workers へのデプロイ）

GitHub リポジトリ（private）と Cloudflare Workers を連携し、`master` ブランチに push すると自動でデプロイされます。

### 初回設定（Cloudflare ダッシュボードで 1 回だけ行う）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインし、**Workers & Pages** → **Create** を開く
2. **Import a repository** を選び、GitHub アカウントを連携する
   - GitHub 側で「Cloudflare Workers and Pages」アプリのインストール画面が出るので、
     `my_webpage` リポジトリへのアクセスを許可する（private リポジトリでも可）
3. リポジトリ `my_webpage` を選び、次のように設定して **Deploy** する

   | 項目 | 設定値 |
   | --- | --- |
   | Project name | `my-webpage`（`wrangler.jsonc` の `name` と同じにする） |
   | Build command | 空欄（ビルド不要） |
   | Deploy command | `npx wrangler deploy` |
   | Production branch | `master` |

4. デプロイが完了すると `https://my-webpage.<アカウントのサブドメイン>.workers.dev` で公開される

### 2 回目以降

`master` ブランチに push するだけで自動的にデプロイされます。
デプロイの状況やログは、ダッシュボードの **Workers & Pages** → `my-webpage` → **Deployments** で確認できます。


## 更新履歴

更新を行った際は、新しいものが上に来るように追記してください。

### 2026-10-07

- README.md のローカルでの実行方法をローカルサーバーで開く方法のみに整理
- トップ画面の下部に「下にスクロール」の案内を追加
  - クリックすると News セクションへ移動する
  - 案内とキャラクターが重ならないよう、キャラクターが着地する床の位置を上げた
- Cloudflare Workers での公開に対応
  - 公開ファイルを `public/` ディレクトリに移動
  - Cloudflare Workers の設定ファイル `wrangler.jsonc` を追加
  - README.md にデプロイ手順を追記
- README.md にローカルでの実行方法を追記
- ウェブページを作成
  - トップ画面にマウス操作で動くボール状のキャラクターを追加
  - News / Skills / About セクションを追加
- README.md を追加（本アプリケーションの概要と更新履歴を記載）

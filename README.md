# 前提

## 知識

本ハンズオンでは、ベクトル検索の基本的な考え方を理解していることを前提としています。「ベクトル検索が初めて」という方は、以下の動画で概要を確認してから進めてください。

- [ベクトルDB入門｜Aurora x ベクトル検索｜ハンズオン！](https://www.youtube.com/watch?v=1PYL9CUARrA)

※ ベクトル検索とは何か、ベクトルDBの基本について解説しています。

## 環境

本ハンズオンを実施するには、以下の環境が必要です。

- AWS アカウント
- Node.js
  - v22.14.0 で動作確認
- ローカル環境から AWS SDK を利用できる認証設定  
  - AWS CLI の設定済みプロファイル、SSO、IAM Role など

# 手順

本ハンズオンは、以下のステップで進めます。

- S3 Vectorsバケット・インデックスを作成
- 作品概要からEmbeddingを生成
- S3 Vectors用フォーマットに変換
- S3 Vectorsへベクトルを登録
- 類似度検索を実行

# S3 Vectorsバケット・インデックスを作成

## S3 Vectorsバケット

- ベクトルバケット名:
  - `aozora-books`

## ベクトルインデックスを作成

- ベクトルインデックス名:
  - `aozora-books-index`
- ディメンション:
  - `1024`
- 距離メトリック:
  - `コサイン`


# 作品概要からEmbeddingを生成

## 環境変数を確認

`.env` を確認。変更無しで動く想定です。

## ライブラリのインストール

```
npm install
```

## Embedding生成スクリプトを実行

`/articles` に配置された、青空文庫100冊分の作品概要データからEmbeddingを生成します。

```
node 1_createEmbedding.mjs
```

# S3 Vectors用フォーマットに変換

S3 Vectors に登録できる形式にデータを変換します。

```
node 2_createS3VectorsInput.mjs
```

# S3 Vectorsへベクトルを登録

AWS SDK を使って、S3 Vectors にベクトルデータを登録します。

```
node 3_putS3Vectors.mjs
```

# 類似度検索を実行

## 検索ワードを設定

今の気分に合った本を検索します。検索したいワードを変数にセットしてください。

```
const queryText = "恋をしたい";
```

## 類似検索スクリプトを実行

```
node 4_queryS3Vectors.mjs
```

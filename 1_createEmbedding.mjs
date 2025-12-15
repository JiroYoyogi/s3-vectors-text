import fs from "node:fs";
import path from "node:path";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "ap-northeast-1";
const BEDROCK_EMBED_MODE =
  process.env.BEDROCK_EMBED_MODEL ?? "amazon.titan-embed-text-v2:0";

const IN_DIR = path.resolve("articles");
const OUT_DIR = path.resolve("articles-embed");

const client = new BedrockRuntimeClient({ region: BEDROCK_REGION });

(async () => {
  try {
    // 読み込み先のディレクトリの存在チェック
    if (!fs.existsSync(IN_DIR)) {
      throw new Error(`Directory not found: ${IN_DIR}`);
    }
    // 出力先ディレクトリ作成
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // JSONファイル名一覧を取得。青空文庫の作品概要を格納したJSON
    const jsonList = fs
      .readdirSync(IN_DIR)
      .filter((f) => path.extname(f).toLowerCase() === ".json");

    if (jsonList.length === 0) {
      throw new Error(`No json files found in directory: ${IN_DIR}`);
    }

    // 概要をEmbedding。Embeddingを含むJSONを作成
    for (const fileName of jsonList) {
      const filePath = path.join(IN_DIR, fileName);
      const raw = fs.readFileSync(filePath, "utf-8");
      const articleJson = JSON.parse(raw);
      // 概要テキスト
      const summary = articleJson.summary;
      if (!summary || typeof summary !== "string") {
        throw new Error(`Invalid JSON (missing summary string): ${fileName}`);
      }

      // Text Embedding (Titan Text Embeddings v2)
      const body = JSON.stringify({
        inputText: summary,
        dimensions: 1024,
      });

      const res = await client.send(
        new InvokeModelCommand({
          modelId: BEDROCK_EMBED_MODE,
          contentType: "application/json",
          body: new TextEncoder().encode(body),
        })
      );

      const embedJson = JSON.parse(new TextDecoder().decode(res.body));
      const embedding = embedJson?.embedding ?? null;

      if (!Array.isArray(embedding)) {
        throw new Error(
          `Unexpected embedding response for ${fileName}: ${JSON.stringify(
            embedJson
          ).slice(0, 300)}`
        );
      }

      const out = {
        ...articleJson,
        embedding: embedding,
        dim: embedding.length,
      };

      const key = path.parse(fileName).name;

      const outPath = path.join(OUT_DIR, `${key}-embed.json`);
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

      console.log(`Embedding saved for ${key} (dim=${embedding.length})`);

    }

    console.log("Done.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

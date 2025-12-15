import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3VectorsClient, QueryVectorsCommand } from "@aws-sdk/client-s3vectors";
import dotenv from "dotenv";

dotenv.config();

const BEDROCK_REGION = process.env.BEDROCK_REGION ?? "ap-northeast-1";
const TEXT_EMBED_MODEL =
  process.env.BEDROCK_TEXT_EMBED_MODEL ?? "amazon.titan-embed-text-v2:0";
const S3_VECTORS_REGION = process.env.S3_VECTORS_REGION;
const VECTOR_BUCKET_NAME = process.env.VECTOR_BUCKET_NAME;
const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME;

const bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });
const s3vectorsClient = new S3VectorsClient({ region: S3_VECTORS_REGION });

(async () => {
  try {
    if (
      !BEDROCK_REGION ||
      !TEXT_EMBED_MODEL ||
      !S3_VECTORS_REGION ||
      !VECTOR_BUCKET_NAME ||
      !VECTOR_INDEX_NAME
    ) {
      throw new Error(
        "Required environment variables are not set (BEDROCK_REGION, TEXT_EMBED_MODEL, S3_VECTORS_REGION, VECTOR_BUCKET_NAME, VECTOR_INDEX_NAME)."
      );
    }

    const queryText = "恋をしたい";
    console.log(`Query text: "${queryText}"`);
    // 検索ワードをEmbedding
    const queryEmbedding = await createEmbedding(queryText);
    console.log(`Embedding created (dim=${queryEmbedding.length})`);

    const res = await s3vectorsClient.send(
      new QueryVectorsCommand({
        vectorBucketName: VECTOR_BUCKET_NAME,
        indexName: VECTOR_INDEX_NAME,
        topK: 5,
        queryVector: { float32: queryEmbedding },
        returnDistance: true,
        returnMetadata: true,
      })
    );

    console.log("Search results:");

    for (const [i, item] of res.vectors.entries()) {
      console.log(
        `${i + 1}. key=${item.key}, distance=${item.distance?.toFixed(4)}, title=${item.metadata?.title}`
      );
    }

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

async function createEmbedding(text) {
  const body = JSON.stringify({
    inputText: text,
  });

  const res = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: TEXT_EMBED_MODEL,
      contentType: "application/json",
      body: new TextEncoder().encode(body),
    })
  );

  const json = JSON.parse(new TextDecoder().decode(res.body));
  const embedding = json?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error("Failed to create embedding from text.");
  }

  return embedding;
}
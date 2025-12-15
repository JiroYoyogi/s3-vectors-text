import fs from "node:fs";
import path from "node:path";

const IN_DIR = path.resolve("articles-embed");
const OUT_DIR = path.resolve("articles-vectors");

(async () => {
  try {
    // 読み込み先のディレクトリの存在チェック
    if (!fs.existsSync(IN_DIR)) {
      throw new Error(`Directory not found: ${IN_DIR}`);
    }
    // 出力先ディレクトリ作成
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // JSONファイル名一覧を取得。Embeddingを格納したJSON
    const jsonList = fs
      .readdirSync(IN_DIR)
      .filter((f) => path.extname(f).toLowerCase() === ".json");

    if (jsonList.length === 0) {
      throw new Error(`No json files found in directory: ${IN_DIR}`);
    }

    for (const fileName of jsonList) {
      const filePath = path.join(IN_DIR, fileName);
      const raw = fs.readFileSync(filePath, "utf-8");
      const articleJson = JSON.parse(raw);

      if (!Array.isArray(articleJson.embedding)) {
        throw new Error(`Invalid embedding in file: ${fileName}`);
      }

      const baseName = path.parse(fileName).name;
      const key = String(baseName.replace(/-embed$/, ""));

      const out = {
        key,
        data: { float32: articleJson.embedding },
        metadata: {
          fileName: `${key}.json`,
          title: articleJson.title,
        },
      };

      const outPath = path.join(OUT_DIR, `${key}-vectors.json`);
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

      console.log(
        `saved S3 Vectors input: ${outPath} (key=${key}, dim=${articleJson.embedding.length})`
      );
    }

    console.log("Done.");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
})();

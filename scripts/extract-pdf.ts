/**
 * Extract raw text from a PDF into per-page text files under raw/.
 *
 * Usage:
 *   npx tsx scripts/extract-pdf.ts phb
 *   npx tsx scripts/extract-pdf.ts mm
 *   npx tsx scripts/extract-pdf.ts phb "D:\path\to\file.pdf"
 *
 * Env (optional):
 *   PHB_PDF_PATH, MM_PDF_PATH
 */
import { createRequire } from "module";
import { promises as fs } from "fs";
import path from "path";

const require = createRequire(import.meta.url);

type BookKey = "phb" | "mm";

const DEFAULTS: Record<BookKey, string> = {
  phb:
    process.env.PHB_PDF_PATH ||
    "D:\\Descargas\\Manual del Jugador 2024.pdf",
  mm:
    process.env.MM_PDF_PATH ||
    "D:\\Descargas\\Manual de Monstruos - Ingles.pdf",
};

async function main() {
  const book = (process.argv[2] || "").toLowerCase() as BookKey;
  if (book !== "phb" && book !== "mm") {
    console.error("Usage: npx tsx scripts/extract-pdf.ts <phb|mm> [pdfPath]");
    process.exit(1);
  }

  const pdfPath = process.argv[3] || DEFAULTS[book];
  const outDir = path.join(process.cwd(), "raw", book);

  await fs.access(pdfPath).catch(() => {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  });

  await fs.mkdir(outDir, { recursive: true });

  // unpdf works in Node and returns text per page
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buffer = await fs.readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });

  const pages = Array.isArray(text) ? text : [text];
  console.log(`Extracting ${totalPages} pages from ${pdfPath}`);

  const index: { page: number; file: string; chars: number }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const fileName = `page-${String(pageNum).padStart(4, "0")}.txt`;
    const content = pages[i] || "";
    await fs.writeFile(path.join(outDir, fileName), content, "utf-8");
    index.push({ page: pageNum, file: fileName, chars: content.length });
    if (pageNum % 25 === 0 || pageNum === pages.length) {
      console.log(`  wrote page ${pageNum}/${pages.length}`);
    }
  }

  await fs.writeFile(
    path.join(outDir, "index.json"),
    JSON.stringify(
      {
        book,
        source: pdfPath,
        extractedAt: new Date().toISOString(),
        totalPages: pages.length,
        pages: index,
      },
      null,
      2,
    ),
    "utf-8",
  );

  // Full dump for grepping
  await fs.writeFile(
    path.join(outDir, "full.txt"),
    pages
      .map((p, i) => `\n\n===== PAGE ${i + 1} =====\n\n${p}`)
      .join(""),
    "utf-8",
  );

  console.log(`Done. Output: ${outDir}`);
  console.log(
    "Next: search raw text, then curate into content/ with scripts/curate-from-raw.ts",
  );

  // silence unused require if tree-shaking complains
  void require;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

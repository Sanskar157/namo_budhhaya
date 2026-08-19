import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { PDFParse } from "pdf-parse";

// 1. Extract the text 
async function loadPdfText(filePath: string): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(readFileSync(filePath)),
  });
  
  try {
    const { pages } = await parser.getText();
    // The verses start on PDF page 11 (index 10). 
    // We slice the array to only grab text from page 11 onwards.
    const relevantPages = pages.slice(10);
    
    // Join the relevant pages back into a single string
    return relevantPages.map((p: any) => p.text).join("\n");
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const filePath = path.join(process.cwd(), "scripts", "Dhammapada (English and Pali).pdf");
  const outputPath = path.join(process.cwd(), "scripts", "parsed_verses.json");
  
  console.log(`Loading PDF from ${filePath}...`);
  const rawText = await loadPdfText(filePath);
  
  // 1. Split the text line by line to process sequentially
  const lines = rawText.split('\n');
  const documents: Document[] = [];
  
  // 2. Track the current chapter state
  let currentChapterNumber = 0;
  let currentChapterName = "Unknown";
  
  // Regex to match chapter headings (e.g., "1 • Twin Verses" or "2. Vigilance")
  // We look for a number, a dot or bullet, and some text.
  const chapterRegex = /^(\d+)\s*[•\.]\s*(.+)$/;
  const verseRegex = /^(\d+)\./;

  let currentVerseBuffer = "";
  let currentVerseNumber: number | null = null;

  // Helper function to save a completed verse chunk
  const pushVerseChunk = () => {
    if (currentVerseBuffer.trim() && currentVerseNumber !== null) {
      // Do not push Table of Contents lines
      if (!currentVerseBuffer.includes("……")) {
        documents.push(
          new Document({
            pageContent: currentVerseBuffer.trim(),
            metadata: { 
              source: "Dhammapada (English and Pali).pdf",
              type: "verse",
              chapterNumber: currentChapterNumber,
              chapterName: currentChapterName,
              verseNumber: currentVerseNumber 
            },
          })
        );
      }
    }
    currentVerseBuffer = "";
  };

  // 3. Sequential Parsing
  for (const line of lines) {
    const cleanLine = line.trim();

    // Check if the line is a Chapter Heading
    const chapterMatch = cleanLine.match(chapterRegex);
    if (chapterMatch && !cleanLine.includes("……")) {
      // It's a new chapter!
      currentChapterNumber = parseInt(chapterMatch[1], 10);
      currentChapterName = chapterMatch[2].trim();
      continue; // Move to the next line
    }

    // Check if the line is the start of a New Verse
    const verseMatch = cleanLine.match(verseRegex);
    if (verseMatch && !cleanLine.includes("……")) {
      // Save the previous verse before starting a new one
      pushVerseChunk(); 
      currentVerseNumber = parseInt(verseMatch[1], 10);
      currentVerseBuffer = cleanLine;
    } else if (currentVerseNumber !== null) {
      // If we are currently inside a verse, keep appending the text
      currentVerseBuffer += "\n" + cleanLine;
    }
  }

  // Push the very last verse in the document
  pushVerseChunk();

  writeFileSync(outputPath, JSON.stringify(documents, null, 2), "utf-8");
  console.log(`Saved chunks to ${outputPath}`);
}

main().catch((err) => {
  console.error("Error during ingestion:", err);
  process.exit(1);
});
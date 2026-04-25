// 단원(Tag) 개념 정리. BE `ConceptNoteResponse` 와 1:1.

export interface ConceptNote {
  tagId: number;
  tagName: string;
  /** Markdown 본문 (헤딩/리스트). */
  content: string;
  /** "LLM" | "FALLBACK" | "MANUAL" */
  source: string;
  /** ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss[.SSS]`) */
  generatedAt: string;
}

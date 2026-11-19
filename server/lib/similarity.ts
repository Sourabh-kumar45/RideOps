/**
 * Keyword similarity between ticket descriptions (TF-IDF + cosine).
 *
 * Why this and not an LLM: there are only ~200 distinct descriptions, the
 * scores are explainable ("shares these words"), it runs in microseconds, and
 * it needs no API key.
 *
 * Text is first normalised to an "issue key": lower-case, numbers and filler
 * words dropped, words stemmed. Templated descriptions such as
 * "SSO login failing for 22 users" and "... for 35 users" share one key, so
 * they count as the same issue.
 */

/** Words that carry no meaning for matching. */
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "for", "from", "has", "have",
  "in", "is", "it", "its", "of", "on", "or", "our", "the", "their", "this", "to", "was", "we",
  "were", "with", "after", "even", "still", "while", "last", "since", "please", "pls", "many",
  "some", "all", "any", "very",
]);

/** Suffixes removed by the stemmer, tried in this order (only one is removed). */
const SUFFIXES = ["ing", "ed", "es", "s"];

/**
 * Light stemmer: "changed", "changes", "changing" and "change" all become "chang".
 * Never shortens a word below 3 letters and leaves "-ss" words ("address") alone.
 */
function stem(word: string): string {
  let out = word;
  for (const suffix of SUFFIXES) {
    if (suffix === "s" && out.endsWith("ss")) continue;
    if (out.endsWith(suffix) && out.length - suffix.length >= 3) {
      out = out.slice(0, -suffix.length);
      break;
    }
  }
  return out.endsWith("e") && out.length > 3 ? out.slice(0, -1) : out;
}

/** Splits text into stemmed keywords, dropping numbers and stopwords. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !/^\d+$/.test(word) && !STOPWORDS.has(word))
    .map(stem);
}

/** The issue key for a description: its keywords joined by spaces. */
export function issueKey(text: string): string {
  return tokenize(text).join(" ");
}

/** A scored match against one indexed issue key. */
export interface Match {
  key: string;
  score: number;
}

type Vector = Map<string, number>;

/** An index over a fixed set of issue keys that scores free text against them. */
export interface SimilarityIndex {
  /** All keys with score > 0, best first. Scores are cosine similarity, 0..1. */
  search(query: string): Match[];
}

/** Builds a TF-IDF index over issue keys (from `issueKey`). Duplicates are ignored. */
export function buildIndex(keys: string[]): SimilarityIndex {
  const unique = [...new Set(keys)].filter(Boolean);
  const tokenLists = unique.map((key) => key.split(" "));

  // Inverse document frequency: rare words weigh more than common ones.
  const docFreq = new Map<string, number>();
  for (const tokens of tokenLists) {
    for (const token of new Set(tokens)) docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
  }
  const idf = (token: string) => Math.log(1 + unique.length / (1 + (docFreq.get(token) ?? 0)));

  const toVector = (tokens: string[]): Vector => {
    const vector: Vector = new Map();
    for (const token of tokens) vector.set(token, (vector.get(token) ?? 0) + idf(token));
    return normalise(vector);
  };

  const vectors = tokenLists.map(toVector);

  return {
    search(query) {
      const q = toVector(tokenize(query));
      if (q.size === 0) return [];
      return unique
        .map((key, i) => ({ key, score: dot(q, vectors[i]) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score);
    },
  };
}

/** Scales a vector to unit length so the dot product is the cosine. */
function normalise(vector: Vector): Vector {
  let norm = 0;
  for (const v of vector.values()) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (const [k, v] of vector) vector.set(k, v / norm);
  return vector;
}

/** Dot product of two sparse vectors. */
function dot(a: Vector, b: Vector): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [k, v] of small) sum += v * (large.get(k) ?? 0);
  return sum;
}

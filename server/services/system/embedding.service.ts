import crypto from "node:crypto";
import { ResultAsync } from "neverthrow";
import { type AppError, InternalError } from "../../lib/errors.js";

const EMBEDDING_DIMENSIONS = 384;

/**
 * Generates a deterministic 384-dimensional normalized vector embedding
 * from text input using token/character n-gram feature hashing and projection.
 */
export function generateEmbedding(text: string): number[] {
  if (!text || typeof text !== "string") {
    return Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  }

  const normalized = text.toLowerCase().trim();
  const vector = new Float64Array(EMBEDDING_DIMENSIONS);

  // 1. Tokenize words and n-grams
  const words = normalized.split(/[\s,._\-+/()]+/).filter((w) => w.length > 0);
  const ngrams: string[] = [...words];

  // Generate 2-word shingles
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (w1 && w2) {
      ngrams.push(`${w1}_${w2}`);
    }
  }

  // Generate character 3-grams for typo & morphology resilience
  for (const word of words) {
    if (word && word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        ngrams.push(`ch:${word.substring(i, i + 3)}`);
      }
    }
  }

  // 2. Hash each n-gram into feature space with semantic weight
  for (const token of ngrams) {
    const hash = crypto.createHash("sha256").update(token).digest();
    // Use pairs of bytes to compute index and sign
    for (let i = 0; i < hash.length - 3; i += 4) {
      const index = hash.readUInt16LE(i) % EMBEDDING_DIMENSIONS;
      const weight = hash.readInt16LE(i + 2) / 32768.0;
      vector[index] = (vector[index] ?? 0) + weight;
    }
  }

  // 3. L2 Euclidean Normalization
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const val = vector[i] ?? 0;
    sumSq += val * val;
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    const result = new Array<number>(EMBEDDING_DIMENSIONS);
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      const val = vector[i] ?? 0;
      result[i] = Number((val / norm).toFixed(6));
    }
    return result;
  }

  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
}

/**
 * Computes cosine similarity between two vector embeddings
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Async neverthrow wrapper for embedding generation
 */
export function generateEmbeddingAsync(text: string): ResultAsync<number[], AppError> {
  return ResultAsync.fromPromise(
    Promise.resolve(generateEmbedding(text)),
    (err) => new InternalError("Failed to generate embedding", { error: String(err) }),
  );
}

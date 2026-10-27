import { QAPair } from '../../types';
import { getQAPairs } from './dataset';
import { preprocessText } from './preprocessor';

export interface TFIDFDoc {
  id: number;
  question: string;
  answer: string;
  intent: string;
  terms: string[];
  vector: Map<string, number>;
  norm: number;
}

export interface TFIDFMatch {
  doc: TFIDFDoc;
  score: number;
  matchedTerms: string[];
}

export class TFIDFIndex {
  private docs: TFIDFDoc[] = [];
  private df: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private N: number = 0;
  private vocabulary: Set<string> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.buildIndex();
  }

  public buildIndex(qaPairs?: QAPair[]) {
    const pairs = qaPairs || getQAPairs();
    this.N = pairs.length;
    this.docs = [];
    this.df.clear();
    this.idf.clear();
    this.vocabulary.clear();

    // 1. Tokenize and compute DF
    for (const pair of pairs) {
      const prep = preprocessText(pair.question, {
        enableSpellingCorrection: true,
        enableStemming: true,
        enableBigrams: true,
      });

      const allTerms = [...prep.stemmedTokens, ...prep.bigrams];
      const uniqueTerms = new Set(allTerms);

      for (const term of uniqueTerms) {
        this.vocabulary.add(term);
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }

      this.docs.push({
        id: pair.id,
        question: pair.question,
        answer: pair.answer,
        intent: pair.intent,
        terms: allTerms,
        vector: new Map(),
        norm: 0,
      });
    }

    // 2. Compute IDF: log((1 + N) / (1 + df)) + 1
    for (const [term, freq] of this.df.entries()) {
      const idfValue = Math.log((1 + this.N) / (1 + freq)) + 1.0;
      this.idf.set(term, idfValue);
    }

    // 3. Compute TF-IDF vectors for each document
    for (const doc of this.docs) {
      const termCounts = new Map<string, number>();
      for (const t of doc.terms) {
        termCounts.set(t, (termCounts.get(t) || 0) + 1);
      }

      let sumSq = 0;
      for (const [t, count] of termCounts.entries()) {
        const tf = count / doc.terms.length;
        const idfVal = this.idf.get(t) || 1.0;
        const tfidf = tf * idfVal;
        doc.vector.set(t, tfidf);
        sumSq += tfidf * tfidf;
      }

      doc.norm = Math.sqrt(sumSq) || 1.0;
    }

    this.initialized = true;
  }

  public getVocabularySize(): number {
    return this.vocabulary.size;
  }

  public getDF(term: string): number {
    return this.df.get(term) || 0;
  }

  public getIDF(term: string): number {
    return this.idf.get(term) || 0;
  }

  public search(
    queryTerms: string[],
    topK: number = 5
  ): TFIDFMatch[] {
    if (!this.initialized) this.buildIndex();

    // Query TF-IDF vector
    const queryCounts = new Map<string, number>();
    for (const t of queryTerms) {
      queryCounts.set(t, (queryCounts.get(t) || 0) + 1);
    }

    const queryVector = new Map<string, number>();
    let qSumSq = 0;

    for (const [t, count] of queryCounts.entries()) {
      if (this.vocabulary.has(t)) {
        const tf = count / queryTerms.length;
        const idfVal = this.idf.get(t) || 1.0;
        const tfidf = tf * idfVal;
        queryVector.set(t, tfidf);
        qSumSq += tfidf * tfidf;
      }
    }

    const qNorm = Math.sqrt(qSumSq);
    if (qNorm === 0) {
      return this.docs.slice(0, topK).map((doc) => ({
        doc,
        score: 0,
        matchedTerms: [],
      }));
    }

    // Cosine similarity against all documents
    const matches: TFIDFMatch[] = [];

    for (const doc of this.docs) {
      let dotProduct = 0;
      const matchedTerms: string[] = [];

      for (const [term, qVal] of queryVector.entries()) {
        const dVal = doc.vector.get(term);
        if (dVal !== undefined) {
          dotProduct += qVal * dVal;
          matchedTerms.push(term);
        }
      }

      const cosineSim = dotProduct / (qNorm * doc.norm);
      matches.push({
        doc,
        score: Math.max(0, Math.min(1.0, cosineSim)),
        matchedTerms,
      });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  public getAllDocs(): TFIDFDoc[] {
    return this.docs;
  }
}

export const globalTFIDF = new TFIDFIndex();

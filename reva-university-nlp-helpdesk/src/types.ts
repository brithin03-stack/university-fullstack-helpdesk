export interface QAPair {
  id: number;
  question: string;
  answer: string;
  intent: string;
  normalizedQuestion?: string;
  tokens?: string[];
  stemmedTokens?: string[];
}

export interface PreprocessingResult {
  original: string;
  normalizedText: string;
  tokens: string[];
  stemmedTokens: string[];
  removedStopwords: string[];
  spellingCorrections: Record<string, string>;
  bigrams: string[];
}

export interface MatchCandidate {
  id: number;
  question: string;
  answer: string;
  intent: string;
  tfidfScore: number;
  semanticScore: number;
  hybridScore: number;
  matchedTokens: string[];
}

export interface RetrievalResult {
  answer: string;
  source: 'dataset' | 'ai_fallback';
  confidence: number;
  matched_question: string;
  intent: string;
  tfidf_score: number;
  semantic_score: number;
  hybrid_score: number;
  top_matches: MatchCandidate[];
  preprocessing: PreprocessingResult;
  decision_rationale: string;
  processing_time_ms: number;
  llm_model?: string;
  llm_generated?: boolean;
  thresholds: {
    highConfidenceThreshold: number;
    moderateConfidenceThreshold: number;
    tfidfWeight: number;
    semanticWeight: number;
  };
}

export interface PipelineConfig {
  tfidfWeight: number;
  semanticWeight: number;
  highConfidenceThreshold: number;
  moderateConfidenceThreshold: number;
  enableSpellingCorrection: boolean;
  enableStemming: boolean;
  enableBigrams: boolean;
}

export interface BenchmarkCase {
  id: string;
  category: 'exact' | 'paraphrase' | 'synonym' | 'spelling_error' | 'unrelated_general' | 'university_not_in_dataset';
  categoryLabel: string;
  userQuestion: string;
  expectedSource: 'dataset' | 'ai_fallback';
  expectedIntent?: string;
  expectedQuestionSubstring?: string;
  description: string;
}

export interface BenchmarkResultItem {
  benchmarkCase: BenchmarkCase;
  retrievalResult: RetrievalResult;
  passed: boolean;
  notes: string;
}

export interface BenchmarkReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  accuracyRate: number;
  averageHybridScore: number;
  averageLatencyMs: number;
  items: BenchmarkResultItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: RetrievalResult;
  loading?: boolean;
}

export interface DatasetStats {
  totalRecords: number;
  intentsCount: Record<string, number>;
  vocabularySize: number;
  avgQuestionLength: number;
  avgAnswerLength: number;
  allIntents: string[];
}

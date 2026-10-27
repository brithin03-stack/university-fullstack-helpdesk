import {
  MatchCandidate,
  PipelineConfig,
  RetrievalResult,
} from '../../types';
import { detectIntent, getQAPairs } from './dataset';
import { preprocessText } from './preprocessor';
import { globalTFIDF } from './tfidf';
import { globalSemanticIndex } from './semantic';

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  tfidfWeight: 0.4,
  semanticWeight: 0.6,
  highConfidenceThreshold: 0.75,
  moderateConfidenceThreshold: 0.55,
  enableSpellingCorrection: true,
  enableStemming: true,
  enableBigrams: true,
};

/**
 * Executes the full hybrid NLP retrieval pipeline on a user query
 */
export function executeHybridRetrieval(
  query: string,
  userConfig?: Partial<PipelineConfig>
): RetrievalResult {
  const startTime = Date.now();
  const config: PipelineConfig = {
    ...DEFAULT_PIPELINE_CONFIG,
    ...userConfig,
  };

  // Step 1: Preprocessing
  const prep = preprocessText(query, {
    enableSpellingCorrection: config.enableSpellingCorrection,
    enableStemming: config.enableStemming,
    enableBigrams: config.enableBigrams,
  });

  const queryTerms = [...prep.stemmedTokens, ...(config.enableBigrams ? prep.bigrams : [])];

  // Step 2: TF-IDF Retrieval
  const tfidfMatches = globalTFIDF.search(queryTerms, 10);
  const tfidfScoreMap = new Map<number, { score: number; matchedTerms: string[] }>();
  for (const m of tfidfMatches) {
    tfidfScoreMap.set(m.doc.id, { score: m.score, matchedTerms: m.matchedTerms });
  }

  // Step 3: Semantic Retrieval
  const semanticMatches = globalSemanticIndex.search(prep.normalizedText, 10);
  const semanticScoreMap = new Map<number, number>();
  for (const m of semanticMatches) {
    semanticScoreMap.set(m.doc.id, m.score);
  }

  // Step 4: Hybrid Fusion Score calculation across all dataset pairs
  const qaPairs = getQAPairs();
  const candidates: MatchCandidate[] = [];

  for (const pair of qaPairs) {
    const tfidfInfo = tfidfScoreMap.get(pair.id) || { score: 0, matchedTerms: [] };
    const semScore = semanticScoreMap.get(pair.id) || 0;

    const hybridScore =
      config.tfidfWeight * tfidfInfo.score +
      config.semanticWeight * semScore;

    candidates.push({
      id: pair.id,
      question: pair.question,
      answer: pair.answer,
      intent: pair.intent,
      tfidfScore: parseFloat(tfidfInfo.score.toFixed(4)),
      semanticScore: parseFloat(semScore.toFixed(4)),
      hybridScore: parseFloat(hybridScore.toFixed(4)),
      matchedTokens: tfidfInfo.matchedTerms,
    });
  }

  // Sort descending by hybrid score
  candidates.sort((a, b) => b.hybridScore - a.hybridScore);

  const topMatch = candidates[0] || {
    id: 0,
    question: '',
    answer: '',
    intent: 'general_university',
    tfidfScore: 0,
    semanticScore: 0,
    hybridScore: 0,
    matchedTokens: [],
  };

  const topMatches = candidates.slice(0, 5);
  const detectedQueryIntent = detectIntent(query);

  // Step 5: Confidence Decision Logic
  let source: 'dataset' | 'ai_fallback' = 'ai_fallback';
  let finalAnswer = '';
  let rationale = '';

  if (topMatch.hybridScore >= config.highConfidenceThreshold) {
    // High Confidence: Authoritative Dataset Answer
    source = 'dataset';
    finalAnswer = topMatch.answer;
    rationale = `High confidence match (score: ${topMatch.hybridScore.toFixed(2)} ≥ ${config.highConfidenceThreshold.toFixed(2)}). Retrieved authoritative response directly from REVA University knowledge base.`;
  } else if (topMatch.hybridScore >= config.moderateConfidenceThreshold) {
    // Moderate Confidence: Evaluate relevance and semantic affinity
    if (topMatch.semanticScore >= 0.65 || topMatch.tfidfScore >= 0.5) {
      source = 'dataset';
      finalAnswer = topMatch.answer;
      rationale = `Moderate confidence match (score: ${topMatch.hybridScore.toFixed(2)} ≥ ${config.moderateConfidenceThreshold.toFixed(2)}). Grounded answer matched with strong semantic alignment to "${topMatch.question}".`;
    } else {
      source = 'ai_fallback';
      finalAnswer = `No exact record was found in the REVA University verified dataset for this query. Top potential match was "${topMatch.question}" (confidence ${topMatch.hybridScore.toFixed(2)}). Connecting to AI Fallback for general guidance...`;
      rationale = `Score (${topMatch.hybridScore.toFixed(2)}) was in moderate range but below semantic grounding threshold. Routing to AI fallback.`;
    }
  } else {
    // Low Confidence: Trigger AI Fallback
    source = 'ai_fallback';
    finalAnswer = `Official university-specific information for "${query}" could not be confirmed in the REVA University verified helpdesk knowledge base.`;
    rationale = `Low confidence score (${topMatch.hybridScore.toFixed(2)} < ${config.moderateConfidenceThreshold.toFixed(2)}). Triggered AI Fallback assistant with strict anti-hallucination guardrails.`;
  }

  const durationMs = Date.now() - startTime;

  return {
    answer: finalAnswer,
    source,
    confidence: topMatch.hybridScore,
    matched_question: topMatch.question || 'None',
    intent: detectedQueryIntent || topMatch.intent || 'general_university',
    tfidf_score: topMatch.tfidfScore,
    semantic_score: topMatch.semanticScore,
    hybrid_score: topMatch.hybridScore,
    top_matches: topMatches,
    preprocessing: prep,
    decision_rationale: rationale,
    processing_time_ms: durationMs,
    thresholds: {
      highConfidenceThreshold: config.highConfidenceThreshold,
      moderateConfidenceThreshold: config.moderateConfidenceThreshold,
      tfidfWeight: config.tfidfWeight,
      semanticWeight: config.semanticWeight,
    },
  };
}

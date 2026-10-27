import { BenchmarkCase, BenchmarkReport, PipelineConfig } from '../../types';
import { executeHybridRetrieval } from './hybridEngine';

export const BENCHMARK_TEST_CASES: BenchmarkCase[] = [
  {
    id: 'tc-exact-01',
    category: 'exact',
    categoryLabel: 'Exact Match',
    userQuestion: 'What is the address of REVA University?',
    expectedSource: 'dataset',
    expectedIntent: 'location_campus',
    expectedQuestionSubstring: 'address',
    description: 'Exact verbatim query matching question #2 in REVA dataset.',
  },
  {
    id: 'tc-exact-02',
    category: 'exact',
    categoryLabel: 'Exact Match',
    userQuestion: 'What is attendance requirement in REVA?',
    expectedSource: 'dataset',
    expectedIntent: 'attendance_discipline',
    expectedQuestionSubstring: 'attendance requirement',
    description: 'Exact question querying mandatory 75% attendance rule.',
  },
  {
    id: 'tc-paraphrase-01',
    category: 'paraphrase',
    categoryLabel: 'Paraphrased Query',
    userQuestion: 'How much does hostel accommodation cost?',
    expectedSource: 'dataset',
    expectedIntent: 'hostel_accommodation',
    expectedQuestionSubstring: 'hostel',
    description: 'Natural paraphrase of hostel facilities / fees inquiring about living costs.',
  },
  {
    id: 'tc-paraphrase-02',
    category: 'paraphrase',
    categoryLabel: 'Paraphrased Query',
    userQuestion: 'What is the fee for staying in the hostel?',
    expectedSource: 'dataset',
    expectedIntent: 'hostel_accommodation',
    expectedQuestionSubstring: 'hostel',
    description: 'Alternative phrasing for dormitory/hostel accommodation fees.',
  },
  {
    id: 'tc-paraphrase-03',
    category: 'paraphrase',
    categoryLabel: 'Paraphrased Query',
    userQuestion: 'How much do students pay for hostel?',
    expectedSource: 'dataset',
    expectedIntent: 'hostel_accommodation',
    expectedQuestionSubstring: 'hostel',
    description: 'Colloquial paraphrase testing student fee and hostel accommodation concept.',
  },
  {
    id: 'tc-synonym-01',
    category: 'synonym',
    categoryLabel: 'Synonym-Based Query',
    userQuestion: 'What degrees and academic programs are available to study?',
    expectedSource: 'dataset',
    expectedIntent: 'academics_courses',
    expectedQuestionSubstring: 'programs',
    description: 'Uses synonyms "academic programs", "degrees", "study" to match course offerings.',
  },
  {
    id: 'tc-synonym-02',
    category: 'synonym',
    categoryLabel: 'Synonym-Based Query',
    userQuestion: 'Are high-speed internet connections accessible inside student dorms?',
    expectedSource: 'dataset',
    expectedIntent: 'hostel_accommodation',
    expectedQuestionSubstring: 'WiFi',
    description: 'Synonym mapping for "internet connection" -> "WiFi" and "dorm" -> "hostel".',
  },
  {
    id: 'tc-spelling-01',
    category: 'spelling_error',
    categoryLabel: 'Minor Spelling Error',
    userQuestion: 'hostel fee at reva univercity',
    expectedSource: 'dataset',
    expectedIntent: 'hostel_accommodation',
    expectedQuestionSubstring: 'hostel',
    description: 'Tests tolerance to "univercity" typo and phrase structure.',
  },
  {
    id: 'tc-spelling-02',
    category: 'spelling_error',
    categoryLabel: 'Minor Spelling Error',
    userQuestion: 'what is the minimum attendence in reva university',
    expectedSource: 'dataset',
    expectedIntent: 'attendance_discipline',
    expectedQuestionSubstring: 'attendence',
    description: 'Common spelling mistake "attendence" matching attendance rule in knowledge base.',
  },
  {
    id: 'tc-spelling-03',
    category: 'spelling_error',
    categoryLabel: 'Minor Spelling Error',
    userQuestion: 'is placemnt support and pakage good for cse branch?',
    expectedSource: 'dataset',
    expectedIntent: 'placements_careers',
    expectedQuestionSubstring: 'placement',
    description: 'Multiple spelling errors ("placemnt", "pakage") with domain keywords.',
  },
  {
    id: 'tc-unrelated-01',
    category: 'unrelated_general',
    categoryLabel: 'Unrelated General Query (Fallback)',
    userQuestion: 'What is the theory of general relativity and how does gravity curve spacetime?',
    expectedSource: 'ai_fallback',
    description: 'Completely ungrounded domain query unrelated to REVA University.',
  },
  {
    id: 'tc-unrelated-02',
    category: 'unrelated_general',
    categoryLabel: 'Unrelated General Query (Fallback)',
    userQuestion: 'Give me a recipe for homemade Italian sourdough pizza dough.',
    expectedSource: 'ai_fallback',
    description: 'Cooking recipe query that must safely trigger AI fallback with low confidence.',
  },
  {
    id: 'tc-unrelated-03',
    category: 'university_not_in_dataset',
    categoryLabel: 'University-Specific Not In Dataset (Fallback)',
    userQuestion: 'What is the private cell phone number of the Dean of Aerospace in Block 4?',
    expectedSource: 'ai_fallback',
    description: 'University-specific query asking for absent private info to prevent hallucination.',
  },
  {
    id: 'tc-unrelated-04',
    category: 'university_not_in_dataset',
    categoryLabel: 'University-Specific Not In Dataset (Fallback)',
    userQuestion: 'What is the syllabus code for 8th semester Quantum Nanotech elective in 2029?',
    expectedSource: 'ai_fallback',
    description: 'Hyper-specific absent university curriculum query that must safely route to AI fallback.',
  },
];

/**
 * Runs the complete benchmark evaluation suite
 */
export function runBenchmarkSuite(config?: Partial<PipelineConfig>): BenchmarkReport {
  const start = Date.now();
  const results = BENCHMARK_TEST_CASES.map((tc) => {
    const res = executeHybridRetrieval(tc.userQuestion, config);

    let passed = false;
    let notes = '';

    if (tc.expectedSource === 'dataset') {
      if (res.source === 'dataset') {
        passed = true;
        notes = `Correctly retrieved authoritative answer with confidence ${res.confidence.toFixed(2)}.`;
      } else {
        passed = false;
        notes = `Failed: routed to fallback when dataset match was expected (score: ${res.confidence.toFixed(2)}).`;
      }
    } else {
      if (res.source === 'ai_fallback') {
        passed = true;
        notes = `Correctly identified out-of-scope query and routed to AI Fallback (score: ${res.confidence.toFixed(2)}).`;
      } else {
        passed = false;
        notes = `Failed: incorrectly gave dataset match for ungrounded question (score: ${res.confidence.toFixed(2)}).`;
      }
    }

    return {
      benchmarkCase: tc,
      retrievalResult: res,
      passed,
      notes,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const avgScore =
    results.reduce((sum, r) => sum + r.retrievalResult.hybrid_score, 0) /
    results.length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests: passedCount,
    accuracyRate: parseFloat(((passedCount / results.length) * 100).toFixed(1)),
    averageHybridScore: parseFloat(avgScore.toFixed(4)),
    averageLatencyMs: Math.round((Date.now() - start) / results.length),
    items: results,
  };
}

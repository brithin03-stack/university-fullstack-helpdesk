import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sliders,
  Database,
  Code2,
  Layers,
  Zap,
} from 'lucide-react';
import { PipelineConfig, RetrievalResult } from '../types';
import { executeHybridRetrieval } from '../lib/nlp/hybridEngine';

interface PipelinePlaygroundProps {
  initialQuery?: string;
  config: PipelineConfig;
  onUpdateConfig: (newConfig: PipelineConfig) => void;
}

const PRESET_QUERIES = [
  'What is the address of REVA University?',
  'How much does hostel accommodation cost?',
  'What is the fee for staying in the hostel?',
  'hostel fee at reva univercity',
  'what is the minimum attendence in reva university',
  'What degrees and academic programs are available to study?',
  'What is the private cell phone number of the Dean of Aerospace?',
  'Explain the theory of general relativity and quantum physics.',
];

export const PipelinePlayground: React.FC<PipelinePlaygroundProps> = ({
  initialQuery = 'How much does hostel accommodation cost?',
  config,
  onUpdateConfig,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [showJson, setShowJson] = useState(false);

  const runPipeline = (testQuery: string) => {
    const res = executeHybridRetrieval(testQuery, config);
    setResult(res);
  };

  useEffect(() => {
    runPipeline(query);
  }, [config]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      runPipeline(query.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-600" />
            Interactive NLP Pipeline Inspector
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Step-by-step mathematical breakdown of Preprocessing, TF-IDF Cosine Similarity, Semantic Embeddings, Hybrid Fusion, and Fallback Routing.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-200 flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-4 h-4 text-amber-600" />
            {showJson ? 'Hide Raw JSON' : 'View Raw JSON'}
          </button>
        </div>
      </div>

      {/* Query Input Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              id="inspector-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a test query to trace through the NLP pipeline..."
              className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-4" />
          </div>
          <button
            id="inspector-run-btn"
            type="submit"
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <Zap className="w-4 h-4" />
            Trace Query
          </button>
        </form>

        {/* Preset chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 font-medium whitespace-nowrap">Try examples:</span>
          {PRESET_QUERIES.map((pq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(pq);
                runPipeline(pq);
              }}
              className="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap transition-colors shadow-xs"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Raw JSON View Modal/Box */}
      {showJson && result && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs font-mono text-gray-400">
            <span>RetrievalResult Response Payload</span>
            <span className="text-amber-400">{result.processing_time_ms} ms</span>
          </div>
          <pre className="text-xs text-amber-300 font-mono leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Step 1 (Preprocessing) & Step 4 (Hybrid Score) */}
          <div className="space-y-6">
            {/* STEP 1: PREPROCESSING */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 inline-flex items-center justify-center text-xs font-bold">1</span>
                  Preprocessing & Lemmatization
                </span>
                <span className="text-[11px] font-mono text-gray-500">Step 1</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">1. Normalized Text:</span>
                  <div className="mt-1 bg-gray-50 p-2 rounded-lg text-gray-800 font-mono border border-gray-200">
                    "{result.preprocessing.normalizedText}"
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-medium">2. Filtered Tokens (Stopwords Removed):</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.preprocessing.tokens.map((t, idx) => (
                      <span key={idx} className="bg-gray-100 text-amber-800 px-2 py-0.5 rounded font-mono border border-gray-200">
                        {t}
                      </span>
                    ))}
                    {result.preprocessing.tokens.length === 0 && (
                      <span className="text-gray-400 italic">No non-stopwords detected</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-medium">3. Porter Stemmed Lemmas:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.preprocessing.stemmedTokens.map((st, idx) => (
                      <span key={idx} className="bg-orange-50 text-orange-800 px-2 py-0.5 rounded font-mono border border-orange-200">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                {result.preprocessing.bigrams.length > 0 && (
                  <div>
                    <span className="text-gray-500 font-medium">4. Generated Bigrams:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {result.preprocessing.bigrams.map((bg, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono border border-blue-200">
                          {bg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(result.preprocessing.spellingCorrections).length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Spelling Normalization Applied:
                    </span>
                    <div className="mt-1 space-y-0.5 font-mono text-emerald-800">
                      {Object.entries(result.preprocessing.spellingCorrections).map(([k, v]) => (
                        <div key={k}>
                          <span className="line-through text-red-500">{k}</span> → <span className="font-bold text-emerald-700">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: HYBRID FUSION FORMULA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-xs font-bold">4</span>
                  Hybrid Fusion Score
                </span>
                <span className="text-[11px] font-mono text-gray-500">Step 4</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono text-xs text-gray-700 space-y-2">
                <div className="text-gray-500">Score Combination Formula:</div>
                <div className="p-2 bg-white rounded border border-gray-200 text-amber-800 font-bold">
                  Score = ({config.tfidfWeight} × TF-IDF) + ({config.semanticWeight} × Semantic)
                </div>
                <div className="space-y-1 text-[11px] text-gray-600 pt-1">
                  <div>TF-IDF Component: <span className="text-amber-700 font-bold">{config.tfidfWeight} × {result.tfidf_score.toFixed(4)} = {(config.tfidfWeight * result.tfidf_score).toFixed(4)}</span></div>
                  <div>Semantic Component: <span className="text-blue-700 font-bold">{config.semanticWeight} × {result.semantic_score.toFixed(4)} = {(config.semanticWeight * result.semantic_score).toFixed(4)}</span></div>
                  <div className="border-t border-gray-200 pt-1 text-emerald-700 font-bold text-sm">
                    Final Hybrid Score: {(result.hybrid_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Weight Adjustment Sliders */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>TF-IDF Weight ({config.tfidfWeight.toFixed(2)})</span>
                  <span>Semantic Weight ({config.semanticWeight.toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.tfidfWeight}
                  onChange={(e) => {
                    const wTfidf = parseFloat(e.target.value);
                    const wSem = parseFloat((1 - wTfidf).toFixed(2));
                    onUpdateConfig({
                      ...config,
                      tfidfWeight: wTfidf,
                      semanticWeight: wSem,
                    });
                  }}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>100% Lexical TF-IDF</span>
                  <span>Balanced (40/60)</span>
                  <span>100% Dense Semantic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Step 2 (TF-IDF Top Matches) & Step 3 (Semantic Top Matches) */}
          <div className="space-y-6">
            {/* STEP 2: TF-IDF MATCHES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center justify-center text-xs font-bold">2</span>
                  TF-IDF Lexical Retrieval
                </span>
                <span className="text-[11px] font-mono text-gray-500">Step 2</span>
              </div>

              <div className="space-y-2.5">
                {result.top_matches.map((match, idx) => (
                  <div
                    key={match.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      idx === 0
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        #{match.id} {match.question}
                      </span>
                      <span className="font-mono font-bold text-amber-800 whitespace-nowrap bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-300">
                        {(match.tfidfScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    {match.matchedTokens.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                        <span className="text-gray-500">Matched:</span>
                        {match.matchedTokens.map((mt, i) => (
                          <span key={i} className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
                            {mt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3: SEMANTIC RETRIEVAL MATCHES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-bold">3</span>
                  Semantic Embedding Retrieval
                </span>
                <span className="text-[11px] font-mono text-gray-500">Step 3</span>
              </div>

              <div className="space-y-2.5">
                {result.top_matches.map((match, idx) => (
                  <div
                    key={match.id}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      idx === 0
                        ? 'bg-blue-50/80 border-blue-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        #{match.id} {match.question}
                      </span>
                      <span className="font-mono font-bold text-blue-800 whitespace-nowrap bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-300">
                        {(match.semanticScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500">
                      Intent Category: <span className="text-gray-700 font-medium">{match.intent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Step 5 (Confidence Routing) & Step 6 (Final Output) */}
          <div className="space-y-6">
            {/* STEP 5: CONFIDENCE ROUTING & DECISION */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center justify-center text-xs font-bold">5</span>
                  Confidence Decision Logic
                </span>
                <span className="text-[11px] font-mono text-gray-500">Step 5</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Confidence Meter Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1.5">
                    <span>Retrieval Confidence</span>
                    <span className="font-mono font-bold text-amber-700">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex border border-gray-200">
                    <div
                      style={{ width: `${Math.min(100, result.confidence * 100)}%` }}
                      className={`h-full transition-all duration-500 ${
                        result.confidence >= config.highConfidenceThreshold
                          ? 'bg-emerald-500'
                          : result.confidence >= config.moderateConfidenceThreshold
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                    <span>0% (Fallback)</span>
                    <span className="text-amber-700">Mod ({config.moderateConfidenceThreshold * 100}%)</span>
                    <span className="text-emerald-700">High ({config.highConfidenceThreshold * 100}%)</span>
                  </div>
                </div>

                {/* Routing Box */}
                <div
                  className={`p-3 rounded-xl border ${
                    result.source === 'dataset'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {result.source === 'dataset' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Routed to Authoritative Dataset</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Routed to AI Fallback Guidance</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-700">
                    {result.decision_rationale}
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 6: FINAL ANSWER & ATTRIBUTION */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center text-xs font-bold">6</span>
                  Final Response Output
                </span>
                <span className="text-[11px] font-mono text-gray-500">Final</span>
              </div>

              {/* Source Badge */}
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Verified Source Attribution
                </span>
                <div className="mt-1">
                  {result.source === 'dataset' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Source: REVA University Helpdesk
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Source: AI-generated general guidance
                    </span>
                  )}
                </div>
              </div>

              {/* Output Content */}
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Delivered Answer
                </span>
                <div className="mt-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-gray-900 text-xs sm:text-sm leading-relaxed">
                  {result.answer}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

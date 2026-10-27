import React from 'react';
import { Sliders, RotateCcw, Check, Sparkles, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { PipelineConfig } from '../types';
import { DEFAULT_PIPELINE_CONFIG } from '../lib/nlp/hybridEngine';

interface SettingsViewProps {
  config: PipelineConfig;
  onUpdateConfig: (newConfig: PipelineConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdateConfig }) => {
  const resetDefaults = () => {
    onUpdateConfig({ ...DEFAULT_PIPELINE_CONFIG });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-600" />
            NLP Pipeline Configuration & Tuning
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tune hybrid retrieval weights, confidence decision thresholds, and preprocessing flags.
          </p>
        </div>

        <button
          onClick={resetDefaults}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Retrieval Weights */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-gray-200 pb-3">
            <Sparkles className="w-4 h-4" />
            Hybrid Fusion Weights
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1.5">
                <span>TF-IDF Lexical Weight:</span>
                <span className="font-mono font-bold text-amber-700">
                  {config.tfidfWeight.toFixed(2)}
                </span>
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
            </div>

            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1.5">
                <span>Semantic Embedding Weight:</span>
                <span className="font-mono font-bold text-blue-700">
                  {config.semanticWeight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.semanticWeight}
                onChange={(e) => {
                  const wSem = parseFloat(e.target.value);
                  const wTfidf = parseFloat((1 - wSem).toFixed(2));
                  onUpdateConfig({
                    ...config,
                    tfidfWeight: wTfidf,
                    semanticWeight: wSem,
                  });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 leading-relaxed">
              <span className="text-gray-900 font-semibold">Recommended 0.4 / 0.6:</span> Balances exact vocabulary keyword matching (TF-IDF) with sentence embedding paraphrase comprehension.
            </div>
          </div>
        </div>

        {/* Section 2: Decision Thresholds */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b border-gray-200 pb-3">
            <ShieldCheck className="w-4 h-4" />
            Confidence Decision Thresholds
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1.5">
                <span>High Confidence Threshold (Dataset Direct):</span>
                <span className="font-mono font-bold text-emerald-700">
                  {(config.highConfidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={config.highConfidenceThreshold}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    highConfidenceThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400">
                Queries with score ≥ threshold return authoritative dataset answer.
              </span>
            </div>

            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1.5">
                <span>Moderate Confidence Threshold (Grounded Eval):</span>
                <span className="font-mono font-bold text-amber-700">
                  {(config.moderateConfidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.7"
                step="0.05"
                value={config.moderateConfidenceThreshold}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    moderateConfidenceThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400">
                Queries with score &lt; threshold trigger safe AI Fallback.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: NLP Preprocessing Options */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5 border-b border-gray-200 pb-3">
            <Info className="w-4 h-4" />
            Preprocessing & Normalization Flags
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={config.enableSpellingCorrection}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    enableSpellingCorrection: e.target.checked,
                  })
                }
                className="mt-0.5 accent-amber-600 rounded"
              />
              <div>
                <span className="font-semibold text-gray-900 block">Spelling Normalization</span>
                <span className="text-gray-500 text-[11px] mt-0.5 block leading-relaxed">
                  Corrects student typos like "univercity", "attendence", and "hostle".
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={config.enableStemming}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    enableStemming: e.target.checked,
                  })
                }
                className="mt-0.5 accent-amber-600 rounded"
              />
              <div>
                <span className="font-semibold text-gray-900 block">Porter Lemmatization</span>
                <span className="text-gray-500 text-[11px] mt-0.5 block leading-relaxed">
                  Reduces plural forms and suffixes (courses → course, paying → pay).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={config.enableBigrams}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    enableBigrams: e.target.checked,
                  })
                }
                className="mt-0.5 accent-amber-600 rounded"
              />
              <div>
                <span className="font-semibold text-gray-900 block">Bigram Features</span>
                <span className="text-gray-500 text-[11px] mt-0.5 block leading-relaxed">
                  Generates adjacent token pairs ("hostel_fee", "placement_record").
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

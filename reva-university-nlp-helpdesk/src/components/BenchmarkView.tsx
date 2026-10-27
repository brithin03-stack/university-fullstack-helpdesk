import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Filter,
  Download,
  Sparkles,
  Layers,
  Clock,
  BarChart2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { BenchmarkReport, PipelineConfig } from '../types';
import { runBenchmarkSuite } from '../lib/nlp/benchmarks';

interface BenchmarkViewProps {
  config: PipelineConfig;
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ config }) => {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const executeBenchmarks = () => {
    setIsRunning(true);
    setTimeout(() => {
      const rep = runBenchmarkSuite(config);
      setReport(rep);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    executeBenchmarks();
  }, [config]);

  const categories = [
    { id: 'all', label: 'All Test Cases' },
    { id: 'exact', label: 'Exact Matches' },
    { id: 'paraphrase', label: 'Paraphrased Queries' },
    { id: 'synonym', label: 'Synonym-Based' },
    { id: 'spelling_error', label: 'Spelling Errors' },
    { id: 'unrelated_general', label: 'Unrelated Fallbacks' },
    { id: 'university_not_in_dataset', label: 'Out-of-Dataset Fallbacks' },
  ];

  const filteredItems = report
    ? activeCategoryFilter === 'all'
      ? report.items
      : report.items.filter((it) => it.benchmarkCase.category === activeCategoryFilter)
    : [];

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reva_nlp_benchmark_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            NLP Demonstration & Evaluation Benchmarks
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Systematic testing of Exact matches, Paraphrases, Synonyms, Spelling Errors, and Anti-Hallucination Fallback routing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="benchmark-export-btn"
            onClick={handleDownloadReport}
            disabled={!report}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            id="benchmark-run-all-btn"
            onClick={executeBenchmarks}
            disabled={isRunning}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Tests...' : 'Run All Benchmarks'}
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <div className="text-xs text-gray-500 font-medium">Evaluation Accuracy</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {report.accuracyRate}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {report.passedTests} of {report.totalTests} tests passing
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <div className="text-xs text-gray-500 font-medium">Avg Hybrid Score</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {(report.averageHybridScore * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              TF-IDF ({config.tfidfWeight}) + Sem ({config.semanticWeight})
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <div className="text-xs text-gray-500 font-medium">Average Latency</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {report.averageLatencyMs} ms
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">In-memory hybrid retrieval</div>
          </div>

          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <div className="text-xs text-gray-500 font-medium">Knowledge Base Size</div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              437
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Authoritative Q&A Records</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategoryFilter(c.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border shadow-xs ${
              activeCategoryFilter === c.id
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Benchmark Table with all 8 demonstration requirements */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Status & Category</th>
                <th className="py-3.5 px-4 min-w-[180px]">User Question</th>
                <th className="py-3.5 px-4">Predicted Intent</th>
                <th className="py-3.5 px-4 min-w-[200px]">Best Matched Dataset Question</th>
                <th className="py-3.5 px-3 text-center">TF-IDF</th>
                <th className="py-3.5 px-3 text-center">Semantic</th>
                <th className="py-3.5 px-3 text-center">Hybrid</th>
                <th className="py-3.5 px-4">Final Source</th>
                <th className="py-3.5 px-4 min-w-[220px]">Final Answer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item, idx) => {
                const res = item.retrievalResult;
                const isDataset = res.source === 'dataset';

                return (
                  <tr
                    key={item.benchmarkCase.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedItemIndex(selectedItemIndex === idx ? null : idx)}
                  >
                    {/* Status & Category */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-bold">
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-[11px] text-gray-900">
                          {item.benchmarkCase.categoryLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {item.benchmarkCase.id}
                      </div>
                    </td>

                    {/* User Question */}
                    <td className="py-3.5 px-4 align-top font-medium text-gray-900">
                      "{item.benchmarkCase.userQuestion}"
                    </td>

                    {/* Predicted Intent */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-amber-800 font-mono text-[10px] border border-gray-200">
                        {res.intent}
                      </span>
                    </td>

                    {/* Best Matching Dataset Question */}
                    <td className="py-3.5 px-4 align-top text-gray-700">
                      {res.matched_question !== 'None' ? (
                        <span>"{res.matched_question}"</span>
                      ) : (
                        <span className="text-gray-400 italic">No direct record</span>
                      )}
                    </td>

                    {/* TF-IDF Score */}
                    <td className="py-3.5 px-3 align-top text-center font-mono font-bold text-amber-700">
                      {(res.tfidf_score * 100).toFixed(0)}%
                    </td>

                    {/* Semantic Score */}
                    <td className="py-3.5 px-3 align-top text-center font-mono font-bold text-blue-700">
                      {(res.semantic_score * 100).toFixed(0)}%
                    </td>

                    {/* Hybrid Score */}
                    <td className="py-3.5 px-3 align-top text-center font-mono font-black text-emerald-700">
                      {(res.hybrid_score * 100).toFixed(0)}%
                    </td>

                    {/* Final Source */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      {isDataset ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Helpdesk Dataset
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          AI Fallback
                        </span>
                      )}
                    </td>

                    {/* Final Answer */}
                    <td className="py-3.5 px-4 align-top text-gray-700 text-[11px] leading-relaxed">
                      {res.answer}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

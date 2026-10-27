import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Hash,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getDatasetStats, getQAPairs } from '../lib/nlp/dataset';
import { QAPair } from '../types';

interface KnowledgeBaseViewProps {
  onTestQuestion: (question: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onTestQuestion }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const allPairs = useMemo(() => getQAPairs(), []);
  const stats = useMemo(() => getDatasetStats(), []);

  const filteredPairs = useMemo(() => {
    return allPairs.filter((pair) => {
      const matchIntent = selectedIntent === 'all' || pair.intent === selectedIntent;
      const matchSearch =
        !searchQuery.trim() ||
        pair.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchIntent && matchSearch;
    });
  }, [allPairs, selectedIntent, searchQuery]);

  const totalPages = Math.ceil(filteredPairs.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPairs.slice(start, start + pageSize);
  }, [filteredPairs, currentPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-600" />
            REVA University Authoritative Knowledge Base
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            437 Authoritative Q&A Records • Verified Ground Truth for REVA Student Helpdesk Hybrid Retrieval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-xs font-mono text-gray-700">
            Records: <span className="text-amber-700 font-bold">{allPairs.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-xs font-mono text-gray-700">
            Vocab: <span className="text-blue-700 font-bold">{stats.vocabularySize} tokens</span>
          </div>
        </div>
      </div>

      {/* Dataset Provenance & Overview Banner */}
      <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                Dataset Provenance
              </span>
              <span className="text-xs text-amber-800 font-mono">
                data/reva_dataset.csv
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              Authoritative REVA University Helpdesk & Academic Policies Corpus
            </h3>
            <p className="text-xs text-gray-600 max-w-3xl leading-relaxed">
              This verified knowledge base contains <strong>437 curated Question-Answer pairs</strong> mapped across 14 institutional domains (Admissions, Fees, 75% Attendance Regulation, Hostel Guidelines, Examination/Grading Rules, Placement Packages, and Campus Facilities). It serves as the primary ground truth for the hybrid NLP retrieval engine with sub-millisecond local indexing.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-xs font-mono bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <div>
              <div className="text-[10px] uppercase text-gray-400">Avg Q Len</div>
              <div className="font-bold text-gray-800">{stats.avgQuestionLength} chars</div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <div className="text-[10px] uppercase text-gray-400">Avg A Len</div>
              <div className="font-bold text-gray-800">{stats.avgAnswerLength} chars</div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div>
              <div className="text-[10px] uppercase text-gray-400">Index Latency</div>
              <div className="font-bold text-emerald-700">&lt; 5 ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Intents Distribution Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        <button
          onClick={() => {
            setSelectedIntent('all');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all shadow-xs ${
            selectedIntent === 'all'
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider">All Categories</div>
          <div className="text-lg font-black mt-0.5 text-gray-900">{allPairs.length}</div>
        </button>

        {stats.allIntents.slice(0, 9).map((intKey) => (
          <button
            key={intKey}
            onClick={() => {
              setSelectedIntent(intKey);
              setCurrentPage(1);
            }}
            className={`p-3 rounded-xl border text-left transition-all shadow-xs ${
              selectedIntent === intKey
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider truncate">
              {intKey.replace(/_/g, ' ')}
            </div>
            <div className="text-lg font-black mt-0.5 text-gray-900">
              {stats.intentsCount[intKey] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search across all 437 questions and answers (e.g. 'hostel', '75%', 'scholarship')..."
            className="w-full bg-white text-gray-900 placeholder-gray-400 text-sm px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedIntent}
            onChange={(e) => {
              setSelectedIntent(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white text-gray-800 text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Intent Domains ({allPairs.length})</option>
            {stats.allIntents.map((it) => (
              <option key={it} value={it}>
                {it.replace(/_/g, ' ')} ({stats.intentsCount[it]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-4 w-40">Intent Domain</th>
                <th className="py-3 px-4 min-w-[240px]">Knowledge Base Question</th>
                <th className="py-3 px-4 min-w-[280px]">Authoritative Grounded Answer</th>
                <th className="py-3 px-4 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-gray-400">
                    #{item.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-amber-800 font-mono text-[10px] border border-gray-200">
                      {item.intent}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {item.question}
                  </td>
                  <td className="py-3 px-4 text-gray-700 leading-relaxed">
                    {item.answer}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onTestQuestion(item.question)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Trace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No questions matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-gray-900">
              {filteredPairs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * pageSize, filteredPairs.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-900">{filteredPairs.length}</span> results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-40 text-gray-700 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-40 text-gray-700 transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

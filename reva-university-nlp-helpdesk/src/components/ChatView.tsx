import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Zap,
  BookOpen,
  AlertTriangle,
  Info,
  Database,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, PipelineConfig, RetrievalResult } from '../types';
import { executeHybridRetrieval } from '../lib/nlp/hybridEngine';
import { getDatasetStats, getQAPairs } from '../lib/nlp/dataset';

interface ChatViewProps {
  config: PipelineConfig;
  onOpenInspectorWithQuery?: (query: string) => void;
}

const SAMPLE_QUERIES = [
  { label: 'Exact: University Address', query: 'What is the address of REVA University?' },
  { label: 'Paraphrase: Hostel Fees', query: 'How much does hostel accommodation cost?' },
  { label: 'Paraphrase: Attendance Rule', query: 'What is the fee for staying in the hostel?' },
  { label: 'Spelling Mistake: Univercity', query: 'hostel fee at reva univercity' },
  { label: 'Spelling: Minimum Attendence', query: 'what is the minimum attendence in reva university?' },
  { label: 'Fallback: Absent Fact', query: 'What is the private cell number of Dean of Aerospace?' },
  { label: 'Fallback: General Topic', query: 'Explain how photosynthesis works in green plants.' },
];

export const ChatView: React.FC<ChatViewProps> = ({ config, onOpenInspectorWithQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello! I am the REVA University Student Helpdesk Assistant. Ask me anything about courses, hostel accommodations, attendance criteria, examination rules, placements, and campus facilities.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMetaId, setExpandedMetaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const datasetStats = React.useMemo(() => getDatasetStats(), []);
  const allQAPairs = React.useMemo(() => getQAPairs(), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const tStart = performance.now();
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputQuery('');

    // Step 1: Execute hybrid NLP retrieval locally (takes 1-5ms directly in browser memory)
    const localResult = executeHybridRetrieval(textToSend, config);
    const localDuration = Math.round(performance.now() - tStart);
    localResult.processing_time_ms = localDuration;

    // Step 2: If high or moderate confidence match from REVA dataset, resolve INSTANTLY
    if (localResult.source === 'dataset') {
      setMessages([
        ...newMessages,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: localResult.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: localResult,
        },
      ]);
      return;
    }

    // Step 3: Low confidence query -> Attempt fast AI Fallback with timeout protection
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9500);

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: textToSend,
          config,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const serverResult: RetrievalResult = await response.json();
        const totalDuration = Math.round(performance.now() - tStart);
        serverResult.processing_time_ms = totalDuration;

        setMessages([
          ...newMessages,
          {
            id: assistantMsgId,
            sender: 'assistant',
            text: serverResult.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: serverResult,
          },
        ]);
      } else {
        throw new Error('Server fallback error');
      }
    } catch {
      // If AI fallback times out or fails, safely display the grounded local fallback
      const totalDuration = Math.round(performance.now() - tStart);
      localResult.processing_time_ms = totalDuration;
      setMessages([
        ...newMessages,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: localResult.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: localResult,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Hello! I am the REVA University Student Helpdesk Assistant. Ask me anything about courses, hostel accommodations, attendance criteria, examination rules, placements, and campus facilities.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 py-4 sm:px-6">
      {/* Sample Query Prompts */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Test Prompts
            </span>
            <button
              onClick={() => setShowDatasetModal(true)}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full transition-colors"
            >
              <Database className="w-3 h-3 text-amber-600" />
              Dataset: 437 REVA Records
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDatasetModal(true)}
              className="sm:hidden text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium transition-colors"
            >
              <Database className="w-3 h-3" />
              Dataset Info
            </button>
            <button
              onClick={clearChat}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Conversation
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sample.query)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-amber-400 transition-all text-left flex items-center gap-1.5 shadow-xs"
            >
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-gray-200 p-4 sm:p-6 space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          const isDataset = msg.metadata?.source === 'dataset';
          const isFallback = msg.metadata?.source === 'ai_fallback';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-shadow ${
                  isAssistant
                    ? 'bg-gray-50 text-gray-800 border border-gray-200/80 shadow-xs'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                }`}
              >
                {/* Assistant Source Badge Header */}
                {isAssistant && msg.metadata && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 gap-2 flex-wrap">
                    {isDataset ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Source: REVA University Helpdesk
                      </span>
                    ) : msg.metadata.llm_generated ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Source: Gemini LLM Fallback ({msg.metadata.llm_model || 'gemini-3-flash'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Source: Grounded Helpdesk Fallback
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {msg.metadata.processing_time_ms ?? 3}ms
                      </span>
                      <span>
                        Score: {(msg.metadata.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Footer bar with timestamp & actions */}
                <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-gray-400 border-t border-gray-200">
                  <span>{msg.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="hover:text-gray-700 transition-colors p-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isAssistant && msg.metadata && (
                      <button
                        onClick={() =>
                          setExpandedMetaId(expandedMetaId === msg.id ? null : msg.id)
                        }
                        className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-medium transition-colors"
                      >
                        <span>NLP Details</span>
                        {expandedMetaId === msg.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible NLP Diagnostics Box */}
                {isAssistant && msg.metadata && expandedMetaId === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700 bg-white rounded-xl p-3 space-y-2.5 font-mono border border-gray-200 shadow-xs"
                  >
                    <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-gray-200">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="text-gray-500 text-[10px]">TF-IDF Score</div>
                        <div className="text-amber-700 font-bold text-sm">
                          {(msg.metadata.tfidf_score * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="text-gray-500 text-[10px]">Semantic Score</div>
                        <div className="text-blue-700 font-bold text-sm">
                          {(msg.metadata.semantic_score * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="text-gray-500 text-[10px]">Hybrid Fusion</div>
                        <div className="text-emerald-700 font-bold text-sm">
                          {(msg.metadata.hybrid_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500">Best Matched Question:</span>
                      <div className="text-gray-800 mt-0.5 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        "{msg.metadata.matched_question}"
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        Intent: <b className="text-amber-700">{msg.metadata.intent}</b>
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        Latency: <b className="text-gray-800">{msg.metadata.processing_time_ms}ms</b>
                      </span>
                    </div>

                    {msg.metadata.preprocessing && (
                      <div className="text-[11px] pt-1">
                        <span className="text-gray-500">Tokens:</span>{' '}
                        <span className="text-orange-700">
                          {msg.metadata.preprocessing.tokens.join(', ') || 'none'}
                        </span>
                        {Object.keys(msg.metadata.preprocessing.spellingCorrections).length > 0 && (
                          <div className="mt-1 text-emerald-700 font-semibold">
                            Spelling corrections:{' '}
                            {Object.entries(msg.metadata.preprocessing.spellingCorrections)
                              .map(([k, v]) => `${k} → ${v}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {onOpenInspectorWithQuery && (
                      <button
                        onClick={() => onOpenInspectorWithQuery(msg.metadata!.preprocessing.original)}
                        className="w-full mt-2 text-center text-xs py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors font-medium"
                      >
                        Inspect in Full Pipeline View →
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-purple-800 text-sm p-3 bg-purple-50 rounded-xl w-fit border border-purple-200 shadow-xs">
            <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
            <span>Consulting Gemini LLM Fallback (synthesizing answer)...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-3 flex items-center space-x-2"
      >
        <input
          id="chat-input-field"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about REVA University (e.g. 'What is the attendance requirement?')..."
          disabled={isLoading}
          className="flex-1 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs disabled:opacity-50"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>

      {/* Dataset Provenance & Information Modal */}
      <AnimatePresence>
        {showDatasetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 shadow-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Dataset Information & Provenance
                    </h3>
                    <p className="text-xs text-gray-500">
                      REVA University Student Helpdesk Knowledge Base
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDatasetModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-black text-amber-700">{allQAPairs.length}</div>
                  <div className="text-[11px] text-gray-500 font-medium">Q&A Records</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-black text-blue-700">{datasetStats.allIntents.length}</div>
                  <div className="text-[11px] text-gray-500 font-medium">Domain Intents</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-black text-emerald-700">{datasetStats.vocabularySize}</div>
                  <div className="text-[11px] text-gray-500 font-medium">Unique Tokens</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-black text-purple-700">&lt;5ms</div>
                  <div className="text-[11px] text-gray-500 font-medium">Instant Retrieval</div>
                </div>
              </div>

              {/* What is this dataset? */}
              <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dataset Overview & Source
                </h4>
                <p>
                  The dataset (<code className="bg-gray-100 px-1 py-0.5 rounded text-amber-800 font-mono">data/reva_dataset.csv</code>) is an authoritative ground-truth knowledge base specifically built for <strong>REVA University (Yelahanka, Bengaluru)</strong>.
                </p>
                <p>
                  It covers officially documented campus rules, academic regulations, examination policies, hostel procedures, fee structures, and placement statistics.
                </p>
              </div>

              {/* Categories breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Covered Domains ({datasetStats.allIntents.length} Categories)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {datasetStats.allIntents.map((intentKey) => (
                    <div
                      key={intentKey}
                      className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-700 capitalize truncate">
                        {intentKey.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {datasetStats.intentsCount[intentKey] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speed & Retrieval info */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Ultra-Fast Dual-Engine NLP Retrieval
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Student queries are indexed through an in-memory dual hybrid pipeline: sublinear TF-IDF keyword matching (0.4 weight) + 64-dimensional semantic concept vector cosine similarity (0.6 weight). Authoritative dataset answers return in <strong>1 to 5 milliseconds</strong>.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowDatasetModal(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { MessageSquare, Cpu, CheckCircle2, Database, Sliders, Sparkles, GraduationCap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'pipeline' | 'benchmarks' | 'dataset' | 'settings';
  setActiveTab: (tab: 'chat' | 'pipeline' | 'benchmarks' | 'dataset' | 'settings') => void;
  datasetCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, datasetCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & University branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-gray-900">REVA University</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium border border-orange-200">
                  NLP Helpdesk
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                Hybrid Retrieval • TF-IDF + Embeddings • {datasetCount} Verified Q&A
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Chat Assistant</span>
            </button>

            <button
              id="nav-tab-pipeline"
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-orange-600" />
              <span>NLP Inspector</span>
            </button>

            <button
              id="nav-tab-benchmarks"
              onClick={() => setActiveTab('benchmarks')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'benchmarks'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Demonstration Suite</span>
            </button>

            <button
              id="nav-tab-dataset"
              onClick={() => setActiveTab('dataset')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dataset'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Knowledge Base</span>
              <span className="sm:hidden">KB</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span className="hidden md:inline">Tuning</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

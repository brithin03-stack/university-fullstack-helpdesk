import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { PipelinePlayground } from './components/PipelinePlayground';
import { BenchmarkView } from './components/BenchmarkView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SettingsView } from './components/SettingsView';
import { PipelineConfig } from './types';
import { DEFAULT_PIPELINE_CONFIG } from './lib/nlp/hybridEngine';
import { getQAPairs } from './lib/nlp/dataset';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'pipeline' | 'benchmarks' | 'dataset' | 'settings'>('chat');
  const [config, setConfig] = useState<PipelineConfig>(() => {
    const saved = localStorage.getItem('reva_nlp_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PIPELINE_CONFIG;
      }
    }
    return DEFAULT_PIPELINE_CONFIG;
  });

  const [inspectorQuery, setInspectorQuery] = useState<string>('How much does hostel accommodation cost?');
  const datasetCount = getQAPairs().length;

  const handleUpdateConfig = (newConfig: PipelineConfig) => {
    setConfig(newConfig);
    localStorage.setItem('reva_nlp_config', JSON.stringify(newConfig));
  };

  const handleInspectQuery = (query: string) => {
    setInspectorQuery(query);
    setActiveTab('pipeline');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetCount={datasetCount}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatView
            config={config}
            onOpenInspectorWithQuery={handleInspectQuery}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelinePlayground
            initialQuery={inspectorQuery}
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarkView config={config} />
        )}

        {activeTab === 'dataset' && (
          <KnowledgeBaseView onTestQuestion={handleInspectQuery} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </main>
    </div>
  );
}

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getDatasetStats, getQAPairs } from './src/lib/nlp/dataset';
import { executeHybridRetrieval } from './src/lib/nlp/hybridEngine';
import { runBenchmarkSuite, BENCHMARK_TEST_CASES } from './src/lib/nlp/benchmarks';
import { PipelineConfig } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Gemini initialization with telemetry header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataset_records: getQAPairs().length,
  });
});

// 2. Dataset inspection endpoint
app.get('/api/dataset', (req, res) => {
  try {
    const pairs = getQAPairs();
    const stats = getDatasetStats();
    const { search, intent, limit = 50, offset = 0 } = req.query;

    let filtered = [...pairs];

    if (intent && typeof intent === 'string' && intent !== 'all') {
      filtered = filtered.filter((p) => p.intent === intent);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.question.toLowerCase().includes(q) ||
          p.answer.toLowerCase().includes(q)
      );
    }

    const paginated = filtered.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    res.json({
      total: filtered.length,
      dataset_total: pairs.length,
      records: paginated,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const stats = getDatasetStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Main Query Endpoint: Hybrid Retrieval + Fallback handling
app.post('/api/query', async (req, res) => {
  try {
    const { query, config, conversationHistory = [] } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    // Step 1 - 5: Hybrid Retrieval Engine
    const retrieval = executeHybridRetrieval(query, config as Partial<PipelineConfig>);

    // If source is AI Fallback, generate grounded AI response if API key is present
    if (retrieval.source === 'ai_fallback') {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const fallbackSystemInstruction = `You are the AI student helpdesk assistant for REVA University (Bengaluru, Karnataka).
Your primary role is to assist students, staff, and visitors with helpful, accurate, and completely articulated answers.
Rules:
1. Always finish your thoughts and complete all sentences cleanly. Never truncate or cut off mid-sentence.
2. The REVA University verified dataset is the authoritative source for official fees, exam dates, hostel rules, and regulations. Do not invent unverified official figures or policies.
3. For campus navigation queries (e.g., from Administration Block to Main Exit Gate): Explain clearly that exiting from the Administration Block involves walking through the central campus avenue/boulevard directly towards the Main Entrance Gate (Gate 1 on Kattigenahalli Main Road), past the central lawns and security check post.
4. For academic, administrative, or student services queries where verified dataset records are not present, provide helpful guidance and advise confirming with the REVA University Administration or Student Affairs office at Rukmini Knowledge Park, Kattigenahalli, Yelahanka, Bengaluru.`;

          const contextPrompt = `User question: "${query}"
Retrieved knowledge base candidates (if any):
${retrieval.top_matches.slice(0, 3).map((m, idx) => `[Candidate ${idx + 1}] Q: ${m.question} -> A: ${m.answer} (Score: ${m.hybridScore})`).join('\n')}

Please provide a helpful, coherent, and completely finished response. Make sure every sentence is fully closed with appropriate punctuation.`;

          // Generate response with Gemini 3 Flash Preview with generous output token allowance
          const aiPromise = ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contextPrompt,
            config: {
              systemInstruction: fallbackSystemInstruction,
              temperature: 0.3,
              maxOutputTokens: 1024,
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI Fallback generation timed out')), 9000)
          );

          const response = await Promise.race([aiPromise, timeoutPromise]);

          if (response && response.text) {
            retrieval.answer = response.text.trim();
            retrieval.llm_model = 'gemini-3-flash-preview';
            retrieval.llm_generated = true;
          }
        } catch (geminiError: any) {
          console.warn('Gemini Fallback error, using grounded safe response:', geminiError?.message || geminiError);
          retrieval.answer = `I could not confirm official university-specific details for "${query}" in the REVA University verified helpdesk knowledge base. For official assistance, please reach out to the REVA admissions or student affairs office at Rukmini Knowledge Park, Kattigenahalli, Yelahanka, Bengaluru.`;
          retrieval.llm_generated = false;
        }
      } else {
        retrieval.answer = `Official university-specific details for "${query}" are not currently indexed in the REVA University verified knowledge base. (Note: AI fallback assistant is active; configure GEMINI_API_KEY in Secrets for live contextual synthesis).`;
        retrieval.llm_generated = false;
      }
    }

    res.json(retrieval);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Benchmark execution endpoint
app.get('/api/benchmarks', (req, res) => {
  try {
    const report = runBenchmarkSuite();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Custom benchmark evaluation with custom config
app.post('/api/evaluate-benchmark', (req, res) => {
  try {
    const { config } = req.body;
    const report = runBenchmarkSuite(config);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REVA University Helpdesk Server running on http://localhost:${PORT}`);
  });
}

startServer();

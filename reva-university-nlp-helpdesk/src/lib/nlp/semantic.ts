import { QAPair } from '../../types';
import { getQAPairs } from './dataset';
import { preprocessText, stemToken } from './preprocessor';

// Semantic cluster definitions for domain-aligned semantic representation
export const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  hostel_accommodation: [
    'hostel', 'hostels', 'accommodation', 'dorm', 'dormitory', 'room', 'rooms', 'stay',
    'staying', 'boarding', 'curfew', 'laundry', 'mess', 'bed', 'living', 'resident'
  ],
  financial_cost: [
    'fee', 'fees', 'cost', 'costs', 'pricing', 'price', 'charge', 'charges', 'pay',
    'payment', 'expense', 'expenses', 'rate', 'rates', 'affordable', 'tuition', 'fine', 'scholarship'
  ],
  academics_courses: [
    'course', 'courses', 'program', 'programs', 'degree', 'degrees', 'study', 'studying',
    'btech', 'mba', 'bba', 'bca', 'phd', 'ug', 'pg', 'undergraduate', 'postgraduate',
    'branch', 'curriculum', 'syllabus', 'electives', 'cbcs', 'duration', 'semester', 'engineering', 'commerce', 'law', 'science'
  ],
  placement_career: [
    'placement', 'placements', 'job', 'jobs', 'company', 'companies', 'recruitment',
    'hiring', 'package', 'salary', 'ctc', 'lpa', 'interview', 'interviews', 'aptitude',
    'career', 'alumni', 'resume', 'hire'
  ],
  internship: [
    'internship', 'internships', 'intern', 'interns', 'stipend', 'industrial', 'training', 'practical'
  ],
  attendance_rules: [
    'attendance', 'attend', 'percentage', 'mandatory', 'compulsory', 'requirement',
    'shortage', 'minimum', '75', '75%', 'strict', 'penalty', 'leave', 'biometric', 'presence'
  ],
  exams_grading: [
    'exam', 'exams', 'examination', 'examinations', 'test', 'tests', 'assessment',
    'marks', 'mark', 'grade', 'grades', 'grading', 'result', 'results', 'revaluation',
    're-exam', 'supplementary', 'backlog', 'backlogs', 'transcript', 'marksheet'
  ],
  infrastructure_facilities: [
    'infrastructure', 'campus', 'building', 'classroom', 'classrooms', 'smart', 'board',
    'projector', 'lab', 'labs', 'laboratory', 'computer', 'coding', 'wifi', 'internet',
    'atm', 'bank', 'banking', 'lift', 'lifts', 'parking', 'clean', 'green', 'greenery',
    'drinking', 'water', 'purified', 'restroom', 'restrooms', 'auditorium'
  ],
  library: [
    'library', 'libraries', 'book', 'books', 'digital', 'resource', 'resources', 'timing', 'timings'
  ],
  sports_fitness: [
    'sport', 'sports', 'game', 'games', 'cricket', 'football', 'basketball', 'gym',
    'fitness', 'trainer', 'trainers', 'yoga', 'court', 'tournament', 'tournaments'
  ],
  transportation: [
    'transport', 'transportation', 'bus', 'buses', 'route', 'routes', 'commute',
    'travel', 'connectivity', 'vehicle', 'vehicles', 'airport', 'yelahanka'
  ],
  food_dining: [
    'food', 'canteen', 'cafeteria', 'mess', 'dining', 'veg', 'vegetarian', 'non-veg',
    'meal', 'meals', 'snack', 'hygienic', 'canteen'
  ],
  safety_support: [
    'safe', 'safety', 'security', 'guard', 'guards', 'cctv', 'medical', 'first aid',
    'doctor', 'emergency', 'helpline', 'counselling', 'proctor', 'anti-ragging', 'ragging',
    'grievance', 'complaint', 'complaints', 'discipline'
  ],
  clubs_activities: [
    'club', 'clubs', 'fest', 'fests', 'event', 'events', 'cultural', 'music', 'dance',
    'theatre', 'drama', 'photography', 'hackathon', 'hackathons', 'nss', 'ncc', 'volunteer',
    'volunteering', 'festival', 'festivals', 'orientation'
  ],
  location_geography: [
    'location', 'located', 'address', 'city', 'area', 'where', 'bangalore', 'bengaluru',
    'karnataka', 'yelahanka', 'kattigenahalli', 'rukmini'
  ],
  institution_general: [
    'established', 'founded', 'private', 'government', 'ugc', 'naac', 'accreditation',
    'approved', 'worth', 'famous', 'reputed', 'reva', 'university'
  ]
};

// Generate a deterministic 64-dimensional semantic embedding space
const VECTOR_DIM = 64;

// Build concept vector maps
const CONCEPT_VECTORS = new Map<string, Float32Array>();

// Seed deterministic pseudo-random vectors for word roots and clusters
function hashStringToVector(str: string, dim: number): Float32Array {
  const vec = new Float32Array(dim);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  for (let d = 0; d < dim; d++) {
    const seed = Math.sin(hash + d * 13.37) * 10000;
    vec[d] = seed - Math.floor(seed) - 0.5;
  }

  // Normalize
  let sumSq = 0;
  for (let d = 0; d < dim; d++) sumSq += vec[d] * vec[d];
  const mag = Math.sqrt(sumSq) || 1.0;
  for (let d = 0; d < dim; d++) vec[d] /= mag;

  return vec;
}

// Pre-initialize cluster basis vectors
const CLUSTER_BASES = new Map<string, Float32Array>();
for (const clusterKey of Object.keys(SEMANTIC_CLUSTERS)) {
  CLUSTER_BASES.set(clusterKey, hashStringToVector('cluster_' + clusterKey, VECTOR_DIM));
}

export function getWordSemanticVector(word: string): Float32Array {
  const stemmed = stemToken(word.toLowerCase());
  if (CONCEPT_VECTORS.has(stemmed)) {
    return CONCEPT_VECTORS.get(stemmed)!;
  }

  const baseVec = hashStringToVector(stemmed, VECTOR_DIM);

  // Blend with semantic clusters
  for (const [clusterKey, words] of Object.entries(SEMANTIC_CLUSTERS)) {
    const match = words.some((w) => stemToken(w) === stemmed || w === word.toLowerCase());
    if (match) {
      const clusterBasis = CLUSTER_BASES.get(clusterKey)!;
      for (let d = 0; d < VECTOR_DIM; d++) {
        baseVec[d] = baseVec[d] * 0.4 + clusterBasis[d] * 0.6;
      }
    }
  }

  // Normalize
  let sumSq = 0;
  for (let d = 0; d < VECTOR_DIM; d++) sumSq += baseVec[d] * baseVec[d];
  const mag = Math.sqrt(sumSq) || 1.0;
  for (let d = 0; d < VECTOR_DIM; d++) baseVec[d] /= mag;

  CONCEPT_VECTORS.set(stemmed, baseVec);
  return baseVec;
}

export interface SemanticDoc {
  id: number;
  question: string;
  answer: string;
  intent: string;
  embedding: Float32Array;
}

export interface SemanticMatch {
  doc: SemanticDoc;
  score: number;
}

export class SemanticIndex {
  private docs: SemanticDoc[] = [];
  private initialized: boolean = false;

  constructor() {
    this.buildIndex();
  }

  public buildIndex(qaPairs?: QAPair[]) {
    const pairs = qaPairs || getQAPairs();
    this.docs = [];

    for (const pair of pairs) {
      const emb = this.computeTextEmbedding(pair.question);
      this.docs.push({
        id: pair.id,
        question: pair.question,
        answer: pair.answer,
        intent: pair.intent,
        embedding: emb,
      });
    }

    this.initialized = true;
  }

  public computeTextEmbedding(text: string): Float32Array {
    const prep = preprocessText(text, {
      enableSpellingCorrection: true,
      enableStemming: true,
      enableBigrams: false,
    });

    const tokens = prep.stemmedTokens.length > 0 ? prep.stemmedTokens : prep.tokens;
    const aggregate = new Float32Array(VECTOR_DIM);

    if (tokens.length === 0) {
      return aggregate;
    }

    // Average embeddings of tokens with positional decay
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const wordVec = getWordSemanticVector(token);
      const posWeight = 1.0 - (i / (tokens.length * 2)); // slight front-weighting for key intent verbs
      for (let d = 0; d < VECTOR_DIM; d++) {
        aggregate[d] += wordVec[d] * posWeight;
      }
    }

    // Normalize
    let sumSq = 0;
    for (let d = 0; d < VECTOR_DIM; d++) sumSq += aggregate[d] * aggregate[d];
    const mag = Math.sqrt(sumSq) || 1.0;
    for (let d = 0; d < VECTOR_DIM; d++) aggregate[d] /= mag;

    return aggregate;
  }

  public cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    for (let d = 0; d < VECTOR_DIM; d++) {
      dot += a[d] * b[d];
    }
    return Math.max(0, Math.min(1.0, dot));
  }

  public search(query: string, topK: number = 5): SemanticMatch[] {
    if (!this.initialized) this.buildIndex();

    const queryEmb = this.computeTextEmbedding(query);
    const matches: SemanticMatch[] = [];

    for (const doc of this.docs) {
      const sim = this.cosineSimilarity(queryEmb, doc.embedding);
      matches.push({
        doc,
        score: sim,
      });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  public getAllDocs(): SemanticDoc[] {
    return this.docs;
  }
}

export const globalSemanticIndex = new SemanticIndex();

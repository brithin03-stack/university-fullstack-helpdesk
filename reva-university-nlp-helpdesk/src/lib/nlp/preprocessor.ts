import { PreprocessingResult } from '../../types';

// Standard comprehensive English stopwords
export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
  'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my',
  'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
  'yourself', 'yourselves'
]);

// Common spelling mistakes and contractions in college student queries
export const SPELLING_DICTIONARY: Record<string, string> = {
  'univercity': 'university',
  'unversity': 'university',
  'univ': 'university',
  'colg': 'college',
  'attendence': 'attendance',
  'attandance': 'attendance',
  'attendace': 'attendance',
  'attandence': 'attendance',
  'hostle': 'hostel',
  'hostels': 'hostel',
  'accomodation': 'accommodation',
  'acommodation': 'accommodation',
  'fee': 'fees',
  'cost': 'fees',
  'pricing': 'fees',
  'price': 'fees',
  'charges': 'fees',
  'charge': 'fees',
  'admision': 'admission',
  'addmission': 'admission',
  'addmissions': 'admissions',
  'admissions': 'admission',
  'certificats': 'certificates',
  'certficate': 'certificate',
  'eligiblity': 'eligibility',
  'sylabus': 'syllabus',
  'curriculam': 'curriculum',
  'profesor': 'professor',
  'faculties': 'faculty',
  'placemnt': 'placement',
  'placemnts': 'placements',
  'internshps': 'internships',
  'intership': 'internship',
  'intern': 'internship',
  'pkg': 'package',
  'pakage': 'package',
  'salery': 'salary',
  'btech': 'btech',
  'b.tech': 'btech',
  'm.tech': 'mtech',
  'mtech': 'mtech',
  'm.b.a': 'mba',
  'b.b.a': 'bba',
  'b.c.a': 'bca',
  'ph.d': 'phd',
  'wifi': 'wifi',
  'wi-fi': 'wifi',
  'wlan': 'wifi',
  'canteen': 'canteen',
  'cantine': 'canteen',
  'cafeteria': 'cafeteria',
  'cafteria': 'cafeteria',
  'mess': 'mess',
  'scholership': 'scholarship',
  'scholerships': 'scholarships',
  'libary': 'library',
  'lib': 'library',
  'lab': 'labs',
  'laboratry': 'laboratory',
  'laboratory': 'labs',
  'comp': 'computer',
  'proctor': 'counselling',
  'counseling': 'counselling',
  'transportation': 'transport',
  'transprt': 'transport',
  'busses': 'buses',
  'vechile': 'vehicle',
  'vechiles': 'vehicles',
  'reval': 'revaluation',
  're-evaluation': 'revaluation',
  'supplementry': 'supplementary',
  'suplementary': 'supplementary',
  'hackton': 'hackathon',
  'hackthons': 'hackathons',
};

// Porter-inspired stemmer & lemmatizer for english queries
export function stemToken(token: string): string {
  let word = token.toLowerCase();
  if (word.length <= 3) return word;

  // Domain-specific lemmatization
  const lemmaMap: Record<string, string> = {
    'universities': 'university',
    'facilities': 'facility',
    'courses': 'course',
    'programs': 'program',
    'degrees': 'degree',
    'hostels': 'hostel',
    'classrooms': 'classroom',
    'companies': 'company',
    'internships': 'internship',
    'placements': 'placement',
    'buses': 'bus',
    'libraries': 'library',
    'laboratories': 'lab',
    'labs': 'lab',
    'exams': 'exam',
    'examinations': 'exam',
    'marks': 'mark',
    'grades': 'grade',
    'costs': 'cost',
    'fees': 'fee',
    'requirements': 'requirement',
    'activities': 'activity',
    'events': 'event',
    'fests': 'fest',
    'competitions': 'competition',
    'trainings': 'training',
    'rules': 'rule',
    'regulations': 'regulation',
    'procedures': 'procedure',
    'certifications': 'certification',
    'certificates': 'certificate',
    'professors': 'professor',
    'teachers': 'teacher',
    'lectures': 'lecture',
    'timings': 'timing',
    'schedules': 'schedule',
    'accreditations': 'accreditation',
  };

  if (lemmaMap[word]) {
    return lemmaMap[word];
  }

  // Step 1: Plurals & standard suffixes
  if (word.endsWith('sses')) {
    word = word.slice(0, -2);
  } else if (word.endsWith('ies')) {
    word = word.slice(0, -3) + 'y';
  } else if (word.endsWith('ss')) {
    // Keep ss
  } else if (word.endsWith('s') && !word.endsWith('us') && !word.endsWith('is')) {
    word = word.slice(0, -1);
  }

  // Step 2: Past tense / participles
  if (word.endsWith('eed')) {
    if (word.length > 5) word = word.slice(0, -1);
  } else if (word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    if (stem.length >= 3 && /[aeiou]/.test(stem)) {
      word = stem;
    }
  } else if (word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    if (stem.length >= 3 && /[aeiou]/.test(stem)) {
      word = stem;
    }
  }

  // Step 3: Derivational suffixes
  if (word.endsWith('tional')) {
    word = word.slice(0, -2); // tional -> tion
  } else if (word.endsWith('ization')) {
    word = word.slice(0, -5) + 'ize';
  } else if (word.endsWith('ation')) {
    word = word.slice(0, -3) + 'e';
  } else if (word.endsWith('ment') && word.length > 6) {
    word = word.slice(0, -4);
  } else if (word.endsWith('able') && word.length > 6) {
    word = word.slice(0, -4);
  }

  return word;
}

/**
 * Calculates Levenshtein Distance for typo matching
 */
export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Master Preprocessor for user queries and dataset documents
 */
export function preprocessText(
  text: string,
  options: {
    enableSpellingCorrection?: boolean;
    enableStemming?: boolean;
    enableBigrams?: boolean;
  } = {}
): PreprocessingResult {
  const {
    enableSpellingCorrection = true,
    enableStemming = true,
    enableBigrams = true,
  } = options;

  const original = text;
  // Step 1: Lowercase & normalize spaces & punctuation
  let normalized = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Step 2: Tokenize
  const rawTokens = normalized.split(/\s+/).filter(Boolean);

  const spellingCorrections: Record<string, string> = {};
  const tokens: string[] = [];
  const removedStopwords: string[] = [];

  for (const rawToken of rawTokens) {
    let token = rawToken;

    // Check spelling dictionary
    if (enableSpellingCorrection && SPELLING_DICTIONARY[token]) {
      const corrected = SPELLING_DICTIONARY[token];
      spellingCorrections[token] = corrected;
      token = corrected;
    }

    // Stopword check
    if (STOPWORDS.has(token)) {
      removedStopwords.push(token);
    } else {
      tokens.push(token);
    }
  }

  // If all tokens were stopwords (e.g., "Where is it?"), keep raw non-empty tokens
  const activeTokens = tokens.length > 0 ? tokens : rawTokens;

  // Step 3: Stemming / Lemmatization
  const stemmedTokens = enableStemming
    ? activeTokens.map((t) => stemToken(t))
    : [...activeTokens];

  // Step 4: Bigram generation
  const bigrams: string[] = [];
  if (enableBigrams && stemmedTokens.length >= 2) {
    for (let i = 0; i < stemmedTokens.length - 1; i++) {
      bigrams.push(`${stemmedTokens[i]}_${stemmedTokens[i + 1]}`);
    }
  }

  return {
    original,
    normalizedText: normalized,
    tokens: activeTokens,
    stemmedTokens,
    removedStopwords,
    spellingCorrections,
    bigrams,
  };
}

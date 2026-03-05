import { FormQuestion } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// SMART SEMANTIC CONSTRAINT ENGINE
// ─────────────────────────────────────────────────────────────────────────
// Dynamically analyzes any form, classifies questions & options into
// semantic categories, detects logical relationships, and auto-generates
// per-record constraints. Zero AI API calls — 100% local heuristics.
// ═══════════════════════════════════════════════════════════════════════════

// ─── TYPES ───────────────────────────────────────────────────────────────

/** Semantic category a question can belong to */
export type QuestionCategory =
    | 'age'
    | 'occupation'
    | 'income'
    | 'education'
    | 'experience'
    | 'gender'
    | 'marital'
    | 'unknown';

/** Semantic sub-class an option value can belong to within its category */
export type OptionClass =
    // Age classes
    | 'minor' | 'young_adult' | 'adult' | 'middle_aged' | 'senior'
    // Occupation classes
    | 'student' | 'employed' | 'senior_professional' | 'business' | 'unemployed' | 'retired'
    // Income classes
    | 'no_income' | 'low_income' | 'mid_income' | 'high_income' | 'very_high_income'
    // Education classes
    | 'school' | 'undergrad' | 'postgrad' | 'doctorate'
    // Experience classes
    | 'no_exp' | 'junior_exp' | 'mid_exp' | 'senior_exp' | 'veteran_exp'
    // Gender
    | 'male' | 'female' | 'other_gender'
    // Marital
    | 'single' | 'married' | 'divorced' | 'widowed'
    // Fallback
    | 'unclassified';

export interface ClassifiedOption {
    value: string;
    weight: number;
    optionClass: string;
}

export interface ClassifiedQuestion {
    questionId: string;
    title: string;
    category: string;
    options: ClassifiedOption[];
}

export interface FieldConstraint {
    id: string;
    description: string;
    sourceQuestionId: string;
    sourceCategory: string;
    sourceClasses: string[];       // if source option matches one of these...
    targetQuestionId: string;
    targetCategory: string;
    blockedClasses: string[];      // ...then block these target classes
}

export interface ConstraintViolation {
    constraintId: string;
    description: string;
    triggerQuestionId: string;
    triggerValue: string;
    violatingQuestionId: string;
    violatingValue: string;
}

// ─── QUESTION CLASSIFIERS ────────────────────────────────────────────────
// Each classifier checks title AND option values to maximize detection accuracy

const CATEGORY_DETECTORS: Array<{
    category: QuestionCategory;
    titlePattern: RegExp;
    optionHints?: RegExp; // if options match this, boosts confidence
    excludePattern?: RegExp; // if title matches this, immediately skip (prevents context hallucinations)
}> = [
        {
            category: 'age',
            titlePattern: /\bage\b|age.?group|age.?range|how old|age.?bracket|your age/i,
            optionHints: /under.?18|18.?2[0-5]|2[5-9].?3|3[0-9].?4|above.?[4-6]|years?\s*old|\d+\s*-\s*\d+/i,
            excludePattern: /\b(kid|child|son|daughter|father|mother|husband|wife|spouse|parent|company|business)\b/i,
        },
        {
            category: 'occupation',
            titlePattern: /profession|occupation|employment|job\b|work|designation|working|career|what do you do/i,
            optionHints: /student|employ|business|retire|freelanc|engineer|doctor|teacher|homemaker|unemploy/i,
            excludePattern: /\b(company|spouse|father|mother|husband|wife|parent|child|kid|son|daughter)\b/i,
        },
        {
            category: 'income',
            titlePattern: /\bincome\b|\bsalary\b|\bearn\b|\bearning\b|stipend|pocket.?money|monthly.?income|annual.?income|\bctc\b|\bwage\b/i,
            optionHints: /no.?income|none|nil|lakh|thousand|[₹$]|0.?to|below.?[0-9]|above.?[0-9]/i,
            excludePattern: /\b(company|spouse|father|mother|husband|wife|parent|revenue|turnover|profit)\b/i,
        },
        {
            category: 'education',
            titlePattern: /education|qualification|degree|highest.?study|studying|academic|educational/i,
            optionHints: /school|10th|12th|bachelor|master|phd|diploma|degree|undergrad|postgrad|high.?school/i,
            excludePattern: /\b(kid|child|son|daughter|father|mother|husband|wife|spouse|parent)\b/i,
        },
        {
            category: 'experience',
            titlePattern: /experience|years?.?of.?work|work.?experience|professional.?experience/i,
            optionHints: /\d+\s*(year|yr)|fresher|entry.?level|senior|no.?experience/i,
        },
        {
            category: 'gender',
            titlePattern: /gender|sex\b/i,
            optionHints: /male|female|non.?binary|prefer.?not|transgender|other/i,
            excludePattern: /\b(kid|child|son|daughter|father|mother|husband|wife|spouse|parent)\b/i,
        },
        {
            category: 'marital',
            titlePattern: /marital|married|marriage|relationship.?status/i,
            optionHints: /single|married|divorced|widowed|separated|in.?a.?relationship/i,
        },
    ];

// ─── OPTION CLASSIFIERS ──────────────────────────────────────────────────
// IMPORTANT: Order matters! More specific patterns MUST come before general ones.

const OPTION_CLASSIFIERS: Record<QuestionCategory, Array<{ cls: OptionClass; pattern: RegExp }>> = {
    age: [
        { cls: 'minor', pattern: /under.?18|below.?18|<\s*18|13.?17|14.?17|15.?17|less.?than.?18|minor|child|0.?1[0-7]|10.?17/i },
        { cls: 'young_adult', pattern: /18.?2[0-5]|18.?to.?2[0-5]|19.?24|18.?24|20.?25|^1[89]$|^2[0-5]$/i },
        { cls: 'adult', pattern: /2[5-9].?3[0-5]|25.?34|26.?35|25.?30|30.?35/i },
        { cls: 'middle_aged', pattern: /3[5-9].?4[0-5]|35.?44|36.?45|40.?49|45.?54|35.?50/i },
        { cls: 'senior', pattern: /above.?4[0-9]|above.?5[0-9]|above.?6[0-9]|5[0-9].?above|4[5-9].?above|older|65\+|60\+|55\+|50\+|45\+|above.?50|above.?45|50.?above|senior|elder/i },
    ],
    occupation: [
        // MORE SPECIFIC patterns first — business/self-employed before general "employed"
        { cls: 'student', pattern: /student|school|college|studying|learner|pupil|intern|fresher|trainee|scholar/i },
        { cls: 'senior_professional', pattern: /\bsenior\b|director|executive|manager|ceo|cto|vp|vice.?president|head.?of|chief|lead|principal|partner/i },
        { cls: 'business', pattern: /business|self.?employ|entrepreneur|freelanc|consultant|founder|startup|owner/i },
        { cls: 'unemployed', pattern: /unemploy|not.?working|jobless|homemaker|housewife|house.?husband|looking.?for.?job/i },
        { cls: 'employed', pattern: /working|professional|employed|job|engineer|doctor|teacher|lawyer|nurse|developer|analyst|designer|accountant|clerk|officer|salaried/i },
        { cls: 'retired', pattern: /retire|pension|senior.?citizen/i },
    ],
    income: [
        // Order: very_high → high → mid → low → no (most specific value patterns first)
        { cls: 'very_high_income', pattern: /above.?[₹]?\s*1[,\s]*00[,\s]*000|above.?[₹]?\s*1.?lakh|more.?than.?[₹]?\s*1.?lakh|[₹]\s*1[,\s]*00[,\s]*000|above.?1[,\s]*00|[₹$]\s*[2-9][,\s]*00[,\s]*000/i },
        { cls: 'high_income', pattern: /[₹]?\s*50[,\s]*000|50.?to|50.?1|above.?50|more.?than.?50|50.?lakh|[₹]?\s*[5-9][0-9][,\s]*000/i },
        { cls: 'mid_income', pattern: /[₹]?\s*[2-4][0-9][,\s]*000|20.?to|25.?to|30.?to|20.?30|25.?50|30.?40|30.?50|[₹]?\s*10.?000.{0,5}30|[₹]?\s*10.?000.{0,5}50/i },
        { cls: 'low_income', pattern: /below.?[₹]?\s*[1-2][0-9]|under.?[₹]?\s*[1-2][0-9]|less.?than.?[₹]?\s*[1-2][0-9]|below.?[₹]?\s*5|under.?[₹]?\s*5|[₹]?\s*5.?000|under.?[₹]?\s*10|below.?[₹]?\s*10|less.?than.?[₹]?\s*10|[₹]?\s*[1-9][,\s]*000\b/i },
        { cls: 'no_income', pattern: /^no.?income$|^none$|^zero$|^nil$|not.?earning|pocket.?money|dependent|^0$/i },
    ],
    education: [
        // Order: doctorate → postgrad → undergrad → school (most specific first)
        { cls: 'doctorate', pattern: /phd|doctorate|post.?doc|d\.?litt|d\.?sc/i },
        { cls: 'postgrad', pattern: /master'?s?|post.?grad|m\.?tech|m\.?sc\b|mba|\bm\.?a\b|m\.?com\b|m\.?ed\b|m\.?phil|\bpg\b/i },
        { cls: 'undergrad', pattern: /bachelor|b\.?tech|b\.?sc|b\.?com|b\.?a\b|bba|bca|undergrad|diploma|certificate|graduate(?!.*post)/i },
        { cls: 'school', pattern: /school|10th|12th|high.?school|secondary|ssc|hsc|class.?[0-9]|intermediate|below.?10|primary|middle/i },
    ],
    experience: [
        { cls: 'veteran_exp', pattern: /1[0-9].?year|2[0-9].?year|above.?10|more.?than.?10|10\+|15\+|20\+|over.?10/i },
        { cls: 'senior_exp', pattern: /[7-9]\s*(-|to)\s*[0-9]+\s*year|7.?year|8.?year|9.?year|10.?year|7.?to|8.?to|10.?to/i },
        { cls: 'mid_exp', pattern: /[3-6]\s*(-|to)\s*[5-7]\s*year|3.?year|4.?year|5.?year|3.?to.?5|5.?to.?7/i },
        { cls: 'junior_exp', pattern: /[0-2]\s*(-|to)\s*[1-3]\s*year|1.?year|2.?year|less.?than.?3|under.?3|below.?3|1.?to.?3/i },
        { cls: 'no_exp', pattern: /no.?experience|fresher|entry.?level|0.?year|none|just.?start|new.?to/i },
    ],
    gender: [
        { cls: 'male', pattern: /^male$|^m$|^man$|^boy$/i },
        { cls: 'female', pattern: /^female$|^f$|^woman$|^girl$/i },
        { cls: 'other_gender', pattern: /non.?binary|other|prefer.?not|transgender|custom/i },
    ],
    marital: [
        { cls: 'single', pattern: /single|unmarried|never.?married/i },
        { cls: 'married', pattern: /married|spouse|domestic.?partner/i },
        { cls: 'divorced', pattern: /divorced|separated|annulled/i },
        { cls: 'widowed', pattern: /widowed|widower/i },
    ],
    unknown: [],
};

// ─── COMPATIBILITY MATRIX ────────────────────────────────────────────────
// Defines which option classes are INCOMPATIBLE across question categories.
// Format: [sourceCategory, sourceClass[], targetCategory, blockedClass[], description]

type CompatibilityRule = {
    sourceCategory: QuestionCategory;
    sourceClasses: OptionClass[];
    targetCategory: QuestionCategory;
    blockedClasses: OptionClass[];
    description: string;
};

const COMPATIBILITY_RULES: CompatibilityRule[] = [
    // ── Student constraints ──
    { sourceCategory: 'occupation', sourceClasses: ['student'], targetCategory: 'age', blockedClasses: ['middle_aged', 'senior'], description: 'Students are typically young, not middle-aged or senior' },
    { sourceCategory: 'occupation', sourceClasses: ['student'], targetCategory: 'income', blockedClasses: ['high_income', 'very_high_income'], description: 'Students typically have low/no income' },
    { sourceCategory: 'occupation', sourceClasses: ['student'], targetCategory: 'education', blockedClasses: ['doctorate'], description: 'Students are still studying, unlikely to have a doctorate' },
    { sourceCategory: 'occupation', sourceClasses: ['student'], targetCategory: 'experience', blockedClasses: ['senior_exp', 'veteran_exp'], description: 'Students have little to no work experience' },

    // ── Retired constraints ──
    { sourceCategory: 'occupation', sourceClasses: ['retired'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult', 'adult'], description: 'Retired people are typically older' },
    { sourceCategory: 'occupation', sourceClasses: ['retired'], targetCategory: 'income', blockedClasses: ['very_high_income'], description: 'Retired people unlikely to have very high active income' },
    { sourceCategory: 'occupation', sourceClasses: ['retired'], targetCategory: 'experience', blockedClasses: ['no_exp', 'junior_exp'], description: 'Retired people have significant experience' },

    // ── Senior professional constraints ──
    { sourceCategory: 'occupation', sourceClasses: ['senior_professional'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult'], description: 'Senior professionals need years to reach that level' },
    { sourceCategory: 'occupation', sourceClasses: ['senior_professional'], targetCategory: 'experience', blockedClasses: ['no_exp', 'junior_exp'], description: 'Senior roles require significant experience' },
    { sourceCategory: 'occupation', sourceClasses: ['senior_professional'], targetCategory: 'income', blockedClasses: ['no_income', 'low_income'], description: 'Senior professionals earn well' },

    // ── Minor (age) constraints ──
    { sourceCategory: 'age', sourceClasses: ['minor'], targetCategory: 'occupation', blockedClasses: ['employed', 'senior_professional', 'business', 'retired'], description: 'Minors are too young for professional roles' },
    { sourceCategory: 'age', sourceClasses: ['minor'], targetCategory: 'income', blockedClasses: ['mid_income', 'high_income', 'very_high_income'], description: 'Minors have no/minimal income' },
    { sourceCategory: 'age', sourceClasses: ['minor'], targetCategory: 'education', blockedClasses: ['undergrad', 'postgrad', 'doctorate'], description: 'Minors are in school, not college/university' },
    { sourceCategory: 'age', sourceClasses: ['minor'], targetCategory: 'experience', blockedClasses: ['mid_exp', 'senior_exp', 'veteran_exp'], description: 'Minors have no professional experience' },

    // ── Young adult constraints ──
    { sourceCategory: 'age', sourceClasses: ['young_adult'], targetCategory: 'occupation', blockedClasses: ['retired', 'senior_professional'], description: 'Young adults are too young for retirement or senior roles' },
    { sourceCategory: 'age', sourceClasses: ['young_adult'], targetCategory: 'education', blockedClasses: ['doctorate'], description: 'Young adults havent had time for a doctorate' },
    { sourceCategory: 'age', sourceClasses: ['young_adult'], targetCategory: 'experience', blockedClasses: ['senior_exp', 'veteran_exp'], description: 'Young adults cant have 10+ years experience' },
    { sourceCategory: 'age', sourceClasses: ['young_adult'], targetCategory: 'income', blockedClasses: ['very_high_income'], description: 'Young adults rarely earn at the highest tier' },

    // ── Senior age constraints ──
    { sourceCategory: 'age', sourceClasses: ['senior'], targetCategory: 'occupation', blockedClasses: ['student'], description: 'Seniors are typically not students' },
    { sourceCategory: 'age', sourceClasses: ['senior'], targetCategory: 'experience', blockedClasses: ['no_exp', 'junior_exp'], description: 'Seniors have accumulated experience' },

    // ── Income → Occupation ──
    { sourceCategory: 'income', sourceClasses: ['no_income'], targetCategory: 'occupation', blockedClasses: ['senior_professional', 'business'], description: 'Zero income rules out senior professional or business owner' },
    { sourceCategory: 'income', sourceClasses: ['very_high_income'], targetCategory: 'occupation', blockedClasses: ['student', 'unemployed'], description: 'Very high income incompatible with student/unemployed' },
    { sourceCategory: 'income', sourceClasses: ['very_high_income'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult'], description: 'Very high income unlikely for minors or young adults' },

    // ── Education → Occupation ──
    { sourceCategory: 'education', sourceClasses: ['school'], targetCategory: 'occupation', blockedClasses: ['senior_professional'], description: 'School education insufficient for senior roles' },
    { sourceCategory: 'education', sourceClasses: ['doctorate'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult'], description: 'Doctorate requires years of study' },

    // ── Experience → Age ──
    { sourceCategory: 'experience', sourceClasses: ['veteran_exp'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult'], description: '10+ years experience requires older age' },
    { sourceCategory: 'experience', sourceClasses: ['senior_exp'], targetCategory: 'age', blockedClasses: ['minor', 'young_adult'], description: '7+ years experience requires older age' },
    { sourceCategory: 'experience', sourceClasses: ['no_exp'], targetCategory: 'occupation', blockedClasses: ['senior_professional'], description: 'No experience rules out senior roles' },

    // ── Age → Marital ──
    { sourceCategory: 'age', sourceClasses: ['minor'], targetCategory: 'marital', blockedClasses: ['married', 'divorced', 'widowed'], description: 'Minors are typically single' },

    // ── Occupation → Gender ──
    { sourceCategory: 'occupation', sourceClasses: ['unemployed'], targetCategory: 'gender', blockedClasses: [], description: 'Occupation and Gender are loosely related, handled softly' }, // Placeholder for generic check if needed
    // Assuming housewife/homemaker was matched under unemployed. Let's make a specific rule if we had housewife.

    // ── Education → Age ──
    { sourceCategory: 'education', sourceClasses: ['school'], targetCategory: 'age', blockedClasses: ['senior'], description: 'Seniors have usually completed higher education' },

    // ── Gender → Occupation (Soft rules) ──
    // In many datasets, 'homemaker' is strongly female-skewed, but structurally it's just 'unemployed' in our classifiers. We won't block strictly.
];


// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classifies a question into a semantic category.
 * Uses both title keywords and option content for robust detection.
 */
export const classifyQuestion = (q: FormQuestion): QuestionCategory => {
    if (q.options.length === 0) return 'unknown';

    const optionText = q.options.map(o => o.value).join(' ');

    for (const detector of CATEGORY_DETECTORS) {
        // If the title contains words indicating it's about someone else, skip classifying
        if (detector.excludePattern && detector.excludePattern.test(q.title)) {
            continue;
        }

        const titleMatch = detector.titlePattern.test(q.title);
        const optionMatch = detector.optionHints ? detector.optionHints.test(optionText) : false;

        // Strong title match alone is enough
        if (titleMatch) return detector.category;

        // If title is ambiguous but options strongly hint, still classify
        // (e.g., question titled "Background" with options "Student, Working, Retired")
        if (optionMatch && !titleMatch) {
            // Count how many options match — need at least 40% for confidence
            const matchCount = q.options.filter(o => detector.optionHints!.test(o.value)).length;
            if (matchCount / q.options.length >= 0.4) return detector.category;
        }
    }

    return 'unknown';
};

/**
 * Classifies an option value within its category context.
 */
export const classifyOption = (value: string, category: QuestionCategory): OptionClass => {
    const classifiers = OPTION_CLASSIFIERS[category];
    if (!classifiers || classifiers.length === 0) return 'unclassified';

    for (const { cls, pattern } of classifiers) {
        if (pattern.test(value)) return cls;
    }
    return 'unclassified';
};

/**
 * Analyzes an entire form: classifies all questions and their options.
 */
export const classifyForm = (questions: FormQuestion[]): ClassifiedQuestion[] => {
    return questions
        .filter(q => q.options.length > 0)
        .map(q => {
            const category = classifyQuestion(q);
            return {
                questionId: q.id,
                title: q.title,
                category,
                options: q.options.map(o => ({
                    value: o.value,
                    weight: o.weight || 0,
                    optionClass: classifyOption(o.value, category),
                })),
            };
        });
};

/**
 * Dynamically generates constraints for a specific form.
 * Only creates constraints where both source and target questions exist.
 */
export const buildConstraintMap = (questions: FormQuestion[]): FieldConstraint[] => {
    const classified = classifyForm(questions);
    const constraints: FieldConstraint[] = [];

    // Build a lookup: category → classified question
    const categoryMap = new Map<string, ClassifiedQuestion>();
    for (const cq of classified) {
        if (cq.category !== 'unknown') {
            categoryMap.set(cq.category, cq);
        }
    }

    // Generate constraints from compatibility rules
    for (const rule of COMPATIBILITY_RULES) {
        const sourceQ = categoryMap.get(rule.sourceCategory);
        const targetQ = categoryMap.get(rule.targetCategory);

        if (!sourceQ || !targetQ) continue;

        // Check if the source question actually HAS options matching the source classes
        const hasSourceOptions = sourceQ.options.some(o =>
            (rule.sourceClasses as string[]).includes(o.optionClass)
        );
        if (!hasSourceOptions) continue;

        // Check if the target question actually HAS options matching the blocked classes
        const hasBlockedOptions = targetQ.options.some(o =>
            (rule.blockedClasses as string[]).includes(o.optionClass)
        );
        if (!hasBlockedOptions) continue;

        // Also verify target has at least 1 non-blocked option (otherwise we'd block everything)
        const hasAllowedOptions = targetQ.options.some(o =>
            !(rule.blockedClasses as string[]).includes(o.optionClass) && o.optionClass !== 'unclassified'
        );
        if (!hasAllowedOptions) continue;

        constraints.push({
            id: `${rule.sourceCategory}_${rule.sourceClasses[0]}_vs_${rule.targetCategory}`,
            description: rule.description,
            sourceQuestionId: sourceQ.questionId,
            sourceCategory: rule.sourceCategory,
            sourceClasses: rule.sourceClasses,
            targetQuestionId: targetQ.questionId,
            targetCategory: rule.targetCategory,
            blockedClasses: rule.blockedClasses,
        });
    }

    return constraints;
};


// ═══════════════════════════════════════════════════════════════════════════
// INLINE JS GENERATOR — embeds into the generated automation script
// ═══════════════════════════════════════════════════════════════════════════

export const generateInlineConstraintJS = (
    constraints: FieldConstraint[],
    classifiedQuestions: ClassifiedQuestion[]
): string => {
    if (constraints.length === 0) return '';

    // Serialize the classification data so the script knows each option's semantic class
    const optionClassMap: Record<string, Record<string, string>> = {};
    for (const cq of classifiedQuestions) {
        if (cq.category === 'unknown') continue;
        optionClassMap[cq.questionId] = {};
        for (const o of cq.options) {
            optionClassMap[cq.questionId][o.value] = o.optionClass;
        }
    }

    const constraintsJSON = JSON.stringify(constraints);
    const classMapJSON = JSON.stringify(optionClassMap);

    return `
  // ═══ SMART CONSTRAINT VALIDATION ENGINE ═══
  const CONSTRAINTS = ${constraintsJSON};
  const OPTION_CLASS_MAP = ${classMapJSON};

  const getOptionClass = (questionId, value) => {
    const qMap = OPTION_CLASS_MAP[questionId];
    if (!qMap) return 'unclassified';
    return qMap[value] || 'unclassified';
  };

  const validateGeneratedRecord = (record) => {
    const violations = [];
    for (const c of CONSTRAINTS) {
      const sourceVal = record[c.sourceQuestionId];
      if (!sourceVal) continue;

      const sourceClass = getOptionClass(c.sourceQuestionId, sourceVal);
      if (!c.sourceClasses.includes(sourceClass)) continue;

      const targetVal = record[c.targetQuestionId];
      if (!targetVal) continue;

      const targetClass = getOptionClass(c.targetQuestionId, targetVal);
      if (c.blockedClasses.includes(targetClass)) {
        violations.push({
          constraintId: c.id,
          targetQuestionId: c.targetQuestionId,
          blockedClasses: c.blockedClasses,
          targetValue: targetVal
        });
      }
    }
    return violations;
  };

  const selectWeightedFiltered = (options, questionId, blockedClasses) => {
    const allowed = options.filter(o => {
      const cls = getOptionClass(questionId, o.value);
      return !blockedClasses.includes(cls);
    });
    if (allowed.length === 0) return options[0]; // absolute fallback
    const total = allowed.reduce((acc, o) => acc + (o.weight || 1), 0);
    let rand = Math.random() * total;
    for (const o of allowed) {
      if (rand < (o.weight || 1)) return o;
      rand -= (o.weight || 1);
    }
    return allowed[allowed.length - 1];
  };

  const resolveRecordViolations = (record) => {
    const MAX_RETRIES = 5;
    let retries = 0;
    let violations = validateGeneratedRecord(record);

    while (violations.length > 0 && retries < MAX_RETRIES) {
      for (const v of violations) {
        const depQ = CONFIG.questions.find(q => q.id === v.targetQuestionId);
        if (!depQ) continue;
        const newOption = selectWeightedFiltered(depQ.options, v.targetQuestionId, v.blockedClasses);
        record[depQ.id] = newOption.value;
      }
      retries++;
      violations = validateGeneratedRecord(record);
    }

    return record;
  };
  // ═══ END CONSTRAINT ENGINE ═══`;
};

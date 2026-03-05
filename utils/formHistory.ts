/**
 * Form Configuration History
 * Saves and restores form weightages/settings via localStorage.
 * Keyed by normalized form URL. LRU eviction at 10 entries.
 */

const STORAGE_PREFIX = 'AF_HISTORY:';
const INDEX_KEY = 'AF_HISTORY_INDEX';
const MAX_ENTRIES = 10;

export interface SavedFormConfig {
    formUrl: string;
    formTitle: string;
    savedAt: number; // timestamp
    targetCount: number;
    speedMode: 'auto' | 'manual';
    delayMin: number;
    nameSource: 'auto' | 'indian' | 'custom';
    customNamesRaw: string;
    customResponses: Record<string, string>;
    /** Map of questionId → option weights array */
    questionWeights: Record<string, number[]>;
    aiApplied?: boolean;
}

/** Normalize URL to strip query params and trailing slashes */
function normalizeUrl(url: string): string {
    try {
        const u = new URL(url);
        return u.origin + u.pathname.replace(/\/+$/, '');
    } catch {
        return url.trim().replace(/\/+$/, '').split('?')[0];
    }
}

function getIndex(): string[] {
    try {
        const raw = localStorage.getItem(INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setIndex(index: string[]) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Evict oldest entries if over MAX_ENTRIES */
function enforceLimit() {
    const index = getIndex();
    while (index.length > MAX_ENTRIES) {
        const oldest = index.shift()!;
        localStorage.removeItem(STORAGE_PREFIX + oldest);
    }
    setIndex(index);
}

/**
 * Save config for a form URL.
 * Call this right before launching a mission.
 */
export function saveFormConfig(
    url: string,
    formTitle: string,
    analysis: { questions: Array<{ id: string; options: Array<{ weight?: number }> }> },
    settings: {
        targetCount: number;
        speedMode: 'auto' | 'manual';
        delayMin: number;
        nameSource: 'auto' | 'indian' | 'custom';
        customNamesRaw: string;
        customResponses: Record<string, string>;
        aiApplied?: boolean;
    }
): void {
    const key = normalizeUrl(url);

    // Build question weights map
    const questionWeights: Record<string, number[]> = {};
    analysis.questions.forEach(q => {
        if (q.options && q.options.length > 0) {
            questionWeights[q.id] = q.options.map(o => o.weight ?? 0);
        }
    });

    const config: SavedFormConfig = {
        formUrl: key,
        formTitle,
        savedAt: Date.now(),
        targetCount: settings.targetCount,
        speedMode: settings.speedMode,
        delayMin: settings.delayMin,
        nameSource: settings.nameSource,
        customNamesRaw: settings.customNamesRaw,
        customResponses: settings.customResponses,
        questionWeights,
        aiApplied: settings.aiApplied || false,
    };

    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(config));

        // Update LRU index
        let index = getIndex();
        index = index.filter(k => k !== key);
        index.push(key); // most recent at end
        setIndex(index);
        enforceLimit();
    } catch (e) {
        console.warn('[FormHistory] Failed to save:', e);
    }
}

/**
 * Load saved config for a form URL.
 * Returns null if no history exists.
 */
export function loadFormConfig(url: string): SavedFormConfig | null {
    const key = normalizeUrl(url);
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        const config = JSON.parse(raw) as SavedFormConfig;

        // 24 hour expiration check
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (Date.now() - config.savedAt > TWENTY_FOUR_HOURS) {
            clearFormConfig(key);
            return null;
        }

        return config;
    } catch {
        return null;
    }
}

/**
 * Remove saved config for a form URL.
 */
export function clearFormConfig(url: string): void {
    const key = normalizeUrl(url);
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
        const index = getIndex().filter(k => k !== key);
        setIndex(index);
    } catch {
        // ignore
    }
}

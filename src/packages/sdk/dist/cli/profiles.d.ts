/**
 * Gate profile presets: strict, balanced, fast.
 * Profiles override flags unless explicitly set.
 */
export declare const PROFILES: {
    readonly strict: {
        readonly minScore: 95;
        readonly maxDrop: 0;
        readonly warnDrop: 0;
        readonly minN: 30;
        readonly allowWeakEvidence: false;
    };
    readonly balanced: {
        readonly minScore: 90;
        readonly maxDrop: 2;
        readonly warnDrop: 1;
        readonly minN: 10;
        readonly allowWeakEvidence: false;
    };
    readonly fast: {
        readonly minScore: 85;
        readonly maxDrop: 5;
        readonly warnDrop: 2;
        readonly minN: 5;
        readonly allowWeakEvidence: true;
    };
};
export type ProfileName = keyof typeof PROFILES;

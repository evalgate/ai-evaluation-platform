"use strict";
/**
 * Gate profile presets: strict, balanced, fast.
 * Profiles override flags unless explicitly set.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILES = void 0;
exports.PROFILES = {
    strict: {
        minScore: 95,
        maxDrop: 0,
        warnDrop: 0,
        minN: 30,
        allowWeakEvidence: false,
    },
    balanced: {
        minScore: 90,
        maxDrop: 2,
        warnDrop: 1,
        minN: 10,
        allowWeakEvidence: false,
    },
    fast: {
        minScore: 85,
        maxDrop: 5,
        warnDrop: 2,
        minN: 5,
        allowWeakEvidence: true,
    },
};

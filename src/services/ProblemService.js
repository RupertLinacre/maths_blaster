// src/services/ProblemService.js
import { generateProblem, getYearLevels } from 'maths-game-problem-generator';

class ProblemService {
    constructor() {
        this.yearLevels = getYearLevels();
        this.baseDifficulty = 'year1'; // Default
        this.problemType = null; // Default to 'all' (random)
    }

    setDifficulty(difficulty) {
        if (this.yearLevels.includes(difficulty)) {
            this.baseDifficulty = difficulty;
        }
    }

    setProblemType(type) {
        // 'all' from the dropdown will be represented as null for the generator
        this.problemType = type === 'all' ? null : type;
    }

    /**
     * Generates a problem for a standard enemy.
     * Uses the base difficulty and specific problem type from the UI.
     */
    getEnemyProblem() {
        const problem = generateProblem({
            yearLevel: this.baseDifficulty,
            type: this.problemType
        });
        if (typeof window !== 'undefined') {
            console.log('[DEBUG] Generated ENEMY problem:', {
                question: problem.expression_short,
                answer: problem.answer,
                difficulty: this.baseDifficulty,
                type: this.problemType || 'random'
            });
        }
        return problem;
    }

    /**
     * Generates a problem for a "hard" entity (red enemies, gun).
     * Uses a difficulty one level higher and a random problem type.
     */
    getHarderProblem() {
        const currentIndex = this.yearLevels.indexOf(this.baseDifficulty);
        // Go one level up, but don't go past the end of the array
        const harderDifficulty = this.yearLevels[Math.min(currentIndex + 1, this.yearLevels.length - 1)];

        const problem = generateProblem({
            yearLevel: harderDifficulty,
            type: null // Always generate a random type for harder problems
        });
        if (typeof window !== 'undefined') {
            console.log('[DEBUG] Generated HARDER problem:', {
                question: problem.expression_short,
                answer: problem.answer,
                difficulty: harderDifficulty,
                type: 'random'
            });
        }
        return problem;
    }

    /**
     * Generates a problem for a "super hard" entity (purple enemies).
     * Uses a difficulty two levels higher and a random problem type.
     */
    getSuperHarderProblem() {
        const currentIndex = this.yearLevels.indexOf(this.baseDifficulty);
        // Go two levels up, but don't go past the end of the array
        const superHarderDifficulty = this.yearLevels[Math.min(currentIndex + 2, this.yearLevels.length - 1)];

        const problem = generateProblem({
            yearLevel: superHarderDifficulty,
            type: null // Always generate a random type for super hard problems
        });
        if (typeof window !== 'undefined') {
            console.log('[DEBUG] Generated SUPER HARDER problem:', {
                question: problem.expression_short,
                answer: problem.answer,
                difficulty: superHarderDifficulty,
                type: 'random'
            });
        }
        return problem;
    }
}

// Export a single instance of the service (Singleton pattern)
export default new ProblemService();

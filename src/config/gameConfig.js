// src/config/gameConfig.js
import { DestroyEnemyStrategy, ShootAndDestroyEnemyStrategy, SprayAndDestroyEnemyStrategy } from '../strategies/EffectStrategy.js';

export function getAdjustedFontSize(textLength) {
    const BASE_SIZE = 20;
    const MIN_SIZE = 12;
    const MAX_CHARS = 7; // The number of characters that fit comfortably at BASE_SIZE

    if (textLength <= MAX_CHARS) {
        return `${BASE_SIZE}px`;
    }

    const newSize = Math.floor(BASE_SIZE * (MAX_CHARS / textLength));
    return `${Math.max(MIN_SIZE, newSize)}px`;
}

export default {
    ENEMY_WIDTH: 100,
    ENEMY_HEIGHT: 50,
    BASE_ENEMY_SPEED: 10,
    BASE_ENEMY_SPAWN_INTERVAL: 8000,
    SPAWN_INTERVAL_REDUCTION_PER_LEVEL: 500,
    MIN_ENEMY_SPAWN_INTERVAL: 500,
    SPRAYER_SPAWN_INTERVAL: 30000,
    INCORRECT_ANSWER_SPEED_PENALTY: 5,
    SHOT_SPEED: 400,
    GUN_X: 500, // CHANGED
    GUN_Y: 550,
    COLORS: {
        BACKGROUND: '#f0f8ff',
        GRID: 0xe6e6fa,
        SCORE_TEXT: '#333',
        GUN: 0x4169E1,
        INPUT_BG: 0x333333,
        INPUT_BORDER: 0xaaaaaa,
        INPUT_TEXT: '#ffffff',
        GREEN_ENEMY: 0x00ff00,
        RED_ENEMY: 0xff0000,
        PURPLE_ENEMY: 0x9400D3, // DarkViolet
        SHOT: 0xFFD700,
        ENEMY_BULLET: 0xff0000
    },

    // --- ENEMY TYPES CONFIGURATION ---
    enemyTypes: [
        {
            name: 'Standard',
            spawnWeight: 0.8, // 80% chance
            color: 0x00ff00, // Green
            strategy: new DestroyEnemyStrategy(),
            problemType: 'enemy'
        },
        {
            name: 'Shooter',
            spawnWeight: 0.2, // 20% chance
            color: 0xff0000, // Red
            strategy: new ShootAndDestroyEnemyStrategy(),
            problemType: 'gun'
        }
    ],

    sprayerConfig: {
        name: 'Sprayer',
        color: 0x9400D3, // Purple
        strategy: new SprayAndDestroyEnemyStrategy(),
        problemType: 'super-hard' // Custom type for the factory
    }
};

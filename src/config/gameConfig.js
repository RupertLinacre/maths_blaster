// src/config/gameConfig.js
import { DestroyEnemyStrategy, ShootAndDestroyEnemyStrategy } from '../strategies/EffectStrategy.js';

export default {
    ENEMY_WIDTH: 100,
    ENEMY_HEIGHT: 50,
    BASE_ENEMY_SPEED: 30,
    BASE_ENEMY_SPAWN_INTERVAL: 4000,
    INCORRECT_ANSWER_SPEED_PENALTY: 5,
    SHOT_SPEED: 400,
    GUN_X: 400,
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
    ]
};

// src/factories/EnemyFactory.js

import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import config from '../config/gameConfig.js';
import ProblemService from '../services/ProblemService.js';

export default class EnemyFactory {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Creates a "standard" enemy (Green or Red) based on spawn weights.
     * These enemies move vertically down the screen.
     */
    createStandardEnemy() {
        const scene = this.scene;

        // 1. Select a standard enemy type based on spawn weights
        const totalWeight = config.enemyTypes.reduce((sum, type) => sum + type.spawnWeight, 0);
        let randomWeight = Math.random() * totalWeight;
        const selectedType = config.enemyTypes.find(type => {
            randomWeight -= type.spawnWeight;
            return randomWeight <= 0;
        }) || config.enemyTypes[0]; // Fallback

        // 2. Get the appropriate problem for the selected type
        const problemData = selectedType.problemType === 'gun'
            ? ProblemService.getHarderProblem()
            : ProblemService.getEnemyProblem();

        // 3. Create the enemy instance and set its properties
        const x = Phaser.Math.Between(config.ENEMY_WIDTH / 2, scene.sys.game.config.width - config.ENEMY_WIDTH / 2);
        const y = config.ENEMY_HEIGHT / 2;
        const enemy = this.buildEnemy(x, y, selectedType, problemData);

        enemy.gameObject.body.setVelocity(0, scene.enemySpeed);
        enemy.gameObject.setData('isThreat', true); // Standard enemies are threats
    }

    /**
     * Creates a special "Sprayer" enemy.
     * This enemy moves horizontally across the top of the screen.
     */
    createSprayerEnemy() {
        const scene = this.scene;
        const sprayerType = config.sprayerConfig;

        // 1. Get the super-hard problem for the sprayer
        const problemData = ProblemService.getSuperHarderProblem();

        // 2. Create the enemy instance and set its properties
        const x = -config.ENEMY_WIDTH / 2; // Start off-screen left
        const y = 75; // Near the top
        const enemy = this.buildEnemy(x, y, sprayerType, problemData);

        enemy.gameObject.body.setVelocity(50, 0); // Move right
        enemy.gameObject.setData('isThreat', false); // Sprayer is not a threat
    }

    /**
     * A helper method to construct the base Enemy object.
     * @param {number} x - The x-coordinate to spawn at.
     * @param {number} y - The y-coordinate to spawn at.
     * @param {object} typeConfig - The configuration object for the enemy type.
     * @param {object} problemData - The problem data from the ProblemService.
     * @returns {Enemy} The created Enemy instance.
     */
    buildEnemy(x, y, typeConfig, problemData) {
        const enemyConfig = {
            problem: {
                text: problemData.expression_short,
                answer: problemData.answer
            },
            color: typeConfig.color,
            strategy: typeConfig.strategy,
            width: config.ENEMY_WIDTH,
            height: config.ENEMY_HEIGHT,
        };

        const enemy = new Enemy(this.scene, x, y, enemyConfig);
        enemy.gameObject.setData('instance', enemy);
        return enemy;
    }
}

// src/factories/EnemyFactory.js

import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';
import config from '../config/gameConfig.js';
import ProblemService from '../services/ProblemService.js';

export default class EnemyFactory {
    constructor(scene) {
        this.scene = scene;
    }

    createEnemy() {
        const scene = this.scene;

        // 1. Select an enemy type based on spawn weights
        const totalWeight = config.enemyTypes.reduce((sum, type) => sum + type.spawnWeight, 0);
        let randomWeight = Math.random() * totalWeight;
        const selectedType = config.enemyTypes.find(type => {
            randomWeight -= type.spawnWeight;
            return randomWeight <= 0;
        }) || config.enemyTypes[0]; // Fallback to the first type

        // 2. Get the appropriate problem for the selected type
        const problemData = selectedType.problemType === 'gun'
            ? ProblemService.getHarderProblem()
            : ProblemService.getEnemyProblem();

        // 3. Prepare the configuration object for the Enemy class
        const enemyConfig = {
            problem: {
                text: problemData.expression_short,
                answer: problemData.answer
            },
            color: selectedType.color,
            strategy: selectedType.strategy,
            width: config.ENEMY_WIDTH,
            height: config.ENEMY_HEIGHT,
        };

        // 4. Create the enemy instance
        const x = Phaser.Math.Between(config.ENEMY_WIDTH / 2, scene.sys.game.config.width - config.ENEMY_WIDTH / 2);
        // Appear half-way into the game area (y = ENEMY_HEIGHT / 2)
        const enemy = new Enemy(scene, x, config.ENEMY_HEIGHT / 2, enemyConfig);

        // Link the GameObject back to our class instance
        enemy.gameObject.setData('instance', enemy);

        return enemy;
    }
}

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
        }) || config.enemyTypes[0]; // Fallback

        // 2. Get the appropriate problem based on the custom problemType
        let problemData;
        if (selectedType.problemType === 'super-hard') {
            problemData = ProblemService.getSuperHarderProblem();
        } else if (selectedType.problemType === 'gun') {
            problemData = ProblemService.getHarderProblem();
        } else {
            problemData = ProblemService.getEnemyProblem();
        }

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

        // 4. Determine spawn position and velocity based on enemy type
        let x, y, velocity;
        const isSprayer = selectedType.name === 'Sprayer';

        if (isSprayer) {
            x = -config.ENEMY_WIDTH / 2; // Start off-screen left
            y = 275; // Near the top
            velocity = { x: 50, y: 0 }; // Move right
        } else {
            x = Phaser.Math.Between(config.ENEMY_WIDTH / 2, scene.sys.game.config.width - config.ENEMY_WIDTH / 2);
            y = config.ENEMY_HEIGHT / 2; // Start just entering at the top
            velocity = { x: 0, y: scene.enemySpeed };
        }

        // 5. Create the enemy instance and set its velocity
        const enemy = new Enemy(scene, x, y, enemyConfig);
        enemy.gameObject.body.setVelocity(velocity.x, velocity.y);

        // 6. Set custom data for game rules
        enemy.gameObject.setData('isThreat', !isSprayer);
        enemy.gameObject.setData('instance', enemy);

        return enemy;
    }
}

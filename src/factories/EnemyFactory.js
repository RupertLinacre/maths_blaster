// src/factories/EnemyFactory.js
import Enemy from '../entities/Enemy.js';
import config from '../config/gameConfig.js';
import { DestroyEnemyStrategy, ShootAndDestroyEnemyStrategy } from '../strategies/EffectStrategy.js';

export default class EnemyFactory {
    constructor(scene) {
        this.scene = scene;
    }

    createEnemy() {
        const scene = this.scene;
        const isRed = Math.random() < 0.2;
        const x = Phaser.Math.Between(config.ENEMY_WIDTH / 2, scene.sys.game.config.width - config.ENEMY_WIDTH / 2);

        let enemyConfig;
        if (isRed) {
            enemyConfig = {
                problem: scene.generateGunProblem(), // Red enemies are harder
                color: config.COLORS.RED_ENEMY,
                strategy: new ShootAndDestroyEnemyStrategy(),
                isRed: true,
            };
        } else {
            enemyConfig = {
                problem: scene.generateEnemyProblem(),
                color: config.COLORS.GREEN_ENEMY,
                strategy: new DestroyEnemyStrategy(),
                isRed: false,
            };
        }

        enemyConfig.width = config.ENEMY_WIDTH;
        enemyConfig.height = config.ENEMY_HEIGHT;

        // This approach is a bit clumsy. We create a container, then wrap it.
        // A better way would be for the Enemy class to create its own container.
        // Let's refactor that. The Enemy constructor will now create everything.
        const enemy = new Enemy(scene, x, -config.ENEMY_HEIGHT, enemyConfig);

        // We need a way to link the Phaser GameObject back to our Enemy instance.
        enemy.gameObject.setData('instance', enemy);

        return enemy;
    }
}

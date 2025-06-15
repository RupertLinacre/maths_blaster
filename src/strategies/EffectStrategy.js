// src/strategies/EffectStrategy.js
import config from '../config/gameConfig.js';

// Base class (optional but good practice)
class EffectStrategy {
    execute(scene, target) {
        throw new Error("Execute method must be implemented by subclass.");
    }
}

export class FireGunStrategy extends EffectStrategy {
    execute(scene, gun) {
        scene.fireGun();
        scene.gunProblem = scene.generateGunProblem();
        scene.gunProblemText.setText(scene.gunProblem.text);
    }
}

export class DestroyEnemyStrategy extends EffectStrategy {
    execute(scene, enemy) {
        scene.showExplosion(enemy.x, enemy.y);
        enemy.destroy();
        scene.updateScore(10);
    }
}

export class ShootAndDestroyEnemyStrategy extends EffectStrategy {
    execute(scene, enemy) {
        scene.shootEnemyBullets(enemy.x, enemy.y);
        scene.showExplosion(enemy.x, enemy.y);
        enemy.destroy();
        scene.updateScore(10);
    }
}

export default EffectStrategy;

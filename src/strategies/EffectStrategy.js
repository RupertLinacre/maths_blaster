// src/strategies/EffectStrategy.js
import config from '../config/gameConfig.js';
import ProblemService from '../services/ProblemService.js';

// Base class (optional but good practice)
class EffectStrategy {
    execute(scene, target) {
        throw new Error("Execute method must be implemented by subclass.");
    }
}

export class FireGunStrategy extends EffectStrategy {
    execute(scene, gun) {
        scene.fireGun();
        // Call the service to get a new, harder problem
        scene.gunProblem = ProblemService.getHarderProblem();
        // Use the short expression for display
        scene.gunProblemText.setText(scene.gunProblem.expression_short);
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

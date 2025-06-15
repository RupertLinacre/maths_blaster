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
        // This is now a single, clean call to the scene's method.
        scene.setGunProblem(ProblemService.getHarderProblem());
    }
}

export class DestroyEnemyStrategy extends EffectStrategy {
    execute(scene, enemy) {
        scene.destroyEnemy(enemy);
    }
}

export class ShootAndDestroyEnemyStrategy extends EffectStrategy {
    execute(scene, enemy) {
        // Pass { bounces: true } to create bouncing bullets
        scene.shootEnemyBullets(enemy.x, enemy.y, { bounces: true });
        scene.destroyEnemy(enemy);
    }
}


export class SprayAndDestroyEnemyStrategy extends EffectStrategy {
    execute(scene, enemy) {
        scene.sprayEnemyBullets(enemy.x, enemy.y);
        scene.destroyEnemy(enemy);
    }
}

export default EffectStrategy;

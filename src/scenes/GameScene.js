// This file is the refactored GameScene moved from src/GameScene.js

import Phaser from 'phaser';
import config, { getAdjustedFontSize } from '../config/gameConfig.js';
import { FireGunStrategy } from '../strategies/EffectStrategy.js';
import EnemyFactory from '../factories/EnemyFactory.js';
import ProblemService from '../services/ProblemService.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.initialLives = 3; // Fixed, not settable from UI
        this.gameOver = false;
        this.enemySpeed = config.BASE_ENEMY_SPEED;
        this.enemySpawnInterval = config.BASE_ENEMY_SPAWN_INTERVAL;
        this.gunProblem = {};
        this.enemies = null;
        this.shots = null;
        this.enemyBullets = null;
        this.gun = null;
        this.gunProblemText = null;
        this.gameOverText = null;
        this.enemySpawnTimer = null;
        this.uiScene = null;
        this.enemyFactory = new EnemyFactory(this);
    }

    create() {
        this.uiScene = this.scene.get('UIScene');
        this.cameras.main.setBackgroundColor(config.COLORS.BACKGROUND);
        this.createGrid();
        this.enemies = this.physics.add.group();
        this.shots = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.createGun();
        this.physics.add.overlap(this.shots, this.enemies, this.shotHitEnemy, null, this);
        this.physics.add.overlap(this.gun, this.enemyBullets, this.bulletHitGun, null, this);
        this.physics.add.overlap(this.enemyBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.startGame();

        // Setup Event Bus Listener
        // this.game.events.on('lives-changed', this.handleLivesChange, this); // No longer needed
        this.game.events.on('difficulty-changed', this.handleDifficultyChange, this);
        this.game.events.on('problem-type-changed', this.handleProblemTypeChange, this);

        // Emit an event to signal the scene is ready
        this.game.events.emit('scene-created');
    }

    update(time, delta) {
        if (this.gameOver) return;
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.y > this.sys.game.config.height) {
                this.loseLife();
                enemy.destroy();
            }
        });
    }

    startGame() {
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3; // Always 3 lives
        this.enemySpeed = config.BASE_ENEMY_SPEED;
        this.enemySpawnInterval = config.BASE_ENEMY_SPAWN_INTERVAL;
        this.enemies.clear(true, true);
        this.shots.clear(true, true);
        this.enemyBullets.clear(true, true);
        if (this.gameOverText) this.gameOverText.destroy();
        this.updateScore(0);
        this.updateLivesDisplay();
        this.updateLevelDisplay();
        // This is the new call
        this.setGunProblem(ProblemService.getHarderProblem());
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        this.time.delayedCall(500, () => this.spawnEnemy());
        this.time.delayedCall(2000, () => this.spawnEnemy());
    }

    endGame() {
        this.gameOver = true;
        this.enemySpawnTimer.remove();
        this.enemies.setVelocityY(0);
        this.gameOverText = this.add.container(500, 300); // CHANGED
        const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.7).setOrigin(0.5);
        const title = this.add.text(0, -50, 'Game Over', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        const finalScore = this.add.text(0, 10, `Final Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const restart = this.add.text(0, 60, 'Press ENTER to Play Again', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        this.gameOverText.add([bg, title, finalScore, restart]);
    }


    // Lives are now fixed to 3; handleLivesChange is no longer needed
    handleLivesChange(data) {
        // No-op
    }

    handleDifficultyChange(data) {
        ProblemService.setDifficulty(data.difficulty);
        // Restart the game if it's not the initial setup call
        if (!data.initial) {
            this.startGame();
        }
    }

    handleProblemTypeChange(data) {
        ProblemService.setProblemType(data.type);
        // Restart the game if it's not the initial setup call
        if (!data.initial) {
            this.startGame();
        }
    }

    shutdown() {
        // this.game.events.off('lives-changed', this.handleLivesChange, this); // No longer needed
        this.game.events.off('difficulty-changed', this.handleDifficultyChange, this);
        this.game.events.off('problem-type-changed', this.handleProblemTypeChange, this);
    }

    createGrid() {
        const graphics = this.add.graphics({ lineStyle: { width: 1, color: config.COLORS.GRID } });
        for (let x = 0; x < this.sys.game.config.width; x += 50) {
            graphics.strokeLineShape(new Phaser.Geom.Line(x, 0, x, this.sys.game.config.height));
        }
        for (let y = 0; y < this.sys.game.config.height; y += 50) {
            graphics.strokeLineShape(new Phaser.Geom.Line(0, y, this.sys.game.config.width, y));
        }
    }

    createGun() {
        this.gun = this.add.container(config.GUN_X, config.GUN_Y);
        const gunBody = this.add.rectangle(0, 0, 80, 80, config.COLORS.GUN).setStrokeStyle(2, 0x000000);
        this.gunProblemText = this.add.text(0, 0, '', { fontSize: '20px', color: 'white', align: 'center' }).setOrigin(0.5);
        this.gun.add([gunBody, this.gunProblemText]);
        this.physics.world.enable(this.gun);
        this.gun.body.setSize(80, 80);
    }

    updateScore(points) {
        this.score += points;
        if (this.uiScene) this.uiScene.updateScore(this.score);
        this.updateDifficulty();
    }

    updateLivesDisplay() {
        if (this.uiScene) this.uiScene.updateLives(this.lives);
    }

    updateLevelDisplay() {
        if (this.uiScene) this.uiScene.updateLevel(this.level);
    }

    spawnEnemy() {
        if (this.gameOver) return;
        this.enemyFactory.createEnemy();
    }

    fireGun() {
        const directions = [
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -0.5, y: -1 },
            { x: 0.5, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        directions.forEach(dir => {
            const shot = this.add.circle(this.gun.x, this.gun.y - 40, 8, config.COLORS.SHOT);
            this.shots.add(shot);
            shot.body.setCircle(8);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x)), config.SHOT_SPEED, shot.body.velocity);
        });
        this.tweens.add({
            targets: this.gun.getAt(0),
            scaleX: 1.2,
            scaleY: 1.2,
            ease: 'Cubic.easeOut',
            duration: 150,
            yoyo: true
        });
    }

    shootEnemyBullets(x, y) {
        const directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];
        directions.forEach(dir => {
            const bullet = this.add.circle(x, y, 5, config.COLORS.ENEMY_BULLET);
            this.enemyBullets.add(bullet);
            bullet.body.setCircle(5);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x)), 150, bullet.body.velocity);
        });
    }

    loseLife() {
        if (this.gameOver) return;
        this.lives--;
        this.updateLivesDisplay();
        this.cameras.main.shake(200, 0.01);
        if (this.lives <= 0) {
            this.endGame();
        }
    }

    updateDifficulty() {
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.enemySpeed = config.BASE_ENEMY_SPEED + (this.level - 1) * 3;
            this.enemySpawnInterval = Math.max(config.BASE_ENEMY_SPAWN_INTERVAL - (this.level - 1) * 500, 500);
            this.enemies.getChildren().forEach(e => e.body.setVelocityY(this.enemySpeed));
            this.enemySpawnTimer.delay = this.enemySpawnInterval;
            this.updateLevelDisplay();
            this.showLevelUpEffect();
        }
    }

    applyIncorrectAnswerPenalty() {
        this.enemySpeed += config.INCORRECT_ANSWER_SPEED_PENALTY;
        this.enemies.getChildren().forEach(e => e.body.setVelocityY(this.enemySpeed));
        this.showIncorrectAnswerEffect();
    }

    shotHitEnemy(shot, enemyGO) {
        shot.destroy(); // The shot is always destroyed.

        const enemyInstance = enemyGO.getData('instance');
        if (enemyInstance) {
            // Delegate the handling of being hit to the enemy itself.
            enemyInstance.onHit();
        } else {
            // Fallback for any object that might not have an instance.
            this.showExplosion(enemyGO.x, enemyGO.y);
            enemyGO.destroy();
            this.updateScore(10);
        }
    }

    bulletHitEnemy(bullet, enemyGO) {
        bullet.destroy(); // The bullet is always destroyed.

        const enemyInstance = enemyGO.getData('instance');
        if (enemyInstance) {
            // Delegate the handling of being hit to the enemy itself.
            enemyInstance.onHit();
        } else {
            // Fallback for any object that might not have an instance.
            this.showExplosion(enemyGO.x, enemyGO.y);
            enemyGO.destroy();
            this.updateScore(10);
        }
    }

    bulletHitGun(gun, bullet) {
        bullet.destroy();
        this.loseLife();
    }

    // Input handling is now managed by UIScene
    checkAnswer(answer) {
        if (isNaN(answer)) return;

        // Check against gun problem first
        if (answer === this.gunProblem.answer) {
            new FireGunStrategy().execute(this, this.gun);
            return;
        }

        let destroyed = false;
        // Iterate backwards when removing items from a group
        const enemies = this.enemies.getChildren();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemyGO = enemies[i]; // This is the Phaser GameObject (container)
            const enemyInstance = enemyGO.getData('instance'); // Get our custom class instance

            if (enemyInstance && enemyInstance.config.problem.answer === answer) {
                enemyInstance.executeEffect();
                destroyed = true;
                break;
            }
        }

        if (!destroyed) {
            this.applyIncorrectAnswerPenalty();
        }
    }

    showExplosion(x, y) {
        const particles = this.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            tint: 0xffd700
        });
        particles.explode(16);
    }

    showLevelUpEffect() {
        const text = this.add.text(500, 300, `LEVEL ${this.level}!`, {
            fontSize: '48px', color: '#FF5500', align: 'center'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    showIncorrectAnswerEffect() {
        const rect = this.add.rectangle(500, 300, 1000, 600, 0xff0000, 0.3); // CHANGED
        this.tweens.add({
            targets: rect,
            alpha: 0,
            duration: 500,
            onComplete: () => rect.destroy()
        });
    }
    setGunProblem(problem) {
        this.gunProblem = problem;
        const newProblemText = this.gunProblem.expression_short;
        const newFontSize = getAdjustedFontSize(newProblemText.length);
        this.gunProblemText.setText(newProblemText);
        this.gunProblemText.setStyle({ fontSize: newFontSize });
    }

    // --- REMOVED generateEnemyProblem and generateGunProblem ---
}

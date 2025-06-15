// This file is the refactored GameScene moved from src/GameScene.js

import Phaser from 'phaser';
// ADD THIS IMPORT
import { checkAnswer } from 'maths-game-problem-generator';
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
        this.sprayerSpawnTimer = null;
        this.uiScene = null;
        this.enemyFactory = new EnemyFactory(this);
    }

    create() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 8, 8); // Create an 8x8 white square
        graphics.generateTexture('white_particle', 8, 8);
        graphics.destroy();

        // --- NEW: INITIALIZE FROM REGISTRY ---
        // Get initial settings that were set in main.js
        const initialDifficulty = this.registry.get('difficulty');
        const initialProblemType = this.registry.get('problemType');

        // Configure the ProblemService BEFORE starting the game for the first time
        ProblemService.setDifficulty(initialDifficulty);
        ProblemService.setProblemType(initialProblemType);
        // --- END OF NEW BLOCK ---

        this.uiScene = this.scene.get('UIScene');
        this.cameras.main.setBackgroundColor(config.COLORS.BACKGROUND);
        this.createGrid();
        this.enemies = this.physics.add.group();
        this.shots = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.createGun();
        this.physics.add.overlap(this.shots, this.enemies, this.shotHitEnemy, null, this);
        this.physics.add.collider(this.enemyBullets, this.enemies, this.handleBulletEnemyCollision, null, this);
        this.startGame();

        // Setup Event Bus Listeners for live changes from the UI
        this.game.events.on('difficulty-changed', this.handleDifficultyChange, this);
        this.game.events.on('problem-type-changed', this.handleProblemTypeChange, this);
    }

    update(time, delta) {
        if (this.gameOver) return;
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.y > this.sys.game.config.height) {
                this.loseLife();
                enemy.destroy();
            }
        });

        // --- ADD THIS BLOCK ---
        // Clean up bullets that have gone off-screen
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < 0 || bullet.x > this.sys.game.config.width || bullet.y < 0 || bullet.y > this.sys.game.config.height) {
                bullet.destroy();
            }
        });
        // --- END OF BLOCK ---
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
        // Clear any existing timers before starting new ones
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.sprayerSpawnTimer) this.sprayerSpawnTimer.remove();

        // Timer for standard enemies (Green and Red)
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnInterval,
            callback: this.spawnStandardEnemy,
            callbackScope: this,
            loop: true
        });

        // Timer for the special Sprayer enemy (Purple)
        this.sprayerSpawnTimer = this.time.addEvent({
            delay: 30000, // Spawn every 30 seconds
            callback: this.spawnSprayerEnemy,
            callbackScope: this,
            loop: true
        });

        // Initial spawns to populate the screen
        this.time.delayedCall(500, () => this.spawnStandardEnemy());
        this.time.delayedCall(2000, () => this.spawnStandardEnemy());
    }

    endGame() {
        this.gameOver = true;
        this.enemySpawnTimer.remove();
        if (this.sprayerSpawnTimer) this.sprayerSpawnTimer.remove();
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
        // Any change from the UI dropdown should restart the game.
        this.startGame();
    }

    handleProblemTypeChange(data) {
        ProblemService.setProblemType(data.type);
        // Any change from the UI dropdown should restart the game.
        this.startGame();
    }

    shutdown() {
        // this.game.events.off('lives-changed', this.handleLivesChange, this); // No longer needed
        this.game.events.off('difficulty-changed', this.handleDifficultyChange, this);
        this.game.events.off('problem-type-changed', this.handleProblemTypeChange, this);
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.sprayerSpawnTimer) this.sprayerSpawnTimer.remove();
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
        // Center the 80x80 physics body to match the visual rectangle
        this.gun.body.setOffset(-40, -40);
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

    spawnStandardEnemy() {
        if (this.gameOver) return;
        this.enemyFactory.createStandardEnemy();
    }

    spawnSprayerEnemy() {
        if (this.gameOver) return;
        this.enemyFactory.createSprayerEnemy();
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

    shootEnemyBullets(x, y, options = {}) {
        const directions = [{ x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }]; // NE, SE, SW, NW
        directions.forEach(dir => {
            const bullet = this.add.circle(x, y, 5, config.COLORS.ENEMY_BULLET);
            this.enemyBullets.add(bullet);
            bullet.body.setCircle(5);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x)), 150, bullet.body.velocity);

            // Set data on the bullet based on options
            bullet.setData('bounces', options.bounces === true);

            // --- ADD THIS BLOCK ---
            if (options.bounces) {
                bullet.body.setBounce(1); // Perfect bounce
                bullet.body.setCollideWorldBounds(false); // Do NOT bounce off screen edges
            }
            // --- END OF BLOCK ---
        });
    }

    // Creates a 360-degree spray of 12 bouncing bullets from (x, y)
    sprayEnemyBullets(x, y) {
        const bulletCount = 12;
        const bulletSpeed = 300; // Faster than normal bullets

        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            const bullet = this.add.circle(x, y, 5, config.COLORS.PURPLE_ENEMY);
            this.enemyBullets.add(bullet);
            bullet.body.setCircle(5);
            // Set data to identify it as a bouncing bullet
            bullet.setData('bounces', true);
            // Set physics properties for bouncing
            bullet.body.setBounce(1);
            bullet.body.setCollideWorldBounds(false);
            // Fire the bullet at the calculated angle and speed
            this.physics.velocityFromAngle(angle, bulletSpeed, bullet.body.velocity);
        }
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
            this.enemies.getChildren().forEach(e => {
                // Only apply vertical speed to enemies that are supposed to move down.
                if (e.getData('isThreat')) {
                    e.body.setVelocityY(this.enemySpeed);
                }
            });
            this.enemySpawnTimer.delay = this.enemySpawnInterval;
            this.updateLevelDisplay();
            this.showLevelUpEffect();
        }
    }

    applyIncorrectAnswerPenalty() {
        this.enemySpeed += config.INCORRECT_ANSWER_SPEED_PENALTY;
        this.enemies.getChildren().forEach(e => {
            // Only apply vertical speed to enemies that are supposed to move down.
            if (e.getData('isThreat')) {
                e.body.setVelocityY(this.enemySpeed);
            }
        });
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

    handleBulletEnemyCollision(bullet, enemyGO) {
        // Any bullet-on-enemy collision will destroy the enemy.
        const enemyInstance = enemyGO.getData('instance');
        if (enemyInstance) {
            enemyInstance.onHit();
        } else {
            // Fallback for safety, in case the instance isn't found.
            this.destroyEnemy(enemyGO);
        }

        // Now, decide what to do with the bullet.
        // If the bullet is NOT a bouncing type, destroy it.
        if (!bullet.getData('bounces')) {
            bullet.destroy();
        }
        // If it IS a bouncing bullet, we do nothing to it. The physics engine
        // has already calculated the bounce, and the bullet will continue on its new path.
    }

    // --- Centralized enemy destruction logic ---
    destroyEnemy(enemyGO) {
        if (!enemyGO || !enemyGO.active) return; // Guard against multiple calls

        this.showExplosion(enemyGO.x, enemyGO.y);
        this.updateScore(10);
        enemyGO.destroy();

        // If that was the last enemy, spawn a new standard enemy immediately.
        if (this.enemies.countActive(true) === 0 && !this.gameOver) {
            this.spawnStandardEnemy();
        }
    }

    // Input handling is now managed by UIScene
    checkAnswer(answer) {
        if (isNaN(answer)) return;

        let gunCorrect = false;
        let enemiesCorrectCount = 0;
        let correctAnswerForLog = null;

        // --- 1. Check Gun ---
        // A correct gun answer does NOT preclude also checking enemies.
        if (checkAnswer(this.gunProblem, answer)) {
            gunCorrect = true;
            correctAnswerForLog = this.gunProblem.answer;
            new FireGunStrategy().execute(this, this.gun);
        }

        // --- 2. Check Enemies ---
        // Find all enemies that match the answer.
        const matchingEnemies = this.enemies.getChildren().filter(enemyGO => {
            const enemyInstance = enemyGO.getData('instance');
            // We only care about active enemies
            return enemyGO.active && enemyInstance && checkAnswer(enemyInstance.config.problem, answer);
        });

        enemiesCorrectCount = matchingEnemies.length;

        if (enemiesCorrectCount > 0) {
            // Use the answer from the first matched enemy for logging purposes if gun wasn't correct.
            if (!correctAnswerForLog) {
                correctAnswerForLog = matchingEnemies[0].getData('instance').config.problem.answer;
            }

            // Now execute the effect for each. This is safe as we're iterating over a filtered array,
            // not the live physics group that gets modified during destruction.
            matchingEnemies.forEach(enemyGO => {
                const enemyInstance = enemyGO.getData('instance');
                if (enemyInstance) {
                    enemyInstance.executeEffect();
                }
            });
        }

        // --- 3. Handle Penalties & Logging ---
        const wasCorrect = gunCorrect || (enemiesCorrectCount > 0);

        if (!wasCorrect) {
            this.applyIncorrectAnswerPenalty();
        }

        if (typeof window !== 'undefined') {
            let context = 'incorrect';
            if (gunCorrect && enemiesCorrectCount > 0) {
                context = `gun + ${enemiesCorrectCount} enemy(s)`;
            } else if (gunCorrect) {
                context = 'gun';
            } else if (enemiesCorrectCount > 0) {
                context = `${enemiesCorrectCount} enemy(s)`;
            }

            console.log(`[DEBUG] Answered (${context}):`, {
                userAnswer: answer,
                correctAnswer: wasCorrect ? correctAnswerForLog : 'N/A',
                correct: wasCorrect
            });
        }
    }

    showExplosion(x, y) {
        // --- REFINED: A quicker, smaller background flash ---
        const flash = this.add.circle(x, y, 5, 0xffa500, 0.7); // Orange flash
        this.tweens.add({
            targets: flash,
            scale: 5,
            alpha: 0,
            duration: 200, // Faster duration
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        // --- REFINED: A toned-down particle effect using the correct texture ---
        const particles = this.add.particles(x, y, 'white_particle', { // USE OUR NEW TEXTURE
            speed: { min: 40, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'NORMAL',
            lifespan: 400, // Shorter lifespan
            tint: [0xff4500, 0xffa500, 0xff6347] // Orangered, Orange, Tomato
        });
        particles.explode(12); // Fewer particles for a cleaner "pop"
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

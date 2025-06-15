import Phaser from 'phaser';

// Game Constants from the original game
const ENEMY_WIDTH = 100;
const ENEMY_HEIGHT = 50;
const BASE_ENEMY_SPEED = 30; // pixels per second
const BASE_ENEMY_SPAWN_INTERVAL = 4000; // ms
const INCORRECT_ANSWER_SPEED_PENALTY = 5; // pixels per second

const SHOT_SPEED = 400; // pixels per second
const GUN_X = 400;
const GUN_Y = 550;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Game State
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.initialLives = 3;
        this.gameOver = false;
        this.enemySpeed = BASE_ENEMY_SPEED;
        this.enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;
        this.gunProblem = {};

        // In-game input handling
        this.currentInputString = '';
        this.maxLength = 10;

        // Phaser objects
        this.enemies = null;
        this.shots = null;
        this.enemyBullets = null;
        this.gun = null;
        this.gunProblemText = null;
        this.inputDisplay = null;
        this.scoreText = null;
        this.livesText = null;
        this.levelText = null;
        this.gameOverText = null;
        this.enemySpawnTimer = null;
    }

    // --- PHASER SCENE LIFECYCLE ---

    create() {
        this.cameras.main.setBackgroundColor('#f0f8ff');
        this.createGrid();

        // Initialize Physics Groups
        this.enemies = this.physics.add.group();
        this.shots = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Create UI
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', color: '#333' });
        this.livesText = this.add.text(20, 50, `Lives: ${this.lives}`, { fontSize: '24px', color: '#333' });
        this.levelText = this.add.text(20, 80, `Level: 1`, { fontSize: '24px', color: '#333' });

        this.createGun();
        this.createInputDisplay();

        // Setup Keyboard Input
        this.input.keyboard.on('keydown', this.handleKeyInput, this);

        // Setup Physics Collisions
        this.physics.add.overlap(this.shots, this.enemies, this.shotHitEnemy, null, this);
        this.physics.add.overlap(this.gun, this.enemyBullets, this.bulletHitGun, null, this);
        this.physics.add.overlap(this.enemyBullets, this.enemies, this.bulletHitEnemy, null, this);

        // Start the game logic
        this.startGame();
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Check for enemies reaching the bottom
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.y > this.sys.game.config.height) {
                this.loseLife();
                enemy.destroy();
            }
        });
    }

    // --- GAME SETUP & STATE ---

    startGame() {
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lives = this.initialLives;
        this.enemySpeed = BASE_ENEMY_SPEED;
        this.enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;

        // Clear existing game objects
        this.enemies.clear(true, true);
        this.shots.clear(true, true);
        this.enemyBullets.clear(true, true);
        if (this.gameOverText) this.gameOverText.destroy();

        // Reset UI
        this.updateScore(0);
        this.updateLivesDisplay();
        this.updateLevelDisplay();

        // Generate new problems and start spawning
        this.gunProblem = this.generateGunProblem();
        this.gunProblemText.setText(this.gunProblem.text);

        // Start enemy spawner
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Spawn initial enemies
        this.time.delayedCall(500, () => this.spawnEnemy());
        this.time.delayedCall(2000, () => this.spawnEnemy());
    }

    endGame() {
        this.gameOver = true;
        this.enemySpawnTimer.remove();
        this.enemies.setVelocityY(0);

        this.gameOverText = this.add.container(400, 300);
        const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.7).setOrigin(0.5);
        const title = this.add.text(0, -50, 'Game Over', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        const finalScore = this.add.text(0, 10, `Final Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        const restart = this.add.text(0, 60, 'Press ENTER to Play Again', { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
        this.gameOverText.add([bg, title, finalScore, restart]);
    }

    setInitialLives(lives) {
        this.initialLives = lives > 0 ? lives : 3;
        this.lives = this.initialLives;
        this.updateLivesDisplay();
    }

    setLives(lives) {
        if (this.gameOver) return; // Don't change lives mid-game
        this.initialLives = lives > 0 ? lives : 3;
        this.lives = this.initialLives;
        this.updateLivesDisplay();
    }

    // --- UI & VISUALS ---

    createGrid() {
        const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xe6e6fa } });
        for (let x = 0; x < this.sys.game.config.width; x += 50) {
            graphics.strokeLineShape(new Phaser.Geom.Line(x, 0, x, this.sys.game.config.height));
        }
        for (let y = 0; y < this.sys.game.config.height; y += 50) {
            graphics.strokeLineShape(new Phaser.Geom.Line(0, y, this.sys.game.config.width, y));
        }
    }

    createGun() {
        // Use a container to group gun elements
        this.gun = this.add.container(GUN_X, GUN_Y);
        const gunBody = this.add.rectangle(0, 0, 80, 80, 0x4169E1).setStrokeStyle(2, 0x000000);
        this.gunProblemText = this.add.text(0, 0, '', { fontSize: '20px', color: 'white', align: 'center' }).setOrigin(0.5);
        this.gun.add([gunBody, this.gunProblemText]);
        this.physics.world.enable(this.gun);
        this.gun.body.setSize(80, 80);
    }

    createInputDisplay() {
        this.add.rectangle(400, 480, 200, 40, 0x333333).setStrokeStyle(2, 0xaaaaaa);
        this.inputDisplay = this.add.text(400, 480, '_', {
            fontSize: '20px', color: '#ffffff', align: 'center', fixedWidth: 180
        }).setOrigin(0.5);
    }

    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        this.updateDifficulty();
    }

    updateLivesDisplay() {
        this.livesText.setText(`Lives: ${this.lives}`);
    }

    updateLevelDisplay() {
        this.levelText.setText(`Level: ${this.level}`);
    }

    // --- GAME LOGIC ---

    spawnEnemy() {
        if (this.gameOver) return;
        const isRed = Math.random() < 0.2;
        const { text, answer } = isRed ? this.generateGunProblem() : this.generateEnemyProblem();
        const color = isRed ? 0xff0000 : 0x00ff00;
        const x = Phaser.Math.Between(ENEMY_WIDTH / 2, this.sys.game.config.width - ENEMY_WIDTH / 2);

        const enemyContainer = this.add.container(x, -ENEMY_HEIGHT);
        const enemyBody = this.add.rectangle(0, 0, ENEMY_WIDTH, ENEMY_HEIGHT, color).setStrokeStyle(2, 0x333333);
        const enemyText = this.add.text(0, 0, text, { fontSize: '20px', color: '#000' }).setOrigin(0.5);
        enemyContainer.add([enemyBody, enemyText]);

        enemyContainer.setData('answer', answer);
        enemyContainer.setData('isRed', isRed);

        this.enemies.add(enemyContainer);
        enemyContainer.body.setVelocityY(this.enemySpeed);
    }

    fireGun() {
        const directions = [
            { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -0.5, y: -1 },
            { x: 0.5, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        directions.forEach(dir => {
            const shot = this.add.circle(this.gun.x, this.gun.y - 40, 8, 0xFFD700);
            this.shots.add(shot);
            shot.body.setCircle(8);
            this.physics.velocityFromAngle(Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x)), SHOT_SPEED, shot.body.velocity);
        });

        // Visual feedback
        this.tweens.add({
            targets: this.gun.getAt(0), // The rectangle
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
            const bullet = this.add.circle(x, y, 5, 0xff0000);
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
            this.enemySpeed = BASE_ENEMY_SPEED + (this.level - 1) * 10;
            this.enemySpawnInterval = Math.max(BASE_ENEMY_SPAWN_INTERVAL - (this.level - 1) * 500, 500);

            // Update running enemies speed
            this.enemies.getChildren().forEach(e => e.body.setVelocityY(this.enemySpeed));

            // Update timer
            this.enemySpawnTimer.delay = this.enemySpawnInterval;

            this.updateLevelDisplay();
            this.showLevelUpEffect();
        }
    }

    applyIncorrectAnswerPenalty() {
        this.enemySpeed += INCORRECT_ANSWER_SPEED_PENALTY;
        this.enemies.getChildren().forEach(e => e.body.setVelocityY(this.enemySpeed));
        this.showIncorrectAnswerEffect();
    }

    // --- COLLISION & EVENT HANDLERS ---

    shotHitEnemy(shot, enemy) {
        this.showExplosion(enemy.x, enemy.y);
        shot.destroy();
        enemy.destroy();
        this.updateScore(10);
    }

    bulletHitEnemy(bullet, enemy) {
        this.showExplosion(enemy.x, enemy.y);
        bullet.destroy();
        enemy.destroy();
        this.updateScore(10);
    }

    bulletHitGun(gun, bullet) {
        bullet.destroy();
        this.loseLife();
    }

    handleKeyInput(event) {
        if (this.gameOver) {
            if (event.key === 'Enter') {
                this.startGame();
            }
            return;
        }

        const key = event.key;
        if (key >= '0' && key <= '9') {
            if (this.currentInputString.length < this.maxLength) {
                this.currentInputString += key;
            }
        } else if (key === 'Backspace') {
            this.currentInputString = this.currentInputString.slice(0, -1);
        } else if (key === 'Enter' && this.currentInputString.length > 0) {
            this.submitAnswer();
        }

        this.inputDisplay.setText(this.currentInputString || '_');
    }

    submitAnswer() {
        const answer = parseInt(this.currentInputString);
        this.currentInputString = '';
        if (isNaN(answer)) return;

        // Check against gun problem first
        if (answer === this.gunProblem.answer) {
            this.fireGun();
            this.gunProblem = this.generateGunProblem();
            this.gunProblemText.setText(this.gunProblem.text);
            return;
        }

        // Check against enemies
        let destroyed = false;
        this.enemies.getChildren().forEach(enemy => {
            if (!destroyed && enemy.getData('answer') === answer) {
                if (enemy.getData('isRed')) {
                    this.shootEnemyBullets(enemy.x, enemy.y);
                }
                this.showExplosion(enemy.x, enemy.y);
                enemy.destroy();
                this.updateScore(10);
                destroyed = true;
            }
        });

        if (!destroyed) {
            this.applyIncorrectAnswerPenalty();
        }
    }

    // --- EFFECT & HELPER FUNCTIONS ---

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
        const text = this.add.text(400, 300, `LEVEL ${this.level}!`, {
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
        const rect = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3);
        this.tweens.add({
            targets: rect,
            alpha: 0,
            duration: 500,
            onComplete: () => rect.destroy()
        });
    }

    generateEnemyProblem() {
        const isMultiplication = Math.random() < 0.3; // Less multiplication for enemies
        if (isMultiplication) {
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            return { text: `${a} × ${b}`, answer: a * b };
        } else {
            const maxNum = Math.min(10 + this.level * 5, 100);
            const a = Math.floor(Math.random() * maxNum);
            const b = Math.floor(Math.random() * maxNum);
            return { text: `${a} + ${b}`, answer: a + b };
        }
    }

    generateGunProblem() {
        const isMultiplication = Math.random() < 0.6; // More multiplication for the gun
        if (isMultiplication) {
            const a = Math.floor(Math.random() * 12) + 1;
            const b = Math.floor(Math.random() * 12) + 1;
            return { text: `${a} × ${b}`, answer: a * b };
        } else {
            const maxNum = Math.min(20 + this.level * 3, 50);
            const a = Math.floor(Math.random() * maxNum) + 10;
            const b = Math.floor(Math.random() * maxNum) + 10;
            return { text: `${a} + ${b}`, answer: a + b };
        }
    }
}
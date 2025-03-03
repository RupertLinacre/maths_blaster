const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const answerInput = document.getElementById('answerInput');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Game Constants
const ENEMY_WIDTH = 80;
const ENEMY_HEIGHT = 80;
const BASE_ENEMY_SPEED = 0.2;
const BASE_ENEMY_SPAWN_INTERVAL = 7500;
const INCORRECT_ANSWER_SPEED_PENALTY = 0.02;

const SHOT_SPEED = 5;
const SHOT_RADIUS = 8;
const SHOT_COLORS = ['#FFD700', '#FF6347', '#7FFFD4', '#9370DB', '#FF69B4', '#00CED1'];

const GUN_WIDTH = 80;
const GUN_HEIGHT = 80;
const GUN_X = CANVAS_WIDTH / 2 - GUN_WIDTH / 2;
const GUN_Y = CANVAS_HEIGHT - GUN_HEIGHT - 10;

// Game State Variables
let enemies = [];
let shots = [];
let enemyBullets = [];
let score = 0;
let lives = 3;
let gameOver = false;
let correctAnswerEffect = null;
let level = 1;
let enemySpeed = BASE_ENEMY_SPEED;
let enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;

let gunProblem = generateGunProblem();
let lastEnemySpawnTime = 0;

// Generate a simple math problem for green enemies
function generateEnemyProblem() {
    const isProblemMultiplication = Math.random() < 0.5;
    if (isProblemMultiplication) {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        return { text: `${a} × ${b}`, answer: a * b };
    } else {
        const maxNum = Math.min(10 + level * 5, 100);
        const a = Math.floor(Math.random() * maxNum);
        const b = Math.floor(Math.random() * maxNum);
        return { text: `${a} + ${b}`, answer: a + b };
    }
}

// Generate a harder math problem for the gun and red enemies
function generateGunProblem() {
    const isProblemMultiplication = Math.random() < 0.5;
    if (isProblemMultiplication) {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        return { text: `${a} × ${b}`, answer: a * b };
    } else {
        const maxNum = Math.min(10 + level * 3, 50);
        const a = Math.floor(Math.random() * maxNum);
        const b = Math.floor(Math.random() * maxNum);
        return { text: `${a} + ${b}`, answer: a + b };
    }
}

// Update game difficulty based on score
function updateDifficulty() {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
        level = newLevel;
        enemySpeed = BASE_ENEMY_SPEED * (1 + (level - 1) * 0.1);
        enemySpawnInterval = Math.max(BASE_ENEMY_SPAWN_INTERVAL * (1 - (level - 1) * 0.1), 500);
        showLevelUpEffect();
    }
}

// Apply speed penalty for incorrect answers
function applyIncorrectAnswerPenalty() {
    enemySpeed += INCORRECT_ANSWER_SPEED_PENALTY;
    showIncorrectAnswerEffect();
}

// Show visual feedback when an incorrect answer is given
function showIncorrectAnswerEffect() {
    correctAnswerEffect = { time: 20, type: 'incorrect' };
}

// Show visual feedback when level increases
function showLevelUpEffect() {
    correctAnswerEffect = { time: 60, type: 'levelUp' };
}

// Spawn a new enemy at the top of the screen
function spawnEnemy() {
    const isRed = Math.random() < 0.2;
    const { text, answer } = isRed ? generateGunProblem() : generateEnemyProblem();
    const color = isRed ? 'red' : 'green';
    const x = Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH);
    const y = 0;
    enemies.push({ x, y, text, answer, color });
}

// Shoot bullets from a red enemy when destroyed
function shootEnemyBullets(x, y) {
    const bulletSpeed = 3;
    enemyBullets.push({ x, y, dx: -bulletSpeed, dy: 0 });
    enemyBullets.push({ x, y, dx: bulletSpeed, dy: 0 });
    enemyBullets.push({ x, y, dx: 0, dy: -bulletSpeed });
    enemyBullets.push({ x, y, dx: 0, dy: bulletSpeed });
}

// Fire six shots from the gun in different directions
function fireGun() {
    const directions = [
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -0.5, dy: -1 },
        { dx: 0.5, dy: -1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];

    directions.forEach((dir, index) => {
        shots.push({
            x: GUN_X + GUN_WIDTH / 2,
            y: GUN_Y,
            dx: dir.dx * SHOT_SPEED,
            dy: dir.dy * SHOT_SPEED,
            color: SHOT_COLORS[index % SHOT_COLORS.length]
        });
    });
    correctAnswerEffect = { time: 30, type: 'gun' };
}

// Show visual feedback when an enemy is destroyed
function showEnemyDestroyedEffect(enemy) {
    correctAnswerEffect = {
        time: 30,
        type: 'enemy',
        x: enemy.x + ENEMY_WIDTH / 2,
        y: enemy.y + ENEMY_HEIGHT / 2
    };
}

// Main game loop
function gameLoop(timestamp) {
    if (gameOver) return;

    if (timestamp - lastEnemySpawnTime > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawnTime = timestamp;
    }

    // Update enemy positions
    enemies.forEach(enemy => {
        enemy.y += enemySpeed;
        if (enemy.y > CANVAS_HEIGHT) {
            enemies.splice(enemies.indexOf(enemy), 1);
            lives--;
            if (lives <= 0) gameOver = true;
        }
    });

    // Update player shot positions
    shots.forEach(shot => {
        shot.x += shot.dx;
        shot.y += shot.dy;
        if (shot.x < 0 || shot.x > CANVAS_WIDTH || shot.y < 0 || shot.y > CANVAS_HEIGHT) {
            shots.splice(shots.indexOf(shot), 1);
        }
    });

    // Update enemy bullet positions
    enemyBullets.forEach(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    });

    // Remove enemy bullets that go off-screen
    enemyBullets = enemyBullets.filter(bullet =>
        bullet.x >= 0 && bullet.x <= CANVAS_WIDTH && bullet.y >= 0 && bullet.y <= CANVAS_HEIGHT
    );

    // Check for collisions between enemy bullets and the gun
    let bulletsToRemove = [];
    enemyBullets.forEach(bullet => {
        if (bullet.x > GUN_X && bullet.x < GUN_X + GUN_WIDTH &&
            bullet.y > GUN_Y && bullet.y < GUN_Y + GUN_HEIGHT) {
            lives--;
            if (lives <= 0) gameOver = true;
            bulletsToRemove.push(bullet);
        }
    });
    enemyBullets = enemyBullets.filter(bullet => !bulletsToRemove.includes(bullet));

    // Check for collisions between player shots and enemies
    for (let i = shots.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const shot = shots[i];
            const enemy = enemies[j];
            if (shot.x > enemy.x && shot.x < enemy.x + ENEMY_WIDTH &&
                shot.y > enemy.y && shot.y < enemy.y + ENEMY_HEIGHT) {
                enemies.splice(j, 1);
                shots.splice(i, 1);
                score += 10;
                updateDifficulty();
                break; // One hit per shot
            }
        }
    }

    // Check for collisions between enemy bullets and enemies
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = enemyBullets[i];
            const enemy = enemies[j];
            if (bullet.x > enemy.x && bullet.x < enemy.x + ENEMY_WIDTH &&
                bullet.y > enemy.y && bullet.y < enemy.y + ENEMY_HEIGHT) {
                showEnemyDestroyedEffect(enemy);
                enemies.splice(j, 1);
                enemyBullets.splice(i, 1);
                score += 10;
                break; // One hit per bullet
            }
        }
    }

    // Update visual effects
    if (correctAnswerEffect) {
        correctAnswerEffect.time--;
        if (correctAnswerEffect.time <= 0) correctAnswerEffect = null;
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Render all game elements
function render() {
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#e6e6fa';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        roundRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 10, true);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        roundRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 10, false, true);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.text, enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2);
    });

    if (correctAnswerEffect && correctAnswerEffect.type === 'gun') {
        const glow = 20 * (correctAnswerEffect.time / 30);
        ctx.fillStyle = '#4169E1';
        roundRect(ctx, GUN_X - glow / 2, GUN_Y - glow / 2, GUN_WIDTH + glow, GUN_HEIGHT + glow, 15, true);
    }

    ctx.fillStyle = '#4169E1';
    roundRect(ctx, GUN_X, GUN_Y, GUN_WIDTH, GUN_HEIGHT, 15, true);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    roundRect(ctx, GUN_X, GUN_Y, GUN_WIDTH, GUN_HEIGHT, 15, false, true);
    ctx.fillStyle = '#333';
    ctx.fillRect(GUN_X + GUN_WIDTH / 2 - 5, GUN_Y - 15, 10, 15);
    ctx.fillRect(GUN_X - 15, GUN_Y + GUN_HEIGHT / 2 - 5, 15, 10);
    ctx.fillRect(GUN_X + GUN_WIDTH, GUN_Y + GUN_HEIGHT / 2 - 5, 15, 10);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gunProblem.text, GUN_X + GUN_WIDTH / 2, GUN_Y + GUN_HEIGHT / 2);

    shots.forEach(shot => {
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(shot.x - shot.dx * 3, shot.y - shot.dy * 3);
        ctx.strokeStyle = shot.color;
        ctx.lineWidth = SHOT_RADIUS;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, SHOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = shot.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    if (correctAnswerEffect && correctAnswerEffect.type === 'enemy') {
        const radius = 40 * (1 - correctAnswerEffect.time / 30);
        ctx.beginPath();
        ctx.arc(correctAnswerEffect.x, correctAnswerEffect.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${correctAnswerEffect.time / 30})`;
        ctx.fill();
    }

    if (correctAnswerEffect && correctAnswerEffect.type === 'levelUp') {
        const alpha = 0.3 * Math.sin(correctAnswerEffect.time * 0.2) + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FF5500';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LEVEL ${level}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Speed increased!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    if (correctAnswerEffect && correctAnswerEffect.type === 'incorrect') {
        const alpha = 0.3 * (correctAnswerEffect.time / 20);
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Speed penalty!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 20, 20);
    ctx.fillText(`Level: ${level}`, 20, 100);
    ctx.fillText(`Speed: ${enemySpeed.toFixed(2)}`, 20, 140);
    for (let i = 0; i < lives; i++) drawHeart(ctx, 20 + i * 40, 60, 15);

    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.fillText(`Reached Level: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        ctx.font = '24px Arial';
        ctx.fillText('Press Enter to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// Helper function to draw heart shape for lives
function drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.quadraticCurveTo(x, y, x + size / 4, y);
    ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
    ctx.quadraticCurveTo(x + size / 2, y, x + size * 3 / 4, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
    ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size);
    ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
    ctx.fillStyle = '#FF5555';
    ctx.fill();
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Handle user input
answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (gameOver) {
            startGame();
            return;
        }

        const input = parseInt(answerInput.value);
        answerInput.value = '';

        if (input === gunProblem.answer) {
            fireGun();
            gunProblem = generateGunProblem();
        } else {
            let enemyDestroyed = false;
            enemies = enemies.filter(enemy => {
                if (enemy.answer === input) {
                    score += 10;
                    updateDifficulty();
                    showEnemyDestroyedEffect(enemy);
                    if (enemy.color === 'red') {
                        shootEnemyBullets(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2);
                    }
                    enemyDestroyed = true;
                    return false;
                }
                return true;
            });

            if (enemyDestroyed && enemies.length === 0) {
                spawnEnemy();
            }

            if (!enemyDestroyed && input) {
                applyIncorrectAnswerPenalty();
                answerInput.classList.add('shake');
                setTimeout(() => answerInput.classList.remove('shake'), 500);
            }
        }
    }
});

// Initialize and start the game
function startGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    enemies = [];
    shots = [];
    enemyBullets = [];
    level = 1;
    enemySpeed = BASE_ENEMY_SPEED;
    enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;
    gunProblem = generateGunProblem();
    lastEnemySpawnTime = 0;

    spawnEnemy();
    spawnEnemy();
    spawnEnemy();
    requestAnimationFrame(gameLoop);
}

startGame();
answerInput.focus();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const answerInput = document.getElementById('answerInput');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Game constants with improved values
const ENEMY_WIDTH = 80;
const ENEMY_HEIGHT = 80;
const BASE_ENEMY_SPEED = 0.2; // Base speed that will increase with level
const BASE_ENEMY_SPAWN_INTERVAL = 2500; // Base spawn interval that will decrease with level
const INCORRECT_ANSWER_SPEED_PENALTY = 0.02; // Speed increase penalty for incorrect answers

const SHOT_SPEED = 5; // pixels per frame
const SHOT_RADIUS = 8; // Larger bullets for better visibility
const SHOT_COLORS = ['#FFD700', '#FF6347', '#7FFFD4', '#9370DB', '#FF69B4', '#00CED1']; // Gold, tomato, aquamarine, purple, hot pink, dark turquoise

const GUN_WIDTH = 80;
const GUN_HEIGHT = 80;
const GUN_X = CANVAS_WIDTH / 2 - GUN_WIDTH / 2;
const GUN_Y = CANVAS_HEIGHT - GUN_HEIGHT - 10;

// Game state variables
let enemies = [];
let shots = [];
let score = 0;
let lives = 3;
let gameOver = false;
let correctAnswerEffect = null;
let level = 1; // Track the current game level
let enemySpeed = BASE_ENEMY_SPEED; // Current enemy speed based on level
let enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL; // Current spawn interval based on level

let gunProblem = generateGunProblem();
let lastEnemySpawnTime = 0;

// Generate a simple math problem for enemies (within 10)
function generateEnemyProblem() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    if (Math.random() < 0.5) {
        return { problem: `${a} + ${b}`, answer: a + b };
    } else {
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        return { problem: `${max} - ${min}`, answer: max - min };
    }
}

// Generate a harder math problem for the gun (within 20)
function generateGunProblem() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    if (Math.random() < 0.5) {
        return { problem: `${a} + ${b}`, answer: a + b };
    } else {
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        return { problem: `${max} - ${min}`, answer: max - min };
    }
}

// Update game difficulty based on score
function updateDifficulty() {
    // Calculate level based on score (level increases every 100 points)
    const newLevel = Math.floor(score / 100) + 1;

    // If level has increased
    if (newLevel > level) {
        level = newLevel;

        // Increase enemy speed by 10% per level
        enemySpeed = BASE_ENEMY_SPEED * (1 + (level - 1) * 0.1);

        // Decrease spawn interval by 10% per level (enemies spawn faster)
        enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL * (1 - (level - 1) * 0.1);

        // Ensure spawn interval doesn't get too low
        enemySpawnInterval = Math.max(enemySpawnInterval, 500);

        // Visual feedback for level up
        showLevelUpEffect();
    }
}

// Apply speed penalty for incorrect answers
function applyIncorrectAnswerPenalty() {
    enemySpeed += INCORRECT_ANSWER_SPEED_PENALTY;

    // Visual feedback for incorrect answer
    showIncorrectAnswerEffect();
}

// Show visual feedback when an incorrect answer is given
function showIncorrectAnswerEffect() {
    correctAnswerEffect = {
        time: 20, // frames the effect will last (shorter than other effects)
        type: 'incorrect'
    };
}

// Show visual feedback when level increases
function showLevelUpEffect() {
    // Create a level up effect that lasts longer than other effects
    correctAnswerEffect = {
        time: 60, // frames the effect will last (longer than other effects)
        type: 'levelUp'
    };
}

// Spawn a new enemy at the top of the screen
function spawnEnemy() {
    const x = Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH);
    const y = 0;
    const { problem, answer } = generateEnemyProblem();
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`; // Random vibrant color
    enemies.push({ x, y, problem, answer, color });
}

// Fire six shots from the gun in different directions (including horizontal)
function fireGun() {
    const directions = [
        { dx: -1, dy: -1 },    // Upper left diagonal
        { dx: 1, dy: -1 },     // Upper right diagonal
        { dx: -0.5, dy: -1 },  // Upper left (less steep)
        { dx: 0.5, dy: -1 },   // Upper right (less steep)
        { dx: -1, dy: 0 },     // Left horizontal
        { dx: 1, dy: 0 }       // Right horizontal
    ];

    directions.forEach((dir, index) => {
        const shot = {
            x: GUN_X + GUN_WIDTH / 2,
            y: GUN_Y,
            dx: dir.dx * SHOT_SPEED,
            dy: dir.dy * SHOT_SPEED,
            color: SHOT_COLORS[index % SHOT_COLORS.length] // Assign different colors to shots
        };
        shots.push(shot);
    });

    // Visual feedback for correct gun answer
    correctAnswerEffect = {
        time: 30, // frames the effect will last
        type: 'gun'
    };
}

// Show visual feedback when an enemy is destroyed by typing its answer
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

    // Spawn enemies at regular intervals
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
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });

    // Update shot positions
    shots.forEach(shot => {
        shot.x += shot.dx;
        shot.y += shot.dy;
        if (shot.x < 0 || shot.x > CANVAS_WIDTH || shot.y < 0 || shot.y > CANVAS_HEIGHT) {
            shots.splice(shots.indexOf(shot), 1);
        }
    });

    // Check for collisions between shots and enemies
    shots.forEach(shot => {
        enemies.forEach(enemy => {
            if (shot.x > enemy.x && shot.x < enemy.x + ENEMY_WIDTH &&
                shot.y > enemy.y && shot.y < enemy.y + ENEMY_HEIGHT) {
                enemies.splice(enemies.indexOf(enemy), 1);
                shots.splice(shots.indexOf(shot), 1);
                score += 10;
                updateDifficulty(); // Check if difficulty should increase
            }
        });
    });

    // Update visual effects
    if (correctAnswerEffect) {
        correctAnswerEffect.time--;
        if (correctAnswerEffect.time <= 0) {
            correctAnswerEffect = null;
        }
    }

    // Render the game
    render();

    requestAnimationFrame(gameLoop);
}

// Render all game elements
function render() {
    // Clear canvas with a light background
    ctx.fillStyle = '#f0f8ff'; // AliceBlue background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines for better depth perception
    ctx.strokeStyle = '#e6e6fa'; // Lavender grid
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // Draw enemies
    enemies.forEach(enemy => {
        // Enemy body (rounded rectangle)
        ctx.fillStyle = enemy.color;
        roundRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 10, true);

        // Enemy border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        roundRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 10, false, true);

        // Enemy math problem (centered)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.problem, enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2);
    });

    // Draw gun
    if (correctAnswerEffect && correctAnswerEffect.type === 'gun') {
        // Glowing effect when gun fires
        const glow = 20 * (correctAnswerEffect.time / 30);
        ctx.fillStyle = '#4169E1'; // Royal blue
        roundRect(ctx, GUN_X - glow / 2, GUN_Y - glow / 2, GUN_WIDTH + glow, GUN_HEIGHT + glow, 15, true);
    }

    ctx.fillStyle = '#4169E1'; // Royal blue
    roundRect(ctx, GUN_X, GUN_Y, GUN_WIDTH, GUN_HEIGHT, 15, true);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    roundRect(ctx, GUN_X, GUN_Y, GUN_WIDTH, GUN_HEIGHT, 15, false, true);

    // Gun barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(GUN_X + GUN_WIDTH / 2 - 5, GUN_Y - 15, 10, 15);

    // Horizontal gun barrels (new)
    ctx.fillRect(GUN_X - 15, GUN_Y + GUN_HEIGHT / 2 - 5, 15, 10); // Left barrel
    ctx.fillRect(GUN_X + GUN_WIDTH, GUN_Y + GUN_HEIGHT / 2 - 5, 15, 10); // Right barrel

    // Gun math problem (centered)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gunProblem.problem, GUN_X + GUN_WIDTH / 2, GUN_Y + GUN_HEIGHT / 2);

    // Draw shots with trail effect
    shots.forEach(shot => {
        // Draw shot trail
        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(shot.x - shot.dx * 3, shot.y - shot.dy * 3);
        ctx.strokeStyle = shot.color;
        ctx.lineWidth = SHOT_RADIUS;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw shot head
        ctx.beginPath();
        ctx.arc(shot.x, shot.y, SHOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = shot.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw enemy destroyed effect
    if (correctAnswerEffect && correctAnswerEffect.type === 'enemy') {
        const radius = 40 * (1 - correctAnswerEffect.time / 30);
        ctx.beginPath();
        ctx.arc(correctAnswerEffect.x, correctAnswerEffect.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${correctAnswerEffect.time / 30})`; // Fading gold
        ctx.fill();
    }

    // Draw level up effect
    if (correctAnswerEffect && correctAnswerEffect.type === 'levelUp') {
        // Create a pulsing effect across the screen
        const alpha = 0.3 * Math.sin(correctAnswerEffect.time * 0.2) + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Display level up text
        ctx.fillStyle = '#FF5500';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LEVEL ${level}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Speed increased!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    // Draw incorrect answer effect
    if (correctAnswerEffect && correctAnswerEffect.type === 'incorrect') {
        // Create a red flash effect
        const alpha = 0.3 * (correctAnswerEffect.time / 20);
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Display warning text
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Speed penalty!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Draw score and lives with better styling
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 20, 20);

    // Display current level
    ctx.fillText(`Level: ${level}`, 20, 100);

    // Display current speed (rounded to 2 decimal places)
    ctx.fillText(`Speed: ${enemySpeed.toFixed(2)}`, 20, 140);

    // Draw lives as hearts
    for (let i = 0; i < lives; i++) {
        drawHeart(ctx, 20 + i * 40, 60, 15);
    }

    // Display game over message
    if (gameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Game over text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        // Final score
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.fillText(`Reached Level: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

        // Restart instructions
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
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
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

        // Check if input matches the gun problem
        if (input === gunProblem.answer) {
            fireGun();
            gunProblem = generateGunProblem();
        } else {
            // Check if input matches any enemy problem
            let enemyDestroyed = false;
            enemies = enemies.filter(enemy => {
                if (enemy.answer === input) {
                    score += 10;
                    updateDifficulty(); // Check if difficulty should increase
                    showEnemyDestroyedEffect(enemy);
                    enemyDestroyed = true;
                    return false; // Remove enemy
                }
                return true;
            });

            // Provide visual feedback if no match was found
            if (!enemyDestroyed && input) {
                // Apply speed penalty for incorrect answer
                applyIncorrectAnswerPenalty();

                // Visual feedback for incorrect answer
                answerInput.classList.add('shake');
                setTimeout(() => {
                    answerInput.classList.remove('shake');
                }, 500);
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
    level = 1;
    enemySpeed = BASE_ENEMY_SPEED;
    enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;
    gunProblem = generateGunProblem();
    lastEnemySpawnTime = 0;
    requestAnimationFrame(gameLoop);
}

// Start the game and focus the input box
startGame();
answerInput.focus();
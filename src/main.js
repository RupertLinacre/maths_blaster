import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';

// --- 1. PHASER GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#f0f8ff',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Set to true to see physics bodies
        }
    },
    scene: [GameScene, UIScene]
};

// --- 2. CREATE THE PHASER GAME INSTANCE ---
const game = new Phaser.Game(config);


// --- 3. THE "GLUE" CODE: CONNECTING HTML TO PHASER ---
window.addEventListener('load', () => {
    // Get a reference to the Phaser canvas
    const canvas = document.querySelector('#game-container canvas');
    if (!canvas) {
        console.error("Phaser canvas not found!");
        return;
    }

    // A. Make the canvas focusable to receive keyboard events.
    canvas.setAttribute('tabindex', '0');

    // B. Get reference to our external HTML input.
    const livesInput = document.getElementById('lives-input');

    // C. When the HTML input is focused, disable Phaser's keyboard manager.
    livesInput.addEventListener('focus', () => {
        if (game.input && game.input.keyboard) {
            game.input.keyboard.enabled = false;
        }
    });

    // D. When the HTML input loses focus, re-enable Phaser's keyboard manager.
    livesInput.addEventListener('blur', () => {
        if (game.input && game.input.keyboard) {
            game.input.keyboard.enabled = true;
        }
        // Don't auto-focus the canvas on blur, as the user might be clicking
        // another HTML element. Let the new pointerdown listener handle it.
    });

    // --- START OF THE FIX ---
    // This is the key change. Add a listener to the canvas itself.
    // This ensures that clicking directly on the game canvas gives it focus,
    // which is necessary to receive keyboard events.
    canvas.addEventListener('pointerdown', () => {
        livesInput.blur(); // Explicitly blur the input field
        canvas.focus();    // And give focus to the canvas
    });
    // --- END OF THE FIX ---


    // --- DATA SYNCING ---
    // Add 'input' event listener to send data to Phaser when the value changes.
    livesInput.addEventListener('input', (event) => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive() && typeof gameScene.setLives === 'function') {
            const lives = parseInt(event.target.value, 10);
            if (!isNaN(lives)) {
                gameScene.setLives(lives);
            }
        }
    });

    // --- INITIALIZATION ---
    const gameScene = game.scene.getScene('GameScene');
    if (gameScene) {
        // Wait for the scene's 'create' method to finish before initializing.
        gameScene.events.on('create', () => {
            const initialLives = parseInt(livesInput.value, 10);
            if (!isNaN(initialLives)) {
                gameScene.setInitialLives(initialLives);
            }
            // Start with the canvas focused.
            canvas.focus();
        });
    }
});
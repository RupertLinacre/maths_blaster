import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import { getYearLevels, getProblemTypes } from 'maths-game-problem-generator';

// --- 1. PHASER GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 1000, //CHANGED
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

    // --- POPULATE NEW UI CONTROLS ---
    const difficultySelector = document.getElementById('difficulty-selector');
    const problemTypeSelector = document.getElementById('problem-type-selector');

    // Populate difficulty levels
    getYearLevels().forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        difficultySelector.appendChild(option);
    });
    // Set default value
    difficultySelector.value = 'year1';

    // Populate problem types
    const problemTypes = ['all', ...getProblemTypes()]; // Add 'all' option
    problemTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        problemTypeSelector.appendChild(option);
    });
    // Set default value
    problemTypeSelector.value = 'all';
    // --- END OF POPULATION CODE ---

    // --- WIRE UP NEW CONTROL EVENTS ---
    difficultySelector.addEventListener('change', (event) => {
        game.events.emit('difficulty-changed', { difficulty: event.target.value });
    });

    problemTypeSelector.addEventListener('change', (event) => {
        game.events.emit('problem-type-changed', { type: event.target.value });
    });
    // --- END OF NEW CONTROL EVENTS ---

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
        const lives = parseInt(event.target.value, 10);
        if (!isNaN(lives)) {
            game.events.emit('lives-changed', { lives: lives });
        }
    });

    // --- INITIALIZATION ---
    game.events.on('scene-created', () => {
        const initialLives = parseInt(livesInput.value, 10);
        if (!isNaN(initialLives)) {
            game.events.emit('lives-changed', { lives: initialLives, initial: true });
        }

        // Send initial difficulty setting
        const initialDifficulty = difficultySelector.value;
        game.events.emit('difficulty-changed', { difficulty: initialDifficulty, initial: true });

        // Send initial problem type setting
        const initialProblemType = problemTypeSelector.value;
        game.events.emit('problem-type-changed', { type: initialProblemType, initial: true });

        // Start with the canvas focused.
        canvas.focus();
    });
});
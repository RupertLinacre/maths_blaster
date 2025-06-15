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
    // Removed livesInput: lives are now fixed to 3

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

    // Removed livesInput focus/blur logic: lives are now fixed to 3


    // Removed livesInput event: lives are now fixed to 3

    // --- INITIALIZATION ---
    game.events.on('scene-created', () => {
        // Lives are now fixed to 3, no need to emit lives-changed
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
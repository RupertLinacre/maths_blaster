import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import { getYearLevels, getProblemTypes } from 'maths-game-problem-generator';

// --- 1. LOAD INITIAL SETTINGS & CONFIGURE GAME ---
// Read saved settings from localStorage, with sensible defaults.
const savedDifficulty = localStorage.getItem('mathsBlasterDifficulty');
const allYearLevels = getYearLevels();
const initialDifficulty = savedDifficulty && allYearLevels.includes(savedDifficulty) ? savedDifficulty : 'year1';

const allProblemTypes = ['all', ...getProblemTypes()];
const savedProblemType = localStorage.getItem('mathsBlasterProblemType');
const initialProblemType = savedProblemType && allProblemTypes.includes(savedProblemType) ? savedProblemType : 'all';

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 1000,
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

// Create the Phaser Game Instance
const game = new Phaser.Game(config);

// --- 2. SET INITIAL STATE IN PHASER REGISTRY ---
// The registry is a global state manager for the game.
// We set the initial values here so scenes can read them on creation.
game.registry.set('difficulty', initialDifficulty);
game.registry.set('problemType', initialProblemType);


// --- 3. CONNECT HTML UI TO PHASER ---
// This runs once the entire page (including scripts, styles, images) is fully loaded.
window.addEventListener('load', () => {
    // Get a reference to the Phaser canvas and make it focusable
    const canvas = document.querySelector('#game-container canvas');
    if (!canvas) {
        console.error("Phaser canvas not found!");
        return;
    }
    canvas.setAttribute('tabindex', '0');
    canvas.focus(); // Start with the game focused

    // Get references to UI controls
    const difficultySelector = document.getElementById('difficulty-selector');
    const problemTypeSelector = document.getElementById('problem-type-selector');

    // Populate and set the initial value for the difficulty selector
    allYearLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        difficultySelector.appendChild(option);
    });
    difficultySelector.value = initialDifficulty;

    // Populate and set the initial value for the problem type selector
    allProblemTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        problemTypeSelector.appendChild(option);
    });
    problemTypeSelector.value = initialProblemType;

    // Wire up UI controls to update the game
    difficultySelector.addEventListener('change', (event) => {
        const value = event.target.value;
        localStorage.setItem('mathsBlasterDifficulty', value);
        game.registry.set('difficulty', value); // Update registry
        game.events.emit('difficulty-changed', { difficulty: value });
    });

    problemTypeSelector.addEventListener('change', (event) => {
        const value = event.target.value;
        localStorage.setItem('mathsBlasterProblemType', value);
        game.registry.set('problemType', value); // Update registry
        game.events.emit('problem-type-changed', { type: value });
    });
});
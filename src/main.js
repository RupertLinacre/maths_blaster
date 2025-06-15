import Phaser from 'phaser';
import GameScene from './GameScene.js';

// --- 1. PHASER GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'game-container',
    scene: [GameScene]
};

// --- 2. CREATE THE PHASER GAME INSTANCE ---
const game = new Phaser.Game(config);

// --- 3. THE "GLUE" CODE: CONNECTING HTML TO PHASER ---
// We wait for the game to be fully ready before setting up listeners.
// The `setTimeout` trick from your original project is a reliable way to do this.
window.addEventListener('load', () => {
    // Get a reference to the Phaser canvas
    const canvas = document.querySelector('#game-container canvas');
    if (!canvas) {
        console.error("Phaser canvas not found!");
        return;
    }

    // --- FOCUS MANAGEMENT ---
    // This is the key part for handling keyboard input correctly.

    // A. Make the canvas focusable so it can receive keyboard events.
    canvas.setAttribute('tabindex', '0');

    // B. Get references to our external HTML inputs.
    const stringInput = document.getElementById('string-input');
    const numberInput = document.getElementById('number-input');
    const htmlInputs = [stringInput, numberInput];

    // C. When an HTML input is focused, disable Phaser's keyboard manager.
    // This stops the game from capturing keys while you're typing in the input fields.
    htmlInputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (game.input && game.input.keyboard) {
                game.input.keyboard.enabled = false;
                console.log("Phaser keyboard DISABLED (typing in HTML input).");
            }
        });

        // D. When the HTML input loses focus, re-enable Phaser's keyboard manager.
        input.addEventListener('blur', () => {
            if (game.input && game.input.keyboard) {
                game.input.keyboard.enabled = true;
                console.log("Phaser keyboard ENABLED.");
            }
            // Also, give focus back to the canvas so game input works immediately.
            canvas.focus();
        });
    });

    // --- NEW FIX: Add a listener to the canvas itself ---
    // This ensures that clicking directly on the game canvas gives it focus,
    // which is necessary to receive keyboard events.
    canvas.addEventListener('pointerdown', () => {
        canvas.focus();
        console.log("Canvas clicked, explicitly setting focus.");
    });

    // --- DATA SYNCING ---
    // This part sends data from the HTML inputs into the Phaser game.

    // Add 'input' event listeners to send data to Phaser whenever the value changes.
    stringInput.addEventListener('input', (event) => {
        const gameScene = game.scene.getScene('GameScene');
        // Check if the scene is running and has the update method before calling it.
        if (gameScene && gameScene.scene.isActive() && typeof gameScene.updateStringDisplay === 'function') {
            gameScene.updateStringDisplay(event.target.value);
        }
    });

    numberInput.addEventListener('input', (event) => {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive() && typeof gameScene.updateNumberDisplay === 'function') {
            gameScene.updateNumberDisplay(event.target.value);
        }
    });

    // --- INITIALIZATION ---
    // Set the initial values in the game when it loads.
    const gameScene = game.scene.getScene('GameScene');
    if (gameScene) {
        // We need to wait for the scene's 'create' method to finish.
        // The 'create' event is a reliable way to do this.
        gameScene.events.on('create', () => {
            gameScene.updateStringDisplay(stringInput.value);
            gameScene.updateNumberDisplay(numberInput.value);
            // Start with the canvas focused.
            canvas.focus();
        });
    }
});

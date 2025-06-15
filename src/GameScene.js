import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // For the in-game input field
        this.inGameInputText = null;
        this.currentInputString = '';
        this.maxLength = 15;

        // For displaying data from HTML controls
        this.htmlStringText = null;
        this.htmlNumberText = null;
    }

    create() {
        // --- 1. Display for values from HTML controls ---
        this.add.text(20, 20, 'Data from HTML Controls:', { fontSize: '20px', fontStyle: 'bold' });
        this.htmlStringText = this.add.text(25, 50, 'String: (waiting...)', { fontSize: '18px', color: '#00ff00' });
        this.htmlNumberText = this.add.text(25, 80, 'Number: (waiting...)', { fontSize: '18px', color: '#00ff00' });

        // --- 2. In-game input field (similar to your game's UI) ---
        this.add.text(this.sys.game.config.width / 2, 200, 'In-Game Input Field', { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5, 0.5);

        // Input field background
        this.add.rectangle(
            this.sys.game.config.width / 2,
            240,
            300,
            40,
            0x333333
        ).setStrokeStyle(2, 0xaaaaaa);

        // The text object that displays the current input
        this.inGameInputText = this.add.text(
            this.sys.game.config.width / 2,
            240,
            '_', // Initial placeholder
            {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center',
                fixedWidth: 280,
            }
        ).setOrigin(0.5);

        // --- 3. Keyboard Listener for the in-game input ---
        // This will only fire if the canvas has focus and the keyboard manager is enabled.
        this.input.keyboard.on('keydown', this.handleInGameKeyInput, this);

        this.add.text(this.sys.game.config.width / 2, 300, 'Click on the game, then type here.\nPress ENTER to log to console.', { align: 'center' }).setOrigin(0.5);
    }

    /**
     * Handles keyboard input for the in-game text field.
     */
    handleInGameKeyInput(event) {
        const key = event.key;

        if (key >= 'a' && key <= 'z' || key >= 'A' && key <= 'Z' || key >= '0' && key <= '9' || key === ' ') {
            if (this.currentInputString.length < this.maxLength) {
                this.currentInputString += key;
            }
        } else if (key === 'Backspace') {
            this.currentInputString = this.currentInputString.slice(0, -1);
        } else if (key === 'Enter') {
            console.log(`[In-Game Input Submitted]: ${this.currentInputString}`);
            this.currentInputString = ''; // Clear after submission
        }

        // Update the display text
        this.inGameInputText.setText(this.currentInputString || '_');
    }

    /**
     * Called from main.js to update the display with the HTML string value.
     */
    updateStringDisplay(value) {
        if (this.htmlStringText) {
            this.htmlStringText.setText(`String: ${value}`);
        }
    }

    /**
     * Called from main.js to update the display with the HTML number value.
     */
    updateNumberDisplay(value) {
        if (this.htmlNumberText) {
            this.htmlNumberText.setText(`Number: ${value}`);
        }
    }
}

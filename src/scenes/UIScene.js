import Phaser from 'phaser';
import config from '../config/gameConfig.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.scoreText = null;
        this.livesText = null;
        this.levelText = null;
        this.inputDisplay = null;
        this.currentInputString = '';
        this.maxLength = 10;
    }

    create() {
        this.cameras.main.setBackgroundColor(config.COLORS.BACKGROUND);
        this.gameScene = this.scene.get('GameScene');

        // Create UI elements
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });
        this.livesText = this.add.text(20, 50, 'Lives: 3', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });
        this.levelText = this.add.text(20, 80, 'Level: 1', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });

        this.add.rectangle(500, 480, 200, 40, config.COLORS.INPUT_BG).setStrokeStyle(2, config.COLORS.INPUT_BORDER); // CHANGED
        this.inputDisplay = this.add.text(500, 480, '_', {
            fontSize: '20px', color: config.COLORS.INPUT_TEXT, align: 'center', fixedWidth: 180
        }).setOrigin(0.5);

        // Setup Keyboard Input
        this.input.keyboard.on('keydown', this.handleKeyInput, this);
        this.scene.sendToBack();
    }

    handleKeyInput(event) {
        if (this.gameScene.gameOver) {
            if (event.key === 'Enter') {
                this.gameScene.startGame();
            }
            return;
        }

        const key = event.key;
        if ((key >= '0' && key <= '9') || key === '.') {
            // Only allow one decimal point
            if (key === '.' && this.currentInputString.includes('.')) {
                // Do nothing if already has a decimal point
                return;
            }
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
        const answer = parseFloat(this.currentInputString);
        this.currentInputString = '';
        this.inputDisplay.setText('_');
        if (isNaN(answer)) return;

        this.gameScene.checkAnswer(answer);
    }

    updateScore(score) {
        if (this.scoreText) this.scoreText.setText(`Score: ${score}`);
    }
    updateLives(lives) {
        if (this.livesText) this.livesText.setText(`Lives: ${lives}`);
    }
    updateLevel(level) {
        if (this.levelText) this.levelText.setText(`Level: ${level}`);
    }
}

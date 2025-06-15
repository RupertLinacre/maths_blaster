import Phaser from 'phaser';
import config from '../config/gameConfig.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
        this.scoreText = null;
        this.livesText = null;
        this.levelText = null;
    }

    create() {
        this.cameras.main.setBackgroundColor(config.COLORS.BACKGROUND);
        this.gameScene = this.scene.get('GameScene');

        // Create UI elements
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });
        this.livesText = this.add.text(20, 50, 'Lives: 3', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });
        this.levelText = this.add.text(20, 80, 'Level: 1', { fontSize: '24px', color: config.COLORS.SCORE_TEXT });

        // Setup Keyboard Input
        this.scene.sendToBack();
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

// src/entities/Enemy.js
import Phaser from 'phaser';
import { getAdjustedFontSize } from '../config/gameConfig.js';

export default class Enemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.config = config; // { text, answer, color, strategy }

        const container = scene.add.container(x, y);
        const body = scene.add.rectangle(0, 0, config.width, config.height, config.color).setStrokeStyle(2, 0x333333);
        const fontSize = getAdjustedFontSize(this.config.problem.text.length);
        const text = scene.add.text(0, 0, this.config.problem.text, { fontSize: fontSize, color: '#000' }).setOrigin(0.5);
        container.add([body, text]);


        // 1. Add the container to the physics group first
        scene.enemies.add(container);

        // --- THE FIX ---
        // 2. Explicitly set the physics body size to match the visual rectangle
        container.body.setSize(config.width, config.height);
        // --- END OF THE FIX ---

        container.body.setVelocityY(scene.enemySpeed);

        // Attach data directly to the instance, not the Phaser container
        this.gameObject = container;
    }

    executeEffect() {
        this.config.strategy.execute(this.scene, this.gameObject);
    }

    // --- ADD THIS NEW METHOD ---
    onHit() {
        // The enemy is responsible for its own destruction logic.
        this.scene.showExplosion(this.gameObject.x, this.gameObject.y);
        this.scene.updateScore(10); // Or get points from config in the future.
        this.gameObject.destroy();
    }
    // --- END OF NEW METHOD ---
}

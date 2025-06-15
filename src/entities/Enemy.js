// src/entities/Enemy.js
import Phaser from 'phaser';

export default class Enemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.config = config; // { text, answer, color, strategy }

        const container = scene.add.container(x, y);
        const body = scene.add.rectangle(0, 0, config.width, config.height, config.color).setStrokeStyle(2, 0x333333);
        const text = scene.add.text(0, 0, this.config.problem.text, { fontSize: '20px', color: '#000' }).setOrigin(0.5);
        container.add([body, text]);

        scene.enemies.add(container); // Add to the physics group
        container.body.setVelocityY(scene.enemySpeed);

        // Attach data directly to the instance, not the Phaser container
        this.gameObject = container;
    }

    executeEffect() {
        this.config.strategy.execute(this.scene, this.gameObject);
    }
}

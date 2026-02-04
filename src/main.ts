import Phaser from 'phaser';
import './style.css';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { OptionsScene } from './scenes/OptionsScene';
import { HighscoresScene } from './scenes/HighscoresScene';
import { QuestStubScene } from './scenes/QuestStubScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0d12',
  scale: {
    width: 960,
    height: 540,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene, GameOverScene, OptionsScene, HighscoresScene, QuestStubScene],
};

new Phaser.Game(config);

import Phaser from 'phaser';
import { ATLAS_SHEETS } from '../content/atlas';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  preload() {
    const useRealAssets = import.meta.env.VITE_USE_REAL_ASSETS === '1';
    this.load.image('terrain-q1-base', 'assets/crimson/ter/ter_q1_base.png');
    this.load.image('terrain-q1-fb', 'assets/crimson/ter/fb_q1.png');

    for (const sheet of ATLAS_SHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }

    this.load.image('game-bodyset', 'assets/crimson/game/bodyset.png');
    this.load.image('game-trooper', 'assets/crimson/game/trooper.png');
    this.load.image('game-alien', 'assets/crimson/game/alien.png');
    this.load.image('game-zombie', 'assets/crimson/game/zombie.png');

    this.load.image('ui-cursor', 'assets/crimson/ui/ui_cursor.png');
    this.load.image('ui-aim', 'assets/crimson/ui/ui_aim.png');
    this.load.image('ui-menu-panel', 'assets/crimson/ui/ui_menuPanel.png');
    this.load.image('ui-menu-item', 'assets/crimson/ui/ui_menuItem.png');

    this.load.image('logo-crimsonland', 'assets/crimson/load/logo_crimsonland.png');
    this.load.image('splash-10tons', 'assets/crimson/load/splash10tons.png');

    if (useRealAssets) {
      this.load.audio('music-intro', 'assets/music/intro.ogg');
      this.load.audio('sfx-ui-click', 'assets/sfx/ui_buttonClick.ogg');
    } else {
      this.load.audio('music-intro', 'assets/music/intro.wav');
      this.load.audio('sfx-ui-click', 'assets/sfx/ui_buttonClick.wav');
    }
  }

  create() {
    if (this.shouldOpenAtlasPreview()) {
      this.scene.start('atlasPreview');
      return;
    }
    this.scene.start('title');
  }

  private shouldOpenAtlasPreview(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('scene') === 'atlas' || params.get('atlas') === '1';
  }
}

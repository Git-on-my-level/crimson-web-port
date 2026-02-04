import Phaser from 'phaser';
import { ATLAS_SHEETS } from '../content/atlas';
import { UI_STYLE } from '../ui/style';

type SheetInfo = {
  key: string;
  frameWidth: number;
  frameHeight: number;
  labels?: Record<string, number>;
};

export class AtlasPreviewScene extends Phaser.Scene {
  private index = 0;
  private sheetGroup?: Phaser.GameObjects.Container;
  private headerText?: Phaser.GameObjects.Text;
  private hoverText?: Phaser.GameObjects.Text;
  private highlight?: Phaser.GameObjects.Graphics;
  private showLabels = false;
  private layout?: {
    startX: number;
    startY: number;
    scale: number;
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    gap: number;
  };

  constructor() {
    super('atlasPreview');
  }

  create() {
    const { width, height } = this.scale;
    this.headerText = this.add.text(width / 2, 24, '', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, height - 24, 'Left/Right: sheet · L: labels · Esc: return', {
      ...UI_STYLE.text.small,
      fontFamily: UI_STYLE.fontFamily,
      color: '#94a3b8',
    }).setOrigin(0.5, 1);

    this.hoverText = this.add.text(16, height - 24, '', {
      ...UI_STYLE.text.small,
      fontFamily: UI_STYLE.fontFamily,
      color: '#e2e8f0',
    }).setOrigin(0, 1);

    this.input.keyboard?.on('keydown-LEFT', () => this.cycle(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.cycle(1));
    this.input.keyboard?.on('keydown-L', () => this.toggleLabels());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('title'));

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updateHover(pointer.x, pointer.y);
    });

    this.drawSheet();
  }

  private cycle(direction: number): void {
    const total = ATLAS_SHEETS.length;
    this.index = (this.index + direction + total) % total;
    this.drawSheet();
  }

  private drawSheet(): void {
    this.sheetGroup?.destroy(true);
    this.highlight?.destroy();
    this.sheetGroup = this.add.container(0, 0);
    this.highlight = this.add.graphics();

    const sheet = ATLAS_SHEETS[this.index];
    const info: SheetInfo = {
      key: sheet.key,
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
      labels: sheet.labels,
    };

    const texture = this.textures.get(info.key);
    const source = texture.getSourceImage() as { width: number; height: number };
    const columns = Math.max(1, Math.floor(source.width / info.frameWidth));
    const rows = Math.max(1, Math.floor(source.height / info.frameHeight));
    const totalFrames = columns * rows;

    const marginTop = 64;
    const marginSide = 24;
    const gridWidth = columns * info.frameWidth;
    const gridHeight = rows * info.frameHeight;
    const availableWidth = this.scale.width - marginSide * 2;
    const availableHeight = this.scale.height - marginTop - 64;
    const maxScale = 2;
    const scale = Math.min(maxScale, availableWidth / gridWidth, availableHeight / gridHeight);
    const gap = Math.max(1, Math.round(scale));

    const gridWidthScaled = columns * info.frameWidth * scale + (columns - 1) * gap;
    const gridHeightScaled = rows * info.frameHeight * scale + (rows - 1) * gap;
    const startX = (this.scale.width - gridWidthScaled) / 2;
    const startY = marginTop + (availableHeight - gridHeightScaled) / 2;

    for (let index = 0; index < totalFrames; index += 1) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (info.frameWidth * scale + gap) + (info.frameWidth * scale) / 2;
      const y = startY + row * (info.frameHeight * scale + gap) + (info.frameHeight * scale) / 2;
      const sprite = this.add.image(x, y, info.key, index);
      sprite.setScale(scale);
      this.sheetGroup.add(sprite);
    }

    if (this.showLabels && info.labels) {
      for (const [label, frame] of Object.entries(info.labels)) {
        const col = frame % columns;
        const row = Math.floor(frame / columns);
        const x = startX + col * (info.frameWidth * scale + gap) + (info.frameWidth * scale) / 2;
        const y = startY + row * (info.frameHeight * scale + gap) + (info.frameHeight * scale) / 2;
        const text = this.add.text(x, y + info.frameHeight * scale * 0.45, label, {
          ...UI_STYLE.text.small,
          fontFamily: UI_STYLE.fontFamily,
          color: '#f8fafc',
          stroke: '#0f172a',
          strokeThickness: 3,
        }).setOrigin(0.5, 0);
        this.sheetGroup.add(text);
      }
    }

    if (this.headerText) {
      this.headerText.setText(`${info.key} (${info.frameWidth}x${info.frameHeight})`);
    }

    this.layout = {
      startX,
      startY,
      scale,
      columns,
      rows,
      frameWidth: info.frameWidth,
      frameHeight: info.frameHeight,
      gap,
    };
  }

  private updateHover(x: number, y: number): void {
    if (!this.hoverText) {
      return;
    }
    if (!this.layout) {
      this.hoverText.setText('');
      this.highlight?.clear();
      return;
    }
    const sheet = ATLAS_SHEETS[this.index];
    const { startX, startY, scale, columns, rows, frameWidth, frameHeight, gap } = this.layout;
    const totalFrames = columns * rows;

    const localX = x - startX;
    const localY = y - startY;
    if (localX < 0 || localY < 0) {
      this.hoverText.setText('');
      this.highlight?.clear();
      return;
    }
    const cellWidth = frameWidth * scale + gap;
    const cellHeight = frameHeight * scale + gap;
    const col = Math.floor(localX / cellWidth);
    const row = Math.floor(localY / cellHeight);
    if (col < 0 || row < 0 || col >= columns || row >= rows) {
      this.hoverText.setText('');
      this.highlight?.clear();
      return;
    }

    const frame = row * columns + col;
    if (frame < 0 || frame >= totalFrames) {
      this.hoverText.setText('');
      this.highlight?.clear();
      return;
    }

    const label = sheet.labels ? Object.entries(sheet.labels).find(([, idx]) => idx === frame)?.[0] : undefined;
    this.hoverText.setText(label ? `Frame ${frame} (${label})` : `Frame ${frame}`);

    const rectX = startX + col * cellWidth;
    const rectY = startY + row * cellHeight;
    this.highlight?.clear();
    this.highlight?.lineStyle(2, 0xf8fafc, 0.9);
    this.highlight?.strokeRect(rectX - 1, rectY - 1, frameWidth * scale + 2, frameHeight * scale + 2);
  }

  private toggleLabels(): void {
    this.showLabels = !this.showLabels;
    this.drawSheet();
  }
}

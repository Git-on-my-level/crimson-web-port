import Phaser from 'phaser';
import { getPerkDef, type PerkId } from '../content/perks';
import type { SimState } from '../sim/state';

const OPTION_COUNT = 3;

type OptionView = {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  description: Phaser.GameObjects.Text;
  keyHint: Phaser.GameObjects.Text;
  perkId: PerkId | null;
};

export class PerkPickerOverlay {
  private readonly onSelect: (slot: number) => void;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly options: OptionView[] = [];

  constructor(scene: Phaser.Scene, onSelect: (slot: number) => void) {
    this.onSelect = onSelect;

    const { width, height } = scene.scale;
    this.backdrop = scene.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.75)
      .setScrollFactor(0)
      .setDepth(1100)
      .setVisible(false);

    this.titleText = scene.add.text(width / 2, height * 0.2, 'Choose a Perk', {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '32px',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1101)
      .setVisible(false);

    for (let i = 0; i < OPTION_COUNT; i += 1) {
      const background = scene.add.rectangle(0, 0, 240, 160, 0x1f2937, 0.95)
        .setStrokeStyle(2, 0x38bdf8)
        .setScrollFactor(0)
        .setDepth(1101)
        .setInteractive({ useHandCursor: true });

      background.on('pointerdown', () => this.onSelect(i + 1));

      const title = scene.add.text(0, -40, '', {
        fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
        fontSize: '20px',
        color: '#f8fafc',
        align: 'center',
        wordWrap: { width: 210 },
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1102);

      const description = scene.add.text(0, 0, '', {
        fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
        fontSize: '14px',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: 210 },
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1102);

      const keyHint = scene.add.text(0, 55, '', {
        fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
        align: 'center',
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1102);

      const container = scene.add.container(0, 0, [background, title, description, keyHint])
        .setDepth(1101)
        .setVisible(false);

      this.options.push({
        container,
        background,
        title,
        description,
        keyHint,
        perkId: null,
      });
    }
  }

  update(state: SimState): void {
    const choices = state.perkChoices ?? [];
    const visible = state.phase === 'PerkSelect' && choices.length > 0;

    this.backdrop.setVisible(visible);
    this.titleText.setVisible(visible);

    for (let i = 0; i < this.options.length; i += 1) {
      const option = this.options[i];
      const perkId = choices[i] ?? null;
      option.perkId = perkId;

      if (!visible || !perkId) {
        option.container.setVisible(false);
        continue;
      }

      const def = getPerkDef(perkId);
      option.title.setText(def.name);
      option.description.setText(def.description);
      option.keyHint.setText(`Press ${i + 1} or click`);
      option.container.setVisible(true);
    }
  }

  resize(width: number, height: number): void {
    this.backdrop.setPosition(width / 2, height / 2);
    this.backdrop.setSize(width, height);
    this.titleText.setPosition(width / 2, height * 0.2);

    const spacing = 260;
    const startX = width / 2 - spacing;
    const y = height * 0.55;

    for (let i = 0; i < this.options.length; i += 1) {
      const option = this.options[i];
      option.container.setPosition(startX + spacing * i, y);
    }
  }

  destroy(): void {
    this.backdrop.destroy();
    this.titleText.destroy();
    for (const option of this.options) {
      option.container.destroy();
    }
  }
}

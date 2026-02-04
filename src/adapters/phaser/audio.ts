import Phaser from 'phaser';
import { loadSettings, updateVolumeSettings } from '../../persistence/settings';

type PhaserPlayableSound =
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.HTML5AudioSound
  | Phaser.Sound.NoAudioSound;

export class PhaserAudioAdapter {
  private volumeSettings = loadSettings().volume;
  private static currentMusic: PhaserPlayableSound | null = null;
  private static currentMusicKey: string | null = null;
  private sound: Phaser.Sound.BaseSoundManager;
  private now: () => number;
  private sfxCooldowns = new Map<string, number>();
  private sfxCooldownMs = 50;

  constructor(sceneOrSound: Phaser.Scene | Phaser.Sound.BaseSoundManager) {
    if (sceneOrSound instanceof Phaser.Scene) {
      this.sound = sceneOrSound.sound;
      this.now = () => sceneOrSound.time.now;
    } else {
      this.sound = sceneOrSound;
      this.now = () => Date.now();
    }
    this.applyVolumes();
  }

  reloadSettings(): void {
    this.volumeSettings = loadSettings().volume;
    this.applyVolumes();
  }

  playSfx(key: string): void {
    const effectiveVolume = this.volumeSettings.master * this.volumeSettings.sfx;
    if (effectiveVolume <= 0) return;

    const now = this.now();
    const lastPlayed = this.sfxCooldowns.get(key) ?? -Infinity;
    if (now - lastPlayed < this.sfxCooldownMs) {
      return;
    }

    this.sound.play(key, { volume: this.volumeSettings.sfx });
    this.sfxCooldowns.set(key, now);
  }

  playMusic(key: string, loop = true): void {
    if (PhaserAudioAdapter.currentMusicKey === key && PhaserAudioAdapter.currentMusic?.isPlaying) {
      PhaserAudioAdapter.currentMusic.setLoop(loop);
      PhaserAudioAdapter.currentMusic.setVolume(this.volumeSettings.music);
      this.applyVolumes();
      return;
    }

    this.stopMusic();

    const music = this.sound.add(key, { loop, volume: this.volumeSettings.music }) as PhaserPlayableSound;
    music.play();

    PhaserAudioAdapter.currentMusic = music;
    PhaserAudioAdapter.currentMusicKey = key;
    this.applyVolumes();
  }

  stopMusic(): void {
    if (PhaserAudioAdapter.currentMusic) {
      PhaserAudioAdapter.currentMusic.stop();
      PhaserAudioAdapter.currentMusic.destroy();
    }
    PhaserAudioAdapter.currentMusic = null;
    PhaserAudioAdapter.currentMusicKey = null;
  }

  setMasterVolume(volume: number): void {
    this.volumeSettings.master = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ master: this.volumeSettings.master });
    this.applyVolumes();
  }

  setSfxVolume(volume: number): void {
    this.volumeSettings.sfx = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ sfx: this.volumeSettings.sfx });
  }

  setMusicVolume(volume: number): void {
    this.volumeSettings.music = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ music: this.volumeSettings.music });
    this.applyVolumes();
  }

  private applyVolumes(): void {
    this.sound.volume = this.volumeSettings.master;
    if (PhaserAudioAdapter.currentMusic) {
      PhaserAudioAdapter.currentMusic.setVolume(this.volumeSettings.music);
    }
  }
}

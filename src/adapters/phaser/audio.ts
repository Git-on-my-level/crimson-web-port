import { loadSettings, updateVolumeSettings } from '../../persistence/settings';

export class PhaserAudioAdapter {
  private volumeSettings = loadSettings().volume;

  constructor() {
  }

  reloadSettings(): void {
    this.volumeSettings = loadSettings().volume;
  }

  playSfx(name: string): void {
    const effectiveVolume = this.volumeSettings.master * this.volumeSettings.sfx;
    if (effectiveVolume <= 0) return;

    console.log(`[Audio] Playing SFX: ${name} (volume: ${effectiveVolume.toFixed(2)})`);
  }

  playMusic(name: string, loop = true): void {
    const effectiveVolume = this.volumeSettings.master * this.volumeSettings.music;
    if (effectiveVolume <= 0) return;

    console.log(`[Audio] Playing music: ${name} (volume: ${effectiveVolume.toFixed(2)}, loop: ${loop})`);
  }

  stopMusic(): void {
    console.log('[Audio] Stopping music');
  }

  setMasterVolume(volume: number): void {
    this.volumeSettings.master = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ master: this.volumeSettings.master });
  }

  setSfxVolume(volume: number): void {
    this.volumeSettings.sfx = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ sfx: this.volumeSettings.sfx });
  }

  setMusicVolume(volume: number): void {
    this.volumeSettings.music = Math.max(0, Math.min(1, volume));
    updateVolumeSettings({ music: this.volumeSettings.music });
  }
}

export interface Keybinds {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  fire: string;
  reload: string;
  weaponSwitch1: string;
  weaponSwitch2: string;
  weaponSwitch3: string;
  weaponSwitch4: string;
  weaponSwitch5: string;
  pause: string;
}

export interface VolumeSettings {
  master: number;
  sfx: number;
  music: number;
}

export interface Settings {
  version: number;
  keybinds: Keybinds;
  volume: VolumeSettings;
}

const STORAGE_KEY = 'crimson_port.settings.v1';

const DEFAULT_KEYBINDS: Keybinds = {
  moveUp: 'W',
  moveDown: 'S',
  moveLeft: 'A',
  moveRight: 'D',
  fire: 'SPACE',
  reload: 'R',
  weaponSwitch1: 'ONE',
  weaponSwitch2: 'TWO',
  weaponSwitch3: 'THREE',
  weaponSwitch4: 'FOUR',
  weaponSwitch5: 'FIVE',
  pause: 'P',
};

const DEFAULT_VOLUME: VolumeSettings = {
  master: 1.0,
  sfx: 1.0,
  music: 0.8,
};

const DEFAULT_SETTINGS: Settings = {
  version: 1,
  keybinds: DEFAULT_KEYBINDS,
  volume: DEFAULT_VOLUME,
};

interface StorageData {
  version: number;
  keybinds?: Partial<Keybinds>;
  volume?: Partial<VolumeSettings>;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function parseStorageData(raw: string | null): StorageData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as StorageData;
    }
  } catch {
    return null;
  }
  return null;
}

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

export function loadSettings(): Settings {
  const storage = getStorage();
  if (!storage) return getDefaultSettings();

  const raw = storage.getItem(STORAGE_KEY);
  const data = parseStorageData(raw);

  if (!data) return getDefaultSettings();

  return {
    version: 1,
    keybinds: { ...DEFAULT_KEYBINDS, ...data.keybinds },
    volume: { ...DEFAULT_VOLUME, ...data.volume },
  };
}

export function saveSettings(settings: Settings): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}

export function updateVolumeSettings(volume: Partial<VolumeSettings>): Settings {
  const settings = loadSettings();
  settings.volume = { ...settings.volume, ...volume };
  saveSettings(settings);
  return settings;
}

export function updateKeybindSetting(action: keyof Keybinds, keyCode: string): Settings {
  const settings = loadSettings();
  settings.keybinds = { ...settings.keybinds, [action]: keyCode };
  saveSettings(settings);
  return settings;
}

export function resetKeybindsToDefaults(): Settings {
  const settings = loadSettings();
  settings.keybinds = { ...DEFAULT_KEYBINDS };
  saveSettings(settings);
  return settings;
}

export function resetVolumeToDefaults(): Settings {
  const settings = loadSettings();
  settings.volume = { ...DEFAULT_VOLUME };
  saveSettings(settings);
  return settings;
}

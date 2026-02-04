export type ProjectileProfileId = 'default' | 'piercing' | 'explosive';

export interface ProjectileProfile {
  id: ProjectileProfileId;
  pierceCount?: number;
  explosionRadius?: number;
  explosionDamageMultiplier?: number;
  projectileRadius?: number;
}

export const PROJECTILE_PROFILES: Record<ProjectileProfileId, ProjectileProfile> = {
  default: { id: 'default' },
  piercing: {
    id: 'piercing',
    pierceCount: 1,
  },
  explosive: {
    id: 'explosive',
    explosionRadius: 3.5,
    explosionDamageMultiplier: 0.9,
    projectileRadius: 0.6,
  },
};

export function getProjectileProfile(id?: ProjectileProfileId): ProjectileProfile {
  return PROJECTILE_PROFILES[id ?? 'default'] ?? PROJECTILE_PROFILES.default;
}

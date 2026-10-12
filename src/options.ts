import type { DisclosureOptions as Options } from '@/types';

export function resolveOptions(
  defaults: Options,
  source: Partial<Options>,
): Options {
  const merged = {
    ...defaults,
    ...source,
    animation: { ...defaults.animation, ...(source.animation ?? {}) },
  };
  const mergedAnimation = merged.animation;
  const duration = mergedAnimation.duration;
  const defaultAnimation = defaults.animation;

  if (typeof duration !== 'number' || Number.isNaN(duration)) {
    const duration = defaultAnimation.duration;
    console.warn(`Invalid animation duration. Fallback: ${duration} (ms).`);
    mergedAnimation.duration = duration;
  }

  if (duration < 0) {
    console.warn('Invalid animation duration. Fallback: 0 (ms).');
    mergedAnimation.duration = 0;
  }

  if (!CSS.supports('animation-timing-function', mergedAnimation.easing)) {
    const easing = defaultAnimation.easing;
    console.warn(`Invalid animation easing. Fallback: '${easing}'.`);
    mergedAnimation.easing = easing;
  }

  if (typeof merged.collapsible !== 'boolean') {
    const collapsible = defaults.collapsible;
    console.warn(`Invalid collapsible option. Fallback: ${collapsible}.`);
    merged.collapsible = collapsible;
  }

  return merged;
}

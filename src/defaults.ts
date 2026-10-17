import type { DisclosureOptions as Options } from './types';

export const defaults = {
  animation: {
    duration: 300,
    easing: 'ease',
  },
  collapsible: true,
} as const satisfies Options;

// Den definitions for Pack 1703
export const DEN_TYPES = {
  PACK: 'pack', // Special identifier for all dens
  LION: 'lion',
  TIGER: 'tiger', 
  WOLF: 'wolf',
  BEAR: 'bear',
  WEBELOS: 'webelos',
  ARROW_OF_LIGHT: 'arrow-of-light'
} as const;

export type DenType = typeof DEN_TYPES[keyof typeof DEN_TYPES];

export const DEN_INFO = {
  [DEN_TYPES.PACK]: {
    name: 'Pack',
    displayName: 'Pack (All Dens)',
    emoji: '🏕️',
    color: 'blue',
    grade: 'All Grades',
    description: 'All dens - pack-wide announcements'
  },
  [DEN_TYPES.LION]: {
    name: 'Lion Den',
    displayName: 'Lion Den',
    emoji: '🦁',
    color: 'yellow',
    grade: 'Kindergarten',
    description: 'Lion Den specific discussions and activities'
  },
  [DEN_TYPES.TIGER]: {
    name: 'Tiger Den',
    displayName: 'Tiger Den', 
    emoji: '🐯',
    color: 'orange',
    grade: '1st Grade',
    description: 'Tiger Den specific discussions and activities'
  },
  [DEN_TYPES.WOLF]: {
    name: 'Wolf Den',
    displayName: 'Wolf Den',
    emoji: '🐺', 
    color: 'blue',
    grade: '2nd Grade',
    description: 'Wolf Den specific discussions and activities'
  },
  [DEN_TYPES.BEAR]: {
    name: 'Bear Den',
    displayName: 'Bear Den',
    emoji: '🐻',
    color: 'brown', 
    grade: '3rd Grade',
    description: 'Bear Den specific discussions and activities'
  },
  [DEN_TYPES.WEBELOS]: {
    name: 'Webelos Den',
    displayName: 'Webelos Den',
    emoji: '🏕️',
    color: 'green',
    grade: '4th Grade', 
    description: 'Webelos Den specific discussions and activities'
  },
  [DEN_TYPES.ARROW_OF_LIGHT]: {
    name: 'Arrow of Light',
    displayName: 'Arrow of Light',
    emoji: '🏹',
    color: 'purple',
    grade: '5th Grade',
    description: 'Arrow of Light specific discussions and activities'
  }
} as const;

export const ALL_DENS = Object.values(DEN_TYPES);
export const INDIVIDUAL_DENS = ALL_DENS.filter(den => den !== DEN_TYPES.PACK); // All dens except pack
export const DEN_NAMES = Object.keys(DEN_INFO);

const BASE = 'https://okizeme.b-cdn.net/armor-king/'

function url(path) {
  return BASE + encodeURIComponent(path).replace(/%2C/g, '%2C').replace(/%2B/g, '%2B')
}

// Break inputs: '1' | '2' | '1+2' | '1or2' | '3+4' | 'none'

export const ARMOR_KING_CHAINS = [
  // ─────────────────────────────────────────────
  // 1. COBRA CLUTCH
  // ─────────────────────────────────────────────
  {
    id: 'ak-cobra-clutch',
    name: 'Cobra Clutch',
    description: 'f,N,d,df+1+3 ou 2+4',
    emoji: '🐍',
    root: {
      id: 'ak-cc1',
      name: 'Cobra Clutch',
      input: 'f,N,d,df+1+3/2+4',
      breakInput: '1or2',
      videoUrl: 'https://okizeme.b-cdn.net/armor-king/f%2Cn%2Cd%2Cdf%2B1%2B3.mp4',
      children: [
        {
          id: 'ak-cc2a',
          name: 'Flinging Half Nelson',
          input: 'CC,1',
          breakInput: '1',
          videoUrl: '',
          children: [],
        },
        {
          id: 'ak-cc2b',
          name: 'Neck Drop',
          input: 'CC,1+2',
          breakInput: '1+2',
          videoUrl: '',
          children: [
            {
              id: 'ak-cc3ba',
              name: 'Choke Sleeper',
              input: 'ND,1',
              breakInput: '1',
              videoUrl: '',
              children: [],
            },
            {
              id: 'ak-cc3bb',
              name: '3-Count Pound',
              input: 'ND,2',
              breakInput: '2',
              videoUrl: '',
              children: [],
            },
          ],
        },
        {
          id: 'ak-cc2c',
          name: 'Sleeper',
          input: 'CC,2',
          breakInput: '2',
          videoUrl: '',
          children: [
            {
              id: 'ak-cc3ca',
              name: 'Human Necktie',
              input: 'SL,2',
              breakInput: '2',
              videoUrl: '',
              children: [],
            },
            {
              id: 'ak-cc3cb',
              name: 'Triple Trouble',
              input: 'SL,1',
              breakInput: '1',
              videoUrl: '',
              children: [],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 2. SUPLEX
  // ─────────────────────────────────────────────
  {
    id: 'ak-suplex',
    name: 'Suplex',
    description: 'Suplex → Jaguar Screwdriver',
    emoji: '🔩',
    root: {
      id: 'ak-sx1',
      name: 'Suplex',
      input: '1+3/2+4',
      breakInput: '1or2',
      videoUrl: 'https://okizeme.b-cdn.net/armor-king/2%2B4.mp4',
      children: [
        {
          id: 'ak-sx2',
          name: 'Jaguar Screwdriver',
          input: 'SX,1',
          breakInput: 'none',
          videoUrl: 'https://okizeme.b-cdn.net/armor-king/2%2B4%2Cd%2B1%2B2.mp4',
          children: [],
        },
      ],
    },
  },
]

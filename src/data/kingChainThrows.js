const BASE = 'https://okizeme.b-cdn.net/king/'

function url(path) {
  return BASE + encodeURIComponent(path).replace(/%2C/g, '%2C').replace(/%2B/g, '%2B')
}

// Break inputs: '1' | '2' | '1+2' | '1or2' | '3+4' | 'none'

export const KING_CHAINS = [
  // ─────────────────────────────────────────────
  // 1. ARM BREAKER
  // ─────────────────────────────────────────────
  {
    id: 'arm-breaker',
    name: 'Arm Breaker',
    description: 'Crouching Dash → AB1',
    emoji: '💪',
    root: {
      id: 'ab1',
      name: 'Arm Breaker',
      input: 'CD.1+3',
      breakInput: '1',
      videoUrl: 'https://okizeme.b-cdn.net/king/CD.1%2B3.mp4',
      children: [
        {
          id: 'ab2a',
          name: 'Triple Arm Breaker',
          input: 'AB1.1,1+2',
          breakInput: '1',
          videoUrl: 'https://okizeme.b-cdn.net/king/AB1.1%2C1%2B2.mp4',
          children: [],
        },
        {
          id: 'ab2b',
          name: 'Head Jammer',
          input: 'AB1.2,4,2+4',
          breakInput: '2',
          videoUrl: 'https://okizeme.b-cdn.net/king/AB1.2%2C4%2C2%2B4.mp4',
          children: [
            {
              id: 'ab2b1',
              name: 'Struggle Combination',
              input: 'AB2b.3,4,3+4,1+2',
              breakInput: 'none',
              videoUrl: 'https://okizeme.b-cdn.net/king/AB2b.3%2C4%2C3%2B4%2C1%2B2.mp4',
              children: [],
            },
          ],
        },
        {
          id: 'ab2c',
          name: 'Chicken Wing Face Lock',
          input: 'AB1.2,1,1+3',
          breakInput: '1+2',
          videoUrl: 'https://okizeme.b-cdn.net/king/AB1.2%2C1%2C1%2B3.mp4',
          children: [
            {
              id: 'ab3ca',
              name: 'Dragon Sleeper Finish',
              input: 'AB2c.2,1,3,1+2',
              breakInput: '1',
              videoUrl: 'https://okizeme.b-cdn.net/king/AB2c.2%2C1%2C3%2C1%2B2.mp4',
              children: [],
            },
            {
              id: 'ab3cb',
              name: 'Rolling Death Cradle',
              input: 'AB2c.1,3,4,2,1+2',
              breakInput: '2',
              videoUrl: 'https://okizeme.b-cdn.net/king/AB2c.1%2C3%2C4%2C2%2C1%2B2.mp4',
              children: [],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 2. STANDING HEEL HOLD
  // ─────────────────────────────────────────────
  {
    id: 'standing-heel-hold',
    name: 'Standing Heel Hold',
    description: 'Crouching Dash → SHH1',
    emoji: '🦵',
    root: {
      id: 'shh1',
      name: 'Standing Heel Hold',
      input: 'CD.2+4',
      breakInput: '2',
      videoUrl: 'https://okizeme.b-cdn.net/king/CD.2%2B4.mp4',
      children: [
        {
          id: 'shh2a',
          name: 'S.T.F.',
          input: 'SHH1.1,2,1+2',
          breakInput: '1',
          videoUrl: 'https://okizeme.b-cdn.net/king/SHH1.1%2C2%2C1%2B2.mp4',
          children: [],
        },
        {
          id: 'shh2b',
          name: 'Scorpion Death Lock',
          input: 'SHH1.2,1,1+3',
          breakInput: '2',
          videoUrl: 'https://okizeme.b-cdn.net/king/SHH1.2%2C1%2C1%2B3.mp4',
          children: [],
        },
        {
          id: 'shh2c',
          name: 'Indian Death Lock',
          input: 'SHH1.1+2,1,3',
          breakInput: '1+2',
          videoUrl: 'https://okizeme.b-cdn.net/king/SHH1.1%2B2%2C1%2C3.mp4',
          children: [
            {
              id: 'shh3ca',
              name: "King's Bridge",
              input: 'SHH2c.3,4,1+2,3+4',
              breakInput: 'none',
              videoUrl: 'https://okizeme.b-cdn.net/king/SHH2c.3%2C4%2C1%2B2%2C3%2B4.mp4',
              children: [],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 3. REVERSE ARM SLAM
  // ─────────────────────────────────────────────
  {
    id: 'reverse-arm-slam',
    name: 'Reverse Arm Slam',
    description: 'df+1+3',
    emoji: '🔄',
    root: {
      id: 'ras1',
      name: 'Reverse Arm Slam',
      input: 'df+1+3',
      breakInput: '1',
      videoUrl: 'https://okizeme.b-cdn.net/king/df%2B1%2B3.mp4',
      children: [
        {
          id: 'ras2',
          name: 'Backdrop',
          input: 'RAS1.1',
          breakInput: 'none',
          videoUrl: 'https://okizeme.b-cdn.net/king/RAS1.1.mp4',
          children: [
            {
              id: 'ras3',
              name: 'German Suplex',
              input: 'RAS2.1',
              breakInput: '1or2',
              videoUrl: 'https://okizeme.b-cdn.net/king/RAS2.1.mp4',
              children: [
                {
                  id: 'ras4',
                  name: 'Power Bomb',
                  input: 'RAS3.1',
                  breakInput: 'none',
                  videoUrl: 'https://okizeme.b-cdn.net/king/RAS3.1.mp4',
                  children: [
                    {
                      id: 'ras5a',
                      name: 'Giant Swing',
                      input: 'RAS4.1',
                      breakInput: '1',
                      videoUrl: 'https://okizeme.b-cdn.net/king/RAS4.1.mp4',
                      children: [],
                    },
                    {
                      id: 'ras5b',
                      name: 'Muscle Buster',
                      input: 'RAS4.2',
                      breakInput: '2',
                      videoUrl: 'https://okizeme.b-cdn.net/king/RAS4.2.mp4',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 4. REVERSE SPECIAL STRETCH BOMB (standalone)
  // ─────────────────────────────────────────────
  {
    id: 'rssb',
    name: 'Reverse Special Stretch Bomb',
    description: 'df+2+4',
    emoji: '🌀',
    root: {
      id: 'rssb1',
      name: 'Reverse Special Stretch Bomb',
      input: 'df+2+4',
      breakInput: '2',
      videoUrl: 'https://okizeme.b-cdn.net/king/df%2B2%2B4.mp4',
      children: [
        {
          id: 'rssb2',
          name: 'Cannonball Buster',
          input: 'RSSB1.1',
          breakInput: 'none',
          videoUrl: 'https://okizeme.b-cdn.net/king/RSSB1.1.mp4',
          children: [
            {
              id: 'rssb3',
              name: 'Manhattan Drop',
              input: 'RSSB2.1',
              breakInput: '1or2',
              videoUrl: 'https://okizeme.b-cdn.net/king/RSSB2.1.mp4',
              children: [
                {
                  id: 'rssb4',
                  name: 'Victory Bomb',
                  input: 'RSSB3.1',
                  breakInput: 'none',
                  videoUrl: 'https://okizeme.b-cdn.net/king/RSSB3.1.mp4',
                  children: [
                    {
                      id: 'rssb5a',
                      name: 'Giant Swing',
                      input: 'RSSB4.1',
                      breakInput: '1',
                      videoUrl: 'https://okizeme.b-cdn.net/king/RSSB4.1.mp4',
                      children: [],
                    },
                    {
                      id: 'rssb5b',
                      name: 'Muscle Buster',
                      input: 'RSSB4.2',
                      breakInput: '2',
                      videoUrl: 'https://okizeme.b-cdn.net/king/RSSB4.2.mp4',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 5. COBRA CLUTCH (Jaguar Step)
  // ─────────────────────────────────────────────
  {
    id: 'cobra-clutch',
    name: 'Cobra Clutch',
    description: 'Jaguar Step → MMD1',
    emoji: '🐍',
    root: {
      id: 'mmd1',
      name: 'Cobra Clutch',
      input: 'JGS.1+3',
      breakInput: '1or2',
      videoUrl: 'https://okizeme.b-cdn.net/king/JGS.1%2B3.mp4',
      children: [
        {
          id: 'mmd2',
          name: 'Cobra Twist',
          input: 'MMD1.1,4,2,3',
          breakInput: 'none',
          videoUrl: 'https://okizeme.b-cdn.net/king/MMD1.1%2C4%2C2%2C3.mp4',
          children: [
            // Two variants of Reverse DDT
            {
              id: 'mmd3a',
              name: 'Reverse DDT (input 1)',
              input: 'MMD2.1,1+3',
              breakInput: '1',
              videoUrl: 'https://okizeme.b-cdn.net/king/MMD2.1%2C1%2B3.mp4',
              children: [
                {
                  id: 'mmd4-from-3a',
                  name: 'Reverse Special Stretch Bomb',
                  input: 'MMD3.1+2,1,1+3',
                  breakInput: '1',
                  videoUrl: 'https://okizeme.b-cdn.net/king/MMD3.1%2B2%2C1%2C1%2B3.mp4',
                  children: [
                    {
                      id: 'mmd5-from-3a',
                      name: 'Backdrop',
                      input: 'MMD4.3+4,1+2',
                      breakInput: 'none',
                      videoUrl: 'https://okizeme.b-cdn.net/king/MMD4.3%2B4%2C1%2B2.mp4',
                      children: [
                        {
                          id: 'mmd6a-bh1',
                          name: 'Burning Hammer (break 1)',
                          input: 'MMD5.1+2,3,1+3',
                          breakInput: '1',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C3%2C1%2B3.mp4',
                          children: [
                            {
                              id: 'mmd7a',
                              name: 'Screwdriver (break 1)',
                              input: 'MMD6.2,4,3,1,1+3',
                              breakInput: '1',
                              videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C1%2B3.mp4',
                              children: [],
                            },
                            {
                              id: 'mmd7b',
                              name: 'Screwdriver (break 2)',
                              input: 'MMD6.2,4,3,1,2+4',
                              breakInput: '2',
                              videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C2%2B4.mp4',
                              children: [],
                            },
                          ],
                        },
                        {
                          id: 'mmd6a-bh2',
                          name: 'Burning Hammer (break 2)',
                          input: 'MMD5.1+2,4,2+4',
                          breakInput: '2',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C4%2C2%2B4.mp4',
                          children: [
                            {
                              id: 'mmd7c',
                              name: 'Screwdriver (break 1)',
                              input: 'MMD6.2,4,3,1,1+3',
                              breakInput: '1',
                              videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C1%2B3.mp4',
                              children: [],
                            },
                            {
                              id: 'mmd7d',
                              name: 'Screwdriver (break 2)',
                              input: 'MMD6.2,4,3,1,2+4',
                              breakInput: '2',
                              videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C2%2B4.mp4',
                              children: [],
                            },
                          ],
                        },
                        {
                          id: 'mmd6a-sol',
                          name: 'Sol Naciente',
                          input: 'MMD5.1+2,4,2,1+2',
                          breakInput: '1+2',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C4%2C2%2C1%2B2.mp4',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'mmd4a-samurai',
                  name: 'Samurai Rock',
                  input: 'MMD3.2,3,1,1+2',
                  breakInput: '1+2',
                  videoUrl: 'https://okizeme.b-cdn.net/king/MMD3.2%2C3%2C1%2C1%2B2.mp4',
                  children: [],
                },
              ],
            },
            {
              id: 'mmd3b',
              name: 'Reverse DDT (input 2)',
              input: 'MMD2.2,2+4',
              breakInput: '2',
              videoUrl: 'https://okizeme.b-cdn.net/king/MMD2.2%2C2%2B4.mp4',
              children: [
                {
                  id: 'mmd4-from-3b',
                  name: 'Reverse Special Stretch Bomb',
                  input: 'MMD3.1+2,2,2+4',
                  breakInput: '2',
                  videoUrl: 'https://okizeme.b-cdn.net/king/MMD3.1%2B2%2C2%2C2%2B4.mp4',
                  children: [
                    {
                      id: 'mmd5-from-3b',
                      name: 'Backdrop',
                      input: 'MMD4.3+4,1+2',
                      breakInput: 'none',
                      videoUrl: 'https://okizeme.b-cdn.net/king/MMD4.3%2B4%2C1%2B2.mp4',
                      children: [
                        {
                          id: 'mmd6b-bh1',
                          name: 'Burning Hammer (break 1)',
                          input: 'MMD5.1+2,3,1+3',
                          breakInput: '1',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C3%2C1%2B3.mp4',
                          children: [
                            { id: 'mmd7e', name: 'Screwdriver (break 1)', input: 'MMD6.2,4,3,1,1+3', breakInput: '1', videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C1%2B3.mp4', children: [] },
                            { id: 'mmd7f', name: 'Screwdriver (break 2)', input: 'MMD6.2,4,3,1,2+4', breakInput: '2', videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C2%2B4.mp4', children: [] },
                          ],
                        },
                        {
                          id: 'mmd6b-bh2',
                          name: 'Burning Hammer (break 2)',
                          input: 'MMD5.1+2,4,2+4',
                          breakInput: '2',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C4%2C2%2B4.mp4',
                          children: [
                            { id: 'mmd7g', name: 'Screwdriver (break 1)', input: 'MMD6.2,4,3,1,1+3', breakInput: '1', videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C1%2B3.mp4', children: [] },
                            { id: 'mmd7h', name: 'Screwdriver (break 2)', input: 'MMD6.2,4,3,1,2+4', breakInput: '2', videoUrl: 'https://okizeme.b-cdn.net/king/MMD6.2%2C4%2C3%2C1%2C2%2B4.mp4', children: [] },
                          ],
                        },
                        {
                          id: 'mmd6b-sol',
                          name: 'Sol Naciente',
                          input: 'MMD5.1+2,4,2,1+2',
                          breakInput: '1+2',
                          videoUrl: 'https://okizeme.b-cdn.net/king/MMD5.1%2B2%2C4%2C2%2C1%2B2.mp4',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'mmd4a-samurai-b',
                  name: 'Samurai Rock',
                  input: 'MMD3.2,3,1,1+2',
                  breakInput: '1+2',
                  videoUrl: 'https://okizeme.b-cdn.net/king/MMD3.2%2C3%2C1%2C1%2B2.mp4',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────
  // 6. ULTIMATE TACKLE
  // ─────────────────────────────────────────────
  {
    id: 'ultimate-tackle',
    name: 'Ultimate Tackle',
    description: 'Full Crouch → FC.1+2',
    emoji: '🤸',
    root: {
      id: 'ut',
      name: 'Ultimate Tackle',
      input: 'FC.1+2',
      breakInput: '1+2',
      videoUrl: 'https://okizeme.b-cdn.net/king/FC.1%2B2.mp4',
      children: [
        {
          id: 'ut-armbar',
          name: 'Armbar',
          input: 'UT,1+2',
          breakInput: '1+2',
          videoUrl: 'https://okizeme.b-cdn.net/king/UT%2C1%2B2.mp4',
          children: [
            {
              id: 'ut-arm-twist',
              name: 'Arm Twist',
              input: 'UT,1+2,1+2',
              breakInput: 'none',
              videoUrl: 'https://okizeme.b-cdn.net/king/UT%2C1%2B2%2C1%2B2.mp4',
              children: [],
            },
          ],
        },
        {
          id: 'ut-legcross',
          name: 'Leg Cross Hold',
          input: 'UT,3+4',
          breakInput: '3+4',
          videoUrl: 'https://okizeme.b-cdn.net/king/UT%2C3%2B4.mp4',
          children: [
            {
              id: 'ut-stretch',
              name: 'Stretch Combo',
              input: 'UT,3+4:1+2',
              breakInput: 'none',
              videoUrl: 'https://okizeme.b-cdn.net/king/UT%2C3%2B4colon1%2B2.mp4',
              children: [],
            },
          ],
        },
        {
          id: 'ut-punches',
          name: 'Ultimate Punch',
          input: 'UT,2,1,2,1',
          breakInput: '1or2',
          videoUrl: 'https://okizeme.b-cdn.net/king/UT%2C2%2C1%2C2%2C1.mp4',
          children: [],
        },
      ],
    },
  },
]

/**
 * Generate all root-to-leaf paths via DFS (shuffled children).
 * Returns array of arrays of nodes.
 */
export function generateAllPaths(root) {
  const paths = []
  function dfs(node, currentPath) {
    const path = [...currentPath, node]
    if (node.children.length === 0) {
      paths.push(path)
      return
    }
    // Shuffle children for variety
    const shuffled = [...node.children].sort(() => Math.random() - 0.5)
    for (const child of shuffled) {
      dfs(child, path)
    }
  }
  dfs(root, [])
  return paths
}

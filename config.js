/**
 * NOCTIS — Configuration & Tuning
 * All section heights, chapter ranges, frame counts, paths, and callout coordinates.
 */

window.NOCTIS_CONFIG = {
  // Frame sequences
  frames: {
    hero: {
      count: 598,
      desktopPath: (index) => `assets/frames/hero/frame_${String(index).padStart(4, '0')}.webp`,
      mobilePath: (index) => `assets/frames/hero-mobile/frame_${String(index).padStart(4, '0')}.webp`,
      preloadInitial: 40, // Preload first 40 frames before revealing site
      totalSizeDesktop: '16.20 MB',
      totalSizeMobile: '7.84 MB',
    },
    dismantle: {
      count: 200,
      desktopPath: (index) => `assets/frames/dismantle/frame_${String(index).padStart(4, '0')}.webp`,
      mobilePath: (index) => `assets/frames/dismantle-mobile/frame_${String(index).padStart(4, '0')}.webp`,
      totalSizeDesktop: '13.35 MB',
      totalSizeMobile: '6.66 MB',
    }
  },

  // Heights for scroll wrappers (multiplier of 100vh)
  scroll: {
    heroHeightMultiplier: 6, // 600vh
    dismantleHeightMultiplier: 3.5, // 350vh
    lerpFactor: 0.15, // Smooth lerp rate for target frame interpolation
    cursorLerp: 0.18, // Cursor lag
  },

  // Hero Scrollytelling Chapters [startProgress, endProgress]
  heroChapters: [
    {
      id: 'chapter-1',
      index: '01',
      range: [0.00, 0.14],
      fadeOutStart: 0.11,
      title: 'NOCTIS',
      subtitle: 'The city is asleep.',
      hint: 'SCROLL TO WAKE IT'
    },
    {
      id: 'chapter-2',
      index: '02',
      range: [0.22, 0.42],
      fadeOutStart: 0.38,
      headline: "It doesn't need the city's light."
    },
    {
      id: 'chapter-3',
      index: '03',
      range: [0.50, 0.70],
      fadeOutStart: 0.66,
      headline: 'It brings its own.'
    },
    {
      id: 'chapter-4',
      index: '04',
      range: [0.80, 1.00],
      fadeOutStart: 0.98,
      model: 'GT-E',
      specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
      linkText: 'Discover the GT-E',
      linkHref: '#lineup'
    }
  ],

  // Hero Telemetry ranges
  telemetry: {
    maxSpeedKmH: 118,
    maxDistanceKm: 4.2,
  },

  // Dismantle callout annotations (revealed sequentially starting from 70% progress)
  // Coordinates in percentage (%) of the stage container
  dismantleCallouts: [
    {
      id: 'callout-light',
      label: 'LIGHT',
      desc: 'Single-line LED signature',
      triggerProgress: 0.72,
      dot: { x: 18, y: 52 },
      lineEnd: { x: 12, y: 44 },
      text: { x: 10, y: 42, align: 'right' }
    },
    {
      id: 'callout-body',
      label: 'BODY',
      desc: 'Carbon composite monocoque',
      triggerProgress: 0.78,
      dot: { x: 55, y: 12 },
      lineEnd: { x: 68, y: 18 },
      text: { x: 70, y: 18, align: 'left' }
    },
    {
      id: 'callout-drive',
      label: 'DRIVE',
      desc: 'Dual axial-flux motors, 680 kW',
      triggerProgress: 0.84,
      dot: { x: 38, y: 62 },
      lineEnd: { x: 24, y: 72 },
      text: { x: 22, y: 72, align: 'right' }
    },
    {
      id: 'callout-battery',
      label: 'BATTERY',
      desc: '110 kWh structural pack',
      triggerProgress: 0.90,
      dot: { x: 62, y: 72 },
      lineEnd: { x: 74, y: 82 },
      text: { x: 76, y: 82, align: 'left' }
    }
  ],

  // Lineup Models
  lineup: [
    {
      id: 'gt-e',
      num: '01',
      name: 'GT-E',
      tagline: 'The grand tourer.',
      specs: {
        range: '640 km',
        accel: '3.1 s',
        power: '680 kW'
      },
      image: 'assets/cars/gt-e.webp',
      alt: 'NOCTIS GT-E matte graphite grand tourer coupe side profile',
      swatches: [
        { name: 'Matte Graphite', color: '#1B1E22', active: true },
        { name: 'Satin Obsidian', color: '#0C0D0F', active: false },
        { name: 'Liquid Silver', color: '#A5AAB2', active: false },
        { name: 'Deep Xenon', color: '#3A485A', active: false }
      ]
    },
    {
      id: 's',
      num: '02',
      name: 'S',
      tagline: 'Four doors, no compromise.',
      specs: {
        range: '600 km',
        accel: '3.6 s',
        power: '520 kW'
      },
      image: 'assets/cars/s.webp',
      alt: 'NOCTIS S satin bone white four-door sport sedan side profile',
      swatches: [
        { name: 'Satin Bone', color: '#EDEAE4', active: true },
        { name: 'Matte Graphite', color: '#1B1E22', active: false },
        { name: 'Midnight Charcoal', color: '#15171C', active: false },
        { name: 'Basalt Grey', color: '#4D535E', active: false }
      ]
    },
    {
      id: 'x',
      num: '03',
      name: 'X',
      tagline: 'Higher, never heavier.',
      specs: {
        range: '560 km',
        accel: '4.2 s',
        power: '480 kW'
      },
      image: 'assets/cars/x.webp',
      alt: 'NOCTIS X midnight blue SUV coupe side profile',
      swatches: [
        { name: 'Midnight Blue', color: '#0E1726', active: true },
        { name: 'Matte Graphite', color: '#1B1E22', active: false },
        { name: 'Bone White', color: '#EDEAE4', active: false },
        { name: 'Abyss Black', color: '#07080A', active: false }
      ]
    },
    {
      id: 'r',
      num: '04',
      name: 'R',
      tagline: 'Built for the track.',
      specs: {
        range: '420 km',
        accel: '2.4 s',
        power: '900 kW'
      },
      image: 'assets/cars/r.webp',
      alt: 'NOCTIS R satin black track coupe with red accents side profile',
      swatches: [
        { name: 'Satin Black / Red', color: '#0A0A0C', active: true },
        { name: 'Carbon Raw', color: '#18191C', active: false },
        { name: 'Asphalt Grey', color: '#2B2E34', active: false },
        { name: 'Pure Xenon', color: '#CFE3FF', active: false }
      ]
    },
    {
      id: 'one',
      num: '05',
      name: 'ONE',
      tagline: 'The future, early.',
      specs: {
        range: '750 km',
        accel: '1.9 s',
        power: 'Concept'
      },
      image: 'assets/cars/one.webp',
      alt: 'NOCTIS ONE liquid silver concept hypercar side profile',
      swatches: [
        { name: 'Liquid Silver', color: '#C8CDD6', active: true },
        { name: 'Dark Mercury', color: '#4E535C', active: false },
        { name: 'Void Black', color: '#050607', active: false },
        { name: 'Luminescent Xenon', color: '#CFE3FF', active: false }
      ]
    }
  ]
};


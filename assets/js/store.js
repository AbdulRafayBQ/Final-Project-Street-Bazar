/* Street Bazar — application state, persistence, seed data & domain logic */

import { uid, slugify } from './ui.js'

const KEY = 'street-bazar-v1'
const DAY = 86400000
const now = Date.now()

export const CATEGORIES = ['Fashion', 'Electronics', 'Mobile Accessories', 'Home & Kitchen', 'Food & Groceries', 'Beauty & Care', 'Handicraft', 'Footwear', 'Jewelry', 'Books & Stationery', 'Sports & Outdoors', 'Kids & Baby', 'Pets', 'Automotive', 'Health & Wellness']

export const STORE_TYPES = [
  { id: 'home', label: 'Home Business', icon: 'home', hint: 'Ghar se chalate hain — small batch, personal touch' },
  { id: 'physical', label: 'Physical Shop', icon: 'bank', hint: 'Dukan/market shop with walk-in customers' },
  { id: 'online', label: 'Online Brand', icon: 'globe', hint: 'Sirf online — page, website ya app se' },
  { id: 'hybrid', label: 'Hybrid (Both)', icon: 'layers', hint: 'Shop bhi aur online delivery bhi' },
]

export const FONT_PAIRS = [
  { id: 'pop', name: 'Bazaar Pop', d: '"Bricolage Grotesque",sans-serif', b: '"Plus Jakarta Sans",sans-serif' },
  { id: 'noor', name: 'Noor Serif', d: '"Playfair Display",serif', b: '"Karla",sans-serif' },
  { id: 'neon', name: 'Neon Grotesk', d: '"Space Grotesk",sans-serif', b: '"DM Sans",sans-serif' },
  { id: 'luxe', name: 'Modern Luxe', d: '"Playfair Display",serif', b: '"Plus Jakarta Sans",sans-serif' },
  { id: 'studio', name: 'Studio Pop', d: '"Space Grotesk",sans-serif', b: '"Plus Jakarta Sans",sans-serif' },
  { id: 'craft', name: 'Warm Craft', d: '"Bricolage Grotesque",sans-serif', b: '"Karla",sans-serif' },
]

export const THEME_PRESETS = [
  { id: 'bazaar', name: 'Bazaar Pop', primary: '#16110D', accent: '#FF8A1E', bg: '#FBF6EE', radius: 18, dark: false, fontPair: 'pop' },
  { id: 'noor', name: 'Noor Luxe', primary: '#3B2A5A', accent: '#C9A227', bg: '#FAF6F0', radius: 10, dark: false, fontPair: 'noor' },
  { id: 'neon', name: 'Neon Chaupar', primary: '#00E0C6', accent: '#FF3D7A', bg: '#0E1420', radius: 20, dark: true, fontPair: 'neon' },
  { id: 'gharana', name: 'Gharana Green', primary: '#1F3D2B', accent: '#E4A11B', bg: '#F7F3EA', radius: 14, dark: false, fontPair: 'craft' },
  { id: 'mint', name: 'Mint Minimal', primary: '#14312C', accent: '#0FA79B', bg: '#F6FAF9', radius: 22, dark: false, fontPair: 'studio' },
  { id: 'midnight', name: 'Midnight Rose', primary: '#FF2E6E', accent: '#F5B301', bg: '#141019', radius: 16, dark: true, fontPair: 'luxe' },
]

export const ORDER_STEPS = ['Order placed', 'Packed by store', 'Shipped', 'Out for delivery', 'Delivered']

const IMG = (n) => './images/' + n

/* ---------------- seed ---------------- */
function seed() {
  const users = [
    { id: 'u-admin', name: 'Bazar Admin', email: 'admin@streetbazar.pk', role: 'admin', avatar: '' },
    { id: 'u-hassan', name: 'Hassan Raza', email: 'hassan@demo.pk', role: 'owner', avatar: '' },
    { id: 'u-sana', name: 'Sana Iqbal', email: 'sana@demo.pk', role: 'owner', avatar: '' },
    { id: 'u-bilal', name: 'Bilal Ahmed', email: 'bilal@demo.pk', role: 'owner', avatar: '' },
    { id: 'u-mariam', name: 'Mariam Noor', email: 'mariam@demo.pk', role: 'owner', avatar: '' },
    { id: 'u-ali', name: 'Ali Customer', email: 'ali@demo.pk', role: 'customer', avatar: '' },
    { id: 'u-zoya', name: 'Zoya Malik', email: 'zoya@demo.pk', role: 'customer', avatar: '' },
  ]

  const stores = [
    {
      id: 's-urban', owner: 'u-hassan', name: 'Urban Roots', slug: 'urban-roots',
      tagline: 'Premium everyday fashion & casual wear',
      type: 'online', city: 'Lahore', address: 'Gulberg III, Lahore',
      description: 'Trendy cotton wear, oversized tees, and premium backpacks designed for daily hustle.',
      logo: '', banner: IMG('banner-fashion.png'),
      theme: { ...THEME_PRESETS[0] },
      categories: ['Fashion'],
      socials: { instagram: 'https://instagram.com/urbanroots' },
      sale: null, status: 'live', rating: 4.8, followers: 12400, createdAt: now - 180 * DAY,
    },
    {
      id: 's-tech', owner: 'u-sana', name: 'Tech Haven', slug: 'tech-haven',
      tagline: 'Next-gen audio gear & smart accessories',
      type: 'online', city: 'Karachi', address: 'Clifton, Karachi',
      description: 'High performance wireless audio and tech gear with official warranty.',
      logo: '', banner: IMG('banner-tech.png'),
      theme: { ...THEME_PRESETS[2] },
      categories: ['Electronics', 'Mobile Accessories'],
      socials: { instagram: 'https://instagram.com/techhaven' },
      sale: null, status: 'live', rating: 4.7, followers: 8700, createdAt: now - 150 * DAY,
    },
    {
      id: 's-homenest', owner: 'u-bilal', name: 'Home Nest', slug: 'home-nest',
      tagline: 'Minimalist home decor & artisanal lighting',
      type: 'physical', city: 'Islamabad', address: 'F-7 Markaz, Islamabad',
      description: 'Elegant home lighting, lamps, and cozy interior accessories.',
      logo: '', banner: IMG('p-chai.png'),
      theme: { ...THEME_PRESETS[3] },
      categories: ['Home & Kitchen'],
      socials: { instagram: 'https://instagram.com/homenest' },
      sale: null, status: 'live', rating: 4.6, followers: 9300, createdAt: now - 120 * DAY,
    },
    {
      id: 's-beautyglow', owner: 'u-mariam', name: 'Beauty Glow', slug: 'beauty-glow',
      tagline: 'Organic skincare & radiant beauty solutions',
      type: 'home', city: 'Lahore', address: 'DHA Phase 5, Lahore',
      description: 'Dermatologist tested natural serums, botanical oils, and glowing skincare.',
      logo: '', banner: IMG('p-cover.png'),
      theme: { ...THEME_PRESETS[4] },
      categories: ['Beauty & Care', 'Health & Wellness'],
      socials: { instagram: 'https://instagram.com/beautyglow' },
      sale: null, status: 'live', rating: 4.9, followers: 15600, createdAt: now - 200 * DAY,
    },
    {
      id: 's-sportsarena', owner: 'u-hassan', name: 'Sports Arena', slug: 'sports-arena',
      tagline: 'Performance activewear & athletic sneakers',
      type: 'online', city: 'Karachi', address: 'PECHS, Karachi',
      description: 'Durable activewear, lightweight running shoes, and sports gear.',
      logo: '', banner: IMG('p-sneakers.png'),
      theme: { ...THEME_PRESETS[5] },
      categories: ['Footwear', 'Sports & Outdoors'],
      socials: { instagram: 'https://instagram.com/sportsarena' },
      sale: null, status: 'live', rating: 4.6, followers: 6200, createdAt: now - 90 * DAY,
    },
    {
      id: 's-noor', owner: 'u-hassan', name: 'Noor Attire', slug: 'noor-attire',
      tagline: 'Handmade lawn, kurta aur jhumka — Lahore se seedha aap tak',
      type: 'home', city: 'Lahore', address: 'Model Town Link Road, Lahore',
      description: 'Hum ghar par block-print aur hand-embroidery karte hain. Chhoti team, puri mehnat — har piece packing se pehle check hota hai. Boutiques ke liye wholesale bhi available.',
      logo: '', banner: IMG('banner-fashion.png'),
      theme: { ...THEME_PRESETS[0] },
      categories: ['Fashion', 'Handicraft', 'Jewelry'],
      socials: { instagram: 'https://instagram.com/noorattire', whatsapp: 'https://wa.me/923001234567', tiktok: '', facebook: '' },
      sale: { text: 'Mid-Season Sale — 25% OFF on lawn', until: now + 5 * DAY },
      status: 'live', rating: 4.8, followers: 1240, createdAt: now - 210 * DAY,
    },
    {
      id: 's-chaupar', owner: 'u-sana', name: 'Chaupar Tech', slug: 'chaupar-tech',
      tagline: 'Gadgets, covers aur accessories — 12 months warranty',
      type: 'online', city: 'Karachi', address: 'Online brand · HQ Karachi',
      description: 'Pakistan ki apni tech label. Custom phone covers, earbuds aur accessories with official warranty aur same-day dispatch in Karachi & Lahore.',
      logo: '', banner: IMG('banner-tech.png'),
      theme: { ...THEME_PRESETS[2] },
      categories: ['Electronics', 'Mobile Accessories'],
      socials: { instagram: 'https://instagram.com/chaupartech', tiktok: 'https://tiktok.com/@chaupartech', whatsapp: 'https://wa.me/923331234567', youtube: '' },
      sale: null,
      status: 'live', rating: 4.6, followers: 3820, createdAt: now - 160 * DAY,
    },
    {
      id: 's-ghar', owner: 'u-bilal', name: 'Ghar Ka Kitchen', slug: 'ghar-ka-kitchen',
      tagline: 'Ghar jaisa khana, brass ware aur namkeen — Islamabad',
      type: 'physical', city: 'Islamabad', address: 'Shop 14, Blue Area, Islamabad',
      description: 'Family kitchen se nikla business. Roz ki taaza namkeen, chai setup aur hand-beaten brass ware. Dukan par aakar chakh kar lein ya delivery karwayein.',
      logo: '', banner: IMG('p-chai.png'),
      theme: { ...THEME_PRESETS[3] },
      categories: ['Food & Groceries', 'Home & Kitchen'],
      socials: { instagram: '', whatsapp: 'https://wa.me/923451234567', facebook: 'https://facebook.com/gharkakitchen' },
      sale: { text: 'Namkeen Week — Buy 2 Get 1 Free', until: now + 2 * DAY },
      status: 'live', rating: 4.9, followers: 640, createdAt: now - 95 * DAY,
    },
    {
      id: 's-gully', owner: 'u-hassan', name: 'Gully Lab', slug: 'gully-lab',
      tagline: 'Streetwear drops every month — sizes for everyone',
      type: 'online', city: 'Karachi', address: 'Studio 3, Saddar, Karachi',
      description: 'Street culture se inspire hoodies, sneakers aur limited drops. Har month ek naya drop. Apna design print karwa bhi sakte hain.',
      logo: '', banner: IMG('p-sneakers.png'),
      theme: { ...THEME_PRESETS[5] },
      categories: ['Fashion', 'Footwear'],
      socials: { instagram: 'https://instagram.com/gullylab', tiktok: '', youtube: '' },
      sale: null,
      status: 'live', rating: 4.7, followers: 2110, createdAt: now - 60 * DAY,
    },
    {
      id: 's-rangrez', owner: 'u-mariam', name: 'Rangrez Prints', slug: 'rangrez-prints',
      tagline: 'Custom t-shirts, mugs aur gifting',
      type: 'home', city: 'Faisalabad', address: 'Jhang Road, Faisalabad',
      description: 'Custom printed gifts — aapki photo, aapka design, humari printing.',
      logo: '', banner: IMG('banner-fashion.png'),
      theme: { ...THEME_PRESETS[4] },
      categories: ['Fashion', 'Handicraft'],
      socials: { instagram: '', whatsapp: '' }, sale: null,
      status: 'pending', rating: 0, followers: 0, createdAt: now - 1 * DAY,
    },
    {
      id: 's-sooji', owner: 'u-bilal', name: 'Sooji & Co.', slug: 'sooji-co',
      tagline: 'Fresh bakes daily from our home oven',
      type: 'home', city: 'Islamabad', address: 'G-11, Islamabad',
      description: 'Cookie, cake rolls aur brownies — order se pehle bake hote hain.',
      logo: '', banner: IMG('p-snacks.png'),
      theme: { ...THEME_PRESETS[0] },
      categories: ['Food & Groceries'],
      socials: {}, sale: null,
      status: 'pending', rating: 0, followers: 0, createdAt: now - 6 * 3600000,
    },
    {
      id: 's-fake', owner: 'u-mariam', name: 'Mega Sneaker Deals', slug: 'mega-sneaker-deals',
      tagline: '70% off branded sneakers',
      type: 'online', city: 'Karachi', address: '',
      description: 'Too-good-to-be-true pricing with no verifiable contact details.',
      logo: '', banner: IMG('p-sneakers.png'),
      theme: { ...THEME_PRESETS[2] }, categories: ['Footwear'], socials: {}, sale: null,
      status: 'rejected', rating: 0, followers: 0, createdAt: now - 3 * DAY,
    },
  ]

  const products = [
    {
      id: 'p-tshirt', store: 's-urban',
      title: 'Oversized Cotton T-Shirt',
      description: '100% combed cotton, breathable relaxed fit for urban wear.',
      price: 699, compareAt: 999, media: [{ type: 'image', url: IMG('p-kurta.png') }],
      categories: ['Fashion'], tags: ['t-shirt', 'cotton', 'oversized'],
      stock: 120, sku: 'UR-TSH-01', sales: 230, rating: 4.8,
      customizable: { on: true, options: [{ name: 'Size', choices: [{ label: 'S', delta: 0 }, { label: 'M', delta: 0 }, { label: 'L', delta: 0 }] }] },
      wholesale: { on: true, tiers: [{ qty: 10, price: 499 }, { qty: 50, price: 399 }] },
      createdAt: now - 10 * DAY, status: 'active',
    },
    {
      id: 'p-earbuds-pro', store: 's-tech',
      title: 'Wireless Earbuds Pro',
      description: 'Active Noise Cancellation, 30h total battery and HD mic.',
      price: 2499, compareAt: 3499, media: [{ type: 'image', url: IMG('p-earbuds.png') }],
      categories: ['Electronics', 'Mobile Accessories'], tags: ['earbuds', 'wireless', 'audio'],
      stock: 85, sku: 'TH-EBD-02', sales: 180, rating: 4.6,
      customizable: { on: false, options: [] },
      wholesale: { on: true, tiers: [{ qty: 10, price: 1899 }, { qty: 30, price: 1699 }] },
      createdAt: now - 14 * DAY, status: 'active',
    },
    {
      id: 'p-table-lamp', store: 's-homenest',
      title: 'Minimal Table Lamp',
      description: 'Warm LED ambient lighting with handcrafted ceramic base.',
      price: 1299, compareAt: 1799, media: [{ type: 'image', url: IMG('p-chai.png') }],
      categories: ['Home & Kitchen'], tags: ['lamp', 'decor', 'lighting'],
      stock: 45, sku: 'HN-LMP-01', sales: 120, rating: 4.7,
      customizable: { on: false, options: [] },
      wholesale: { on: true, tiers: [{ qty: 5, price: 999 }, { qty: 20, price: 849 }] },
      createdAt: now - 22 * DAY, status: 'active',
    },
    {
      id: 'p-serum', store: 's-beautyglow',
      title: 'Vitamin C Face Serum',
      description: 'Pure 15% L-Ascorbic Acid formula for bright glowing skin.',
      price: 899, compareAt: 1299, media: [{ type: 'image', url: IMG('banner-tech.png') }],
      categories: ['Beauty & Care', 'Health & Wellness'], tags: ['serum', 'skincare', 'glowing'],
      stock: 150, sku: 'BG-SRM-01', sales: 310, rating: 4.9,
      customizable: { on: false, options: [] },
      wholesale: { on: true, tiers: [{ qty: 12, price: 649 }, { qty: 40, price: 549 }] },
      createdAt: now - 5 * DAY, status: 'active',
    },
    {
      id: 'p-running-shoes', store: 's-sportsarena',
      title: 'Running Shoes',
      description: 'Ultra-lightweight mesh upper with responsive foam cushioning.',
      price: 3199, compareAt: 4299, media: [{ type: 'image', url: IMG('p-sneakers.png') }],
      categories: ['Footwear', 'Sports & Outdoors'], tags: ['shoes', 'running', 'sports'],
      stock: 60, sku: 'SA-SHS-01', sales: 160, rating: 4.6,
      customizable: { on: true, options: [{ name: 'Size', choices: [{ label: '40', delta: 0 }, { label: '42', delta: 0 }, { label: '44', delta: 0 }] }] },
      wholesale: { on: true, tiers: [{ qty: 8, price: 2499 }, { qty: 25, price: 2199 }] },
      createdAt: now - 8 * DAY, status: 'active',
    },
    {
      id: 'p-backpack', store: 's-urban',
      title: 'Travel Backpack',
      description: 'Water-resistant multi-pocket design with 15.6 inch laptop sleeve.',
      price: 1799, compareAt: 2499, media: [{ type: 'image', url: IMG('p-hoodie.png') }],
      categories: ['Fashion'], tags: ['backpack', 'travel', 'laptop'],
      stock: 90, sku: 'UR-BAK-01', sales: 140, rating: 4.7,
      customizable: { on: false, options: [] },
      wholesale: { on: true, tiers: [{ qty: 10, price: 1399 }, { qty: 30, price: 1199 }] },
      createdAt: now - 15 * DAY, status: 'active',
    },
    {
      id: 'p-kurta', store: 's-noor',
      title: 'Zari Hand-Embroidered Kurta',
      description: 'Bilkul naya, bilkul aap jaisa — hand-embroidered zari kurta jo Lahore ki galiyon se seedha aapke wardrobe tak.\n\n• Pure lawn base with hand-run zari work\n• Stitched in our home studio, checked twice before packing\n• Colour-fast dye, soft on skin\n• Delivery 2–5 working days all over Pakistan',
      price: 4500, compareAt: 5900, media: [{ type: 'image', url: IMG('p-kurta.png') }, { type: 'image', url: IMG('banner-fashion.png') }],
      categories: ['Fashion'], tags: ['kurta', 'embroidered', 'lawn', 'handmade', 'zari'],
      stock: 42, sku: 'NA-KUR-01', sales: 128, rating: 4.9,
      customizable: { on: true, options: [
        { name: 'Size', choices: [{ label: 'S', delta: 0 }, { label: 'M', delta: 0 }, { label: 'L', delta: 0 }, { label: 'XL', delta: 300 }] },
        { name: 'Fabric', choices: [{ label: 'Lawn', delta: 0 }, { label: 'Khaddar', delta: 500 }, { label: 'Silk', delta: 1200 }] },
        { name: 'Embroidery', choices: [{ label: 'Basic', delta: 0 }, { label: 'Heavy', delta: 800 }] },
      ] },
      wholesale: { on: true, tiers: [{ qty: 12, price: 3600 }, { qty: 50, price: 3150 }] },
      createdAt: now - 30 * DAY, status: 'active',
    },
    {
      id: 'p-fabric', store: 's-noor',
      title: 'Hand-Block Lawn Bundle (2.5m)',
      description: 'Roz ki nayi jodi — 2.5 metre hand-block printed lawn, complete suit ke liye kaafi.\n\n• 2.5m shirt + 2.5m dupatta piece\n• Natural dyes, soft finish\n• Boutiques ke liye wholesale rates available',
      price: 1900, compareAt: 2400, media: [{ type: 'image', url: IMG('banner-fashion.png') }],
      categories: ['Fashion', 'Handicraft'], tags: ['lawn', 'block print', 'fabric', 'suit'],
      stock: 60, sku: 'NA-FAB-04', sales: 74, rating: 4.6,
      customizable: { on: true, options: [{ name: 'Print', choices: [{ label: 'Floral', delta: 0 }, { label: 'Geometric', delta: 0 }, { label: 'Buti', delta: 150 }] }] },
      wholesale: { on: true, tiers: [{ qty: 20, price: 1550 }] },
      createdAt: now - 18 * DAY, status: 'active',
    },
    {
      id: 'p-jhumka', store: 's-noor',
      title: 'Zari Silver-Tone Jhumka',
      description: 'Feather-light jhumka jo poora din chale bina bore kare.\n\n• Anti-tarnish silver tone\n• Traditional shape, modern weight\n• Gift box included',
      price: 1250, compareAt: null, media: [{ type: 'image', url: IMG('p-jhumka.png') }],
      categories: ['Jewelry'], tags: ['jhumka', 'silver', 'traditional'],
      stock: 88, sku: 'NA-JHM-02', sales: 210, rating: 4.7,
      customizable: { on: false, options: [] }, wholesale: { on: false, tiers: [] },
      createdAt: now - 45 * DAY, status: 'active',
    },
    {
      id: 'p-cover', store: 's-chaupar',
      title: 'AuraGrip Custom Phone Cover',
      description: 'Apna design, apni photo, apna naam — AuraGrip cover 5 layer protection ke sath.\n\n• Matte / glossy / clear finish choice\n• Shockproof edges, camera lip protection\n• Custom print in 24 hours\n• All major models supported',
      price: 1450, compareAt: 1900, media: [{ type: 'image', url: IMG('p-cover.png') }],
      categories: ['Mobile Accessories'], tags: ['cover', 'custom', 'phone', 'print'],
      stock: 210, sku: 'CT-CVR-11', sales: 640, rating: 4.8,
      customizable: { on: true, options: [
        { name: 'Model', choices: [{ label: 'iPhone 15', delta: 0 }, { label: 'iPhone 14', delta: 0 }, { label: 'Samsung S24', delta: 0 }, { label: 'Redmi Note 13', delta: 0 }] },
        { name: 'Finish', choices: [{ label: 'Matte', delta: 0 }, { label: 'Glossy', delta: 100 }, { label: 'Clear', delta: 0 }] },
      ] },
      wholesale: { on: true, tiers: [{ qty: 25, price: 1090 }, { qty: 100, price: 890 }] },
      createdAt: now - 12 * DAY, status: 'active',
    },
    {
      id: 'p-earbuds', store: 's-chaupar',
      title: 'Nitro Pod Pro Earbuds',
      description: '40h battery, ANC aur low-latency gaming mode — Nitro Pod Pro aapki roz ki soundtrack.\n\n• Hybrid ANC up to 32dB\n• 8mm drivers, punchy bass\n• IPX5 sweat proof\n• 12 months warranty',
      price: 4900, compareAt: 6500, media: [{ type: 'image', url: IMG('p-earbuds.png') }],
      categories: ['Electronics', 'Mobile Accessories'], tags: ['earbuds', 'anc', 'wireless', 'audio'],
      stock: 76, sku: 'CT-EBD-07', sales: 322, rating: 4.5,
      customizable: { on: false, options: [] }, wholesale: { on: true, tiers: [{ qty: 20, price: 4100 }] },
      createdAt: now - 5 * DAY, status: 'active',
    },
    {
      id: 'p-chai', store: 's-ghar',
      title: 'Hand-Beaten Brass Chai Kettle Set',
      description: 'Chai ka asli maza brass mein — hand-beaten kettle + 2 glass cups.\n\n• Food-safe inner coating\n• Works on gas & electric stove\n• Keeps chai garam 45 minutes\n• Hand wash recommended',
      price: 3200, compareAt: null, media: [{ type: 'image', url: IMG('p-chai.png') }],
      categories: ['Home & Kitchen'], tags: ['brass', 'chai', 'kettle', 'handmade'],
      stock: 18, sku: 'GK-CHI-03', sales: 56, rating: 4.9,
      customizable: { on: false, options: [] }, wholesale: { on: false, tiers: [] },
      createdAt: now - 26 * DAY, status: 'active',
    },
    {
      id: 'p-snacks', store: 's-ghar',
      title: 'Desi Namkeen Party Box (1kg)',
      description: 'Roz taaza banne wali namkeen — mixture, aloo bukhara aur khasta. Mehmaan aa jayein toh sab tayyar.\n\n• No preservatives\n• Packed fresh on dispatch day\n• Resealable box\n• Best within 10 days',
      price: 1150, compareAt: 1400, media: [{ type: 'image', url: IMG('p-snacks.png') }],
      categories: ['Food & Groceries'], tags: ['namkeen', 'snacks', 'fresh', 'party'],
      stock: 5, sku: 'GK-NMK-01', sales: 189, rating: 4.8,
      customizable: { on: false, options: [] }, wholesale: { on: true, tiers: [{ qty: 15, price: 940 }] },
      createdAt: now - 2 * DAY, status: 'active',
    },
    {
      id: 'p-hoodie', store: 's-gully',
      title: 'Gully Oversized Hoodie',
      description: 'Heavyweight 380 GSM hoodie, boxy fit — sardi ka sabse comfortable layer.\n\n• 380 GSM brushed fleece\n• Pre-shrunk, colour-locked\n• Kangaroo pocket, ribbed cuffs\n• Custom text print available',
      price: 3600, compareAt: 4200, media: [{ type: 'image', url: IMG('p-hoodie.png') }],
      categories: ['Fashion'], tags: ['hoodie', 'streetwear', 'oversized', 'winter'],
      stock: 34, sku: 'GL-HOD-05', sales: 96, rating: 4.6,
      customizable: { on: true, options: [
        { name: 'Size', choices: [{ label: 'M', delta: 0 }, { label: 'L', delta: 0 }, { label: 'XL', delta: 200 }] },
        { name: 'Colour', choices: [{ label: 'Jet Black', delta: 0 }, { label: 'Bone', delta: 0 }, { label: 'Maroon', delta: 0 }] },
      ] },
      wholesale: { on: true, tiers: [{ qty: 10, price: 2950 }] },
      createdAt: now - 8 * DAY, status: 'active',
    },
    {
      id: 'p-sneakers', store: 's-gully',
      title: 'VoltRun Street Sneakers',
      description: 'Bounce-back sole, breathable mesh — poore din bhaag ke lie bhi tayyar.\n\n• EVA cushioned midsole\n• Non-slip rubber outsole\n• EU 39–46 available\n• 7-day size exchange',
      price: 5900, compareAt: 7200, media: [{ type: 'image', url: IMG('p-sneakers.png') }],
      categories: ['Footwear'], tags: ['sneakers', 'running', 'street'],
      stock: 21, sku: 'GL-SNK-02', sales: 143, rating: 4.7,
      customizable: { on: true, options: [{ name: 'Size', choices: [{ label: '40', delta: 0 }, { label: '42', delta: 0 }, { label: '44', delta: 0 }, { label: '46', delta: 0 }] }] },
      wholesale: { on: true, tiers: [{ qty: 12, price: 4750 }, { qty: 40, price: 4200 }] },
      createdAt: now - 20 * DAY, status: 'active',
    },
  ]

  const reviews = [
    { id: 'r-1', product: 'p-kurta', store: 's-noor', user: 'u-ali', userName: 'Ali Customer', rating: 5, text: 'Kurta exactly jaisa picture mein tha. Stitching saaf aur zari ka kaam bahut nice. Next colour bhi order karunga.', at: now - 6 * DAY },
    { id: 'r-2', product: 'p-kurta', store: 's-noor', user: 'u-zoya', userName: 'Zoya Malik', rating: 4, text: 'Quality achi hai, delivery 1 din late hui but owner ne update diya. Overall happy.', at: now - 14 * DAY },
    { id: 'r-3', product: 'p-cover', store: 's-chaupar', user: 'u-ali', userName: 'Ali Customer', rating: 5, text: 'Custom print crisp aaya, edges soft hain. Payment se 24 ghante mein deliver.', at: now - 4 * DAY },
    { id: 'r-4', product: 'p-earbuds', store: 's-chaupar', user: 'u-zoya', userName: 'Zoya Malik', rating: 4, text: 'Bass zabardast, ANC office ki shor door kar deta hai. Case thoda mota hai but battery solid.', at: now - 9 * DAY },
    { id: 'r-5', product: 'p-chai', store: 's-ghar', user: 'u-ali', userName: 'Ali Customer', rating: 5, text: 'Brass ka weight asli hai, chai lambi der garam rehti hai. Gift karne ke liye best.', at: now - 11 * DAY },
    { id: 'r-6', product: 'p-sneakers', store: 's-gully', user: 'u-zoya', userName: 'Zoya Malik', rating: 5, text: 'Size guide accurate tha, sole bouncy. Roz ki walk mein best.', at: now - 3 * DAY },
    { id: 'r-7', product: 'p-hoodie', store: 's-gully', user: 'u-ali', userName: 'Ali Customer', rating: 4, text: 'Fabric mota aur soft. Thoda lamba hai oversized ki wajah se, style waise hi hai.', at: now - 2 * DAY },
    { id: 'r-8', product: 'p-snacks', store: 's-ghar', user: 'u-ali', userName: 'Ali Customer', rating: 5, text: 'Taaza thi, khasta bilkul ghar jaisa. Logo ne kaha agla order 5 kg ka dein.', at: now - 1 * DAY },
  ]

  const orders = [
    {
      id: 'SB-4F2K9X', user: 'u-ali',
      items: [{ product: 'p-kurta', store: 's-noor', title: 'Zari Hand-Embroidered Kurta', price: 5000, qty: 1, options: { Size: 'L', Fabric: 'Silk', Embroidery: 'Basic' }, image: IMG('p-kurta.png') }],
      total: 5000, status: 2,
      timeline: [
        { step: 0, at: now - 2 * DAY, note: 'Order confirm — payment on delivery' },
        { step: 1, at: now - 30 * 3600000, note: 'Noor Attire ne pack kar diya' },
        { step: 2, at: now - 8 * 3600000, note: 'TCS 77123456 — Lahore se dispatch' },
      ],
      etaDays: 3, address: { name: 'Ali Customer', line: 'House 21, Street 4, Gulberg III, Lahore', phone: '+92 300 1112223' },
      stores: ['s-noor'], createdAt: now - 2 * DAY,
    },
    {
      id: 'SB-9J7M2Q', user: 'u-ali',
      items: [{ product: 'p-earbuds', store: 's-chaupar', title: 'Nitro Pod Pro Earbuds', price: 4900, qty: 1, options: {}, image: IMG('p-earbuds.png') }],
      total: 4900, status: 4,
      timeline: ORDER_STEPS.map((s, i) => ({ step: i, at: now - (20 - i * 3) * DAY, note: i === 4 ? 'Delivered — received by Ali' : s + ' ✓' })),
      etaDays: 0, address: { name: 'Ali Customer', line: 'House 21, Street 4, Gulberg III, Lahore', phone: '+92 300 1112223' },
      stores: ['s-chaupar'], createdAt: now - 20 * DAY,
    },
    {
      id: 'SB-2H8D4L', user: 'u-zoya',
      items: [{ product: 'p-sneakers', store: 's-gully', title: 'VoltRun Street Sneakers', price: 5900, qty: 1, options: { Size: '42' }, image: IMG('p-sneakers.png') }],
      total: 5900, status: 3,
      timeline: ORDER_STEPS.slice(0, 4).map((s, i) => ({ step: i, at: now - (4 - i) * DAY, note: s })),
      etaDays: 1, address: { name: 'Zoya Malik', line: 'Flat 6B, Clifton Block 4, Karachi', phone: '+92 333 4445556' },
      stores: ['s-gully'], createdAt: now - 4 * DAY,
    },
  ]

  const threads = [
    { id: 't-1', product: 'p-kurta', store: 's-noor', customer: 'u-ali', read: false, messages: [
      { from: 'u-ali', text: 'Salam! Ye kurta XL mein hai ya sirf stitched size available hai?', at: now - 5 * 3600000 },
      { from: 'u-hassan', text: 'Walaikum salam! XL available hai aur aap custom length bhi karwa sakte hain. Chest measurement bata dein.', at: now - 4 * 3600000 },
    ] },
    { id: 't-2', product: 'p-cover', store: 's-chaupar', customer: 'u-ali', read: true, messages: [
      { from: 'u-ali', text: 'Mera model Redmi Note 13 supported hai?', at: now - 26 * 3600000 },
      { from: 'ai', text: 'Ji bilkul — Redmi Note 13 available hai (Matte / Glossy / Clear). Custom print sirf 24 ghante mein ready hota hai, delivery 2–5 din.', at: now - 26 * 3600000 + 40000 },
    ] },
  ]

  const follows = [
    { id: 'f-1', user: 'u-ali', store: 's-noor', at: now - 40 * DAY },
    { id: 'f-2', user: 'u-ali', store: 's-chaupar', at: now - 30 * DAY },
    { id: 'f-3', user: 'u-ali', store: 's-gully', at: now - 2 * DAY },
    { id: 'f-4', user: 'u-zoya', store: 's-gully', at: now - 12 * DAY },
  ]

  const likes = [{ id: 'l-1', user: 'u-ali', product: 'p-chai' }]

  stores.forEach((store) => { store.demo = true })
  products.forEach((product) => { product.demo = true })
  return {
    version: 1, isDemo: true, users, stores, products, reviews, orders, follows, threads, likes, warehouse: [],
    cart: [], notifications: [
      { id: 'n-1', to: 'u-ali', title: 'Gully Lab added a new drop', body: 'Gully Oversized Hoodie ab live hai.', at: now - 8 * 3600000, read: false, link: '#/product/p-hoodie' },
      { id: 'n-2', to: 'u-ali', title: 'Order SB-4F2K9X shipped', body: 'Noor Attire ne order dispatch kar diya hai.', at: now - 8 * 3600000, read: false, link: '#/track/SB-4F2K9X' },
    ],
    aiLog: [{ id: 'a-1', kind: 'description', user: 'u-hassan', at: now - 3 * DAY, label: 'Zari Hand-Embroidered Kurta' }],
    settings: {
      supabase: { url: '', key: '' },
      ai: { key: '', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
      brand: { name: 'Street Bazar', tagline: 'Har gali ka apna bazaar' },
      lastSync: null,
    },
  }
}

/* ---------------- persistence ---------------- */
export let state = load()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === 1) return parsed
    }
  } catch { /* corrupted storage — fall through to seed */ }
  const fresh = seed()
  try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch { /* ignore quota */ }
  return fresh
}

export function save() {
  try {   localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('street-bazar-state-changed')) } catch { /* ignore quota */ }
}
export function resetDemo() { state = seed(); save() }

/* ---------------- selectors ---------------- */
export const userById = (id) => state.users.find((u) => u.id === id) || null
export const currentUser = () => (state.session ? userById(state.session) : null)
export const productById = (id) => state.products.find((p) => p.id === id) || null
export const storeById = (id) => state.stores.find((s) => s.id === id) || null
export const storeBySlug = (s) => state.stores.find((x) => x.slug === s) || null
export const storeOf = (p) => storeById(p?.store)
// Stores remain discoverable while awaiting review; only explicitly hidden or rejected stores stay private.
export const liveStores = () => state.stores.filter((s) => s.status !== 'hidden' && s.status !== 'rejected')
export const storeProducts = (id) => state.products.filter((p) => p.store === id && p.status !== 'hidden')
export const myStores = () => { const u = currentUser(); return u ? state.stores.filter((s) => s.owner === u.id) : [] }
export const isFollowing = (id) => state.follows.some((f) => f.user === state.session && f.store === id)
export const followedStores = () => { const u = currentUser(); return u ? state.follows.filter((f) => f.user === u.id).map((f) => storeById(f.store)).filter(Boolean) : [] }
export const likedProducts = () => state.likes.filter((l) => l.user === state.session).map((l) => l.product)
export const productReviews = (pid) => state.reviews.filter((r) => r.product === pid).sort((a, b) => b.at - a.at)
export const storeReviews = (sid) => state.reviews.filter((r) => r.store === sid).sort((a, b) => b.at - a.at)
export const storeSales = (sid) => storeProducts(sid).reduce((a, p) => a + (p.sales || 0), 0)
export const storeRevenue = (sid) => storeProducts(sid).reduce((a, p) => a + (p.sales || 0) * (p.price || 0), 0)
export const myOrders = () => { const u = currentUser(); return u ? state.orders.filter((o) => o.user === u.id).sort((a, b) => b.createdAt - a.createdAt) : [] }
export const orderById = (id) => state.orders.find((o) => o.id.toUpperCase() === String(id || '').toUpperCase()) || null
export const storeOrders = (sid) => state.orders.filter((o) => o.stores?.includes(sid)).sort((a, b) => b.createdAt - a.createdAt)
export const cartCount = () => state.cart.reduce((a, i) => a + i.qty, 0)
export const cartTotal = () => state.cart.reduce((a, i) => a + i.unitPrice * i.qty, 0)
export const myNotifications = () => { const u = currentUser(); return u ? state.notifications.filter((n) => n.to === u.id).sort((a, b) => b.at - a.at) : [] }
export const unreadNotis = () => myNotifications().filter((n) => !n.read).length
export const storeThreads = (sid) => state.threads.filter((t) => t.store === sid).sort((a, b) => (b.messages.at(-1)?.at || 0) - (a.messages.at(-1)?.at || 0))
export const myThreads = () => { const u = currentUser(); return u ? state.threads.filter((t) => t.customer === u.id).sort((a, b) => (b.messages.at(-1)?.at || 0) - (a.messages.at(-1)?.at || 0)) : [] }
export const threadById = (id) => state.threads.find((t) => t.id === id) || null
export const newProductsFor = () => {
  const ids = followedStores().map((s) => s.id)
  return state.products.filter((p) => ids.includes(p.store) && p.status !== 'hidden').sort((a, b) => b.createdAt - a.createdAt)
}
export const saleStores = () => liveStores().filter((s) => s.sale && s.sale.until > Date.now())
export const pendingStores = () => state.stores.filter((s) => s.status === 'pending')
export const allCategories = () => {
  const custom = state.stores.flatMap((s) => s.categories || []).filter((c) => !CATEGORIES.includes(c))
  return [...CATEGORIES, ...[...new Set(custom)]]
}
export const lowStock = () => state.products.filter((p) => p.stock <= 8 && p.status !== 'hidden')

export function searchAll(q = '') {
  const s = q.toLowerCase().trim()
  if (!s) return { products: [], stores: [] }
  const products = state.products.filter((p) =>
    p.status !== 'hidden' && (p.title.toLowerCase().includes(s) || (p.tags || []).join(' ').toLowerCase().includes(s) || (p.categories || []).join(' ').toLowerCase().includes(s)))
  const stores = liveStores().filter((st) => (st.name + ' ' + st.tagline + ' ' + (st.categories || []).join(' ')).toLowerCase().includes(s))
  return { products, stores }
}

export function ratingOf(p) {
  if (p?.rating) return p.rating
  const rs = productReviews(p?.id)
  return rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0
}

export function recommendations(limit = 8) {
  const likedTags = new Set(state.products.filter((p) => likedProducts().includes(p.id)).flatMap((p) => p.tags || []))
  const scored = liveStores().flatMap((st) => storeProducts(st.id)).map((p) => {
    let score = 0
    score += (p.sales || 0) / 40
    score += ratingOf(p) * 1.6
    if ((p.tags || []).some((t) => likedTags.has(t))) score += 6
    if (likedProducts().includes(p.id)) score -= 100
    if (p.compareAt && p.compareAt > p.price) score += 2
    score -= (Date.now() - new Date(p.createdAt).getTime()) / DAY / 40
    return { p, score }
  }).sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.p)
}

/* ---------------- mutations ---------------- */
const moneyPlain = (n) => 'Rs ' + Number(n).toLocaleString('en-PK')

export function notify(to, title, body, link = '#/') {
  state.notifications.unshift({ id: uid('n'), to, title, body, link, at: Date.now(), read: false })
  save()
}

export function login(email, pass) {
  const u = state.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase().trim())
  if (!u) throw new Error('No account with this email. Sign up karein pehle.')
  if (!pass) throw new Error('Password required.')
  state.session = u.id; save(); return u
}
export function signup({ name, email, pass, role = 'customer' }) {
  if (state.users.some((x) => x.email.toLowerCase() === email.toLowerCase())) throw new Error('Ye email pehle se registered hai.')
  const u = { id: uid('u'), name, email, role, pass, avatar: '', createdAt: Date.now() }
  state.users.push(u); state.session = u.id; save(); return u
}
export function googleAuth() {
  let u = state.users.find((x) => x.email === 'you@gmail.com')
  if (!u) { u = { id: uid('u'), name: 'Google User', email: 'you@gmail.com', role: 'customer', pass: '', avatar: '', createdAt: Date.now() }; state.users.push(u) }
  state.session = u.id; save(); return u
}
export function logout() { state.session = null; save() }
export function setRole(role) {
  const u = currentUser(); if (!u) return
  u.role = role; save()
}

export function createStore(data) {
  const preset = THEME_PRESETS.find((t) => t.id === data.themeId) || THEME_PRESETS[0]
  const store = {
    id: uid('s'), owner: state.session, name: data.name, slug: slugify(data.name) + '-' + Math.random().toString(36).slice(2, 5),
    tagline: data.tagline || '', type: data.type, city: data.city || '', address: data.address || '',
    description: data.description || '', logo: data.logo || '', banner: data.banner || '',
    theme: { ...preset, ...(data.theme || {}) }, categories: data.categories || [], socials: data.socials || {},
    sale: data.sale && data.sale.text ? data.sale : null, status: 'pending', rating: 0, followers: 0, createdAt: Date.now(),
  }
  state.stores.unshift(store)
  const u = currentUser(); if (u && u.role === 'customer') u.role = 'owner'
  save(); return store
}
export function updateStore(id, data) {
  const s = storeById(id); if (!s) return null
  Object.assign(s, data)
  if (data.themeId) { const t = THEME_PRESETS.find((x) => x.id === data.themeId); if (t) s.theme = { ...t, ...(data.theme || {}) } }
  save(); return s
}

export function deleteStore(id) {
  const store = storeById(id)
  if (!store) return false
  const productIds = new Set(state.products.filter((p) => p.store === id).map((p) => p.id))
  state.stores = state.stores.filter((s) => s.id !== id)
  state.products = state.products.filter((p) => p.store !== id)
  state.reviews = state.reviews.filter((r) => r.store !== id && !productIds.has(r.product))
  state.follows = state.follows.filter((f) => f.store !== id)
  state.threads = state.threads.filter((t) => t.store !== id)
  state.warehouse = (state.warehouse || []).filter((item) => !item.product || !productIds.has(item.product))
  save()
  return true
}

export function createProduct(data) {
  const p = {
    id: uid('p'), store: data.store, title: data.title, description: data.description || '',
    price: Number(data.price) || 0, compareAt: Number(data.compareAt) || null,
    media: data.media?.length ? data.media : [{ type: 'image', url: './images/p-kurta.png' }],
    categories: data.categories || [], tags: data.tags || [], stock: Number(data.stock) || 0,
    deliveryCharge: Number(data.deliveryCharge) || 0,
    sku: data.sku || '', customizable: data.customizable || { on: false, options: [] },
    wholesale: data.wholesale || { on: false, tiers: [] }, sales: 0, rating: 0,
    createdAt: Date.now(), status: 'active',
  }
  state.products.unshift(p)
  const store = storeById(p.store)
  if (store?.owner) {
    state.warehouse = state.warehouse || []
    state.warehouse.unshift({ id: uid('w'), owner: store.owner, store: p.store, name: p.title, qty: p.stock, sku: p.sku, cost: 0, location: '', product: p.id, inventory: 'store', updatedAt: Date.now() })
  }
  save()
  return p
}
export function updateProduct(id, data) {
  const p = productById(id); if (!p) return null
  Object.assign(p, data); save(); return p
}
export function deleteProduct(id) {
  const product = productById(id)
  if (!product) return false
  state.products = state.products.filter((p) => p.id !== id)
  state.reviews = state.reviews.filter((r) => r.product !== id)
  state.threads = state.threads.filter((t) => t.product !== id)
  state.warehouse = (state.warehouse || []).filter((item) => item.product !== id)
  state.cart = (state.cart || []).filter((item) => item.product !== id)
  state.likes = (state.likes || []).filter((item) => item.product !== id)
  save()
  return true
}
export function deleteOrder(id) {
  const order = state.orders.find((o) => o.id === id)
  if (!order) return false
  state.orders = state.orders.filter((o) => o.id !== id)
  save()
  return true
}
export function addStock(pid, qty) {
  const p = productById(pid); if (!p) return
  p.stock = Math.max(0, (p.stock || 0) + Number(qty)); save()
  const linked = (state.warehouse || []).find((item) => item.product === pid)
  if (linked) { linked.qty = p.stock; linked.updatedAt = Date.now(); save() }
}

export function addWarehouseItem({ owner, store = null, name, qty = 0, sku = '', cost = 0, location = '', product = null, image = '', inventory = 'private' }) {
  const existing = (state.warehouse || []).find((entry) => entry.owner === owner && entry.store === store && entry.name.toLowerCase() === String(name).trim().toLowerCase() && entry.product === product)
  if (existing) return updateWarehouseItem(existing.id, { qty: existing.qty + Math.max(0, Number(qty) || 0), image: image || existing.image })
  const item = { id: uid('w'), owner, store, name: String(name).trim(), qty: Math.max(0, Number(qty) || 0), sku, cost: Number(cost) || 0, location, product, image, inventory, updatedAt: Date.now() }
  state.warehouse = state.warehouse || []
  state.warehouse.unshift(item)
  save()
  return item
}

export function updateWarehouseItem(id, data) {
  const item = (state.warehouse || []).find((entry) => entry.id === id)
  if (!item) return null
  Object.assign(item, data, { qty: Math.max(0, Number(data.qty ?? item.qty) || 0), updatedAt: Date.now() })
  if (item.product) {
    const product = productById(item.product)
    if (product) product.stock = item.qty
  }
  save()
  return item
}

export function deleteWarehouseItem(id) {
  const index = (state.warehouse || []).findIndex((entry) => entry.id === id)
  if (index < 0) return false
  state.warehouse.splice(index, 1)
  save()
  return true
}

export const ownerWarehouse = (owner = state.session) => (state.warehouse || []).filter((item) => item.owner === owner)

export function addReview({ product, store, rating, text }) {
  const u = currentUser(); if (!u) throw new Error('Review ke liye login karein')
  const r = { id: uid('r'), product, store, user: u.id, userName: u.name, rating: Number(rating), text, at: Date.now() }
  state.reviews.unshift(r)
  const p = productById(product)
  if (p) { const rs = productReviews(product); p.rating = rs.reduce((a, x) => a + x.rating, 0) / rs.length }
  save(); return r
}

export function toggleFollow(sid) {
  const u = currentUser(); if (!u) return null
  const i = state.follows.findIndex((f) => f.user === u.id && f.store === sid)
  const s = storeById(sid)
  if (i >= 0) { state.follows.splice(i, 1); if (s) s.followers = Math.max(0, (s.followers || 0) - 1); save(); return false }
  state.follows.push({ id: uid('f'), user: u.id, store: sid, at: Date.now() })
  if (s) { s.followers = (s.followers || 0) + 1; notify(s.owner, 'New follower 🎉', (u.name || 'Someone') + ' followed ' + s.name, '#/store/' + s.slug) }
  save(); return true
}

export function toggleLike(pid) {
  const u = currentUser(); if (!u) return null
  const i = state.likes.findIndex((l) => l.user === u.id && l.product === pid)
  if (i >= 0) { state.likes.splice(i, 1); save(); return false }
  state.likes.push({ id: uid('l'), user: u.id, product: pid }); save(); return true
}

export function addToCart({ product, qty = 1, options = {}, unitPrice, image = '', customizedImage = '' }) {
  const p = productById(product); if (!p) return
  const key = product + '|' + JSON.stringify(options)
  const found = state.cart.find((i) => i.key === key)
  if (found) found.qty += qty
  else state.cart.push({ key, product, store: p.store, title: p.title, image: image || p.media?.[0]?.url || '', customizedImage, qty, options, unitPrice: unitPrice ?? p.price })
  save()
}
export const setCart = (items) => { state.cart = items; save() }

export function orderIdGen() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'SB-' + s
}

export function placeOrder({ address, etaDays = 4 }) {
  if (!state.cart.length) throw new Error('Cart khaali hai')
  const u = currentUser(); if (!u) throw new Error('Order ke liye login zaroori hai')
  const id = orderIdGen()
  const stores = [...new Set(state.cart.map((i) => i.store))]
  const total = cartTotal()
  const order = {
    id, user: u.id, items: state.cart.map((i) => ({ ...i })), total, status: 0,
    timeline: [{ step: 0, at: Date.now(), note: 'Order placed · payment on delivery' }],
    etaDays, address, stores, createdAt: Date.now(),
  }
  state.orders.unshift(order)
  state.cart.forEach((i) => {
    const p = productById(i.product)
    if (p) {
      p.stock = Math.max(0, p.stock - i.qty)
      p.sales = (p.sales || 0) + i.qty
      const linked = (state.warehouse || []).find((item) => item.product === p.id)
      if (linked) { linked.qty = p.stock; linked.updatedAt = Date.now() }
    }
  })
  stores.forEach((sid) => { const s = storeById(sid); if (s) notify(s.owner, 'New order ' + id, u.name + ' ne ' + moneyPlain(total) + ' ka order kiya', '#/dashboard') })
  state.cart = []; save(); return order
}

export function advanceOrder(id) {
  const o = orderById(id); if (!o) return
  if (o.status >= ORDER_STEPS.length - 1) return
  o.status += 1
  o.timeline.push({ step: o.status, at: Date.now(), note: ORDER_STEPS[o.status] })
  if (o.status === 4) o.etaDays = 0
  notify(o.user, 'Order ' + o.id + ' · ' + ORDER_STEPS[o.status], 'Aapka order aage barh gaya hai.', '#/track/' + o.id)
  save()
}
export function cancelOrder(id, reason) {
  const order = orderById(id)
  if (!order || order.status >= 2 || order.status === 5) return null
  order.status = 5
  order.cancelReason = String(reason || 'Store could not fulfil this customized order').trim()
  order.timeline.push({ step: 5, at: Date.now(), note: 'Cancelled by store: ' + order.cancelReason })
  notify(order.user, 'Order ' + order.id + ' cancelled', order.cancelReason, '#/track/' + order.id)
  save()
  return order
}

export function sendMessage({ productId, storeId, from, text }) {
  let t = state.threads.find((x) => x.product === productId && x.store === storeId && x.customer === from)
  if (!t) { t = { id: uid('t'), product: productId, store: storeId, customer: from, read: false, messages: [] }; state.threads.unshift(t) }
  t.messages.push({ from, text, at: Date.now() })
  t.read = false
  save(); return t
}
export function markThreadRead(id) { const t = threadById(id); if (t) { t.read = true; save() } }
export function unreadThreadCount() {
  const u = currentUser(); if (!u) return 0
  const mine = myStores()
  const own = state.threads.filter((t) => mine.some((s) => s.id === t.store) && !t.read).length
  const cust = state.threads.filter((t) => t.customer === u.id && !t.read).length
  return own + cust
}

export function logAI(kind, label) {
  state.aiLog.unshift({ id: uid('a'), kind, user: state.session, at: Date.now(), label })
  state.aiLog = state.aiLog.slice(0, 300)
  save()
}

export function updateSettings(part) {
  state.settings = {
    ...state.settings, ...part,
    supabase: { ...state.settings.supabase, ...(part.supabase || {}) },
    ai: { ...state.settings.ai, ...(part.ai || {}) },
    brand: { ...state.settings.brand, ...(part.brand || {}) },
  }
  save(); return state.settings
}

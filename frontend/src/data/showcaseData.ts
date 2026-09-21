// Curated gallery of well-known live websites & applications used as design/build
// inspiration references. Screenshots are generated live from each URL, so they
// always reflect the current site. These are third-party public sites, shown as
// references — links open the real website in a new tab.

export interface ShowcaseSite {
  id: string;
  name: string;
  url: string;
  category: ShowcaseCategoryId;
  tagline: string;
  description: string;
  tags: string[];
}

export type ShowcaseCategoryId =
  | 'ai' | 'saas' | 'ecommerce' | 'fintech' | 'media'
  | 'design' | 'dev' | 'travel' | 'social' | 'education' | 'health' | 'food';

export interface ShowcaseCategory {
  id: ShowcaseCategoryId;
  name: string;
}

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  { id: 'ai', name: 'AI & Machine Learning' },
  { id: 'saas', name: 'SaaS & Productivity' },
  { id: 'ecommerce', name: 'E-commerce & Retail' },
  { id: 'fintech', name: 'Fintech & Banking' },
  { id: 'media', name: 'Media & Streaming' },
  { id: 'design', name: 'Design & Creative' },
  { id: 'dev', name: 'Developer Tools' },
  { id: 'travel', name: 'Travel & Hospitality' },
  { id: 'social', name: 'Social & Community' },
  { id: 'education', name: 'Education & Learning' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'food', name: 'Food & Delivery' },
];

// Live screenshot thumbnail service (no API key). First hit renders the site,
// then WordPress caches it on their CDN.
export const screenshotUrl = (url: string, w = 1040, h = 800): string =>
  `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${w}&h=${h}`;

const s = (
  id: string, name: string, url: string, category: ShowcaseCategoryId,
  tagline: string, description: string, tags: string[]
): ShowcaseSite => ({ id, name, url, category, tagline, description, tags });

export const SHOWCASE_SITES: ShowcaseSite[] = [
  // AI & ML
  s('openai', 'OpenAI', 'https://openai.com', 'ai', 'Creators of ChatGPT & GPT models', 'A minimalist, editorial marketing site with bold typography and clean whitespace that lets research and product storytelling lead. A benchmark for restrained, high-trust AI branding.', ['Next.js', 'Editorial', 'Dark UI']),
  s('anthropic', 'Anthropic', 'https://www.anthropic.com', 'ai', 'Claude AI & safety research', 'Warm cream palette, serif accents and generous spacing give this AI-safety company a distinctly human, calm identity that stands apart from the usual neon-tech look.', ['Serif', 'Warm palette', 'Brand']),
  s('midjourney', 'Midjourney', 'https://www.midjourney.com', 'ai', 'AI image generation', 'A gallery-first product where the generated art itself is the hero, framed by a dark, gallery-grade interface.', ['Gallery', 'Dark UI', 'Community']),
  s('perplexity', 'Perplexity', 'https://www.perplexity.ai', 'ai', 'AI answer engine', 'A focused, search-first interface that proves an AI product can feel like a fast, trustworthy utility.', ['Search UX', 'Minimal', 'Citations']),
  s('huggingface', 'Hugging Face', 'https://huggingface.co', 'ai', 'The AI model community', 'A friendly, community-driven hub packed with data yet kept approachable through playful branding.', ['Community', 'Dev-first', 'Playful']),
  s('runway', 'Runway', 'https://runwayml.com', 'ai', 'AI video & creative tools', 'Cinematic, motion-rich landing pages that showcase generative video with immersive full-bleed media.', ['Motion', 'Cinematic', 'Creative']),
  s('elevenlabs', 'ElevenLabs', 'https://elevenlabs.io', 'ai', 'AI voice generation', 'Sleek dark UI with audio-reactive visuals that make a voice product feel tangible.', ['Dark UI', 'Audio', 'Product']),

  // SaaS & Productivity
  s('notion', 'Notion', 'https://www.notion.so', 'saas', 'All-in-one workspace', 'Iconic hand-drawn illustration style and a soft, approachable palette turned a complex tool into a beloved brand.', ['Illustration', 'Brand', 'Docs']),
  s('linear', 'Linear', 'https://linear.app', 'saas', 'Issue tracking, reimagined', 'The gold standard of modern SaaS design — dark glass surfaces, subtle gradients and buttery micro-interactions.', ['Dark UI', 'Glassmorphism', 'Motion']),
  s('figma', 'Figma', 'https://www.figma.com', 'design', 'Collaborative design tool', 'Vibrant, playful and confident, with bold color blocks and interactive product demos embedded on the page.', ['Playful', 'Interactive', 'Brand']),
  s('slack', 'Slack', 'https://slack.com', 'saas', 'Team messaging', 'Friendly, colorful branding paired with crisp product storytelling and clear conversion paths.', ['Brand', 'Marketing', 'Color']),
  s('airtable', 'Airtable', 'https://www.airtable.com', 'saas', 'Databases for everyone', 'Bright, modular layouts that visualize a flexible database product through colorful UI snapshots.', ['Colorful', 'Modular', 'B2B']),
  s('asana', 'Asana', 'https://asana.com', 'saas', 'Work management', 'Signature coral-and-gradient brand system with smooth scroll animations across the marketing site.', ['Gradient', 'Motion', 'Brand']),
  s('monday', 'monday.com', 'https://monday.com', 'saas', 'Work OS', 'Loud, colorful and conversion-optimized — a masterclass in high-energy B2B marketing design.', ['Colorful', 'Conversion', 'B2B']),
  s('clickup', 'ClickUp', 'https://clickup.com', 'saas', 'One app for work', 'Dense feature storytelling handled with clear hierarchy and a bold purple identity.', ['Purple', 'Feature-rich', 'Marketing']),
  s('loom', 'Loom', 'https://www.loom.com', 'saas', 'Async video messaging', 'Clean, product-led pages with autoplaying demos that instantly communicate the value prop.', ['Video', 'Product-led', 'Clean']),
  s('zapier', 'Zapier', 'https://zapier.com', 'saas', 'Automation for apps', 'Approachable orange brand with clear, benefit-led copy and thousands of integration pages done at scale.', ['SEO scale', 'Brand', 'Automation']),
  s('calendly', 'Calendly', 'https://calendly.com', 'saas', 'Scheduling automation', 'Simple, trustworthy and conversion-focused with a clean blue palette.', ['Clean', 'Conversion', 'Blue']),

  // E-commerce & Retail
  s('apple', 'Apple', 'https://www.apple.com', 'ecommerce', 'Consumer electronics', 'The benchmark for premium product storytelling — full-bleed imagery, scroll-driven animation and immaculate typography.', ['Premium', 'Scroll motion', 'Typography']),
  s('nike', 'Nike', 'https://www.nike.com', 'ecommerce', 'Sportswear & apparel', 'Bold, high-energy commerce with striking imagery and confident black-and-white branding.', ['Bold', 'Commerce', 'Brand']),
  s('shopify', 'Shopify', 'https://www.shopify.com', 'ecommerce', 'E-commerce platform', 'Merchant-first storytelling with rich illustration and a globally localized marketing engine.', ['Illustration', 'Platform', 'Global']),
  s('allbirds', 'Allbirds', 'https://www.allbirds.com', 'ecommerce', 'Sustainable footwear', 'Earthy palette and generous product photography that embodies a sustainable, natural brand.', ['DTC', 'Sustainable', 'Photography']),
  s('gymshark', 'Gymshark', 'https://www.gymshark.com', 'ecommerce', 'Fitness apparel', 'A community-powered DTC brand with punchy, athletic art direction.', ['DTC', 'Athletic', 'Community']),
  s('warbyparker', 'Warby Parker', 'https://www.warbyparker.com', 'ecommerce', 'Eyewear', 'Clean, editorial retail with a home try-on flow that set the DTC standard.', ['DTC', 'Editorial', 'Retail']),
  s('glossier', 'Glossier', 'https://www.glossier.com', 'ecommerce', 'Beauty & skincare', 'Millennial-pink minimalism and soft product photography that built a cult beauty brand.', ['Minimal', 'Beauty', 'Brand']),
  s('ikea', 'IKEA', 'https://www.ikea.com', 'ecommerce', 'Home furnishings', 'Massive catalog commerce made navigable with strong information architecture and room-set imagery.', ['Catalog', 'IA', 'Retail']),

  // Fintech & Banking
  s('stripe', 'Stripe', 'https://stripe.com', 'fintech', 'Payments infrastructure', 'The most-copied site in tech — signature animated gradients, gorgeous docs and pixel-perfect craft.', ['Gradient', 'Docs', 'Craft']),
  s('revolut', 'Revolut', 'https://www.revolut.com', 'fintech', 'Global neobank', 'Bold, dark, gradient-heavy fintech branding with slick device mockups.', ['Dark UI', 'Gradient', 'Mobile']),
  s('wise', 'Wise', 'https://wise.com', 'fintech', 'International money transfer', 'Bright, transparent branding with a distinctive green identity and clear pricing storytelling.', ['Bright', 'Transparent', 'Brand']),
  s('coinbase', 'Coinbase', 'https://www.coinbase.com', 'fintech', 'Crypto exchange', 'Trust-forward crypto design balancing approachability with regulatory seriousness.', ['Crypto', 'Trust', 'Blue']),
  s('robinhood', 'Robinhood', 'https://robinhood.com', 'fintech', 'Commission-free investing', 'Playful, animated and mobile-first, making investing feel accessible.', ['Mobile-first', 'Motion', 'Green']),
  s('mercury', 'Mercury', 'https://mercury.com', 'fintech', 'Banking for startups', 'Refined, calm fintech with tasteful gradients and elegant product screenshots.', ['Refined', 'Gradient', 'Startup']),
  s('ramp', 'Ramp', 'https://ramp.com', 'fintech', 'Corporate cards & spend', 'Sharp, confident B2B fintech with a strong yellow-and-black system.', ['B2B', 'Bold', 'Brand']),

  // Media & Streaming
  s('netflix', 'Netflix', 'https://www.netflix.com', 'media', 'Streaming entertainment', 'Immersive, poster-driven UI with the definitive dark cinematic experience.', ['Dark UI', 'Cinematic', 'Personalization']),
  s('spotify', 'Spotify', 'https://www.spotify.com', 'media', 'Music streaming', 'Vibrant duotone art direction and an instantly recognizable green brand.', ['Duotone', 'Brand', 'Audio']),
  s('disneyplus', 'Disney+', 'https://www.disneyplus.com', 'media', 'Streaming service', 'Premium dark UI with rich franchise-led hero rails.', ['Dark UI', 'Streaming', 'Brand']),
  s('youtube', 'YouTube', 'https://www.youtube.com', 'media', 'Video platform', 'The world\u2019s largest video UI — a masterclass in scalable, familiar content layout.', ['Video', 'Scale', 'UX']),
  s('vimeo', 'Vimeo', 'https://vimeo.com', 'media', 'Creative video hosting', 'Elegant, creator-focused video platform with refined typography.', ['Video', 'Creative', 'Clean']),
  s('nytimes', 'The New York Times', 'https://www.nytimes.com', 'media', 'News & journalism', 'The pinnacle of digital editorial design and immersive scrollytelling.', ['Editorial', 'Scrollytelling', 'Typography']),

  // Design & Creative
  s('dribbble', 'Dribbble', 'https://dribbble.com', 'design', 'Design community', 'A visual-first grid where the community\u2019s work is the entire interface.', ['Gallery', 'Community', 'Grid']),
  s('behance', 'Behance', 'https://www.behance.net', 'design', 'Creative portfolios', 'Adobe\u2019s portfolio network with immersive full-width case studies.', ['Portfolio', 'Gallery', 'Creative']),
  s('awwwards', 'Awwwards', 'https://www.awwwards.com', 'design', 'Web design awards', 'The tastemaker of cutting-edge web design and interaction trends.', ['Trends', 'Awards', 'Inspiration']),
  s('canva', 'Canva', 'https://www.canva.com', 'design', 'Design for everyone', 'Bright, friendly and template-led, making design approachable at massive scale.', ['Colorful', 'Templates', 'Scale']),
  s('framer', 'Framer', 'https://www.framer.com', 'design', 'Design & publish sites', 'A design tool whose own site is a live showcase of advanced motion and effects.', ['Motion', 'No-code', 'Effects']),
  s('webflow', 'Webflow', 'https://webflow.com', 'design', 'Visual web development', 'Sophisticated, developer-grade marketing with rich interactions.', ['No-code', 'Motion', 'B2B']),
  s('pentagram', 'Pentagram', 'https://www.pentagram.com', 'design', 'Design studio', 'A legendary studio with a bold, work-forward portfolio.', ['Studio', 'Portfolio', 'Bold']),

  // Developer Tools
  s('github', 'GitHub', 'https://github.com', 'dev', 'Where the world builds software', 'Dark, spacious developer marketing with striking 3D globe visualizations.', ['Dark UI', '3D', 'Dev']),
  s('vercel', 'Vercel', 'https://vercel.com', 'dev', 'Frontend cloud', 'Minimal black-and-white aesthetic that defined the modern dev-tool look.', ['Minimal', 'Dark UI', 'Craft']),
  s('netlify', 'Netlify', 'https://www.netlify.com', 'dev', 'Web deployment platform', 'Teal-accented dev branding with clean docs and quickstart flows.', ['Teal', 'Docs', 'Dev']),
  s('mongodb', 'MongoDB', 'https://www.mongodb.com', 'dev', 'Developer data platform', 'Confident green brand with strong technical storytelling.', ['Database', 'Green', 'B2B']),
  s('supabase', 'Supabase', 'https://supabase.com', 'dev', 'Open source Firebase', 'Dark, green-accented dev tooling with a strong open-source identity.', ['Dark UI', 'Open source', 'Dev']),
  s('postman', 'Postman', 'https://www.postman.com', 'dev', 'API platform', 'Orange-branded, feature-rich API tooling with clear onboarding.', ['API', 'Brand', 'Dev']),
  s('tailwind', 'Tailwind CSS', 'https://tailwindcss.com', 'dev', 'Utility-first CSS', 'Immaculate documentation design that is itself a reference for docs UX.', ['Docs', 'Craft', 'CSS']),
  s('raycast', 'Raycast', 'https://www.raycast.com', 'dev', 'Productivity launcher', 'Beautiful dark UI with tasteful gradients and delightful detail.', ['Dark UI', 'Gradient', 'Product']),

  // Travel & Hospitality
  s('airbnb', 'Airbnb', 'https://www.airbnb.com', 'travel', 'Homes & experiences', 'Warm, photography-led design with an industry-defining search and booking UX.', ['Photography', 'Booking UX', 'Brand']),
  s('booking', 'Booking.com', 'https://www.booking.com', 'travel', 'Hotels & stays', 'A conversion-optimized travel giant and a study in urgency and trust cues.', ['Conversion', 'Travel', 'Scale']),
  s('marriott', 'Marriott', 'https://www.marriott.com', 'travel', 'Global hotels', 'Premium hospitality branding with rich imagery and loyalty storytelling.', ['Luxury', 'Hospitality', 'Booking']),
  s('expedia', 'Expedia', 'https://www.expedia.com', 'travel', 'Travel booking', 'Dense travel commerce made usable with strong filtering and bundling UX.', ['Travel', 'Search', 'Bundles']),
  s('lonelyplanet', 'Lonely Planet', 'https://www.lonelyplanet.com', 'travel', 'Travel guides', 'Editorial, wanderlust-driven design with immersive destination photography.', ['Editorial', 'Photography', 'Content']),
  s('fourseasons', 'Four Seasons', 'https://www.fourseasons.com', 'travel', 'Luxury hotels', 'Understated luxury with elegant typography and cinematic property films.', ['Luxury', 'Cinematic', 'Elegant']),

  // Social & Community
  s('x', 'X (Twitter)', 'https://x.com', 'social', 'Real-time social', 'A minimal, content-dense timeline UI optimized for real-time consumption.', ['Timeline', 'Dark UI', 'Social']),
  s('instagram', 'Instagram', 'https://www.instagram.com', 'social', 'Photo & video sharing', 'A visual-first grid that shaped modern mobile social design.', ['Grid', 'Mobile', 'Visual']),
  s('reddit', 'Reddit', 'https://www.reddit.com', 'social', 'Community forums', 'The front page of the internet with a scalable, community-driven layout.', ['Community', 'Feed', 'Scale']),
  s('linkedin', 'LinkedIn', 'https://www.linkedin.com', 'social', 'Professional network', 'Trust-forward professional networking with a familiar blue system.', ['Professional', 'Feed', 'Blue']),
  s('pinterest', 'Pinterest', 'https://www.pinterest.com', 'social', 'Visual discovery', 'The masonry grid that launched a thousand copycats.', ['Masonry', 'Discovery', 'Visual']),
  s('discord', 'Discord', 'https://discord.com', 'social', 'Chat for communities', 'Playful, purple-brand community platform with fun illustration.', ['Playful', 'Purple', 'Community']),

  // Education
  s('duolingo', 'Duolingo', 'https://www.duolingo.com', 'education', 'Language learning', 'Gamified, mascot-driven design that makes learning genuinely fun and habit-forming.', ['Gamified', 'Mascot', 'Playful']),
  s('coursera', 'Coursera', 'https://www.coursera.org', 'education', 'Online courses', 'Trust-forward edtech with clean course discovery and university branding.', ['EdTech', 'Clean', 'Courses']),
  s('khanacademy', 'Khan Academy', 'https://www.khanacademy.org', 'education', 'Free education', 'Mission-driven, accessible learning design at global scale.', ['Accessible', 'Mission', 'Scale']),
  s('masterclass', 'MasterClass', 'https://www.masterclass.com', 'education', 'Learn from the best', 'Cinematic, premium edtech with dark, film-grade hero videos.', ['Cinematic', 'Premium', 'Video']),
  s('brilliant', 'Brilliant', 'https://brilliant.org', 'education', 'Interactive STEM learning', 'Bright, interactive learning with delightful animated lessons.', ['Interactive', 'Animated', 'STEM']),
  s('udemy', 'Udemy', 'https://www.udemy.com', 'education', 'Skills marketplace', 'A vast course marketplace with strong discovery and conversion patterns.', ['Marketplace', 'Courses', 'Conversion']),

  // Health & Wellness
  s('headspace', 'Headspace', 'https://www.headspace.com', 'health', 'Meditation & mindfulness', 'Soothing, illustration-led wellness design with a warm, calming palette.', ['Illustration', 'Calm', 'Brand']),
  s('calm', 'Calm', 'https://www.calm.com', 'health', 'Sleep & meditation', 'Serene, nature-driven design with ambient full-screen video.', ['Serene', 'Video', 'Wellness']),
  s('whoop', 'WHOOP', 'https://www.whoop.com', 'health', 'Fitness wearable', 'Sleek dark, data-driven design for a performance wearable.', ['Dark UI', 'Data', 'Wearable']),
  s('ouraring', 'Oura', 'https://ouraring.com', 'health', 'Smart ring & health', 'Elegant, minimal product design with refined health-data visuals.', ['Minimal', 'Product', 'Data']),
  s('nike-training', 'Peloton', 'https://www.onepeloton.com', 'health', 'Connected fitness', 'High-energy fitness branding with strong motion and community proof.', ['Fitness', 'Motion', 'Community']),
  s('myfitnesspal', 'MyFitnessPal', 'https://www.myfitnesspal.com', 'health', 'Nutrition tracking', 'Approachable health-tracking design with clear data entry UX.', ['Tracking', 'Clean', 'Mobile']),

  // Food & Delivery
  s('doordash', 'DoorDash', 'https://www.doordash.com', 'food', 'Food delivery', 'Conversion-optimized delivery marketplace with strong local discovery.', ['Marketplace', 'Delivery', 'Conversion']),
  s('ubereats', 'Uber Eats', 'https://www.ubereats.com', 'food', 'Food delivery', 'Bold black-and-green branding with a slick ordering flow.', ['Delivery', 'Brand', 'Mobile']),
  s('deliveroo', 'Deliveroo', 'https://deliveroo.com', 'food', 'Food delivery', 'Teal-branded delivery with playful illustration and clear UX.', ['Delivery', 'Teal', 'Illustration']),
  s('starbucks', 'Starbucks', 'https://www.starbucks.com', 'food', 'Coffee & rewards', 'Premium beverage branding with a best-in-class rewards experience.', ['Brand', 'Rewards', 'Retail']),
  s('hellofresh', 'HelloFresh', 'https://www.hellofresh.com', 'food', 'Meal kits', 'Appetizing food photography with a conversion-focused subscription flow.', ['Subscription', 'Photography', 'Conversion']),
  s('opentable', 'OpenTable', 'https://www.opentable.com', 'food', 'Restaurant reservations', 'Clean reservation UX with strong local restaurant discovery.', ['Booking', 'Discovery', 'Clean']),

  // AI & ML (extended)
  s('gemini', 'Google Gemini', 'https://gemini.google.com', 'ai', 'Google\u2019s AI assistant', 'Clean, colorful Google-brand AI product with a friendly conversational canvas.', ['Google', 'Conversational', 'Clean']),
  s('claude', 'Claude', 'https://claude.ai', 'ai', 'AI assistant by Anthropic', 'Warm, focused chat UI that keeps the conversation front and center.', ['Chat UI', 'Warm', 'Minimal']),
  s('replicate', 'Replicate', 'https://replicate.com', 'ai', 'Run AI models via API', 'Developer-first AI platform with a clean, model-gallery layout.', ['Dev', 'Gallery', 'API']),
  s('cursor', 'Cursor', 'https://www.cursor.com', 'ai', 'AI code editor', 'Sleek dark landing with slick product demos of AI-assisted coding.', ['Dark UI', 'Dev', 'Product']),

  // SaaS (extended)
  s('intercom', 'Intercom', 'https://www.intercom.com', 'saas', 'Customer service AI', 'Bold, human-illustrated support platform with confident messaging.', ['Illustration', 'Support', 'Brand']),
  s('hubspot', 'HubSpot', 'https://www.hubspot.com', 'saas', 'CRM & marketing', 'Orange-branded inbound marketing giant with strong content and conversion.', ['CRM', 'Conversion', 'Content']),
  s('dropbox', 'Dropbox', 'https://www.dropbox.com', 'saas', 'Cloud storage', 'Playful brand refresh with expressive type and colorful illustration.', ['Brand', 'Illustration', 'Type']),
  s('miro', 'Miro', 'https://miro.com', 'saas', 'Online whiteboard', 'Energetic collaboration branding with a lively yellow identity.', ['Collab', 'Yellow', 'Motion']),
  s('typeform', 'Typeform', 'https://www.typeform.com', 'saas', 'Conversational forms', 'Human, conversational form design that made surveys feel friendly.', ['Forms', 'Conversational', 'Brand']),
  s('superhuman', 'Superhuman', 'https://superhuman.com', 'saas', 'The fastest email', 'Premium, dark, gradient-rich SaaS with a speed-obsessed narrative.', ['Dark UI', 'Gradient', 'Premium']),

  // E-commerce (extended)
  s('tesla', 'Tesla', 'https://www.tesla.com', 'ecommerce', 'Electric vehicles', 'Minimal, full-bleed automotive design with configurator-led commerce.', ['Minimal', 'Automotive', 'Configurator']),
  s('lego', 'LEGO', 'https://www.lego.com', 'ecommerce', 'Toys & play', 'Joyful, colorful commerce packed with playful interaction for all ages.', ['Playful', 'Colorful', 'Commerce']),
  s('sephora', 'Sephora', 'https://www.sephora.com', 'ecommerce', 'Beauty retail', 'Rich beauty commerce with strong product discovery and reviews.', ['Beauty', 'Commerce', 'Discovery']),
  s('etsy', 'Etsy', 'https://www.etsy.com', 'ecommerce', 'Handmade marketplace', 'Warm, craft-forward marketplace celebrating independent sellers.', ['Marketplace', 'Warm', 'Craft']),
  s('bestbuy', 'Best Buy', 'https://www.bestbuy.com', 'ecommerce', 'Electronics retail', 'Large-scale retail commerce with dense but organized product IA.', ['Retail', 'IA', 'Scale']),

  // Fintech (extended)
  s('paypal', 'PayPal', 'https://www.paypal.com', 'fintech', 'Online payments', 'Trusted global payments brand with clear, benefit-led marketing.', ['Payments', 'Trust', 'Blue']),
  s('square', 'Square', 'https://squareup.com', 'fintech', 'Payments for business', 'Clean, black-and-white commerce tooling for sellers of every size.', ['Payments', 'Minimal', 'B2B']),
  s('brex', 'Brex', 'https://www.brex.com', 'fintech', 'Corporate spend', 'Sharp, premium fintech with confident dark accents.', ['B2B', 'Premium', 'Dark UI']),
  s('plaid', 'Plaid', 'https://plaid.com', 'fintech', 'Financial data APIs', 'Developer-grade fintech infrastructure with tasteful branding.', ['API', 'Fintech', 'Brand']),

  // Media (extended)
  s('twitch', 'Twitch', 'https://www.twitch.tv', 'media', 'Live streaming', 'Dark, purple gaming-first streaming UI built for real-time community.', ['Dark UI', 'Purple', 'Live']),
  s('soundcloud', 'SoundCloud', 'https://soundcloud.com', 'media', 'Audio streaming', 'Orange-branded audio platform with a distinctive waveform UI.', ['Audio', 'Waveform', 'Brand']),
  s('medium', 'Medium', 'https://medium.com', 'media', 'Reading & writing', 'A reference for clean, typography-first reading experiences.', ['Editorial', 'Typography', 'Reading']),
  s('theverge', 'The Verge', 'https://www.theverge.com', 'media', 'Tech journalism', 'Bold, colorful tech publication known for its expressive redesigns.', ['Editorial', 'Bold', 'Tech']),

  // Design & Dev (extended)
  s('codepen', 'CodePen', 'https://codepen.io', 'dev', 'Front-end playground', 'A live-code community where the work runs right in the grid.', ['Live code', 'Community', 'Dev']),
  s('stackoverflow', 'Stack Overflow', 'https://stackoverflow.com', 'dev', 'Developer Q&A', 'The reference for content-dense, utilitarian developer UX at scale.', ['Q&A', 'Scale', 'Utility']),
  s('gitlab', 'GitLab', 'https://about.gitlab.com', 'dev', 'DevOps platform', 'Comprehensive DevOps marketing with strong information architecture.', ['DevOps', 'IA', 'B2B']),
  s('storybook', 'Storybook', 'https://storybook.js.org', 'dev', 'UI component workshop', 'Developer docs and tooling with a clean, component-driven aesthetic.', ['Docs', 'Components', 'Dev']),
  s('adobe', 'Adobe', 'https://www.adobe.com', 'design', 'Creative software', 'Rich, gradient-forward creative marketing across a huge product suite.', ['Gradient', 'Creative', 'Suite']),
  s('unsplash', 'Unsplash', 'https://unsplash.com', 'design', 'Free stock photography', 'A photography-first masonry gallery that lets imagery dominate.', ['Gallery', 'Photography', 'Masonry']),

  // Travel & Social & Education & Health & Food (extended)
  s('tripadvisor', 'Tripadvisor', 'https://www.tripadvisor.com', 'travel', 'Reviews & bookings', 'Review-driven travel discovery with strong social proof patterns.', ['Reviews', 'Travel', 'Discovery']),
  s('kayak', 'KAYAK', 'https://www.kayak.com', 'travel', 'Travel search', 'Powerful metasearch UX with dense filtering done cleanly.', ['Metasearch', 'Filters', 'Travel']),
  s('behance2', 'Product Hunt', 'https://www.producthunt.com', 'social', 'New product discovery', 'A daily launch community with a clean, upvote-driven feed.', ['Community', 'Feed', 'Launch']),
  s('substack', 'Substack', 'https://substack.com', 'social', 'Newsletters & writing', 'Clean, writer-first publishing with a warm editorial identity.', ['Publishing', 'Editorial', 'Warm']),
  s('edx', 'edX', 'https://www.edx.org', 'education', 'University courses online', 'Academic, trust-forward learning with university-grade credibility.', ['EdTech', 'Academic', 'Courses']),
  s('skillshare', 'Skillshare', 'https://www.skillshare.com', 'education', 'Creative classes', 'Vibrant, creator-led learning with bold thumbnails and energy.', ['Creative', 'Courses', 'Vibrant']),
  s('noom', 'Noom', 'https://www.noom.com', 'health', 'Behavioral weight health', 'Friendly, psychology-led health branding with a conversion-first funnel.', ['Health', 'Funnel', 'Brand']),
  s('zocdoc', 'Zocdoc', 'https://www.zocdoc.com', 'health', 'Find & book doctors', 'Trust-forward healthcare booking with a clean, reassuring UX.', ['Health', 'Booking', 'Trust']),
  s('grubhub', 'Grubhub', 'https://www.grubhub.com', 'food', 'Food ordering', 'Local food delivery with strong discovery and reorder flows.', ['Delivery', 'Discovery', 'Local']),
  s('yelp', 'Yelp', 'https://www.yelp.com', 'food', 'Local business reviews', 'Review-driven local discovery with dense listing UX done well.', ['Reviews', 'Local', 'Discovery']),
];


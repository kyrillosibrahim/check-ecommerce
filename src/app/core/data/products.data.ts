import { IProduct } from '../models/product.model';

export const PRODUCTS_DATA: IProduct[] = [
  // ── Electronics (4) ──
  {
    id: 'prod-001',
    title: 'Wireless Noise-Cancelling Headphones',
    titleAr: 'سماعات لاسلكية بخاصية إلغاء الضوضاء',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support. Perfect for travel and focused work sessions.',
    descriptionAr: 'سماعات فوق الأذن فاخرة مع خاصية إلغاء الضوضاء النشط، بطارية تدوم 30 ساعة، ودعم الصوت عالي الدقة. مثالية للسفر وجلسات العمل المركزة.',
    price: 199.99,
    discountPercentage: 15,
    rating: 4.7,
    ratingsCount: 234,
    stock: 25,
    categoryId: 1,
    category: 'electronics',
    images: [
      'https://picsum.photos/seed/headphones1/600/600',
      'https://picsum.photos/seed/headphones2/600/600',
      'https://picsum.photos/seed/headphones3/600/600'
    ],
    brand: 'SoundMax',
    isFeatured: true,
    tags: ['audio', 'wireless', 'noise-cancelling']
  },
  {
    id: 'prod-002',
    title: 'Smart Fitness Watch Pro',
    titleAr: 'ساعة ذكية للياقة البدنية برو',
    description: 'Advanced smartwatch with heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Water-resistant up to 50m.',
    descriptionAr: 'ساعة ذكية متطورة مع مراقبة معدل ضربات القلب، تتبع GPS، تحليل النوم، وبطارية تدوم 7 أيام. مقاومة للماء حتى 50 متر.',
    price: 249.99,
    discountPercentage: 10,
    rating: 4.5,
    ratingsCount: 189,
    stock: 18,
    categoryId: 1,
    category: 'electronics',
    images: [
      'https://picsum.photos/seed/watch1/600/600',
      'https://picsum.photos/seed/watch2/600/600',
      'https://picsum.photos/seed/watch3/600/600'
    ],
    brand: 'TechFit',
    isFeatured: true,
    tags: ['wearable', 'fitness', 'smartwatch']
  },
  {
    id: 'prod-003',
    title: 'Portable Bluetooth Speaker',
    titleAr: 'مكبر صوت بلوتوث محمول',
    description: 'Compact waterproof speaker with 360-degree sound, 12-hour playtime, and built-in microphone for hands-free calls.',
    descriptionAr: 'مكبر صوت مدمج مقاوم للماء بصوت محيطي 360 درجة، تشغيل 12 ساعة، وميكروفون مدمج للمكالمات بدون استخدام اليدين.',
    price: 79.99,
    discountPercentage: 0,
    rating: 4.3,
    ratingsCount: 156,
    stock: 42,
    categoryId: 1,
    category: 'electronics',
    images: [
      'https://picsum.photos/seed/speaker1/600/600',
      'https://picsum.photos/seed/speaker2/600/600',
      'https://picsum.photos/seed/speaker3/600/600'
    ],
    brand: 'SoundMax',
    isFeatured: false,
    tags: ['audio', 'bluetooth', 'portable']
  },
  {
    id: 'prod-004',
    title: 'Adjustable Laptop Stand',
    titleAr: 'حامل لابتوب قابل للتعديل',
    description: 'Ergonomic aluminum laptop stand with adjustable height and angle. Compatible with all laptops up to 17 inches. Foldable for portability.',
    descriptionAr: 'حامل لابتوب من الألومنيوم بتصميم مريح مع ارتفاع وزاوية قابلين للتعديل. متوافق مع جميع اللابتوبات حتى 17 بوصة. قابل للطي لسهولة الحمل.',
    price: 45.99,
    discountPercentage: 20,
    rating: 4.6,
    ratingsCount: 98,
    stock: 35,
    categoryId: 1,
    category: 'electronics',
    images: [
      'https://picsum.photos/seed/stand1/600/600',
      'https://picsum.photos/seed/stand2/600/600',
      'https://picsum.photos/seed/stand3/600/600'
    ],
    brand: 'DeskPro',
    isFeatured: false,
    tags: ['ergonomic', 'laptop', 'office']
  },

  // ── Clothing (3) ──
  {
    id: 'prod-005',
    title: 'Classic Denim Jacket',
    titleAr: 'جاكيت جينز كلاسيكي',
    description: 'Timeless denim jacket with a modern fit. Made from premium cotton denim with copper button details and chest pockets.',
    descriptionAr: 'جاكيت جينز كلاسيكي بقصة عصرية. مصنوع من قماش الدنيم القطني الفاخر مع أزرار نحاسية وجيوب صدرية.',
    price: 89.99,
    discountPercentage: 0,
    rating: 4.4,
    ratingsCount: 76,
    stock: 30,
    categoryId: 2,
    category: 'clothing',
    images: [
      'https://picsum.photos/seed/denim1/600/600',
      'https://picsum.photos/seed/denim2/600/600',
      'https://picsum.photos/seed/denim3/600/600'
    ],
    brand: 'UrbanStyle',
    isFeatured: true,
    tags: ['jacket', 'denim', 'casual']
  },
  {
    id: 'prod-006',
    title: 'Lightweight Running Shoes',
    titleAr: 'حذاء رياضي خفيف للجري',
    description: 'Ultra-light running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole. Ideal for daily runs.',
    descriptionAr: 'حذاء جري خفيف الوزن مع توسيد متجاوب، جزء علوي شبكي يسمح بالتهوية، ونعل مطاطي متين. مثالي للجري اليومي.',
    price: 129.99,
    discountPercentage: 25,
    rating: 4.8,
    ratingsCount: 312,
    stock: 20,
    categoryId: 2,
    category: 'clothing',
    images: [
      'https://picsum.photos/seed/shoes1/600/600',
      'https://picsum.photos/seed/shoes2/600/600',
      'https://picsum.photos/seed/shoes3/600/600'
    ],
    brand: 'SprintX',
    isFeatured: true,
    tags: ['shoes', 'running', 'sport']
  },
  {
    id: 'prod-007',
    title: 'Premium Cotton T-Shirt',
    titleAr: 'تيشيرت قطن فاخر',
    description: 'Super soft 100% organic cotton t-shirt with a relaxed fit. Pre-shrunk and fade-resistant. Available in multiple colors.',
    descriptionAr: 'تيشيرت ناعم جداً من القطن العضوي 100% بقصة مريحة. مقاوم للانكماش وثبات الألوان. متوفر بألوان متعددة.',
    price: 29.99,
    discountPercentage: 0,
    rating: 4.2,
    ratingsCount: 445,
    stock: 50,
    categoryId: 2,
    category: 'clothing',
    images: [
      'https://picsum.photos/seed/tshirt1/600/600',
      'https://picsum.photos/seed/tshirt2/600/600',
      'https://picsum.photos/seed/tshirt3/600/600'
    ],
    brand: 'ComfortWear',
    isFeatured: false,
    tags: ['t-shirt', 'cotton', 'basics']
  },

  // ── Home & Kitchen (3) ──
  {
    id: 'prod-008',
    title: 'Programmable Coffee Maker',
    titleAr: 'ماكينة قهوة قابلة للبرمجة',
    description: '12-cup programmable coffee maker with thermal carafe, auto shut-off, and brew strength control. Wake up to freshly brewed coffee.',
    descriptionAr: 'ماكينة قهوة قابلة للبرمجة بسعة 12 كوب مع إبريق حراري، إيقاف تلقائي، والتحكم في قوة التحضير. استيقظ على قهوة طازجة.',
    price: 69.99,
    discountPercentage: 10,
    rating: 4.5,
    ratingsCount: 167,
    stock: 15,
    categoryId: 3,
    category: 'home-kitchen',
    images: [
      'https://picsum.photos/seed/coffee1/600/600',
      'https://picsum.photos/seed/coffee2/600/600',
      'https://picsum.photos/seed/coffee3/600/600'
    ],
    brand: 'BrewMaster',
    isFeatured: true,
    tags: ['coffee', 'kitchen', 'appliance']
  },
  {
    id: 'prod-009',
    title: 'Minimalist Ceramic Plant Pot',
    titleAr: 'أصيص نباتات سيراميك بتصميم بسيط',
    description: 'Handcrafted ceramic planter with drainage hole and bamboo saucer. Perfect for succulents, herbs, or small indoor plants.',
    descriptionAr: 'أصيص سيراميك مصنوع يدوياً مع فتحة تصريف وصحن من الخيزران. مثالي للعصاريات والأعشاب والنباتات الداخلية الصغيرة.',
    price: 24.99,
    discountPercentage: 0,
    rating: 4.1,
    ratingsCount: 89,
    stock: 40,
    categoryId: 3,
    category: 'home-kitchen',
    images: [
      'https://picsum.photos/seed/pot1/600/600',
      'https://picsum.photos/seed/pot2/600/600',
      'https://picsum.photos/seed/pot3/600/600'
    ],
    brand: 'GreenLife',
    isFeatured: false,
    tags: ['home', 'decor', 'plant']
  },
  {
    id: 'prod-010',
    title: 'LED Desk Lamp with USB Port',
    titleAr: 'مصباح مكتب LED مع منفذ USB',
    description: 'Modern LED desk lamp with 5 brightness levels, 3 color temperatures, and built-in USB charging port. Touch control and memory function.',
    descriptionAr: 'مصباح مكتب LED عصري مع 5 مستويات سطوع، 3 درجات حرارة لون، ومنفذ شحن USB مدمج. تحكم باللمس وخاصية الذاكرة.',
    price: 39.99,
    discountPercentage: 15,
    rating: 4.6,
    ratingsCount: 203,
    stock: 28,
    categoryId: 3,
    category: 'home-kitchen',
    images: [
      'https://picsum.photos/seed/lamp1/600/600',
      'https://picsum.photos/seed/lamp2/600/600',
      'https://picsum.photos/seed/lamp3/600/600'
    ],
    brand: 'LumiPro',
    isFeatured: false,
    tags: ['lighting', 'desk', 'office']
  },

  // ── Sports (3) ──
  {
    id: 'prod-011',
    title: 'Non-Slip Yoga Mat',
    titleAr: 'سجادة يوغا مانعة للانزلاق',
    description: 'Extra-thick 6mm yoga mat with non-slip texture on both sides. Made from eco-friendly TPE material. Includes carrying strap.',
    descriptionAr: 'سجادة يوغا بسمك 6 مم مع سطح مانع للانزلاق من الجهتين. مصنوعة من مادة TPE صديقة للبيئة. تشمل حزام للحمل.',
    price: 34.99,
    discountPercentage: 0,
    rating: 4.4,
    ratingsCount: 178,
    stock: 33,
    categoryId: 4,
    category: 'sports',
    images: [
      'https://picsum.photos/seed/yoga1/600/600',
      'https://picsum.photos/seed/yoga2/600/600',
      'https://picsum.photos/seed/yoga3/600/600'
    ],
    brand: 'FlexFit',
    isFeatured: false,
    tags: ['yoga', 'fitness', 'mat']
  },
  {
    id: 'prod-012',
    title: 'Insulated Water Bottle 750ml',
    titleAr: 'زجاجة مياه معزولة 750 مل',
    description: 'Double-wall vacuum insulated stainless steel water bottle. Keeps drinks cold 24 hours or hot 12 hours. BPA-free lid.',
    descriptionAr: 'زجاجة مياه من الستانلس ستيل بعزل مفرغ مزدوج الجدار. تحافظ على المشروبات باردة 24 ساعة أو ساخنة 12 ساعة. غطاء خالٍ من BPA.',
    price: 19.99,
    discountPercentage: 10,
    rating: 4.7,
    ratingsCount: 523,
    stock: 45,
    categoryId: 4,
    category: 'sports',
    images: [
      'https://picsum.photos/seed/bottle1/600/600',
      'https://picsum.photos/seed/bottle2/600/600',
      'https://picsum.photos/seed/bottle3/600/600'
    ],
    brand: 'HydroMax',
    isFeatured: true,
    tags: ['hydration', 'bottle', 'insulated']
  },
  {
    id: 'prod-013',
    title: 'Resistance Bands Set (5 Pack)',
    titleAr: 'طقم أحزمة مقاومة (5 قطع)',
    description: 'Professional-grade latex resistance bands with 5 resistance levels. Includes door anchor, handles, and ankle straps. Perfect for home workouts.',
    descriptionAr: 'أحزمة مقاومة احترافية من اللاتكس بـ 5 مستويات مقاومة. تشمل مرساة باب، مقابض، وأربطة كاحل. مثالية للتمارين المنزلية.',
    price: 22.99,
    discountPercentage: 30,
    rating: 4.3,
    ratingsCount: 267,
    stock: 38,
    categoryId: 4,
    category: 'sports',
    images: [
      'https://picsum.photos/seed/bands1/600/600',
      'https://picsum.photos/seed/bands2/600/600',
      'https://picsum.photos/seed/bands3/600/600'
    ],
    brand: 'PowerFlex',
    isFeatured: false,
    tags: ['resistance', 'workout', 'bands']
  },

  // ── Vitamins (12) ──
  {
    id: 'prod-014',
    title: 'Now Foods Boron 3mg 250 Veg Capsules',
    titleAr: 'بورون 3 مل جرام من ناو فودز 250 كبسولة نباتية',
    description: 'Boron is a bioactive trace mineral that affects calcium, magnesium, and phosphorus metabolism. Supports bone strength and structure. Albion Bororganic Glycine form for optimal absorption.',
    descriptionAr: 'البورون معدن زهيد ونشط حيوياً يؤثر في عملية أيض الكالسيوم والمغنيسيوم والفوسفور. يدعم قوة العظام وبنيتها. يتفاعل مع الكالسيوم والمغنيسيوم لدعم العظام.',
    price: 1430,
    discountPercentage: 0,
    rating: 4.8,
    ratingsCount: 134,
    stock: 22,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/بورون 3 مل جرام من ناو فودز 250 كبسولة نباتية/front.webp',
      'assets/nowfods/بورون 3 مل جرام من ناو فودز 250 كبسولة نباتية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/بورون 3 مل جرام من ناو فودز 250 كبسولة نباتية/normal/13ccf60690.webp',
      'assets/nowfods/بورون 3 مل جرام من ناو فودز 250 كبسولة نباتية/normal/53e9721eda.webp'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'boron', 'bone-support', 'minerals'],
    productForm: { type: 'Capsules', typeAr: 'كبسولة', count: '250' },
    faq: [
      { q: 'ما هي فوائد البورون؟', a: 'البورون يساعد على تحسين حالات هشاشة العظام ومكافحة المرض، ويسهم في تحسين أيض وامتصاص المعادن المختلفة مما يساهم في تقوية العظام وتحسين صحتها.' },
      { q: 'ما هي طريقة استخدام البورون؟', a: 'تناول كبسولة واحدة يوميًا مع إحدى الوجبات.' },
      { q: 'ما هي مكونات كبسولات البورون؟', a: 'دقيق الأرز، هيبروميلوز (كبسولة سليولوز)، وحمض الستياريك (مصدر نباتي).' },
      { q: 'هل المنتج مناسب للنباتيين؟', a: 'نعم، المنتج نباتي ومناسب لجميع النباتيين وحاصل على شهادة كوشر.' }
    ]
  },
  {
    id: 'prod-015',
    title: 'Now Foods NAC 1000mg 60 Tablets',
    titleAr: 'ناو فودز NAC 1000 مل جرام 60 قرص',
    description: 'N-Acetyl Cysteine (NAC) is a powerful antioxidant amino acid and a precursor to glutathione. Supports respiratory health, liver detoxification, and cellular protection against free radicals.',
    descriptionAr: 'إن-أسيتيل سيستئين (NAC) هو حمض أميني مضاد للأكسدة قوي وسابق للجلوتاثيون. يدعم صحة الجهاز التنفسي، إزالة سموم الكبد، وحماية الخلايا من الجذور الحرة.',
    price: 1225,
    discountPercentage: 0,
    rating: 4.6,
    ratingsCount: 112,
    stock: 17,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز‏ NAC مل جرام 1،000 ، 60 قرص/front.webp',
      'assets/nowfods/ناو فودز‏ NAC مل جرام 1،000 ، 60 قرص/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز‏ NAC مل جرام 1،000 ، 60 قرص/normal/014db2704b.webp',
      'assets/nowfods/ناو فودز‏ NAC مل جرام 1،000 ، 60 قرص/normal/6e3cdad14c.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'nac', 'antioxidant', 'liver-support'],
    productForm: { type: 'Tablets', typeAr: 'قرص', count: '60' },
    comingSoon: true,
    faq: [
      { q: 'ما هو NAC؟', a: 'إن-أسيتيل سيستئين (NAC) هو حمض أميني مضاد للأكسدة قوي وسابق للجلوتاثيون، يدعم صحة الجهاز التنفسي وإزالة سموم الكبد وحماية الخلايا من الجذور الحرة.' },
      { q: 'ما هي الجرعة الموصى بها؟', a: 'تناول قرص واحد يوميًا مع الوجبة.' }
    ]
  },
  {
    id: 'prod-016',
    title: 'Now Foods Zinc 50mg 250 Tablets',
    titleAr: 'ناو فودز أقراص الزنك تركيز 50 مل جرام عدد 250 قرص',
    description: 'Zinc is an essential mineral cofactor for hundreds of enzymatic reactions related to protein and carbohydrate metabolism, RNA/DNA synthesis, and intercellular signaling. Supports immune function and healthy aging.',
    descriptionAr: 'الزنك هو عامل مساعد معدني ضروري لمئات من التفاعلات الإنزيمية المتعلقة بعملية التمثيل الغذائي للبروتين والكربوهيدرات، وتخليق الحمض النووي، والإشارات بين الخلايا. يدعم وظيفة المناعة والتقدم في السن بشكل صحي.',
    price: 1325,
    discountPercentage: 0,
    rating: 4.7,
    ratingsCount: 267,
    stock: 35,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز أقراص الزنك تركيز 50 مل جرام عدد 250 قرص/normal/front.webp',
      'assets/nowfods/ناو فودز أقراص الزنك تركيز 50 مل جرام عدد 250 قرص/normal/back.webp'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'zinc', 'immune-support', 'minerals'],
    productForm: { type: 'Tablets', typeAr: 'قرص', count: '250' },
    faq: [
      { q: 'ما هي فوائد الزنك؟', a: 'يدعم المناعة، يحفز نمو الأطفال، يساعد في الوقاية من الزهايمر، يقلل أعراض الأكزيما والاكتئاب، ويدعم وظيفة الإنزيمات.' },
      { q: 'ما هي الجرعة الموصى بها؟', a: 'تناول قرصًا واحدًا يوميًا مع الوجبة.' },
      { q: 'هل المنتج مناسب للنباتيين؟', a: 'نعم، المنتج نباتي ومناسب لجميع النباتيين.' }
    ]
  },
  {
    id: 'prod-019',
    title: 'Now Foods Dopa Mucuna 90 Veg Capsules',
    titleAr: 'ناو فودز دوبا موكونا 90 كبسولة نباتية',
    description: 'Standardized Mucuna extract with 15% naturally occurring L-Dopa. Supports brain function and dopamine production. Used in traditional Ayurvedic medicine for thousands of years.',
    descriptionAr: 'مستخلص موكونا موحد مع 15% من إل-دوبا الطبيعي. يدعم وظائف المخ وإنتاج الدوبامين. يُستخدم في الطب الهندي التقليدي (الأيورفيدا) منذ آلاف السنين.',
    price: 1400,
    discountPercentage: 0,
    rating: 4.5,
    ratingsCount: 98,
    stock: 26,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز‏ دوبا موكونا 90 كبسولة نباتية/front.webp',
      'assets/nowfods/ناو فودز‏ دوبا موكونا 90 كبسولة نباتية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز‏ دوبا موكونا 90 كبسولة نباتية/normal/13d98ac9d8.webp',
      'assets/nowfods/ناو فودز‏ دوبا موكونا 90 كبسولة نباتية/normal/19ec10cbcf.webp',
      'assets/nowfods/ناو فودز‏ دوبا موكونا 90 كبسولة نباتية/normal/bd6fd08389.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'mucuna', 'brain-support', 'dopamine'],
    productForm: { type: 'Capsules', typeAr: 'كبسولة', count: '90' },
    comingSoon: true,
    faq: [
      { q: 'ما هي فوائد دوبا موكونا؟', a: 'تدعم وظائف المخ وإنتاج الدوبامين، تساعد في علاج مرض السكري وخفض مستويات السكر بالدم، وتساهم في خسارة الوزن.' },
      { q: 'ما هي طريقة الاستخدام؟', a: 'تناول كبسولة أو اثنين مع الوجبة يوميًا، ويُفضل تناوله في وقت مبكر من اليوم.' },
      { q: 'هل المنتج خالٍ من مسببات الحساسية؟', a: 'نعم، لا يُصنع بمكونات من القمح أو الجلوتين أو الصويا أو الحليب أو البيض أو السمك أو المحار أو المكسرات.' }
    ]
  },
  {
    id: 'prod-020',
    title: 'Now Foods Liquid Chlorophyll Mint 473ml',
    titleAr: 'ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل',
    description: 'Super concentrated liquid chlorophyll with natural mint flavor. Over 90 servings per bottle. Acts as an internal deodorizer, supports detoxification, and provides fresh breath.',
    descriptionAr: 'كلوروفيل سائل فائق التركيز بنكهة النعناع الطبيعية. أكثر من 90 جرعة في الزجاجة. يعمل كمزيل للروائح الداخلية، يدعم إزالة السموم، ويمنح نفساً منعشاً.',
    price: 2250,
    discountPercentage: 22,
    rating: 4.9,
    ratingsCount: 312,
    stock: 15,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل/front.webp',
      'assets/nowfods/ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل/normal/0e9fe84d35.webp',
      'assets/nowfods/ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل/normal/3615428cff.webp',
      'assets/nowfods/ناو فودز كلوروفيل سائل بنكهة النعناع الطبيعية 473 مل/normal/8d5d6509c6.webp'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'chlorophyll', 'detox', 'mint'],
    productForm: { type: 'Liquid', typeAr: 'سائل', count: '473ml' },
    faq: [
      { q: 'ما هو الكلوروفيل السائل؟', a: 'الكلوروفيل هو صبغة خضراء تنتجها النباتات، يعمل كمعادل للجذور الحرة ويساعد في دعم عمليات إزالة السموم من الجسم ويُستخدم كمزيل للروائح الداخلية.' },
      { q: 'ما هي دواعي الاستخدام؟', a: 'يعزز طاقة الجسم، يدعم صحة الجهاز الهضمي، يعمل كمضاد للأكسدة، يساهم في تعزيز صحة الجلد، يدعم جهاز المناعة، ويساعد في تنقية الدم.' },
      { q: 'كيف يتم تناول الكلوروفيل السائل؟', a: 'تناول ملعقة صغيرة (5 مل) يوميًا في 8 أونصات من الماء أو العصير. يُرج جيدًا قبل الاستخدام ويُحفظ في الثلاجة بعد الفتح.' },
      { q: 'هل المنتج خالٍ من مسببات الحساسية؟', a: 'نعم، لا يحتوي على الخميرة أو القمح أو الجلوتين أو الصويا أو الذرة أو الحليب أو البيض أو السمك أو المحار.' }
    ]
  },
  {
    id: 'prod-021',
    title: 'Now Foods Ashwagandha Standardized Extract 450mg 90 Veg Capsules',
    titleAr: 'ناو فودز اشواجندا مستخلص موحد 450 مل جرام 90 كبسولة نباتية',
    description: 'Ashwagandha (Withania somnifera) is an herb widely used in traditional Ayurvedic medicine. Used as a general tonic and adaptogen to help the body adapt to temporary natural stress. Supports a healthy immune system and acts as a free radical scavenger.',
    descriptionAr: 'الاشواجندا او العبعب المنوم (ويثانيا سومنيفرا) هو من الاعشاب والنباتات الطبية ويُستخدم على نطاق واسع في النظام العشبي التقليدي في الهند في الأيورفيدا. يُستخدم كمحفز عام و"كمكيف طبيعي" لمساعدة الجسم على التكيف مع الإجهاد المؤقت الطبيعي. يدعم نظام المناعة الصحي.',
    price: 1300,
    discountPercentage: 0,
    rating: 4.7,
    ratingsCount: 156,
    stock: 20,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز اشواجندا مستخلص موحد 450 مل جرام 90 كبسولة نباتية/front.webp',
      'assets/nowfods/ناو فودز اشواجندا مستخلص موحد 450 مل جرام 90 كبسولة نباتية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز اشواجندا مستخلص موحد 450 مل جرام 90 كبسولة نباتية/normal/265b8c58ec.webp',
      'assets/nowfods/ناو فودز اشواجندا مستخلص موحد 450 مل جرام 90 كبسولة نباتية/normal/cb8059a2f9.webp'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'ashwagandha', 'stress-support', 'adaptogen'],
    productForm: { type: 'Capsules', typeAr: 'كبسولة', count: '90' },
    faq: [
      { q: 'ما هي فوائد الأشواجندا؟', a: 'تساعد الجسم على التكيف مع الإجهاد المؤقت الطبيعي، تدعم نظام المناعة الصحي، وتعمل ككاسح للجذور الحرة.' },
      { q: 'كيف يتم تناول الأشواجندا؟', a: 'تناول كبسولة واحدة مرتين أو ثلاث مرات يوميًا.' },
      { q: 'هل المنتج مناسب للنباتيين؟', a: 'نعم، المنتج نباتي ومناسب لجميع النباتيين وحاصل على شهادة كوشر.' }
    ]
  },
  {
    id: 'prod-022',
    title: 'Now Foods Glucomannan 575mg 180 Capsules',
    titleAr: 'ناو فودز جلوكومانان 575 مل جرام 180 كبسولة',
    description: 'Glucomannan is a soluble bulk-forming fiber derived from konjac root (Amorphophallus konjac) that helps maintain bowel regularity. Supports healthy lipid levels within the normal range and promotes a feeling of fullness for healthy weight management.',
    descriptionAr: 'الجلوكومانان هي ألياف تشكيل الكتلة قابلة للذوبان مشتقة من جذور الكونجاك والتي تساعد في الحفاظ على انتظام الأمعاء. تدعم مستويات الدهون الصحية وتعزز الإحساس بالشبع لإدارة الوزن الصحي.',
    price: 1585,
    discountPercentage: 0,
    rating: 4.4,
    ratingsCount: 89,
    stock: 18,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز جلوكومانان 575 مل جرام 180 كبسولة/front.webp',
      'assets/nowfods/ناو فودز جلوكومانان 575 مل جرام 180 كبسولة/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز جلوكومانان 575 مل جرام 180 كبسولة/normal/a7b2767030.webp',
      'assets/nowfods/ناو فودز جلوكومانان 575 مل جرام 180 كبسولة/normal/d6062708cb.webp',
      'assets/nowfods/ناو فودز جلوكومانان 575 مل جرام 180 كبسولة/normal/e5c81446bc.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'glucomannan', 'weight-management', 'fiber'],
    productForm: { type: 'Capsules', typeAr: 'كبسولة', count: '180' },
    comingSoon: true,
    faq: [
      { q: 'ما هو الجلوكومانان؟', a: 'ألياف قابلة للذوبان مشتقة من جذور الكونجاك، تساعد في الحفاظ على انتظام الأمعاء ومستويات الدهون الصحية وتعزز الإحساس بالشبع لإدارة الوزن.' },
      { q: 'كيف يتم تناول الجلوكومانان؟', a: 'تناول 3 كبسولات مرة أو مرتين يوميًا مع ما لا يقل عن 8 أونصات من الماء قبل 30-45 دقيقة من وجبة الطعام.' },
      { q: 'هل المنتج خالٍ من مسببات الحساسية؟', a: 'نعم، لا يُصنع بمكونات من القمح أو الجلوتين أو الصويا أو الحليب أو البيض أو الأسماك أو المحار أو المكسرات.' }
    ]
  },
  {
    id: 'prod-023',
    title: 'Now Foods Garlic Oil 1500mg 100 Softgels',
    titleAr: 'ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية',
    description: 'Garlic oil extracted and concentrated from garlic bulb (Allium sativum), equivalent to one whole clove of garlic with no added fillers. Rich in naturally occurring sulfur compounds, amino acids, and trace minerals. Supports cardiovascular health and immune function.',
    descriptionAr: 'يتم استخلاص زيت الثوم وتركيزه من بصيلة الثوم (أليوم ساتيفوم) وهو يعادل فص ثوم كامل بدون إضافة حشوات. يزخر بمركبات الكبريت والأحماض الأمينية والمعادن النادرة. يدعم صحة القلب والأوعية الدموية والجهاز المناعي.',
    price: 1050,
    discountPercentage: 0,
    rating: 4.5,
    ratingsCount: 142,
    stock: 30,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية/front.webp',
      'assets/nowfods/ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية/normal/4ef7df1db0.webp',
      'assets/nowfods/ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية/normal/bbc88e4df5.webp',
      'assets/nowfods/ناو فودز زيت الثوم تركيز 1500 مل جرام 100 كبسولة هلامية/normal/bf7a76e890.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'garlic', 'heart-health', 'immune-support'],
    productForm: { type: 'Softgels', typeAr: 'كبسولة هلامية', count: '100' },
    faq: [
      { q: 'ما هي فوائد زيت الثوم؟', a: 'يدعم صحة القلب والأوعية الدموية، يقلل الكوليسترول الضار، يعزز الجهاز المناعي، يعمل كمضاد للأكسدة، ويساعد في تحسين الهضم والتخلص من السموم.' },
      { q: 'كيف يتم تناول زيت الثوم؟', a: 'تناول 3 كبسولات هلامية يوميًا، ويُفضل مع الطعام.' },
      { q: 'ما هي مكونات الكبسولة؟', a: 'زيت الثوم المركز يعادل فص ثوم كامل بدون حشوات، غني بمركبات الكبريت والأحماض الأمينية والمعادن النادرة.' }
    ]
  },
  {
    id: 'prod-024',
    title: 'Now Foods Evening Primrose Oil 500mg 100 Softgels',
    titleAr: 'ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية',
    description: 'Evening Primrose Oil contains naturally occurring Gamma Linolenic Acid (GLA), an omega-6 fatty acid. Supports healthy skin, balanced immune response, and women\'s health. Hexane-free extraction for maximum purity.',
    descriptionAr: 'يحتوي زيت زهرة الربيع المسائية على حمض جاما لينولينيك (GLA) الموجود بشكل طبيعي وهو حمض دهني أوميجا 6. يدعم صحة البشرة والاستجابة المناعية المتوازنة وصحة المرأة. خالٍ من الهكسان لأقصى نقاء.',
    price: 1225,
    discountPercentage: 0,
    rating: 4.6,
    ratingsCount: 198,
    stock: 25,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية/front.webp',
      'assets/nowfods/ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية/normal/94706e4339.webp',
      'assets/nowfods/ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية/normal/b1ad285df7.webp',
      'assets/nowfods/ناو فودز زيت زهرة الربيع المسائية 500 ملجرام 100 كبسولة هلامية/normal/d413ef3097.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'evening-primrose', 'omega-6', 'womens-health'],
    productForm: { type: 'Softgels', typeAr: 'كبسولة هلامية', count: '100' },
    faq: [
      { q: 'ما هي فوائد زيت زهرة الربيع المسائية؟', a: 'يدعم صحة البشرة وتقليل الالتهابات، يحسن صحة القلب، يخفف أعراض الدورة الشهرية، يدعم الجهاز العصبي، ويعزز التوازن الهرموني وجودة النوم.' },
      { q: 'كيف يتم تناوله؟', a: 'تناول 3 كبسولات هلامية يوميًا مع الطعام.' },
      { q: 'هل المنتج خالٍ من مسببات الحساسية؟', a: 'نعم، لا يحتوي على الخميرة أو القمح أو الجلوتين أو الصويا أو الذرة أو الحليب أو البيض أو الأسماك أو المحار.' }
    ]
  },
  {
    id: 'prod-025',
    title: 'Now Foods Omega-3 Fish Oil 500 EPA / 250 DHA 90 Softgels',
    titleAr: 'ناو فودز‏ زيت سمك معزز بأوميجا 3، تركيز 500 EPA ، وتركيز 250 DHA عدد 90 كبسولة هلامية',
    description: 'Molecularly distilled and enteric coated omega-3 fish oil concentrate. 500 EPA / 250 DHA per softgel. Supports heart and brain health. Odor controlled for easy consumption. Halal certified.',
    descriptionAr: 'زيت سمك مركز بأوميجا 3 مقطر جزئياً ومُغلف معوياً. تركيز 500 EPA و250 DHA لكل كبسولة. يدعم صحة القلب والدماغ. مع السيطرة على الرائحة لسهولة التناول. حاصل على شهادة حلال.',
    price: 1655,
    discountPercentage: 0,
    rating: 4.8,
    ratingsCount: 245,
    stock: 19,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز‏ زيت سمك معزز بأوميجا 3، تركيز 500 EPA ، وتركيز 250 DHA عدد 90 كبسولة هلامية/front.webp',
      'assets/nowfods/ناو فودز‏ زيت سمك معزز بأوميجا 3، تركيز 500 EPA ، وتركيز 250 DHA عدد 90 كبسولة هلامية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز‏ زيت سمك معزز بأوميجا 3، تركيز 500 EPA ، وتركيز 250 DHA عدد 90 كبسولة هلامية/normal/13295383d0.webp'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'omega-3', 'fish-oil', 'heart-health'],
    productForm: { type: 'Softgels', typeAr: 'كبسولة هلامية', count: '90' },
    faq: [
      { q: 'ما هي فوائد أوميجا 3؟', a: 'يدعم صحة القلب والدماغ، مُغلف معويًا للسيطرة على الرائحة، حاصل على شهادة حلال وكوشر.' },
      { q: 'كيف يتم تناول أوميجا 3؟', a: 'تناول كبسولة هلامية واحدة مرة أو مرتين يوميًا مع الطعام.' },
      { q: 'ما مصدر زيت السمك؟', a: 'زيت السمك منتج في بيرو والمغرب، يحتوي على الأنشوجة والسردين، مقطر جزئياً لأقصى نقاء.' }
    ]
  },
  {
    id: 'prod-026',
    title: 'Now Foods L-Tyrosine Extra Strength 750mg 90 Veg Capsules',
    titleAr: 'ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية',
    description: 'L-Tyrosine is an essential amino acid necessary for the production of neurotransmitters dopamine, adrenaline, and noradrenaline, as well as skin pigment melanin. Supports positive mood, mental alertness, and healthy thyroid function. Pharmaceutical grade.',
    descriptionAr: 'ل-تيروسين هو حمض أميني لا غنى عنه لازم لإنتاج الناقلات العصبية الدوبامين والأدرينالين والنورادرينالين وكذلك تصبغ البشرة الميلانين. يدعم المزاج الإيجابي واليقظة العقلية ووظائف الغدة الدرقية الصحية. فئة صيدلانية.',
    price: 1450,
    discountPercentage: 0,
    rating: 4.5,
    ratingsCount: 87,
    stock: 24,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية/front.webp',
      'assets/nowfods/ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية/normal/36ec49bd90.webp',
      'assets/nowfods/ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية/normal/7edb240323.webp',
      'assets/nowfods/ناو فودز‏ ل-تيروسين، 750 مل جرام، 90 كبسولة نباتية/normal/a457bd747f.webp'
    ],
    brand: 'Now Foods',
    isFeatured: false,
    tags: ['vitamins', 'l-tyrosine', 'amino-acid', 'brain-support'],
    productForm: { type: 'Capsules', typeAr: 'كبسولة', count: '90' },
    faq: [
      { q: 'ما هي فوائد ل-تيروسين؟', a: 'يحسن التركيز والذاكرة، يساعد في علاج الاكتئاب والقلق، يعزز الأداء الرياضي، يقلل آثار التعب والإجهاد، ويدعم صحة الغدة الدرقية.' },
      { q: 'كيف يتم تناول ل-تيروسين؟', a: 'تناول كبسولة إلى 3 كبسولات يوميًا، ويُفضّل بين الوجبات.' },
      { q: 'هل المنتج خالٍ من مسببات الحساسية؟', a: 'نعم، غير مصنع بمكونات من القمح أو الجلوتين أو الصويا أو الحليب أو البيض أو الأسماك أو المحار أو المكسرات.' }
    ]
  },
  {
    id: 'prod-027',
    title: 'Now Foods Ultra Omega-3 500 EPA / 250 DHA 180 Softgels',
    titleAr: 'ناو فودز‏ زيت السمك الغني بأوميجا-3 الفائق، 500 حمض الإيكوسابنتاينويك 250 حمض الدوكوساهيكسانويك 180 كبسولة',
    description: 'Ultra concentrated natural fish oil with 500 EPA / 250 DHA per softgel. Molecularly distilled with enteric coating for odor control. Supports cardiovascular health, brain function, and healthy joints. 180 softgels value size.',
    descriptionAr: 'زيت سمك طبيعي فائق التركيز بتركيز 500 EPA و250 DHA لكل كبسولة. مقطر جزئياً مع غلاف معوي للسيطرة على الرائحة. يدعم صحة القلب والأوعية الدموية ووظائف الدماغ والمفاصل الصحية. حجم اقتصادي 180 كبسولة.',
    price: 2375,
    discountPercentage: 0,
    rating: 4.9,
    ratingsCount: 328,
    stock: 12,
    categoryId: 5,
    category: 'Vitamins',
    images: [
      'assets/nowfods/ناو فودز‏, زيت السمك الغني بأوميجا-3 الفائق، 500 حمض الإيكوسابنتاينويك 250 حمض الدوكوساهيكسانويك 180 كبسولة/front.webp',
      'assets/nowfods/ناو فودز‏, زيت السمك الغني بأوميجا-3 الفائق، 500 حمض الإيكوسابنتاينويك 250 حمض الدوكوساهيكسانويك 180 كبسولة/back.webp'
    ],
    naturalImages: [
      'assets/nowfods/ناو فودز‏, زيت السمك الغني بأوميجا-3 الفائق، 500 حمض الإيكوسابنتاينويك 250 حمض الدوكوساهيكسانويك 180 كبسولة/normal/download.png'
    ],
    brand: 'Now Foods',
    isFeatured: true,
    tags: ['vitamins', 'omega-3', 'fish-oil', 'heart-health'],
    productForm: { type: 'Softgels', typeAr: 'كبسولة هلامية', count: '180' },
    faq: [
      { q: 'ما الفرق بين Ultra Omega-3 و Omega-3 العادي؟', a: 'Ultra Omega-3 يحتوي على تركيز أعلى 500 EPA / 250 DHA لكل كبسولة، مقطر جزئياً مع غلاف معوي للسيطرة على الرائحة، وبحجم اقتصادي 180 كبسولة.' },
      { q: 'ما هي دواعي الاستخدام؟', a: 'يدعم صحة القلب والأوعية الدموية، يعزز وظائف الدماغ والذاكرة، يدعم صحة العين والمفاصل، ويحسن المزاج ويدعم صحة الجلد والشعر.' },
      { q: 'كيف يتم تناوله؟', a: 'تناول كبسولة هلامية واحدة مرة أو مرتين يوميًا مع الطعام.' }
    ]
  },

  // ── Accessories (2) ──
  {
    id: 'prod-017',
    title: 'Genuine Leather Bifold Wallet',
    titleAr: 'محفظة جلد طبيعي ثنائية الطي',
    description: 'Slim bifold wallet crafted from full-grain leather. Features RFID blocking, 8 card slots, 2 bill compartments, and ID window.',
    descriptionAr: 'محفظة ثنائية الطي رفيعة مصنوعة من الجلد الطبيعي الكامل. تتميز بحماية RFID، 8 جيوب للبطاقات، حجرتين للأوراق النقدية، ونافذة للهوية.',
    price: 54.99,
    discountPercentage: 10,
    rating: 4.4,
    ratingsCount: 201,
    stock: 31,
    categoryId: 6,
    category: 'accessories',
    images: [
      'https://picsum.photos/seed/wallet1/600/600',
      'https://picsum.photos/seed/wallet2/600/600',
      'https://picsum.photos/seed/wallet3/600/600'
    ],
    brand: 'LeatherCraft',
    isFeatured: false,
    tags: ['wallet', 'leather', 'rfid']
  },
  {
    id: 'prod-018',
    title: 'Polarized Aviator Sunglasses',
    titleAr: 'نظارات شمسية أفياتور مستقطبة',
    description: 'Classic aviator sunglasses with polarized lenses for 100% UV protection. Lightweight metal frame with spring hinges for comfort.',
    descriptionAr: 'نظارات شمسية أفياتور كلاسيكية بعدسات مستقطبة لحماية 100% من الأشعة فوق البنفسجية. إطار معدني خفيف مع مفصلات زنبركية للراحة.',
    price: 64.99,
    discountPercentage: 15,
    rating: 4.3,
    ratingsCount: 176,
    stock: 24,
    categoryId: 6,
    category: 'accessories',
    images: [
      'https://picsum.photos/seed/sunglasses1/600/600',
      'https://picsum.photos/seed/sunglasses2/600/600',
      'https://picsum.photos/seed/sunglasses3/600/600'
    ],
    brand: 'VisionPro',
    isFeatured: true,
    tags: ['sunglasses', 'polarized', 'uv']
  }
];

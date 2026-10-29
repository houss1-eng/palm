// Catalogue par défaut — modifiable depuis l'espace admin (admin.html).
// price: null => "Prix sur demande". oldPrice => prix barré (promo).
// image : photo de la carte (img/… fournie avec l'app, ou /api/images/… envoyée depuis l'admin).
window.PALM_DEFAULT = {
  settings: {
    phone: "+21622807207",
    instagram: "_.palm.beauty.centre._",
    city: { fr: "Gabès", ar: "قابس" },
    openHour: 9,
    closeHour: 19,
    // Photo d'accueil (null = img/hero.jpg) et chiffres de la bande « Pourquoi Palm ».
    heroImage: null,
    stats: { years: 20, brands: 3 },
    // Textes du site modifiables depuis l'admin (onglet Site).
    texts: {
      tagline: { fr: "Spa · Hammam · Beauté · Laser", ar: "سبا · حمّام · تجميل · ليزر" },
      heroTitle: { fr: "Votre moment de beauté et de sérénité", ar: "لحظتك للجمال والراحة" },
      heroText: {
        fr: "Hammam privé, soins visage et corps, coiffure, épilation laser et tout ce qu'il faut pour la mariée — réunis dans un seul centre à Gabès.",
        ar: "حمّام خاص، عناية بالوجه والجسم، تسريحات، إزالة الشعر بالليزر وكل ما تحتاجه العروسة — في مركز واحد بقابس."
      },
      exp: { fr: "Technicienne laser · 20 ans d'expérience", ar: "تقنية ليزر · 20 سنة خبرة" },
      brands: { fr: "THALGO · NUXE · KÉRASTASE", ar: "THALGO · NUXE · KÉRASTASE" },
      packsKicker: { fr: "Rituels signature", ar: "طقوس مميّزة" },
      packsTitle: { fr: "Nos packs signature", ar: "باقاتنا المميزة" },
      packsSub: { fr: "Le hammam traditionnel, sublimé.", ar: "الحمّام التقليدي بلمسة فاخرة." },
      whyYears: { fr: "ans d'expérience laser", ar: "سنة خبرة في الليزر" },
      whyBrands: { fr: "marques pro : Thalgo, Nuxe, Kérastase", ar: "ماركات محترفة: Thalgo، Nuxe، Kérastase" },
      brideKicker: { fr: "Le grand jour", ar: "النهار الكبير" },
      brideTitle: { fr: "Spécial Mariée", ar: "خاص بالعروسة" },
      brideSub: {
        fr: "Hammam, soins, laser, épilation, coiffure : tout ce dont la mariée a besoin, au même endroit.",
        ar: "حمّام، عناية، ليزر، إزالة الشعر، تسريحة: كل ما تحتاجه العروسة في مكان واحد."
      },
      servicesKicker: { fr: "La carte", ar: "قائمة الخدمات" },
      servicesTitle: { fr: "Tous nos services", ar: "جميع خدماتنا" },
      contactTitle: { fr: "Nous contacter", ar: "اتصلي بنا" }
    },
    adminPin: "1234"
  },

  categories: [
    { id: "packs",     icon: "🌴", name: { fr: "Hammam & Packs",  ar: "الحمّام والباقات" } },
    { id: "visage",    icon: "✨", name: { fr: "Soins visage",    ar: "العناية بالوجه" } },
    { id: "corps",     icon: "🪷", name: { fr: "Soins corps",     ar: "العناية بالجسم" } },
    { id: "coiffure",  icon: "💇‍♀️", name: { fr: "Coiffure & cheveux", ar: "الشعر والتسريحات" } },
    { id: "laser",     icon: "💎", name: { fr: "Épilation laser", ar: "إزالة الشعر بالليزر" } },
    { id: "epilation", icon: "🌸", name: { fr: "Épilation classique", ar: "إزالة الشعر التقليدية" } }
  ],

  services: [
    // ---------- Packs hammam ----------
    {
      id: "gold-ritual", image: "img/gold-ritual.jpg", cat: "packs", featured: true, bridal: true, active: true,
      name: { fr: "Palm Gold Ritual", ar: "طقوس بالم الذهبية" },
      desc: { fr: "Luxe · Beauté · Bien-être — l'expérience ultime du bien-être.", ar: "فخامة · جمال · راحة — تجربة الاسترخاء القصوى." },
      price: 99, oldPrice: null, duration: 180,
      badge: { fr: "Best-seller", ar: "الأكثر طلباً" },
      items: [
        { fr: "Hammam privé", ar: "حمام خاص" },
        { fr: "Savon noir marocain – gommage au gant kessa", ar: "صابون بلدي مغربي – تكسيل بالكاسة" },
        { fr: "Enveloppement nourrissant au ghassoul", ar: "لفافة مغذية بالطفل (غاسول)" },
        { fr: "Modelage relaxant 20 min – huile NUXE", ar: "تدليك استرخائي 20 دقيقة – زيت NUXE" },
        { fr: "Rituel mains & pieds THALGO", ar: "عناية باليدين والقدمين THALGO" },
        { fr: "Soin visage THALGO", ar: "عناية بالوجه THALGO" },
        { fr: "Lavage des cheveux – shampooing KÉRASTASE", ar: "غسل الشعر – شامبو KÉRASTASE" },
        { fr: "Brushing", ar: "براشينغ" },
        { fr: "Serviette chaude parfumée", ar: "منشفة ساخنة معطّرة" },
        { fr: "Body & hair mist signature PALM", ar: "بخاخ الجسم والشعر من PALM" },
        { fr: "Sachet parfumé PALM", ar: "كيس معطّر PALM" }
      ]
    },
    {
      id: "oriental-ritual", image: "img/oriental-ritual.jpg", cat: "packs", featured: true, bridal: true, active: true,
      name: { fr: "Palm Oriental Ritual", ar: "طقوس بالم الشرقية" },
      desc: { fr: "Tradition · Beauté · Bien-être — une parenthèse de beauté et de sérénité.", ar: "تقاليد · جمال · راحة — لحظة جمال وهدوء." },
      price: 79, oldPrice: null, duration: 150,
      badge: null,
      items: [
        { fr: "Hammam privé", ar: "حمام خاص" },
        { fr: "Savon noir marocain – gommage au gant kessa", ar: "صابون بلدي مغربي – تكسيل بالكاسة" },
        { fr: "Enveloppement nourrissant au ghassoul", ar: "لفافة مغذية بالطفل (غاسول)" },
        { fr: "Modelage relaxant 15 min – huile NUXE", ar: "تدليك استرخائي 15 دقيقة – زيت NUXE" },
        { fr: "Rituel mains & pieds THALGO", ar: "عناية باليدين والقدمين THALGO" },
        { fr: "Soin visage THALGO", ar: "عناية بالوجه THALGO" },
        { fr: "Lavage des cheveux – shampooing KÉRASTASE", ar: "غسل الشعر – شامبو KÉRASTASE" },
        { fr: "Serviette chaude parfumée", ar: "منشفة ساخنة معطّرة" },
        { fr: "Body & hair mist signature PALM", ar: "بخاخ الجسم والشعر من PALM" },
        { fr: "Sachet parfumé PALM", ar: "كيس معطّر PALM" }
      ]
    },
    {
      id: "pack-vip", image: "img/pack-vip.jpg", cat: "packs", featured: true, bridal: true, active: true,
      name: { fr: "Pack VIP", ar: "باقة VIP" },
      desc: { fr: "Le pack complet hammam + jacuzzi + massage.", ar: "الباقة الكاملة: حمّام + جاكوزي + تدليك." },
      price: 60, oldPrice: null, duration: 180,
      badge: null,
      items: [
        { fr: "Salle vapeur", ar: "غرفة البخار" },
        { fr: "Savon marocain", ar: "صابون مغربي" },
        { fr: "7arza", ar: "حرزة" },
        { fr: "Gommage", ar: "تقشير" },
        { fr: "Enveloppement argile verte", ar: "لفافة الطين الأخضر" },
        { fr: "Mini soin mains & pieds + masque visage", ar: "عناية خفيفة باليدين والقدمين + ماسك للوجه" },
        { fr: "Modelage 7 min", ar: "تدليك 7 دقائق" },
        { fr: "Masque corps complet barouk", ar: "ماسك كامل للجسم بالبروك" },
        { fr: "Lavage cheveux et savonnage", ar: "غسل الشعر والتصبين" },
        { fr: "15 min jacuzzi", ar: "15 دقيقة جاكوزي" },
        { fr: "15 min massage corps complet", ar: "15 دقيقة تدليك كامل للجسم" },
        { fr: "Hydratation du corps au lait", ar: "ترطيب الجسم بالحليب" },
        { fr: "Brushing", ar: "براشينغ" }
      ]
    },
    {
      id: "pack-standard", image: "img/pack-standard.jpg", cat: "packs", featured: true, bridal: false, active: true,
      name: { fr: "Pack Standard", ar: "الباقة العادية" },
      desc: { fr: "L'essentiel du hammam traditionnel.", ar: "أساسيات الحمّام التقليدي." },
      price: 25, oldPrice: null, duration: 120,
      badge: null,
      items: [
        { fr: "Salle vapeur", ar: "غرفة البخار" },
        { fr: "Savon marocain", ar: "صابون مغربي" },
        { fr: "7arza", ar: "حرزة" },
        { fr: "Gommage", ar: "تقشير" },
        { fr: "Enveloppement argile verte", ar: "لفافة الطين الأخضر" },
        { fr: "Mini soin mains & pieds + masque visage", ar: "عناية خفيفة باليدين والقدمين + ماسك للوجه" },
        { fr: "Lavage cheveux et savonnage", ar: "غسل الشعر والتصبين" },
        { fr: "Massage relaxant 5 min", ar: "تدليك استرخائي 5 دقائق" }
      ]
    },
    {
      id: "pack-nuit", image: "img/pack-nuit.jpg", cat: "packs", featured: false, bridal: false, active: true,
      name: { fr: "Pack de Nuit", ar: "باقة الليل" },
      desc: { fr: "Nouveau ! Le pack en soirée : sans massage, remplacé par une séance de modelage relaxant. Places limitées.", ar: "جديد! حرصاً على راحة حرفائنا: بدون مساج، ويتم تعويضه بجلسة modelage relaxant. الأماكن محدودة." },
      price: null, oldPrice: null, duration: 150,
      badge: { fr: "Nouveau", ar: "جديد" },
      items: []
    },

    // ---------- Visage ----------
    {
      id: "hydrafacial", image: "img/hydrafacial.jpg", cat: "visage", featured: false, bridal: true, active: true,
      name: { fr: "HydraFacial", ar: "هيدرافيشل" },
      desc: { fr: "Nettoyage profond, hydratation et éclat — chaque étape expliquée par Mme Amel.", ar: "تنظيف عميق وترطيب وإشراقة — كل مرحلة تشرحها لك مدام آمال." },
      price: null, oldPrice: null, duration: 60, badge: null, items: []
    },
    {
      id: "soin-visage-thalgo", image: "img/soin-visage.jpg", cat: "visage", featured: false, bridal: true, active: true,
      name: { fr: "Soin visage THALGO", ar: "عناية بالوجه THALGO" },
      desc: { fr: "Soin professionnel adapté à votre type de peau.", ar: "عناية احترافية حسب نوع بشرتك." },
      price: null, oldPrice: null, duration: 45, badge: null, items: []
    },
    {
      id: "hifu", image: "img/hifu.jpg", cat: "visage", featured: false, bridal: false, active: true,
      name: { fr: "HIFU D25", ar: "هايفو D25" },
      desc: { fr: "Lifting sans chirurgie par ultrasons focalisés — nouvelle technologie chez Palm Luxury.", ar: "شدّ الوجه بدون جراحة بالموجات فوق الصوتية — تقنية جديدة في بالم." },
      price: null, oldPrice: null, duration: 60, badge: { fr: "Bientôt", ar: "قريباً" }, items: []
    },

    // ---------- Corps ----------
    {
      id: "modelage-relaxant", image: "img/modelage.jpg", cat: "corps", featured: false, bridal: true, active: true,
      name: { fr: "Modelage relaxant", ar: "تدليك استرخائي" },
      desc: { fr: "Modelage du corps à l'huile NUXE.", ar: "تدليك الجسم بزيت NUXE." },
      price: null, oldPrice: null, duration: 30, badge: null, items: []
    },
    {
      id: "rituel-mains-pieds", image: "img/mains-pieds.jpg", cat: "corps", featured: false, bridal: true, active: true,
      name: { fr: "Rituel mains & pieds", ar: "عناية باليدين والقدمين" },
      desc: { fr: "Soin complet THALGO pour mains et pieds.", ar: "عناية كاملة THALGO لليدين والقدمين." },
      price: null, oldPrice: null, duration: 45, badge: null, items: []
    },

    // ---------- Coiffure ----------
    {
      id: "soin-aloe-vera", image: "img/soin-aloe-vera.jpg", cat: "coiffure", featured: false, bridal: true, active: true,
      name: { fr: "Soin capillaire à l'Aloe Vera", ar: "عناية بالشعر بالألوفيرا" },
      desc: { fr: "Lissage et brillance, toutes longueurs de cheveux.", ar: "تنعيم ولمعان، لجميع أطوال الشعر." },
      price: 40, oldPrice: 60, duration: 90, badge: { fr: "Promo", ar: "تخفيض" }, items: []
    },
    {
      id: "brushing", image: "img/brushing.jpg", cat: "coiffure", featured: false, bridal: true, active: true,
      name: { fr: "Brushing", ar: "براشينغ" },
      desc: { fr: "Lavage KÉRASTASE + brushing.", ar: "غسل بـ KÉRASTASE + براشينغ." },
      price: null, oldPrice: null, duration: 45, badge: null, items: []
    },
    {
      id: "coiffure-mariee", image: "img/coiffure-mariee.jpg", cat: "coiffure", featured: false, bridal: true, active: true,
      name: { fr: "Coiffure mariée", ar: "تسريحة العروسة" },
      desc: { fr: "Coiffure du grand jour, essai possible.", ar: "تسريحة اليوم الكبير، مع إمكانية التجربة." },
      price: null, oldPrice: null, duration: 120, badge: null, items: []
    },

    // ---------- Laser (prix par séance) ----------
    { id: "laser-visage", image: "img/laser-visage.jpg",      cat: "laser", active: true, bridal: false, name: { fr: "Visage complet", ar: "الوجه كامل" }, price: 100, duration: 30 },
    { id: "laser-levre", image: "img/laser-visage.jpg",       cat: "laser", active: true, bridal: false, name: { fr: "Lèvre supérieure (moustache)", ar: "الشفة العليا" }, price: 60, duration: 15 },
    { id: "laser-menton", image: "img/laser-visage.jpg",      cat: "laser", active: true, bridal: false, name: { fr: "Menton", ar: "الذقن" }, price: 60, duration: 15 },
    { id: "laser-corps", image: "img/laser-centre.jpg",       cat: "laser", active: true, bridal: false, name: { fr: "Corps complet", ar: "الجسم كامل" }, price: 450, duration: 120 },
    { id: "laser-aisselles", image: "img/laser-centre.jpg",   cat: "laser", active: true, bridal: false, name: { fr: "Aisselles", ar: "الإبطين" }, price: 80, duration: 15 },
    { id: "laser-bras", image: "img/laser-lancement.jpg",        cat: "laser", active: true, bridal: false, name: { fr: "Bras complets", ar: "الذراعين كامل" }, price: 120, duration: 30 },
    { id: "laser-avant-bras", image: "img/laser-lancement.jpg",  cat: "laser", active: true, bridal: false, name: { fr: "Avant-bras", ar: "الساعدين" }, price: 90, duration: 20 },
    { id: "laser-jambes", image: "img/laser-centre.jpg",      cat: "laser", active: true, bridal: false, name: { fr: "Jambes", ar: "الساقين كامل" }, price: 190, duration: 45 },
    { id: "laser-demi-jambes", image: "img/laser-centre.jpg", cat: "laser", active: true, bridal: false, name: { fr: "Demi-jambes", ar: "نصف الساقين" }, price: 150, duration: 30 },
    { id: "laser-maillot", image: "img/laser-prix.jpg",     cat: "laser", active: true, bridal: false, name: { fr: "Maillot classique", ar: "البيكيني الكلاسيكي" }, price: 100, duration: 20 },
    { id: "laser-maillot-int", image: "img/laser-prix.jpg", cat: "laser", active: true, bridal: false, name: { fr: "Maillot intégral", ar: "البيكيني الكامل" }, price: 120, duration: 25 },

    // Offres mariée laser (6 séances)
    {
      id: "laser-pack-essentiel", image: "img/laser-mariee.jpg", cat: "laser", featured: false, bridal: true, active: true,
      name: { fr: "Pack Essentiel – 6 séances", ar: "باقة أساسية – 6 جلسات" },
      desc: { fr: "Aisselles + maillot intégral.", ar: "الإبطين + البيكيني الكامل." },
      price: 950, oldPrice: 1200, duration: 40, badge: { fr: "Spécial mariée", ar: "خاص بالعروسة" }, items: []
    },
    {
      id: "laser-pack-femme", image: "img/laser-mariee.jpg", cat: "laser", featured: false, bridal: true, active: true,
      name: { fr: "Pack Femme – 6 séances", ar: "باقة المرأة – 6 جلسات" },
      desc: { fr: "Jambes + aisselles + maillot intégral.", ar: "الساقين + الإبطين + البيكيني الكامل." },
      price: 1950, oldPrice: 2340, duration: 90, badge: { fr: "Spécial mariée", ar: "خاص بالعروسة" }, items: []
    },
    {
      id: "laser-pack-bridal", image: "img/laser-mariee.jpg", cat: "laser", featured: false, bridal: true, active: true,
      name: { fr: "Bridal Pack – 6 séances", ar: "باقة العروسة – 6 جلسات" },
      desc: { fr: "Corps complet + visage.", ar: "الجسم كامل + الوجه." },
      price: 2700, oldPrice: 3300, duration: 150, badge: { fr: "Spécial mariée", ar: "خاص بالعروسة" }, items: []
    },

    // ---------- Épilation classique ----------
    { id: "epil-sourcils", image: "img/sourcils.jpg", cat: "epilation", active: true, bridal: true, name: { fr: "Sourcils", ar: "الحواجب" }, price: null, duration: 15 },
    { id: "epil-visage", image: "img/epil-visage.jpg",   cat: "epilation", active: true, bridal: true, name: { fr: "Visage", ar: "الوجه" }, price: null, duration: 20 },
    { id: "epil-jambes", image: "img/epil-jambes.jpg",   cat: "epilation", active: true, bridal: true, name: { fr: "Jambes complètes", ar: "الساقين كامل" }, price: null, duration: 40 },
    { id: "epil-corps", image: "img/epil-corps.jpg",    cat: "epilation", active: true, bridal: true, name: { fr: "Corps complet (spécial mariée)", ar: "الجسم كامل (خاص بالعروسة)" }, price: null, duration: 90 }
  ]
};

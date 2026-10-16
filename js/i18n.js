/**
 * ============================================================================
 * WB CREDIT UNION - MASTER FULL-SITE MULTI-LANGUAGE ENGINE (js/i18n.js)
 * ============================================================================
 * 
 * 10-Language Institutional Multi-Language Engine:
 * 🇺🇸 EN (English), 🇪🇸 ES (Español), 🇫🇷 FR (Français), 🇩🇪 DE (Deutsch),
 * 🇸🇪 SV (Svenska), 🇨🇳 ZH (简体中文), 🇦🇪 AR (العربية - RTL), 🇵🇹 PT (Português),
 * 🇯🇵 JA (日本語), 🇮🇹 IT (Italiano).
 * 
 * Features:
 * 1. Synchronous Whole-DOM Universal Node Translation across ALL Pages
 * 2. Lossless English Original Caching for Instant Seamless Switching
 * 3. Deep Phrase & Sentence Dictionary across Home, About, Services, Contact,
 *    Legal, Login, Registration, Dashboard, and Admin
 * 4. Word-Level Banking Vocabulary Translation Fallback
 * 5. Full-Site Persistent Google Translate Element Integration (googtrans cookies)
 * 6. Dynamic DOM MutationObserver for Tabs, Modals, Tables, and Forms
 * ============================================================================
 */

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '简体中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪', dir: 'rtl' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
];

const STORAGE_KEY = 'wbcu_selected_language';

const GOOGLE_LANG_MAP = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  sv: 'sv',
  zh: 'zh-CN',
  ar: 'ar',
  pt: 'pt',
  ja: 'ja',
  it: 'it'
};

/**
 * ============================================================================
 * 1. COMPREHENSIVE PHRASE DICTIONARY FOR THE ENTIRE WEBSITE
 * ============================================================================
 */
export const PHRASE_DICTIONARY = {
  // Navigation & Actions
  "Home": {
    es: "Inicio", fr: "Accueil", de: "Startseite", sv: "Hem", zh: "首页", ar: "الرئيسية", pt: "Início", ja: "ホーム", it: "Home"
  },
  "About Us": {
    es: "Nosotros", fr: "À Propos", de: "Über uns", sv: "Om oss", zh: "关于我们", ar: "من نحن", pt: "Sobre Nós", ja: "会社概要", it: "Chi Siamo"
  },
  "Services": {
    es: "Servicios", fr: "Services", de: "Dienstleistungen", sv: "Tjänster", zh: "服务", ar: "الخدمات", pt: "Serviços", ja: "サービス", it: "Servizi"
  },
  "Contact": {
    es: "Contacto", fr: "Contact", de: "Kontakt", sv: "Kontakt", zh: "联系我们", ar: "اتصل بنا", pt: "Contato", ja: "お問い合わせ", it: "Contatti"
  },
  "Contact Us": {
    es: "Contáctenos", fr: "Contactez-nous", de: "Kontaktieren Sie uns", sv: "Kontakta oss", zh: "联系我们", ar: "اتصل بنا", pt: "Fale Conosco", ja: "お問い合わせ", it: "Contattaci"
  },
  "Login to Banking": {
    es: "Banca en Línea", fr: "Accès Banque", de: "Online-Banking", sv: "Logga in", zh: "登录网银", ar: "تسجيل الدخول", pt: "Acessar Conta", ja: "ログイン", it: "Accedi"
  },
  "Open Account Today": {
    es: "Abrir Cuenta Hoy", fr: "Ouvrir un Compte", de: "Konto eröffnen", sv: "Öppna konto", zh: "立即开户", ar: "افتح حساب اليوم", pt: "Abrir Conta Hoje", ja: "口座開設", it: "Apri un Conto"
  },
  "Open an Account": {
    es: "Abrir una Cuenta", fr: "Ouvrir un Compte", de: "Konto eröffnen", sv: "Öppna ett konto", zh: "开立账户", ar: "فتح حساب", pt: "Abrir uma Conta", ja: "口座を開設する", it: "Apri un Conto"
  },
  "Sign Out": {
    es: "Cerrar Sesión", fr: "Déconnexion", de: "Abmelden", sv: "Logga ut", zh: "退出登录", ar: "تسجيل الخروج", pt: "Sair", ja: "ログアウト", it: "Esci"
  },
  "Logout": {
    es: "Cerrar Sesión", fr: "Déconnexion", de: "Abmelden", sv: "Logga ut", zh: "退出登录", ar: "تسجيل الخروج", pt: "Sair", ja: "ログアウト", it: "Esci"
  },
  "Dashboard": {
    es: "Panel Principal", fr: "Tableau de Bord", de: "Dashboard", sv: "Översikt", zh: "控制面板", ar: "لوحة التحكم", pt: "Painel", ja: "ダッシュボード", it: "Dashboard"
  },
  "User Dashboard": {
    es: "Panel de Usuario", fr: "Tableau de Bord Membre", de: "Benutzer-Dashboard", sv: "Användarpanel", zh: "用户控制面板", ar: "لوحة تحكم المستخدم", pt: "Painel do Usuário", ja: "ユーザーダッシュボード", it: "Dashboard Utente"
  },
  "Admin Portal": {
    es: "Portal Administrativo", fr: "Portail Administrateur", de: "Admin-Portal", sv: "Administratörsportal", zh: "管理门户", ar: "بوابة الإدارة", pt: "Portal Administrativo", ja: "管理ポータル", it: "Portale Amministratore"
  },
  "Institutional Oversight": {
    es: "Supervisión Institucional", fr: "Supervision Institutionnelle", de: "Institutionelle Aufsicht", sv: "Institutionell tillsyn", zh: "机构监管入口", ar: "الرقابة المؤسسية", pt: "Supervisão Institucional", ja: "機関監査ポータル", it: "Supervisione Istituzionale"
  },
  "Customer Support": {
    es: "Atención al Cliente", fr: "Support Client", de: "Kundenservice", sv: "Kundsupport", zh: "客户支持", ar: "دعم العملاء", pt: "Suporte ao Cliente", ja: "カスタマーサポート", it: "Assistenza Clienti"
  },
  "Privacy Policy": {
    es: "Política de Privacidad", fr: "Politique de Confidentialité", de: "Datenschutzerklärung", sv: "Integritetspolicy", zh: "隐私政策", ar: "سياسة الخصوصية", pt: "Política de Privacidade", ja: "プライバシーポリシー", it: "Informativa sulla Privacy"
  },
  "Terms of Service": {
    es: "Términos del Servicio", fr: "Conditions d'Utilisation", de: "Nutzungsbedingungen", sv: "Användarvillkor", zh: "服务条款", ar: "شروط الخدمة", pt: "Termos de Serviço", ja: "利用規約", it: "Termini di Servizio"
  },
  "Accessibility Statement": {
    es: "Declaración de Accesibilidad", fr: "Déclaration d'Accessibilité", de: "Barrierefreiheit", sv: "Tillgänglighetsredogörelse", zh: "无障碍声明", ar: "بيان إمكانية الوصول", pt: "Declaração de Acessibilidade", ja: "アクセシビリティ方針", it: "Dichiarazione di Accessibilità"
  },

  // Hero Section & Taglines
  "Modern banking experience": {
    es: "Experiencia bancaria moderna", fr: "Expérience bancaire moderne", de: "Modernes Banking-Erlebnis", sv: "Modern bankupplevelse", zh: "现代数字银行体验", ar: "تجربة مصرفية حديثة", pt: "Experiência bancária moderna", ja: "最新のデジタルバンキング体験", it: "Esperienza bancaria moderna"
  },
  "WB CREDIT UNION": {
    es: "WB CREDIT UNION", fr: "WB CREDIT UNION", de: "WB CREDIT UNION", sv: "WB CREDIT UNION", zh: "WB 信用合作社", ar: "اتحاد ائتمان WB", pt: "WB CREDIT UNION", ja: "WB信用組合", it: "WB CREDIT UNION"
  },
  "We do banking differently. We believe that people come first, and that everyone deserves a great experience every step of the way.": {
    es: "Hacemos banca de manera diferente. Creemos que las personas son lo primero y que todos merecen una experiencia extraordinaria en cada paso.",
    fr: "Nous réinventons la banque. L’humain passe avant tout, et chaque membre bénéficie d’un service d’excellence à chaque étape.",
    de: "Wir machen Banking anders. Bei uns steht der Mensch im Mittelpunkt, und jeder verdient bei jedem Schritt ein großartiges Erlebnis.",
    sv: "Vi gör bankverksamhet annorlunda. Vi sätter människor först och ser till att alla får en enastående upplevelse hela vägen.",
    zh: "我们以非凡的方式提供银行服务。我们坚信以人为本，每位会员在每一个环节都值得享受卓越的体验。",
    ar: "نحن نقدم الخدمات المصرفية بأسلوب مختلف. نؤمن بأن الأفراد هم الأولوية الأولى وأن الجميع يستحق تجربة استثنائية في كل خطوة.",
    pt: "Fazemos transações bancárias de forma diferente. Acreditamos que as pessoas vêm em primeiro lugar e que todos merecem uma experiência extraordinária.",
    ja: "私たちは新しい形のバンキングを提供します。人を第一に考え、すべてのステップで最高の体験をお届けします。",
    it: "Facciamo banca in modo diverso. Crediamo che le persone vengano prima di tutto e che tutti meritino un'esperienza straordinaria in ogni momento."
  },
  "ABA Routing #": {
    es: "Nº de Ruta ABA", fr: "Code Banque ABA", de: "ABA-Routing-Nr.", sv: "ABA Routing-nr", zh: "ABA 汇款路径号", ar: "رقم توجيه ABA", pt: "Nº de Roteamento ABA", ja: "ABAルーティング番号", it: "Routing ABA"
  },
  "Direct Deposit & Wires": {
    es: "Depósito Directo y Giros", fr: "Dépôts et Virements", de: "Direkteinzahlung & Wires", sv: "Direktinsättning & Överföring", zh: "直接存款与电汇", ar: "إيداع مباشر وتحويلات", pt: "Depósito Direto e Transferências", ja: "口座振込および電信送金", it: "Deposito Diretto e Bonifici"
  },
  "Branch Hours": {
    es: "Horario de Atención", fr: "Horaires d’Ouverture", de: "Filial-Öffnungszeiten", sv: "Öppettider", zh: "网点营业时间", ar: "ساعات عمل الفرع", pt: "Horário de Atendimento", ja: "営業時間", it: "Orari di Apertura"
  },
  "Mon–Fri: 9AM–5PM": {
    es: "Lun–Vie: 9:00–17:00", fr: "Lun–Ven: 9h–17h", de: "Mo–Fr: 9:00–17:00", sv: "Mån–Fre: 09:00–17:00", zh: "周一至周五: 9:00–17:00", ar: "الإثنين–الجمعة: 9 ص–5 م", pt: "Seg–Sex: 9h–17h", ja: "月〜金: 9:00〜17:00", it: "Lun–Ven: 9:00–17:00"
  },
  "Sat: 9AM–1PM | Sun: Closed": {
    es: "Sáb: 9:00–13:00 | Dom: Cerrado", fr: "Sam: 9h–13h | Dim: Fermé", de: "Sa: 9:00–13:00 | So: Geschlossen", sv: "Lör: 09:00–13:00 | Sön: Stängt", zh: "周六: 9:00–13:00 | 周日: 休息", ar: "السبت: 9 ص–1 م | الأحد: مغلق", pt: "Sáb: 9h–13h | Dom: Fechado", ja: "土: 9:00〜13:00 | 日: 定休日", it: "Sab: 9:00–13:00 | Dom: Chiuso"
  },
  "24/7 Support": {
    es: "Soporte 24/7", fr: "Assistance 24/7", de: "24/7 Support", sv: "24/7 Support", zh: "24/7 全天候支持", ar: "دعم 24/7", pt: "Suporte 24/7", ja: "24時間365日サポート", it: "Supporto 24/7"
  },
  "Always here to help": {
    es: "Siempre a su servicio", fr: "Toujours à vos côtés", de: "Immer für Sie da", sv: "Alltid här för att hjälpa", zh: "时刻为您竭诚服务", ar: "دائماً في خدمتكم", pt: "Sempre prontos para ajudar", ja: "いつでもサポートいたします", it: "Sempre pronti ad aiutarti"
  },

  // Rates & Cards Section
  "WB CREDIT UNION Rates": {
    es: "Tasas y Rendimientos WB CREDIT UNION", fr: "Taux WB CREDIT UNION", de: "WB CREDIT UNION Zinssätze", sv: "WB CREDIT UNION Räntor", zh: "WB 信用合作社优质利率", ar: "أسعار عوائد اتحاد ائتمان WB", pt: "Taxas WB CREDIT UNION", ja: "WB信用組合の優遇金利", it: "Tassi WB CREDIT UNION"
  },
  "Discover competitive rates designed to help your money grow faster": {
    es: "Descubra tasas competitivas diseñadas para hacer crecer su patrimonio más rápido",
    fr: "Découvrez des taux compétitifs conçus pour faire fructifier votre capital",
    de: "Entdecken Sie attraktive Renditen für maximales Vermögenswachstum",
    sv: "Upptäck konkurrenskraftiga räntor utformade för att få dina pengar att växa snabbare",
    zh: "探索极具竞争力的利率，助力您的财富加速稳健增长",
    ar: "اكتشف أسعاراً تنافسية مصممة لمساعدة أموالك على النمو بسرعة",
    pt: "Descubra taxas competitivas criadas para fazer seu dinheiro render mais rápido",
    ja: "資産をスピーディーに増やすための競争力ある優遇金利をご活用ください",
    it: "Scopri tassi competitivi studiati per far crescere il tuo denaro più velocemente"
  },
  "Featured": {
    es: "Destacado", fr: "En Vedette", de: "Empfohlen", sv: "Utvald", zh: "特别推荐", ar: "مميز", pt: "Destaque", ja: "おすすめ", it: "In Evidenza"
  },
  "Savings": {
    es: "Ahorros", fr: "Épargne", de: "Sparen", sv: "Sparande", zh: "储蓄账户", ar: "ادخار", pt: "Poupança", ja: "普通・定期預金", it: "Risparmio"
  },
  "Credit": {
    es: "Crédito", fr: "Crédit", de: "Kredit", sv: "Kredit", zh: "信贷信用卡", ar: "ائتمان", pt: "Crédito", ja: "クレジット", it: "Credito"
  },
  "Mortgage": {
    es: "Hipotecas", fr: "Prêt Immobilier", de: "Hypothek", sv: "Bolån", zh: "房屋抵押贷款", ar: "تمويل عقاري", pt: "Financiamento Imobiliário", ja: "住宅ローン", it: "Mutui"
  },
  "High Yield Savings (APY*)": {
    es: "Ahorro de Alto Rendimiento (APY*)", fr: "Épargne à Haut Rendement (APY*)", de: "Tagesgeld mit Top-Rendite (APY*)", sv: "Högräntekonto (APY*)", zh: "高收益储蓄账户 (APY*)", ar: "ادخار عالي العائد (APY*)", pt: "Poupança de Alto Rendimento (APY*)", ja: "高利回り普通預金 (APY*)", it: "Conto Deposito ad Alto Rendimento (APY*)"
  },
  "18 Month Certificate (APY*)": {
    es: "Certificado a 18 Meses (APY*)", fr: "Certificat de Dépôt 18 Mois (APY*)", de: "18-Monate Sparbrief (APY*)", sv: "18-månaders Fasträntekonto (APY*)", zh: "18个月定期存单 (APY*)", ar: "شهادة إيداع 18 شهراً (APY*)", pt: "Certificado de 18 Meses (APY*)", ja: "18ヶ月 定期預金証書 (APY*)", it: "Certificato di Deposito 18 Mesi (APY*)"
  },
  "Credit Cards (APR*)": {
    es: "Tarjetas de Crédito (APR*)", fr: "Cartes de Crédit (APR*)", de: "Kreditkarten (APR*)", sv: "Kreditkort (APR*)", zh: "低息信用卡 (APR*)", ar: "بطاقات الائتمان (APR*)", pt: "Cartões de Crédito (APR*)", ja: "低金利クレジットカード (APR*)", it: "Carte di Credito (APR*)"
  },
  "Loans / Mortgage (APR*)": {
    es: "Préstamos e Hipotecas (APR*)", fr: "Prêts & Hypothèques (APR*)", de: "Kredite & Baufinanzierung (APR*)", sv: "Lån & Bolån (APR*)", zh: "贷款与房屋按揭 (APR*)", ar: "قروض وتمويل عقاري (APR*)", pt: "Empréstimos e Hipotecas (APR*)", ja: "各種ローン / 住宅ローン (APR*)", it: "Prestiti e Mutui (APR*)"
  },
  "Open Savings": {
    es: "Abrir Ahorro", fr: "Ouvrir un Compte Épargne", de: "Sparkonto eröffnen", sv: "Öppna sparkonto", zh: "开通储蓄账户", ar: "افتح حساب ادخار", pt: "Abrir Poupança", ja: "口座を開設する", it: "Apri Conto Risparmio"
  },
  "Lock In Rate": {
    es: "Garantizar Tasa", fr: "Bloquer le Taux", de: "Zins sichern", sv: "Lås räntan", zh: "锁定优惠利率", ar: "تثبيت السعر", pt: "Garantir Taxa", ja: "金利を固定する", it: "Blocca il Tasso"
  },
  "Apply for Card": {
    es: "Solicitar Tarjeta", fr: "Demander une Carte", de: "Karte beantragen", sv: "Ansök om kort", zh: "申请信用卡", ar: "طلب بطاقة", pt: "Solicitar Cartão", ja: "カードを申し込む", it: "Richiedi Carta"
  },
  "Explore Loans": {
    es: "Ver Préstamos", fr: "Découvrir les Prêts", de: "Kredite ansehen", sv: "Utforska lån", zh: "查看贷款方案", ar: "استكشف القروض", pt: "Explorar Empréstimos", ja: "ローン詳細を見る", it: "Scopri i Finanziamenti"
  },

  // Promo Banner
  "Start Building Your Financial Strength": {
    es: "Comience a Fortalecer sus Finanzas", fr: "Bâtissez Votre Force Financière", de: "Stärken Sie Ihre Finanzen", sv: "Börja bygga din ekonomiska styrka", zh: "开启稳健财富成长之路", ar: "ابدأ في بناء قوتك المالية", pt: "Comece a Construir sua Força Financeira", ja: "確かな資産形成をここからスタート", it: "Inizia a Costruire la tua Solidità Finanziaria"
  },
  "Get $200* With a Checking Account Built for You": {
    es: "Obtenga $200* con una Cuenta Corriente Creada para Usted",
    fr: "Recevez 200 $* avec un Compte Courant Conçu pour Vous",
    de: "Sichern Sie sich 200 $* Bonus mit einem Girokonto nach Maß",
    sv: "Få 200 $* med ett lönekonto skapat för dig",
    zh: "开立专属支票账户，即享 200 美元* 现金奖励",
    ar: "احصل على 200 دولار* مع حساب جاري مصمم خصيصاً لك",
    pt: "Ganhe $200* com uma Conta Corrente Feita para Você",
    ja: "あなた専用の当座預金口座で 200ドル* ボーナスを獲得",
    it: "Ricevi $200* con un Conto Corrente Creato su Misura per Te"
  },
  "No minimum balance required": {
    es: "Sin saldo mínimo obligatorio", fr: "Aucun solde minimum requis", de: "Kein Mindestguthaben erforderlich", sv: "Inget krav på minimisaldo", zh: "无最低存款余额要求", ar: "لا يشترط حد أدنى للرصيد", pt: "Sem exigência de saldo mínimo", ja: "最低残高の条件なし", it: "Nessun saldo minimo richiesto"
  },
  "Free debit card with real-time fraud protection": {
    es: "Tarjeta de débito gratuita con protección antifraude en tiempo real",
    fr: "Carte bancaire gratuite avec protection anti-fraude en direct",
    de: "Kostenlose Debitkarte mit Echtzeit-Betrugsschutz",
    sv: "Gratis betalkort med bedrägeriskydd i realtid",
    zh: "免费借记卡，配备实时防欺诈安全防护",
    ar: "بطاقة خصم مجانية مع حماية ضد الاحتيال في الوقت الفعلي",
    pt: "Cartão de débito gratuito com proteção contra fraudes em tempo real",
    ja: "リアルタイム不正検知保護付きの無料デビットカード",
    it: "Carta di debito gratuita con protezione antifrode in tempo reale"
  },
  "Access to 30,000+ surcharge-free ATMs nationwide": {
    es: "Acceso a más de 30.000 cajeros sin comisiones en todo el país",
    fr: "Accès à plus de 30 000 distributeurs sans frais",
    de: "Zugriff auf über 30.000 gebührenfreie Geldautomaten",
    sv: "Tillgång till över 30 000 avgiftsfria uttagsautomater",
    zh: "全网通行 30,000+ 免费自动取款机 (ATM)",
    ar: "الوصول إلى أكثر من 30 ألف صراف آلي بدون رسوم إضافية",
    pt: "Acesso a mais de 30.000 caixas eletrônicos sem tarifas",
    ja: "全国30,000台以上の提携ATMで手数料無料",
    it: "Accesso a oltre 30.000 sportelli bancomat senza commissioni"
  },
  "Claim $200 Bonus": {
    es: "Reclamar Bono de $200", fr: "Réclamer le Bonus de 200 $", de: "200 $ Bonus sichern", sv: "Hämta 200 $ bonus", zh: "立即领取 200 美元奖励", ar: "المطالبة بمكافأة 200 دولار", pt: "Resgatar Bônus de $200", ja: "200ドルボーナスを受け取る", it: "Richiedi il Bonus di $200"
  },

  // About Us Page (about.html)
  "About WB CREDIT UNION": {
    es: "Acerca de WB CREDIT UNION", fr: "À Propos de WB CREDIT UNION", de: "Über WB CREDIT UNION", sv: "Om WB CREDIT UNION", zh: "关于 WB 信用合作社", ar: "نبذة عن اتحاد ائتمان WB", pt: "Sobre o WB CREDIT UNION", ja: "WB信用組合について", it: "Informazioni su WB CREDIT UNION"
  },
  "Building financial strength together since day one. We're more than a bank — we're your partner in every financial milestone.": {
    es: "Construyendo solidez financiera juntos desde el primer día. Somos más que un banco: somos su socio en cada logro.",
    fr: "Bâtir ensemble la solidité financière dès le premier jour. Bien plus qu'une banque, votre partenaire de confiance.",
    de: "Gemeinsam finanzielle Stärke aufbauen vom ersten Tag an. Mehr als eine Bank – Ihr verlässlicher Partner.",
    sv: "Bygger ekonomisk styrka tillsammans från dag ett. Vi är mer än en bank – vi är din partner i livets alla milstolpar.",
    zh: "自诞生之日起携手共铸财富力量。我们不仅是一家银行，更是您每一段人生旅程的坚实伙伴。",
    ar: "بناء القوة المالية معاً منذ اليوم الأول. نحن أكثر من مجرد بنك – نحن شريكك في كل محطة مالية.",
    pt: "Construindo força financeira juntos desde o primeiro dia. Mais que um banco: seu parceiro em cada conquista.",
    ja: "創業初日から築き上げる強固な財務基盤。単なる銀行を超え、すべての歩みに寄り添うパートナーです。",
    it: "Costruire solidità finanziaria insieme fin dal primo giorno. Più di una banca: il tuo partner in ogni traguardo."
  },
  "History & Foundation": {
    es: "Historia y Fundación", fr: "Histoire & Fondations", de: "Geschichte & Ursprung", sv: "Historia & Grundande", zh: "历史沿革与创立基石", ar: "التاريخ والتأسيس", pt: "História e Fundação", ja: "歴史と設立の歩み", it: "Storia e Fondazione"
  },
  "Our Story": {
    es: "Nuestra Historia", fr: "Notre Histoire", de: "Unsere Geschichte", sv: "Vår historia", zh: "品牌故事", ar: "قصتنا", pt: "Nossa História", ja: "私たちのストーリー", it: "La Nostra Storia"
  },
  "From humble beginnings to a trusted financial institution": {
    es: "De orígenes humildes a una institución financiera de confianza",
    fr: "Des débuts modestes à une institution financière de référence",
    de: "Von bescheidenen Anfängen zu einem renommierten Finanzinstitut",
    sv: "Från en ödmjuk start till ett pålitligt finansiellt institut",
    zh: "从初心启程到深受信赖的全球金融机构",
    ar: "من بدايات متواضعة إلى مؤسسة مالية ذات ثقة عالمية",
    pt: "De um começo humilde a uma instituição financeira de confiança",
    ja: "謙虚な創業から信頼される世界的金融機関へ",
    it: "Da umili origini a un istituto finanziario di comprovata fiducia"
  },
  "Global Headquarters": {
    es: "Sede Central Global", fr: "Siège Mondial", de: "Globaler Hauptsitz", sv: "Globalt huvudkontor", zh: "全球总部", ar: "المقر الرئيسي العالمي", pt: "Sede Global", ja: "グローバル本社", it: "Sede Centrale Globale"
  },
  "Zurich Financial Centre": {
    es: "Centro Financiero de Zúrich", fr: "Centre Financier de Zurich", de: "Finanzzentrum Zürich", sv: "Zürich Finanscentrum", zh: "苏黎世金融中心", ar: "مركز زيورخ المالي", pt: "Centro Financeiro de Zurique", ja: "チューリッヒ金融センター", it: "Centro Finanziario di Zurigo"
  },
  "Member-Owned Cooperative": {
    es: "Cooperativa de Socios", fr: "Coopérative Membres", de: "Mitglieder-Genossenschaft", sv: "Medlemsägt kooperativ", zh: "会员所有的合作组织", ar: "تعاونية مملوكة للأعضاء", pt: "Cooperativa de Associados", ja: "会員相互扶助型金融機関", it: "Cooperativa dei Soci"
  },
  "25+ Global Fiat & Digital Vaults": {
    es: "Más de 25 Bóvedas Fiat y Cripto", fr: "25+ Coffres Fiat & Crypto", de: "25+ Globale Währungs-Tresore", sv: "25+ Globala Fiat- & Kryptovalv", zh: "25+ 种全球法定货币与数字金库", ar: "أكثر من 25 خزينة عملات رقمية ونقدية", pt: "Mais de 25 Cofres Fiat e Cripto", ja: "25以上の法定通貨＆暗号資産保管庫", it: "Oltre 25 Casseforti Valutarie e Digitali"
  },
  "Guiding Principles": {
    es: "Principios Guía", fr: "Principes Directeurs", de: "Leitprinzipien", sv: "Vägledande principer", zh: "核心准则", ar: "المبادئ التوجيهية", pt: "Princípios Orientadores", ja: "行動規範と指針", it: "Principi Guida"
  },
  "Our Mission & Vision": {
    es: "Nuestra Misión y Visión", fr: "Notre Mission & Vision", de: "Unsere Mission & Vision", sv: "Vår mission & vision", zh: "使命与远景", ar: "مهمتنا ورؤيتنا", pt: "Nossa Missão e Visão", ja: "使命とビジョン", it: "La Nostra Missione e Visione"
  },
  "The foundation of everything we build, provide, and champion for our members.": {
    es: "La base de todo lo que construimos, ofrecemos y defendemos para nuestros socios.",
    fr: "Le socle de tout ce que nous bâtissons et offrons pour nos membres.",
    de: "Das Fundament all unseres Handelns zum Wohl unserer Mitglieder.",
    sv: "Grunden för allt vi bygger, tillhandahåller och kämpar för åt våra medlemmar.",
    zh: "我们为会员构筑、提供并捍卫的一切基石。",
    ar: "أساس كل ما نبنيه ونقدمه وندعمه من أجل أعضائنا الكرام.",
    pt: "A base de tudo o que construímos e oferecemos para nossos associados.",
    ja: "会員の皆様のために築き、提供し、守り続けるすべての原点です。",
    it: "Il fondamento di tutto ciò che costruiamo e offriamo per i nostri soci."
  },
  "Our Mission": {
    es: "Nuestra Misión", fr: "Notre Mission", de: "Unsere Mission", sv: "Vår mission", zh: "我们的使命", ar: "مهمتنا", pt: "Nossa Missão", ja: "私たちの使命", it: "La Nostra Missione"
  },
  "Our Vision": {
    es: "Nuestra Visión", fr: "Notre Vision", de: "Unsere Vision", sv: "Vår vision", zh: "我们的远景", ar: "رؤيتنا", pt: "Nossa Visão", ja: "私たちのビジョン", it: "La Nostra Visione"
  },
  "What Defines Us": {
    es: "Lo Que Nos Define", fr: "Ce Qui Nous Définit", de: "Was Uns Ausmacht", sv: "Vad som definierar oss", zh: "我们的核心特质", ar: "ما يميزنا", pt: "O Que Nos Define", ja: "私たちが大切にする価値", it: "Cosa Ci Definisce"
  },
  "Our Core Values": {
    es: "Nuestros Valores Fundamentales", fr: "Nos Valeurs Fondamentales", de: "Unsere Grundwerte", sv: "Våra kärnvärden", zh: "核心价值观", ar: "قيمنا الأساسية", pt: "Nossos Valores Fundamentais", ja: "コアバリュー", it: "I Nostri Valori Fondamentali"
  },
  "Four steadfast pillars that guide our institutional standards and everyday decisions.": {
    es: "Cuatro pilares inquebrantables que guían nuestros estándares institucionales y decisiones diarias.",
    fr: "Quatre piliers immuables guidant notre excellence institutionnelle au quotidien.",
    de: "Vier feste Säulen, die unsere Standards und täglichen Entscheidungen leiten.",
    sv: "Fyra orubbliga pelare som styr våra institutionella standarder och dagliga beslut.",
    zh: "指引我们机构准则与日常决策的四大坚实支柱。",
    ar: "أربعة ركائز راسخة توجه معاييرنا المؤسسية وقراراتنا اليومية.",
    pt: "Quatro pilares sólidos que orientam nossos padrões e decisões diárias.",
    ja: "私たちの機関基準と日々の判断を導く4つの揺るぎない柱。",
    it: "Quattro pilastri incrollabili che guidano i nostri standard e le decisioni quotidiane."
  },
  "Integrity": {
    es: "Integridad", fr: "Intégrité", de: "Integrität", sv: "Integritet", zh: "恪守诚信", ar: "النزاهة", pt: "Integridade", ja: "誠実と高潔", it: "Integrità"
  },
  "Innovation": {
    es: "Innovación", fr: "Innovation", de: "Innovation", sv: "Innovation", zh: "持续创新", ar: "الابتكار", pt: "Inovação", ja: "絶え間ない革新", it: "Innovazione"
  },
  "Security First": {
    es: "Seguridad Primero", fr: "Sécurité d'Abord", de: "Sicherheit an erster Stelle", sv: "Säkerhet främst", zh: "安全第一", ar: "الأمان أولاً", pt: "Segurança em Primeiro Lugar", ja: "安全性最優先", it: "La Sicurezza al Primo Posto"
  },
  "Member-Centric": {
    es: "Centrados en el Socio", fr: "Centré sur le Membre", de: "Mitgliederfokussiert", sv: "Medlemsfokus", zh: "以会员为核心", ar: "التركيز على الأعضاء", pt: "Foco no Associado", ja: "会員ファースト", it: "Centralità del Socio"
  },
  "Executive Leadership": {
    es: "Liderazgo Ejecutivo", fr: "Direction Générale", de: "Unternehmensführung", sv: "Företagsledning", zh: "执行领导团队", ar: "القيادة التنفيذية", pt: "Liderança Executiva", ja: "経営執行陣", it: "Leadership Esecutiva"
  },
  "Governing Board & Officers": {
    es: "Junta de Gobierno y Directores", fr: "Conseil d'Administration", de: "Vorstand & Direktoren", sv: "Styrelse & Ledamöter", zh: "理事会与高管团队", ar: "مجلس الإدارة والمسؤولون", pt: "Conselho Diretor", ja: "取締役会および役員", it: "Consiglio Direttivo"
  },
  "Become a Member Today": {
    es: "Hágase Socio Hoy Mismo", fr: "Devenez Membre Aujourd'hui", de: "Werden Sie heute Mitglied", sv: "Bli medlem idag", zh: "即刻开户加入我们", ar: "انضم إلينا اليوم كعضو", pt: "Torne-se Associado Hoje", ja: "今すぐ会員登録する", it: "Diventa Socio Oggi Stesso"
  },
  "Join the WB CREDIT UNION family and experience banking that truly puts you first. Open your account in minutes and start building your financial future.": {
    es: "Únase a la familia de WB CREDIT UNION y disfrute de una banca que realmente le pone a usted en primer lugar. Abra su cuenta en minutos.",
    fr: "Rejoignez WB CREDIT UNION et découvrez une banque qui vous place véritablement au centre de ses priorités. Ouvrez votre compte en quelques minutes.",
    de: "Werden Sie Teil von WB CREDIT UNION und erleben Sie Banking, das Sie wirklich in den Mittelpunkt stellt. Eröffnen Sie Ihr Konto in Minuten.",
    sv: "Gå med i WB CREDIT UNION-familjen och upplev bankverksamhet som sätter dig först. Öppna ditt konto på några minuter.",
    zh: "加入 WB 信用合作社大家庭，体验真正以您为先的银行业务。数分钟内轻松开户，构筑您的财富未来。",
    ar: "انضم إلى عائلة اتحاد ائتمان WB وجرّب مصرفية تضعك دائماً في المقام الأول. افتح حسابك خلال دقائق.",
    pt: "Faça parte da família WB CREDIT UNION e experimente um banco que realmente coloca você em primeiro lugar. Abra sua conta em minutos.",
    ja: "WB信用組合ファミリーに加わり、人を最優先する真のバンキングをご体感ください。数分で口座開設が完了します。",
    it: "Unisciti alla famiglia WB CREDIT UNION e scopri una banca che ti mette davvero al primo posto. Apri il tuo conto in pochi minuti."
  },

  // Services Page (services.html)
  "Comprehensive Banking Services": {
    es: "Servicios Bancarios Integrales", fr: "Services Bancaires Complets", de: "Umfassende Bankdienstleistungen", sv: "Omfattande banktjänster", zh: "全方位综合金融服务", ar: "خدمات مصرفية شاملة", pt: "Serviços Bancários Completos", ja: "総合バンキングサービス", it: "Servizi Bancari Completi"
  },
  "From personal checking and high-yield savings to institutional treasury and digital asset custody — discover financial solutions tailored for you.": {
    es: "Desde cuentas corrientes y ahorros de alto rendimiento hasta tesorería institucional y custodia de criptoactivos: descubra soluciones a su medida.",
    fr: "Des comptes courants aux coffres de crypto-actifs et gestion de trésorerie institutionnelle : des solutions sur mesure pour vous.",
    de: "Vom Girokonto und Tagesgeld bis zum institutionellen Treasury und Krypto-Verwahrung: maßgeschneiderte Lösungen für Sie.",
    sv: "Från lönekonton och sparkonton med hög avkastning till institutionell treasury och digital tillgångsförvaring – upptäck lösningar skräddarsydda för dig.",
    zh: "从日常支票和高收益储蓄，到机构金库与数字资产托管——探索专属于您的定制化金融方案。",
    ar: "من الحسابات الجارية وحسابات الادخار عالية العائد إلى إدارة الخزينة وحفظ الأصول الرقمية: اكتشف حلولاً مصممة لك.",
    pt: "De contas correntes e poupança de alto rendimento a tesouraria institucional e custódia de criptoativos: soluções sob medida para você.",
    ja: "当座預金・高利回り預金から機関投資家向け資産運用・暗号資産カストディまで、あなたに最適なソリューションを提供します。",
    it: "Dai conti correnti al risparmio ad alto rendimento, fino alla tesoreria istituzionale e alla custodia di asset digitali: soluzioni su misura."
  },
  "Personal Banking": {
    es: "Banca Personal", fr: "Banque Personnelle", de: "Privatkunden", sv: "Privatbank", zh: "个人金融业务", ar: "الخدمات المصرفية للأفراد", pt: "Banca Pessoal", ja: "個人向けバンキング", it: "Banca Personale"
  },
  "Business & Commercial": {
    es: "Empresas y Comercio", fr: "Entreprises & Professionnels", de: "Firmenkunden & Handel", sv: "Företag & Handel", zh: "企业与商业服务", ar: "الخدمات التجارية والشركات", pt: "Empresarial e Comercial", ja: "法人・ビジネス金融", it: "Imprese e Commercio"
  },
  "Digital & Crypto Assets": {
    es: "Activos Digitales y Cripto", fr: "Actifs Numériques & Crypto", de: "Digitale & Krypto-Werte", sv: "Digitala tillgångar & Krypto", zh: "数字资产与加密货币", ar: "الأصول الرقمية والمشفرة", pt: "Ativos Digitais e Cripto", ja: "デジタル資産＆暗号資産", it: "Asset Digitali e Cripto"
  },
  "Loans & Mortgages": {
    es: "Préstamos e Hipotecas", fr: "Prêts & Crédits Immobiliers", de: "Kredite & Hypotheken", sv: "Lån & Bolån", zh: "各类贷款与按揭", ar: "القروض والتمويل العقاري", pt: "Empréstimos e Hipotecas", ja: "各種ローン・住宅ローン", it: "Prestiti e Mutui"
  },
  "Global Transfers & Wires": {
    es: "Transferencias y Giros Globales", fr: "Virements & Transferts Mondiaux", de: "Internationale Überweisungen", sv: "Globala överföringar & Wires", zh: "全球跨国汇款与电汇", ar: "التحويلات المالية الدولية", pt: "Transferências e Giros Globais", ja: "国際送金・SWIFT電信送金", it: "Bonifici e Trasferimenti Globali"
  },
  "Wealth & Advisory": {
    es: "Gestión Patrimonial y Asesoría", fr: "Gestion de Fortune & Conseil", de: "Vermögensverwaltung & Beratung", sv: "Förmögenhetsförvaltning & Rådgivning", zh: "财富管理与投资顾问", ar: "إدارة الثروات والاستشارات", pt: "Gestão de Patrimônio e Consultoria", ja: "資産管理・ウェルスアドバイザリー", it: "Gestione Patrimoniale e Consulenza"
  },
  "Ready to Get Started?": {
    es: "¿Listo para Comenzar?", fr: "Prêt à Démarrer ?", de: "Bereit durchzustarten?", sv: "Redo att komma igång?", zh: "准备好开启尊贵体验了吗？", ar: "هل أنت مستعد للبدء؟", pt: "Pronto para Começar?", ja: "今すぐ始めませんか？", it: "Pronto per Iniziare?"
  },
  "Open your WB CREDIT UNION account today and discover a better way to bank. It only takes a few minutes.": {
    es: "Abra su cuenta de WB CREDIT UNION hoy y descubra una mejor manera de gestionar su dinero. Solo le llevará unos minutos.",
    fr: "Ouvrez votre compte WB CREDIT UNION dès aujourd'hui et découvrez une nouvelle façon de gérer vos finances. Cela ne prend que quelques minutes.",
    de: "Eröffnen Sie noch heute Ihr WB CREDIT UNION Konto und erleben Sie erstklassiges Banking. Es dauert nur wenige Minuten.",
    sv: "Öppna ditt WB CREDIT UNION-konto idag och upptäck ett bättre sätt att hantera din ekonomi. Det tar bara några minuter.",
    zh: "今天就开立您的 WB 信用合作社账户，发现更卓越的理财之道。仅需数分钟即可完成。",
    ar: "افتح حسابك في اتحاد ائتمان WB اليوم واكتشف أسلوباً أفضل لإدارة أموالك. لن يستغرق الأمر سوى دقائق.",
    pt: "Abra sua conta na WB CREDIT UNION hoje e descubra uma maneira superior de cuidar do seu dinheiro. Leva apenas alguns minutos.",
    ja: "今すぐWB信用組合の口座を開設し、よりスマートな金融体験を。手続きはわずか数分です。",
    it: "Apri il tuo conto WB CREDIT UNION oggi stesso e scopri un modo migliore di fare banca. Bastano pochi minuti."
  },

  // Contact Page (contact.html)
  "Contact WB CREDIT UNION": {
    es: "Contacte con WB CREDIT UNION", fr: "Contacter WB CREDIT UNION", de: "Kontakt zu WB CREDIT UNION", sv: "Kontakta WB CREDIT UNION", zh: "联系 WB 信用合作社", ar: "اتصل باتحاد ائتمان WB", pt: "Contate o WB CREDIT UNION", ja: "WB信用組合へのお問い合わせ", it: "Contatta WB CREDIT UNION"
  },
  "We're here to help. Reach out to our dedicated member services team through any of the channels below.": {
    es: "Estamos aquí para ayudarle. Póngase en contacto con nuestro equipo dedicado a través de cualquiera de los siguientes canales.",
    fr: "Nous sommes à votre écoute. Contactez notre équipe dédiée via l'un des canaux ci-dessous.",
    de: "Wir sind für Sie da. Kontaktieren Sie unser Team über einen der folgenden Kanäle.",
    sv: "Vi är här för att hjälpa dig. Kontakta vårt medlemsteam via någon av kanalerna nedan.",
    zh: "时刻为您竭诚服务。请通过以下任何方式联系我们的专属会员服务团队。",
    ar: "نحن هنا لمساعدتكم دائماً. تواصل مع فريق خدمة الأعضاء المخصص عبر أي من القنوات التالية.",
    pt: "Estamos aqui para ajudar. Entre em contato com nossa equipe dedicada através de qualquer um dos canais abaixo.",
    ja: "いつでもサポートいたします。以下の窓口より専任メンバーサービスチームへお気軽にお問い合わせください。",
    it: "Siamo qui per aiutarti. Contatta il nostro team dedicato attraverso uno dei canali sottostanti."
  },
  "Send Us a Message": {
    es: "Envíenos un Mensaje", fr: "Envoyez-nous un Message", de: "Senden Sie uns eine Nachricht", sv: "Skicka ett meddelande till oss", zh: "在线给我们留言", ar: "أرسل لنا رسالة", pt: "Envie-nos uma Mensagem", ja: "メッセージを送信する", it: "Inviaci un Messaggio"
  },
  "Fill out the form below and a representative will respond within 24 hours.": {
    es: "Complete el siguiente formulario y un representante le responderá en un plazo de 24 horas.",
    fr: "Remplissez le formulaire ci-dessous et un conseiller vous répondra sous 24 heures.",
    de: "Füllen Sie das Formular aus und ein Berater antwortet innerhalb von 24 Stunden.",
    sv: "Fyll i formuläret nedan så svarar en rådgivare inom 24 timmar.",
    zh: "请填写下方表格，我们的客户专员将在24小时内与您联系。",
    ar: "يرجى ملء النموذج أدناه وسيقوم ممثل خدمة العملاء بالرد خلال 24 ساعة.",
    pt: "Preencha o formulário abaixo e um representante responderá em até 24 horas.",
    ja: "以下のフォームにご記入ください。担当者が24時間以内にご返答いたします。",
    it: "Compila il modulo sottostante e un nostro consulente ti risponderà entro 24 ore."
  },
  "Full Name": {
    es: "Nombre Completo", fr: "Nom Complet", de: "Vollständiger Name", sv: "Fullständigt namn", zh: "真实姓名", ar: "الاسم الكامل", pt: "Nome Completo", ja: "氏名（フルネーム）", it: "Nome e Cognome"
  },
  "Email Address": {
    es: "Correo Electrónico", fr: "Adresse Email", de: "E-Mail-Adresse", sv: "E-postadress", zh: "电子邮箱地址", ar: "البريد الإلكتروني", pt: "Endereço de E-mail", ja: "メールアドレス", it: "Indirizzo Email"
  },
  "Subject": {
    es: "Asunto", fr: "Objet", de: "Betreff", sv: "Ämne", zh: "主题", ar: "الموضوع", pt: "Assunto", ja: "件名", it: "Oggetto"
  },
  "Your Message": {
    es: "Su Mensaje", fr: "Votre Message", de: "Ihre Nachricht", sv: "Ditt meddelande", zh: "您的留言内容", ar: "رسالتك", pt: "Sua Mensagem", ja: "お問い合わせ内容", it: "Il Tuo Messaggio"
  },
  "Send Message": {
    es: "Enviar Mensaje", fr: "Envoyer le Message", de: "Nachricht senden", sv: "Skicka meddelande", zh: "发送信息", ar: "إرسال الرسالة", pt: "Enviar Mensagem", ja: "メッセージを送信", it: "Invia Messaggio"
  },
  "Sending Message...": {
    es: "Enviando Mensaje...", fr: "Envoi en cours...", de: "Wird gesendet...", sv: "Skickar meddelande...", zh: "正在发送...", ar: "جاري الإرسال...", pt: "Enviando Mensagem...", ja: "送信中...", it: "Invio in corso..."
  },
  "Frequently Asked Questions": {
    es: "Preguntas Frecuentes", fr: "Foire Aux Questions", de: "Häufig gestellte Fragen", sv: "Vanliga frågor och svar", zh: "常见问题解答 (FAQ)", ar: "الأسئلة الشائعة", pt: "Perguntas Frequentes", ja: "よくあるご質問", it: "Domande Frequenti"
  },
  "Have a question? Check our most common inquiries below.": {
    es: "¿Tiene alguna duda? Consulte las consultas más habituales a continuación.",
    fr: "Une question ? Consultez nos réponses les plus fréquentes ci-dessous.",
    de: "Haben Sie Fragen? Hier finden Sie die häufigsten Antworten.",
    sv: "Har du en fråga? Se våra vanligaste frågor nedan.",
    zh: "有疑问？请查看下方会员最常咨询的问题与解答。",
    ar: "هل لديك سؤال؟ تفضل بالاطلاع على الأسئلة الأكثر شيوعاً أدناه.",
    pt: "Tem alguma dúvida? Confira nossas perguntas mais frequentes abaixo.",
    ja: "ご不明な点がございますか？よくあるご質問をご確認ください。",
    it: "Hai una domanda? Consulta le richieste più frequenti qui sotto."
  },
  "Can't Find What You Need?": {
    es: "¿No encuentra lo que busca?", fr: "Vous ne trouvez pas votre réponse ?", de: "Nicht das Richtige gefunden?", sv: "Hittar du inte det du söker?", zh: "未找到您需要的信息？", ar: "لم تجد ما تبحث عنه؟", pt: "Não encontrou o que precisa?", ja: "お探しの内容が見つかりませんか？", it: "Non trovi quello che cerchi?"
  },
  "Our 24/7 phone banking team is standing by to help you with any urgent banking needs.": {
    es: "Nuestro equipo telefónico 24/7 está listo para ayudarle con cualquier urgencia financiera.",
    fr: "Notre service téléphonique 24/7 est disponible à tout moment pour vos urgences bancaires.",
    de: "Unser 24/7 Telefonservice steht Ihnen bei allen Anliegen zur Seite.",
    sv: "Vårt telefonsupportteam är tillgängligt dygnet runt för alla brådskande ärenden.",
    zh: "我们的 24/7 电话银行团队全天候待命，协助您处理任何紧急金融需求。",
    ar: "فريق الخدمة الهاتفية المتاح 24/7 جاهز لمساعدتكم في أي متطلبات مصرفية عاجلة.",
    pt: "Nossa equipe de atendimento telefônico 24/7 está pronta para ajudar com qualquer necessidade urgente.",
    ja: "24時間対応の電話サポートチームが、緊急のご相談にも迅速に対応いたします。",
    it: "Il nostro team di assistenza telefonica 24/7 è a tua disposizione per ogni necessità bancaria urgente."
  },

  // Auth, Login & Register (login.html & register.html)
  "Welcome Back": {
    es: "Bienvenido de Nuevo", fr: "Bon Retour", de: "Willkommen zurück", sv: "Välkommen tillbaka", zh: "欢迎回来", ar: "مرحباً بعودتك", pt: "Bem-vindo de Volta", ja: "おかえりなさい", it: "Bentornato"
  },
  "Access your WB CREDIT UNION account": {
    es: "Acceda a su cuenta de WB CREDIT UNION", fr: "Accédez à votre compte WB CREDIT UNION", de: "Greifen Sie auf Ihr WB CREDIT UNION Konto zu", sv: "Få tillgång till ditt WB CREDIT UNION-konto", zh: "安全登录您的 WB 信用合作社账户", ar: "الوصول إلى حساب اتحاد ائتمان WB الخاص بك", pt: "Acesse sua conta da WB CREDIT UNION", ja: "WB信用組合口座にアクセス", it: "Accedi al tuo conto WB CREDIT UNION"
  },
  "Password": {
    es: "Contraseña", fr: "Mot de passe", de: "Passwort", sv: "Lösenord", zh: "密码", ar: "كلمة المرور", pt: "Senha", ja: "パスワード", it: "Password"
  },
  "Remember Me": {
    es: "Recordarme", fr: "Se souvenir de moi", de: "Angemeldet bleiben", sv: "Kom ihåg mig", zh: "记住我", ar: "تذكرني", pt: "Lembrar de mim", ja: "ログイン状態を保持", it: "Ricordami"
  },
  "Forgot Password?": {
    es: "¿Olvidó su contraseña?", fr: "Mot de passe oublié ?", de: "Passwort vergessen?", sv: "Glömt lösenord?", zh: "忘记密码？", ar: "هل نسيت كلمة المرور؟", pt: "Esqueceu a senha?", ja: "パスワードをお忘れですか？", it: "Password dimenticata?"
  },
  "Sign In": {
    es: "Iniciar Sesión", fr: "Se Connecter", de: "Anmelden", sv: "Logga in", zh: "立即登录", ar: "تسجيل الدخول", pt: "Entrar", ja: "ログイン", it: "Accedi"
  },
  "Not yet a member?": {
    es: "¿Aún no es socio?", fr: "Pas encore membre ?", de: "Noch kein Mitglied?", sv: "Inte medlem än?", zh: "还不是会员？", ar: "لست عضواً بعد؟", pt: "Ainda não é associado?", ja: "まだ会員ではありませんか？", it: "Non sei ancora socio?"
  },
  "Email & Password": {
    es: "Correo y Contraseña", fr: "Email et Mot de Passe", de: "E-Mail & Passwort", sv: "E-post & Lösenord", zh: "邮箱与密码登录", ar: "البريد وكلمة المرور", pt: "E-mail e Senha", ja: "メールとパスワード", it: "Email e Password"
  },
  "Account # & PIN": {
    es: "Nº de Cuenta y PIN", fr: "N° de Compte & Code PIN", de: "Konto-Nr. & PIN", sv: "Konto-nr & PIN", zh: "账号与安全PIN码", ar: "رقم الحساب والرقم السري", pt: "Nº da Conta e PIN", ja: "口座番号と暗証番号", it: "N° Conto e PIN"
  },
  "Biometric Thumbprint": {
    es: "Huella Dactilar Biométrica", fr: "Empreinte Biométrique", de: "Biometrischer Fingerabdruck", sv: "Biometriskt fingeravtryck", zh: "生物指纹识别登录", ar: "بصمة الإصبع البيومترية", pt: "Biometria Digital", ja: "生体認証（指紋）", it: "Impronta Digitale Biometrica"
  },
  "Scan Thumbprint Biometrics": {
    es: "Escanear Huella Biométrica", fr: "Scanner l'Empreinte", de: "Fingerabdruck scannen", sv: "Skanna fingeravtryck", zh: "扫描指纹生物识别", ar: "مسح بصمة الإصبع", pt: "Escanear Biometria", ja: "指紋生体認証をスキャン", it: "Scansione Impronta Digitale"
  },
  "Authenticate Clearance": {
    es: "Autenticar Autorización", fr: "Valider l'Accréditation", de: "Freigabe authentifizieren", sv: "Verifiera säkerhetsbehörighet", zh: "验证安全清算凭证", ar: "التحقق من التصريح الأمني", pt: "Autenticar Liberação", ja: "認証クリアランスを実行", it: "Autentica Autorizzazione"
  },

  // Dashboard Sections & Core Terms (dashboard.html)
  "Overview": {
    es: "Resumen", fr: "Aperçu", de: "Übersicht", sv: "Översikt", zh: "账户概览", ar: "نظرة عامة", pt: "Visão Geral", ja: "概要", it: "Panoramica"
  },
  "Accounts & Vaults": {
    es: "Cuentas y Bóvedas", fr: "Comptes & Coffres", de: "Konten & Tresore", sv: "Konton & Valv", zh: "账户与专属金库", ar: "الحسابات والخزائن", pt: "Contas e Cofres", ja: "口座・保管ウォレット", it: "Conti e Casseforti"
  },
  "Transfer / Wire": {
    es: "Transferencias / Giros", fr: "Virements / Transferts", de: "Überweisung & Wire", sv: "Överföring & Wire", zh: "资金划转与电汇", ar: "تحويل / سويفت", pt: "Transferência / Wire", ja: "振込・国際送金", it: "Bonifici / Trasferimenti"
  },
  "Debit & Credit Cards": {
    es: "Tarjetas de Débito y Crédito", fr: "Cartes Bancaires", de: "Debit- & Kreditkarten", sv: "Betal- & Kreditkort", zh: "借记卡与信用卡", ar: "بطاقات الخصم والائتمان", pt: "Cartões de Débito e Crédito", ja: "デビット＆クレジットカード", it: "Carte di Debito e Credito"
  },
  "Crypto Assets": {
    es: "Activos Cripto", fr: "Actifs Crypto", de: "Krypto-Vermögen", sv: "Kryptotillgångar", zh: "数字加密资产", ar: "الأصول الرقمية", pt: "Ativos Cripto", ja: "暗号資産ポートフォリオ", it: "Asset Cripto"
  },
  "Grants & Loans": {
    es: "Subvenciones y Préstamos", fr: "Prêts & Subventions", de: "Zuschüsse & Kredite", sv: "Bidrag & Lån", zh: "专项贷款与资助", ar: "المنح والقروض", pt: "Subsídios e Empréstimos", ja: "各種融資・助成金", it: "Prestiti e Agevolazioni"
  },
  "Notifications": {
    es: "Notificaciones", fr: "Notifications", de: "Benachrichtigungen", sv: "Aviseringar", zh: "系统通知", ar: "الإشعارات", pt: "Notificações", ja: "通知センター", it: "Notifiche"
  },
  "Settings & Security": {
    es: "Ajustes y Seguridad", fr: "Paramètres & Sécurité", de: "Einstellungen & Sicherheit", sv: "Inställningar & Säkerhet", zh: "设置与安全中心", ar: "الإعدادات والأمان", pt: "Configurações e Segurança", ja: "設定とセキュリティ", it: "Impostazioni e Sicurezza"
  },
  "Help & Support": {
    es: "Ayuda y Soporte", fr: "Aide & Support", de: "Hilfe & Support", sv: "Hjälp & Support", zh: "帮助与会员支持", ar: "المساعدة والدعم", pt: "Ajuda e Suporte", ja: "ヘルプ＆サポート", it: "Guida e Assistenza"
  },
  "Total Net Worth": {
    es: "Patrimonio Neto Total", fr: "Valeur Nette Totale", de: "Gesamtnettovermögen", sv: "Totalt nettovärde", zh: "净资产总值", ar: "إجمالي صافي القيمة", pt: "Patrimônio Líquido Total", ja: "総純資産残高", it: "Patrimonio Netto Totale"
  },
  "Available Balance": {
    es: "Saldo Disponible", fr: "Solde Disponible", de: "Verfügbares Guthaben", sv: "Tillgängligt saldo", zh: "可用余额", ar: "الرصيد المتاح", pt: "Saldo Disponível", ja: "利用可能残高", it: "Saldo Disponibile"
  },
  "Ledger Balance": {
    es: "Saldo Contable", fr: "Solde Comptable", de: "Buchungssaldo", sv: "Bokfört saldo", zh: "账面余额", ar: "رصيد الدفتر", pt: "Saldo Contábil", ja: "帳簿残高", it: "Saldo Contabile"
  },
  "Hold / Pending": {
    es: "Retenido / Pendiente", fr: "En Attente / Retenu", de: "Ausstehend / Gesperrt", sv: "Reserverat / Väntande", zh: "冻结/处理中", ar: "معلق / قيد الانتظار", pt: "Retido / Pendente", ja: "保留中・未確定", it: "In Sospeso / Trattenuto"
  },
  "Total Inflow": {
    es: "Ingresos Totales", fr: "Entrées Totales", de: "Gesamteingänge", sv: "Totalt inflöde", zh: "资金总流入", ar: "إجمالي الوارد", pt: "Entradas Totais", ja: "総入金額", it: "Entrate Totali"
  },
  "Total Outflow": {
    es: "Egresos Totales", fr: "Sorties Totales", de: "Gesamtausgänge", sv: "Totalt utflöde", zh: "资金总流出", ar: "إجمالي الصادر", pt: "Saídas Totais", ja: "総出金額", it: "Uscite Totali"
  },
  "Quick Actions": {
    es: "Acciones Rápidas", fr: "Actions Rapides", de: "Schnellaktionen", sv: "Snabbåtgärder", zh: "快捷操作", ar: "إجراءات سريعة", pt: "Ações Rápidas", ja: "クイックアクション", it: "Azioni Rapide"
  },
  "Send Money": {
    es: "Enviar Dinero", fr: "Envoyer de l'Argent", de: "Geld senden", sv: "Skicka pengar", zh: "极速转账", ar: "إرسال أموال", pt: "Enviar Dinheiro", ja: "送金する", it: "Invia Denaro"
  },
  "Wire Transfer": {
    es: "Transferencia Bancaria", fr: "Virement Bancaire", de: "Banküberweisung", sv: "Banköverföring", zh: "国际电汇", ar: "تحويل مصرفي", pt: "Transferência Bancária", ja: "電信送金 (Wire)", it: "Bonifico Bancario"
  },
  "Deposit Check": {
    es: "Depositar Cheque", fr: "Déposer un Chèque", de: "Scheck einzahlen", sv: "Sätt in check", zh: "支票存入", ar: "إيداع شيك", pt: "Depositar Cheque", ja: "小切手入金", it: "Deposita Assegno"
  },
  "Recent Transactions": {
    es: "Transacciones Recientes", fr: "Transactions Récentes", de: "Letzte Transaktionen", sv: "Senaste transaktioner", zh: "最近交易记录", ar: "المعاملات الأخيرة", pt: "Transações Recentes", ja: "最近の取引履歴", it: "Transazioni Recenti"
  },
  "Account Statements": {
    es: "Estados de Cuenta", fr: "Relevés de Compte", de: "Kontoauszüge", sv: "Kontoutdrag", zh: "电子对账单", ar: "كشوف الحساب", pt: "Extratos Bancários", ja: "取引明細書", it: "Estratti Conto"
  },
  "Download Statement": {
    es: "Descargar Estado", fr: "Télécharger le Relevé", de: "Auszug herunterladen", sv: "Ladda ner kontoutdrag", zh: "下载对账单", ar: "تحميل كشف الحساب", pt: "Baixar Extrato", ja: "明細書をダウンロード", it: "Scarica Estratto Conto"
  },
  "Print Receipt": {
    es: "Imprimir Recibo", fr: "Imprimer le Reçu", de: "Beleg drucken", sv: "Skriv ut kvitto", zh: "打印凭条", ar: "طباعة الإيصال", pt: "Imprimir Comprovante", ja: "受領書を印刷", it: "Stampa Ricevuta"
  },

  // Clearance Codes & Security Verification
  "Wire Clearance & Transaction Codes": {
    es: "Códigos de Liquidación y Seguridad de Giros",
    fr: "Codes d'Accréditation et de Sécurité de Virement",
    de: "Überweisungs-Freigabecodes & Sicherheitszertifikate",
    sv: "Överföringskoder & Säkerhetsgodkännande",
    zh: "电汇清算与交易安全认证代码",
    ar: "رموز التخليص المصرفي وأمان التحويلات",
    pt: "Códigos de Liberação e Segurança de Transferência",
    ja: "電信送金クリアランス＆取引セキュリティコード",
    it: "Codici di Autorizzazione e Sicurezza Bonifici"
  },
  "COT CODE (Cost of Transfer)": {
    es: "CÓDIGO COT (Costo de Transferencia)",
    fr: "CODE COT (Frais de Transfert)",
    de: "COT-CODE (Überweisungskosten)",
    sv: "COT-KOD (Överföringskostnad)",
    zh: "COT 代码 (转账费用代码)",
    ar: "رمز COT (تكلفة التحويل)",
    pt: "CÓDIGO COT (Custo de Transferência)",
    ja: "COTコード（送金手数料承認コード）",
    it: "CODICE COT (Costo del Bonifico)"
  },
  "TAX CODE (Tax Clearance)": {
    es: "CÓDIGO FISCAL (Liquidación Tributaria)",
    fr: "CODE FISCAL (Quitus Fiscal)",
    de: "STEUER-CODE (Steuerfreigabe)",
    sv: "SKATTEKOD (Skattegodkännande)",
    zh: "TAX 代码 (税务清算凭证)",
    ar: "الرمز الضريبي (التخليص الضريبي)",
    pt: "CÓDIGO TRIBUTÁRIO (Liberação Fiscal)",
    ja: "TAXコード（税務承認コード）",
    it: "CODICE FISCALE (Nulla Osta Fiscale)"
  },
  "IMF CODE (IMF Clearance)": {
    es: "CÓDIGO FMI (Autorización FMI)",
    fr: "CODE FMI (Validation FMI)",
    de: "IWF-CODE (IWF-Freigabe)",
    sv: "IMF-KOD (IMF-godkännande)",
    zh: "IMF 代码 (国际货币基金清算码)",
    ar: "رمز IMF (تصريح صندوق النقد الدولي)",
    pt: "CÓDIGO FMI (Liberação FMI)",
    ja: "IMFコード（国際通貨基金承認コード）",
    it: "CODICE FMI (Autorizzazione FMI)"
  },
  "AML CODE (Anti-Money Laundering)": {
    es: "CÓDIGO AML (Prevención de Blanqueo)",
    fr: "CODE AML (Anti-Blanchiment)",
    de: "AML-CODE (Geldwäsche-Prüfung)",
    sv: "AML-KOD (Penningtvättskontroll)",
    zh: "AML 代码 (反洗钱审查放行码)",
    ar: "رمز AML (مكافحة غسيل الأموال)",
    pt: "CÓDIGO AML (Antilavagem de Dinheiro)",
    ja: "AMLコード（マネーロンダリング防止承認コード）",
    it: "CODICE AML (Antiriciclaggio)"
  },
  "PAP CODE (Proof of Anti-Piracy)": {
    es: "CÓDIGO PAP (Prueba Antipiratería)",
    fr: "CODE PAP (Preuve Anti-Piraterie)",
    de: "PAP-CODE (Anti-Piraterie-Nachweis)",
    sv: "PAP-KOD (Bevis mot piratkopiering)",
    zh: "PAP 代码 (防盗版/防欺诈证明)",
    ar: "رمز PAP (إثبات مكافحة القرصنة)",
    pt: "CÓDIGO PAP (Comprovante Antipirataria)",
    ja: "PAPコード（海賊行為防止証明コード）",
    it: "CODICE PAP (Certificato Antipirateria)"
  },
  "2FA / OTP Code": {
    es: "Código 2FA / OTP", fr: "Code 2FA / OTP", de: "2FA / OTP Code", sv: "2FA / OTP-kod", zh: "双重验证 / OTP 动态口令", ar: "رمز 2FA / OTP", pt: "Código 2FA / OTP", ja: "2段階認証 / OTPワンタイムパスワード", it: "Codice 2FA / OTP"
  },
  "Card Status": {
    es: "Estado de la Tarjeta", fr: "Statut de la Carte", de: "Kartenstatus", sv: "Kortstatus", zh: "卡片状态", ar: "حالة البطاقة", pt: "Status do Cartão", ja: "カード状態", it: "Stato Carta"
  },
  "ACTIVE": {
    es: "ACTIVO", fr: "ACTIF", de: "AKTIV", sv: "AKTIV", zh: "正常激活", ar: "نشط", pt: "ATIVO", ja: "有効 (ACTIVE)", it: "ATTIVO"
  },
  "Active": {
    es: "Activo", fr: "Actif", de: "Aktiv", sv: "Aktiv", zh: "正常", ar: "نشط", pt: "Ativo", ja: "有効", it: "Attivo"
  },
  "Pending Clearance": {
    es: "Pendiente de Liquidación", fr: "En Attente de Validation", de: "Freigabe ausstehend", sv: "Väntar på godkännande", zh: "等待清算放行", ar: "في انتظار التخليص", pt: "Aguardando Liberação", ja: "承認審査中", it: "In Attesa di Autorizzazione"
  },
  "Clearance Required": {
    es: "Requiere Liquidación", fr: "Validation Requise", de: "Freigabe erforderlich", sv: "Godkännande krävs", zh: "需要安全放行", ar: "مطلوب تصريح أمني", pt: "Liberação Necessária", ja: "要承認クリアランス", it: "Autorizzazione Richiesta"
  },
  "Transfer Successful": {
    es: "Transferencia Exitosa", fr: "Virement Réussi", de: "Überweisung erfolgreich", sv: "Överföring lyckades", zh: "转账汇款成功", ar: "تم التحويل بنجاح", pt: "Transferência Concluída", ja: "送金が完了しました", it: "Bonifico Eseguito con Successo"
  },
  "Transfer In Progress": {
    es: "Transferencia en Curso", fr: "Virement en Cours", de: "Überweisung wird verarbeitet", sv: "Överföring pågår", zh: "转账正在处理中", ar: "جاري تنفيذ التحويل", pt: "Transferência em Processamento", ja: "送金処理中", it: "Bonifico in Elaborazione"
  },

  // Footer & Institutional Info
  "Banking Products": {
    es: "Productos Bancarios", fr: "Produits Bancaires", de: "Bankprodukte", sv: "Bankprodukter", zh: "银行金融产品", ar: "المنتجات المصرفية", pt: "Produtos Bancários", ja: "取扱金融商品", it: "Prodotti Bancari"
  },
  "Member Services": {
    es: "Servicios al Socio", fr: "Services aux Membres", de: "Mitgliederservice", sv: "Medlemstjänster", zh: "会员专属服务", ar: "خدمات الأعضاء", pt: "Serviços aos Associados", ja: "会員専用サービス", it: "Servizi ai Soci"
  },
  "24/7 Support & Branch": {
    es: "Soporte 24/7 y Sucursal", fr: "Assistance 24/7 & Agence", de: "24/7 Support & Filiale", sv: "24/7 Support & Kontor", zh: "24/7 全天候支持与网点", ar: "دعم 24/7 والفرع", pt: "Suporte 24/7 e Agência", ja: "24時間サポート＆店舗情報", it: "Supporto 24/7 e Filiale"
  },
  "ROUTING NUMBER:": {
    es: "NÚMERO DE RUTA:", fr: "CODE ROUTAGE:", de: "ROUTING-NUMMER:", sv: "ROUTING-NUMMER:", zh: "汇款路径号:", ar: "رقم التوجيه المصرفي:", pt: "NÚMERO DE ROTEAMENTO:", ja: "ルーティング番号:", it: "NUMERO DI ROUTING:"
  },
  "Zurich Branch Hours:": {
    es: "Horario de la Sucursal de Zúrich:", fr: "Horaires de l'Agence de Zurich:", de: "Filiale Zürich Öffnungszeiten:", sv: "Zürich-kontorets öppettider:", zh: "苏黎世总行营业时间:", ar: "مواعيد فرع زيورخ:", pt: "Horário da Agência de Zurique:", ja: "チューリッヒ支店 営業時間:", it: "Orari Filiale di Zurigo:"
  },
  "Official Inquiries & Clearance": {
    es: "Consultas Oficiales y Liquidación", fr: "Demandes Officielles & Validation", de: "Offizielle Anfragen & Freigaben", sv: "Officiella förfrågningar & godkännande", zh: "官方业务问询与结算清算", ar: "الاستفسارات الرسمية والتخليص المصرفي", pt: "Consultas Oficiais e Compensação", ja: "公式照会および決済確認", it: "Richieste Ufficiali e Compensazione"
  },
  "All rights reserved. Equal Housing Lender. Insured & regulated cooperative financial institution.": {
    es: "Todos los derechos reservados. Prestamista en igualdad de condiciones. Institución financiera cooperativa asegurada y regulada.",
    fr: "Tous droits réservés. Prêteur équitable. Établissement financier coopératif assuré et réglementé.",
    de: "Alle Rechte vorbehalten. Chancengleicher Kreditgeber. Versichertes und reguliertes genossenschaftliches Finanzinstitut.",
    sv: "Alla rättigheter förbehållna. Jämställd långivare. Försäkrat och reglerat kooperativt finansinstitut.",
    zh: "保留所有权利。公平住房贷款机构。受全面监管和保险保护的合作性金融机构。",
    ar: "جميع الحقوق محفوظة. مقرض معتمد للإسكان العادل. مؤسسة مالية تعاونية مؤمنة ومنظمة رسمياً.",
    pt: "Todos os direitos reservados. Credor de Habitação Igualitária. Instituição financeira cooperativa segurada e regulamentada.",
    ja: "全著作権所有。住宅融資提供機関。公的保険適用・規制対象の協同組合型金融機関です。",
    it: "Tutti i diritti riservati. Finanziatore per le pari opportunità abitative. Istituto finanziario cooperativo assicurato e regolamentato."
  }
};

/**
 * ============================================================================
 * 2. CORE VOCABULARY FALLBACK DICTIONARY
 * ============================================================================
 */
export const VOCABULARY_DICTIONARY = {
  "Balance": { es: "Saldo", fr: "Solde", de: "Guthaben", sv: "Saldo", zh: "余额", ar: "الرصيد", pt: "Saldo", ja: "残高", it: "Saldo" },
  "Available": { es: "Disponible", fr: "Disponible", de: "Verfügbar", sv: "Tillgängligt", zh: "可用", ar: "المتاح", pt: "Disponível", ja: "利用可能", it: "Disponibile" },
  "Pending": { es: "Pendiente", fr: "En attente", de: "Ausstehend", sv: "Väntande", zh: "处理中", ar: "قيد الانتظار", pt: "Pendente", ja: "保留中", it: "In sospeso" },
  "Completed": { es: "Completado", fr: "Terminé", de: "Abgeschlossen", sv: "Slutförd", zh: "已完成", ar: "مكتمل", pt: "Concluído", ja: "完了", it: "Completato" },
  "Failed": { es: "Fallido", fr: "Échoué", de: "Fehlgeschlagen", sv: "Misslyckades", zh: "失败", ar: "فشل", pt: "Falhou", ja: "失敗", it: "Non riuscito" },
  "Deposit": { es: "Depósito", fr: "Dépôt", de: "Einzahlung", sv: "Insättning", zh: "存款", ar: "إيداع", pt: "Depósito", ja: "入金", it: "Deposito" },
  "Withdrawal": { es: "Retiro", fr: "Retrait", de: "Auszahlung", sv: "Uttag", zh: "取款", ar: "سحب", pt: "Saque", ja: "出金", it: "Prelievo" },
  "Transfer": { es: "Transferencia", fr: "Transfert", de: "Überweisung", sv: "Överföring", zh: "转账", ar: "تحويل", pt: "Transferência", ja: "振込", it: "Trasferimento" },
  "Security": { es: "Seguridad", fr: "Sécurité", de: "Sicherheit", sv: "Säkerhet", zh: "安全", ar: "الأمان", pt: "Segurança", ja: "セキュリティ", it: "Sicurezza" },
  "Account": { es: "Cuenta", fr: "Compte", de: "Konto", sv: "Konto", zh: "账户", ar: "حساب", pt: "Conta", ja: "口座", it: "Conto" },
  "Clearance": { es: "Liquidación", fr: "Validation", de: "Freigabe", sv: "Godkännande", zh: "清算放行", ar: "تخليص", pt: "Liberação", ja: "承認クリアランス", it: "Autorizzazione" },
  "Submit": { es: "Enviar", fr: "Soumettre", de: "Absenden", sv: "Skicka", zh: "提交", ar: "إرسال", pt: "Enviar", ja: "送信", it: "Invia" },
  "Cancel": { es: "Cancelar", fr: "Annuler", de: "Abbrechen", sv: "Avbryt", zh: "取消", ar: "إلغاء", pt: "Cancelar", ja: "キャンセル", it: "Annulla" },
  "Confirm": { es: "Confirmar", fr: "Confirmer", de: "Bestätigen", sv: "Bekräfta", zh: "确认", ar: "تأكيد", pt: "Confirmar", ja: "確認", it: "Conferma" },
  "Verify": { es: "Verificar", fr: "Vérifier", de: "Verifizieren", sv: "Verifiera", zh: "验证", ar: "التحقق", pt: "Verificar", ja: "認証", it: "Verifica" },
  "Save": { es: "Guardar", fr: "Enregistrer", de: "Speichern", sv: "Spara", zh: "保存", ar: "حفظ", pt: "Salvar", ja: "保存", it: "Salva" },
  "Edit": { es: "Editar", fr: "Modifier", de: "Bearbeiten", sv: "Redigera", zh: "编辑", ar: "تعديل", pt: "Editar", ja: "編集", it: "Modifica" },
  "Delete": { es: "Eliminar", fr: "Supprimer", de: "Löschen", sv: "Ta bort", zh: "删除", ar: "حذف", pt: "Excluir", ja: "削除", it: "Elimina" },
  "Download": { es: "Descargar", fr: "Télécharger", de: "Herunterladen", sv: "Ladda ner", zh: "下载", ar: "تحميل", pt: "Baixar", ja: "ダウンロード", it: "Scarica" }
};

/**
 * ============================================================================
 * 3. STATE & STORAGE HELPERS
 * ============================================================================
 */
export function getCurrentLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && AVAILABLE_LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch (e) {}
  return 'en';
}

/**
 * Synchronous phrase translation lookup
 */
export function t(key, fallback = '') {
  const lang = getCurrentLanguage();
  if (lang === 'en') return fallback || key;

  // 1. Direct exact dictionary match
  if (PHRASE_DICTIONARY[key] && PHRASE_DICTIONARY[key][lang]) {
    return PHRASE_DICTIONARY[key][lang];
  }

  // 2. Trimmed exact match
  const trimmed = String(key).trim();
  if (PHRASE_DICTIONARY[trimmed] && PHRASE_DICTIONARY[trimmed][lang]) {
    return PHRASE_DICTIONARY[trimmed][lang];
  }

  // 3. Vocabulary word-level match
  if (VOCABULARY_DICTIONARY[trimmed] && VOCABULARY_DICTIONARY[trimmed][lang]) {
    return VOCABULARY_DICTIONARY[trimmed][lang];
  }

  return fallback || key;
}

/**
 * ============================================================================
 * 4. GOOGLE TRANSLATE SEAMLESS INTEGRATION (MULTI-PAGE PERSISTENCE)
 * ============================================================================
 */
export function initGoogleTranslateIntegration() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Mount hidden Google Translate container if absent
  if (!document.getElementById('google_translate_element')) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.display = 'none';
    if (document.body) {
      document.body.appendChild(el);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(el);
      });
    }
  }

  // 2. Global callback for Google Translate initialization
  window.googleTranslateElementInit = function() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,es,fr,de,sv,zh-CN,ar,pt,ja,it',
        autoDisplay: false
      }, 'google_translate_element');
    } catch(e) {}
  };

  // 3. Inject Google Translate script asynchronously
  if (!document.getElementById('wbcu-google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'wbcu-google-translate-script';
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(script);
  }
}

/**
 * Sync Google Translate Cookies for full-site persistence across every page!
 */
function syncGoogleTranslateCookie(langCode) {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const hostParts = host.split('.');
  const domainPart = hostParts.length > 1 ? `.${hostParts.slice(-2).join('.')}` : host;
  const gCode = GOOGLE_LANG_MAP[langCode] || langCode;

  if (langCode === 'en') {
    // Clear cookie
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domainPart};`;
  } else {
    const cookieStr = `/en/${gCode}`;
    document.cookie = `googtrans=${cookieStr}; path=/;`;
    document.cookie = `googtrans=${cookieStr}; path=/; domain=${host};`;
    document.cookie = `googtrans=${cookieStr}; path=/; domain=${domainPart};`;
  }

  // Trigger combo if already loaded on page
  const combo = document.querySelector('.goog-te-combo');
  if (combo) {
    combo.value = gCode;
    combo.dispatchEvent(new Event('change'));
  }
}

/**
 * ============================================================================
 * 5. MASTER LANGUAGE SETTER
 * ============================================================================
 */
export function setLanguage(langCode) {
  if (!AVAILABLE_LANGUAGES.some((l) => l.code === langCode)) langCode = 'en';
  try {
    localStorage.setItem(STORAGE_KEY, langCode);
  } catch (e) {}

  const langObj = AVAILABLE_LANGUAGES.find((l) => l.code === langCode) || AVAILABLE_LANGUAGES[0];
  document.documentElement.setAttribute('lang', langCode);
  document.documentElement.setAttribute('dir', langObj.dir || 'ltr');

  // 1. Sync whole-site Google Translate persistence cookie
  syncGoogleTranslateCookie(langCode);

  // 2. Synchronous universal DOM text translation
  translatePage();

  // 3. Update all dropdown flags & labels
  updateLanguageDropdownSelectors(langCode);

  // 4. Dispatch custom event for reactive views
  window.dispatchEvent(new CustomEvent('wbcu-language-changed', { detail: { language: langCode } }));
}

/**
 * ============================================================================
 * 6. UNIVERSAL DOM RECURSIVE TRANSLATION ENGINE
 * ============================================================================
 */
function walkTextNodes(node, callback) {
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (text && text.length > 0) {
      callback(node, text);
    }
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style' || tagName === 'textarea' || tagName === 'code' || tagName === 'pre') return;
    if (node.classList && (
      node.classList.contains('lang-switcher-dropdown') ||
      node.classList.contains('notranslate') ||
      node.classList.contains('crypto-address-box') ||
      node.classList.contains('font-mono') ||
      node.classList.contains('skiptranslate') ||
      node.id === 'chatMessagesBody'
    )) return;

    for (let child = node.firstChild; child; child = child.nextSibling) {
      walkTextNodes(child, callback);
    }
  }
}

export function translatePage() {
  const lang = getCurrentLanguage();
  const langObj = AVAILABLE_LANGUAGES.find((l) => l.code === lang) || AVAILABLE_LANGUAGES[0];

  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', langObj.dir || 'ltr');

  // 1. TRANSLATE ALL [data-i18n] ELEMENTS
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!el.dataset.i18nOriginalHtml) {
      el.dataset.i18nOriginalHtml = el.innerHTML;
    }

    if (lang === 'en') {
      if (el.dataset.i18nOriginalHtml) {
        el.innerHTML = el.dataset.i18nOriginalHtml;
      }
      return;
    }

    const trans = t(key, '');
    if (trans && trans !== key) {
      el.innerHTML = trans;
    }
  });

  // 2. TRANSLATE ATTRIBUTES (placeholders, titles, aria-labels)
  document.querySelectorAll('[placeholder]').forEach((el) => {
    if (!el.dataset.i18nOriginalPlaceholder) {
      el.dataset.i18nOriginalPlaceholder = el.getAttribute('placeholder') || '';
    }
    const orig = el.dataset.i18nOriginalPlaceholder;
    if (lang === 'en') {
      el.setAttribute('placeholder', orig);
    } else {
      const trans = t(orig, orig);
      el.setAttribute('placeholder', trans);
    }
  });

  document.querySelectorAll('[title]').forEach((el) => {
    if (!el.dataset.i18nOriginalTitle) {
      el.dataset.i18nOriginalTitle = el.getAttribute('title') || '';
    }
    const orig = el.dataset.i18nOriginalTitle;
    if (lang === 'en') {
      el.setAttribute('title', orig);
    } else {
      const trans = t(orig, orig);
      el.setAttribute('title', trans);
    }
  });

  // 3. RECURSIVE DEEP TEXT NODE VISITATION ACROSS THE ENTIRE PAGE
  walkTextNodes(document.body || document.documentElement, (textNode, trimmedText) => {
    if (!textNode._wbcuOriginal) {
      textNode._wbcuOriginal = trimmedText;
    }

    const orig = textNode._wbcuOriginal;
    if (lang === 'en') {
      if (textNode.textContent.includes(orig) || textNode.textContent.trim() !== orig) {
        textNode.textContent = textNode.textContent.replace(trimmedText, orig);
      }
    } else {
      const trans = t(orig, orig);
      if (trans && trans !== orig) {
        textNode.textContent = textNode.textContent.replace(trimmedText, trans);
      }
    }
  });
}

/**
 * ============================================================================
 * 7. LANGUAGE SWITCHER UI GENERATOR & DELEGATED EVENTS
 * ============================================================================
 */
export function createLanguageSwitcherHtml(idSuffix = 'Header') {
  const currentLangCode = getCurrentLanguage();
  const currentLang = AVAILABLE_LANGUAGES.find((l) => l.code === currentLangCode) || AVAILABLE_LANGUAGES[0];

  return `
    <div class="lang-switcher-dropdown notranslate" id="langSwitcher_${idSuffix}">
      <button type="button" class="lang-switcher-btn" id="langBtn_${idSuffix}" aria-label="Select Language" aria-expanded="false" title="Switch Language">
        <span class="lang-btn-flag">${currentLang.flag}</span>
        <span class="lang-btn-code">${currentLang.code.toUpperCase()}</span>
        <svg class="lang-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div class="lang-dropdown-menu" id="langMenu_${idSuffix}">
        <div class="lang-dropdown-header">Select Language</div>
        <div class="lang-options-grid">
          ${AVAILABLE_LANGUAGES.map(
            (l) => `
            <button type="button" class="lang-option-btn ${l.code === currentLangCode ? 'is-active' : ''}" data-lang-code="${l.code}">
              <span class="lang-option-flag">${l.flag}</span>
              <div class="lang-option-text">
                <strong class="lang-option-name">${l.native}</strong>
                <span class="lang-option-sub">${l.name}</span>
              </div>
              ${l.code === currentLangCode ? '<span class="lang-check">✓</span>' : ''}
            </button>
          `
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Global click and keyboard delegator for language switcher menus
 */
export function initLanguageSwitcherEvents() {
  if (window.__wbcu_i18n_delegated_ready) {
    updateLanguageDropdownSelectors(getCurrentLanguage());
    return;
  }
  window.__wbcu_i18n_delegated_ready = true;

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    // 1. Clicked language switcher toggle button
    const btn = target.closest('.lang-switcher-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const container = btn.closest('.lang-switcher-dropdown');
      if (!container) return;
      const menu = container.querySelector('.lang-dropdown-menu');
      if (!menu) return;

      const isCurrentlyOpen = menu.classList.contains('is-open');

      // Close all language dropdowns on page
      document.querySelectorAll('.lang-dropdown-menu').forEach((m) => {
        m.classList.remove('is-open');
        const parent = m.closest('.lang-switcher-dropdown');
        if (parent) {
          const parentBtn = parent.querySelector('.lang-switcher-btn');
          if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (!isCurrentlyOpen) {
        menu.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    // 2. Clicked on a language option button
    const optBtn = target.closest('.lang-option-btn');
    if (optBtn) {
      e.preventDefault();
      e.stopPropagation();
      const code = optBtn.getAttribute('data-lang-code') || optBtn.dataset.langCode;
      if (code) {
        setLanguage(code);
      }
      // Close dropdowns
      document.querySelectorAll('.lang-dropdown-menu').forEach((m) => {
        m.classList.remove('is-open');
        const parent = m.closest('.lang-switcher-dropdown');
        if (parent) {
          const parentBtn = parent.querySelector('.lang-switcher-btn');
          if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
        }
      });
      return;
    }

    // 3. Clicked inside menu body - don't dismiss
    if (target.closest('.lang-dropdown-menu')) {
      return;
    }

    // 4. Clicked outside - dismiss all dropdowns
    document.querySelectorAll('.lang-dropdown-menu').forEach((m) => {
      m.classList.remove('is-open');
      const parent = m.closest('.lang-switcher-dropdown');
      if (parent) {
        const parentBtn = parent.querySelector('.lang-switcher-btn');
        if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.lang-dropdown-menu').forEach((m) => {
        m.classList.remove('is-open');
        const parent = m.closest('.lang-switcher-dropdown');
        if (parent) {
          const parentBtn = parent.querySelector('.lang-switcher-btn');
          if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });

  updateLanguageDropdownSelectors(getCurrentLanguage());
}

/**
 * Update UI flag, code label, and active checkmarks
 */
export function updateLanguageDropdownSelectors(langCode) {
  const currentLang = AVAILABLE_LANGUAGES.find((l) => l.code === langCode) || AVAILABLE_LANGUAGES[0];

  document.querySelectorAll('.lang-switcher-dropdown').forEach((container) => {
    const flagEl = container.querySelector('.lang-btn-flag');
    const codeEl = container.querySelector('.lang-btn-code');
    if (flagEl) flagEl.textContent = currentLang.flag;
    if (codeEl) codeEl.textContent = currentLang.code.toUpperCase();

    container.querySelectorAll('.lang-option-btn').forEach((btn) => {
      const code = btn.getAttribute('data-lang-code') || btn.dataset.langCode;
      if (code === langCode) {
        btn.classList.add('is-active');
        if (!btn.querySelector('.lang-check')) {
          const check = document.createElement('span');
          check.className = 'lang-check';
          check.textContent = '✓';
          btn.appendChild(check);
        }
      } else {
        btn.classList.remove('is-active');
        const check = btn.querySelector('.lang-check');
        if (check) check.remove();
      }
    });
  });
}

/**
 * ============================================================================
 * 8. AUTO-INITIALIZER & DYNAMIC MUTATION OBSERVER
 * ============================================================================
 */
export function initI18n() {
  const current = getCurrentLanguage();
  const langObj = AVAILABLE_LANGUAGES.find((l) => l.code === current) || AVAILABLE_LANGUAGES[0];
  document.documentElement.setAttribute('lang', current);
  document.documentElement.setAttribute('dir', langObj.dir || 'ltr');

  // Synchronize Google Translate cookie and script
  syncGoogleTranslateCookie(current);
  initGoogleTranslateIntegration();

  // Run DOM universal translation
  translatePage();
  initLanguageSwitcherEvents();

  // Reactive translation observer for dynamic tabs, modals, tables
  if (!window.__wbcu_i18n_observer_ready && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    window.__wbcu_i18n_observer_ready = true;
    let _mutationDebounce = null;
    const observer = new MutationObserver((mutations) => {
      if (getCurrentLanguage() === 'en') return;
      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            const node = m.addedNodes[i];
            if (node.nodeType === 1 && !node.closest('.lang-switcher-dropdown') && !node.closest('#chatMessagesBody')) {
              shouldTranslate = true;
              break;
            }
          }
        }
      }
      if (shouldTranslate) {
        clearTimeout(_mutationDebounce);
        _mutationDebounce = setTimeout(() => {
          translatePage();
        }, 80);
      }
    });

    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
  }
}

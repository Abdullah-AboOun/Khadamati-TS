import { db, schema } from "./index"
import { DEFAULT_CATEGORIES } from "../../shared/constants"
import { auth } from "../auth"
import { eq, ne } from "drizzle-orm"

async function seed() {
  console.log("🌱 Seeding database...")

  // Clean existing mock data
  console.log("🧹 Cleaning old mock data...")
  await db.delete(schema.review)
  await db.delete(schema.order)
  await db.delete(schema.serviceImage)
  await db.delete(schema.service)
  await db.delete(schema.contactMessage)
  await db.delete(schema.user).where(ne(schema.user.role, "admin"))
  console.log("✅ Database cleaned")

  // Seed categories
  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(schema.category)
      .values({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
      })
      .onConflictDoNothing()
  }
  console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} categories`)

  // Seed default admin commission setting
  await db
    .insert(schema.setting)
    .values({ key: "commission_rate", value: "0.10" })
    .onConflictDoNothing()
  console.log("✅ Seeded default settings")

  // Seed default admin account
  const adminEmail = "admin@khadamati.com"
  const existingAdmin = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, adminEmail))
    .then((res) => res[0])

  if (!existingAdmin) {
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: "Admin123!",
        name: "مدير النظام",
        role: "admin",
      },
    })
    console.log("✅ Seeded default admin account (admin@khadamati.com / Admin123!)")
  } else {
    console.log("ℹ️ Admin account already exists, skipping")
  }

  // Helper to fetch user ID by email
  const getUserId = async (email: string) => {
    const res = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1)
    return res[0]?.id
  }

  // Helper to fetch category ID by slug
  const getCategoryId = async (slug: string) => {
    const res = await db
      .select({ id: schema.category.id })
      .from(schema.category)
      .where(eq(schema.category.slug, slug))
      .limit(1)
    return res[0]?.id
  }

  // Seed clients and providers
  console.log("👥 Seeding users...")
  const clientsData = [
    {
      email: "client1@khadamati.com",
      password: "Client123!",
      name: "أحمد محمد",
      role: "client" as const,
      phone: "+970599111222",
      city: "القدس",
    },
    {
      email: "client2@khadamati.com",
      password: "Client123!",
      name: "فاطمة علي",
      role: "client" as const,
      phone: "+970599333444",
      city: "رام الله",
    },
    {
      email: "client3@khadamati.com",
      password: "Client123!",
      name: "سارة حسن",
      role: "client" as const,
      phone: "+970599444555",
      city: "رام الله",
    },
    {
      email: "client4@khadamati.com",
      password: "Client123!",
      name: "طارق محمود",
      role: "client" as const,
      phone: "+970599666777",
      city: "نابلس",
    },
    {
      email: "client5@khadamati.com",
      password: "Client123!",
      name: "ليلى سعيد",
      role: "client" as const,
      phone: "+970599888999",
      city: "الالقدس",
    },
  ]

  const providersData = [
    {
      email: "provider1@khadamati.com",
      password: "Provider123!",
      name: "خالد النجار",
      role: "provider" as const,
      phone: "+970599555666",
      city: "نابلس",
      bio: "نجار محترف بخبرة تزيد عن 10 سنوات في تصميم وتصنيع وصيانة الأثاث الخشبي والمنزلي.",
    },
    {
      email: "provider2@khadamati.com",
      password: "Provider123!",
      name: "ياسر الكهربائي",
      role: "provider" as const,
      phone: "+970599777888",
      city: "الخليل",
      bio: "فني كهرباء منازل وتمديدات صحية، متخصص في كشف الأعطال وتأسيس شبكات الكهرباء الحديثة.",
    },
    {
      email: "provider3@khadamati.com",
      password: "Provider123!",
      name: "سليم السباك",
      role: "provider" as const,
      phone: "+970599000111",
      city: "بيت لحم",
      bio: "معلم سباكة خبرة طويلة في صيانة وتمديد شبكات المياه والصرف الصحي وتركيب الفلاتر والمضخات.",
    },
    {
      email: "provider4@khadamati.com",
      password: "Provider123!",
      name: "منى للتصميم",
      role: "provider" as const,
      phone: "+970599222333",
      city: "غزة",
      bio: "مصممة جرافيك متخصصة في بناء الهويات البصرية، الشعارات، وتصاميم منصات التواصل الاجتماعي.",
    },
    {
      email: "provider5@khadamati.com",
      password: "Provider123!",
      name: "رائد لتكييف الهواء",
      role: "provider" as const,
      phone: "+970599123456",
      city: "القدس",
      bio: "فني تكييف وتبريد معتمد، صيانة وتركيب جميع أنواع المكيفات المنزلية والتجارية بجودة عالية وسرعة في العمل.",
    },
    {
      email: "provider6@khadamati.com",
      password: "Provider123!",
      name: "أمل للتنظيف",
      role: "provider" as const,
      phone: "+970599234567",
      city: "رام الله",
      bio: "فريق تنظيف محترف للمنازل والشركات، نستخدم أفضل مواد التعقيم لضمان بيئة صحية ونظيفة.",
    },
    {
      email: "provider7@khadamati.com",
      password: "Provider123!",
      name: "محمد المبرمج",
      role: "provider" as const,
      phone: "+970599345678",
      city: "نابلس",
      bio: "مطور ويب متخصص في برمجة وتطوير المواقع والمتاجر الإلكترونية باستخدام أحدث التقنيات.",
    },
    {
      email: "provider8@khadamati.com",
      password: "Provider123!",
      name: "وسام للمونتاج",
      role: "provider" as const,
      phone: "+970599456789",
      city: "غزة",
      bio: "صانع محتوى ومحرر فيديو، خبرة طويلة في تعديل ومونتاج الفيديوهات وتأثيرات الصوت والحركة.",
    },
  ]

  for (const client of clientsData) {
    await auth.api.signUpEmail({ body: client })
  }
  for (const provider of providersData) {
    await auth.api.signUpEmail({ body: provider })
  }
  console.log("✅ Seeded clients and providers")

  const client1Id = await getUserId("client1@khadamati.com")
  const client2Id = await getUserId("client2@khadamati.com")
  const client3Id = await getUserId("client3@khadamati.com")
  const client4Id = await getUserId("client4@khadamati.com")
  const client5Id = await getUserId("client5@khadamati.com")

  const provider1Id = await getUserId("provider1@khadamati.com")
  const provider2Id = await getUserId("provider2@khadamati.com")
  const provider3Id = await getUserId("provider3@khadamati.com")
  const provider4Id = await getUserId("provider4@khadamati.com")
  const provider5Id = await getUserId("provider5@khadamati.com")
  const provider6Id = await getUserId("provider6@khadamati.com")
  const provider7Id = await getUserId("provider7@khadamati.com")
  const provider8Id = await getUserId("provider8@khadamati.com")

  const carpentryCatId = await getCategoryId("carpentry")
  const electricalCatId = await getCategoryId("electrical")
  const plumbingCatId = await getCategoryId("plumbing")
  const designCatId = await getCategoryId("graphic-design")
  const acCatId = await getCategoryId("ac")
  const cleaningCatId = await getCategoryId("cleaning")
  const programmingCatId = await getCategoryId("programming")
  const videoCatId = await getCategoryId("video-editing")

  // Seed services
  console.log("🛠️ Seeding services...")
  const servicesData = [
    {
      providerId: provider1Id,
      categoryId: carpentryCatId,
      title: "تصنيع وتصليح غرف نوم وخزائن مبتكرة",
      description: "نقوم بتصميم وتصنيع غرف النوم الحديثة والكلاسيكية، بالإضافة إلى الخزائن المدمجة وصيانة الأثاث التالف بجودة عالية واستخدام أفضل أنواع الخشب.",
      pricingType: "fixed" as const,
      price: 1200,
      city: "نابلس",
      images: [
        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider1Id,
      categoryId: carpentryCatId,
      title: "صيانة أبواب خشبية ونوافذ وطاولات",
      description: "صيانة شاملة للأبواب والنوافذ والحلول الخشبية، تغيير الأقفال والمفاصل وتصليح التشققات والكسور مع إعادة دهان وتلميع الخشب.",
      pricingType: "fixed" as const,
      price: 150,
      city: "نابلس",
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider2Id,
      categoryId: electricalCatId,
      title: "تأسيس شبكات كهرباء متكاملة للمنازل والفلل",
      description: "تخطيط وتمديد شبكات الكهرباء والإنارة الحديثة للمباني السكنية والتجارية تحت الإنشاء وفقاً للمواصفات الهندسية المعتمدة والأمان التام.",
      pricingType: "quote" as const,
      price: null,
      city: "الخليل",
      images: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider2Id,
      categoryId: electricalCatId,
      title: "صيانة أعطال الكهرباء المنزلية وتركيب اللوحات",
      description: "فحص وحل مشاكل انقطاع التيار والماس الكهربائي، وتركيب لوحات التوزيع والقواطع، وتثبيت الإنارة، والثريات، والمفاتيح الذكية.",
      pricingType: "fixed" as const,
      price: 80,
      city: "الخليل",
      images: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider3Id,
      categoryId: plumbingCatId,
      title: "تركيب وصيانة خلاطات وفلاتر ومضخات المياه",
      description: "تركيب وصيانة جميع أنواع خلاطات المغاسل والمطابخ، تركيب فلاتر تنقية المياه المنزلية متعددة المراحل، وصيانة وتركيب مضخات رفع وضغط المياه.",
      pricingType: "fixed" as const,
      price: 100,
      city: "بيت لحم",
      images: [
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider3Id,
      categoryId: plumbingCatId,
      title: "تأسيس وتمديد خطوط السباكة والصرف الصحي",
      description: "تمديد خطوط التغذية بالمياه الباردة والساخنة، وتأسيس شبكات الصرف الصحي الداخلية والخارجية للمباني الجديدة مع اختبارات الضغط لمنع التسريبات.",
      pricingType: "quote" as const,
      price: null,
      city: "بيت لحم",
      images: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider4Id,
      categoryId: designCatId,
      title: "تصميم الهويات البصرية المتكاملة والشعارات",
      description: "نساعدك في بناء حضور قوي لعلامتك التجارية من خلال تصميم شعار فريد ودليل الهوية البصرية الكامل (الألوان، الخطوط، تطبيقات الهوية).",
      pricingType: "fixed" as const,
      price: 500,
      city: "غزة",
      images: [
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider4Id,
      categoryId: designCatId,
      title: "تصميم منشورات السوشيال ميديا والإعلانات",
      description: "تصميم بوسترات احترافية لمنصات التواصل الاجتماعي (فيسبوك، انستجرام، لينكد إن) بتصاميم عصرية تزيد من التفاعل وتجذب العملاء.",
      pricingType: "fixed" as const,
      price: 50,
      city: "غزة",
      images: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider5Id,
      categoryId: acCatId,
      title: "صيانة وتعبئة غاز المكيفات المنزلية",
      description: "فحص تسريب الغاز، تنظيف الفلاتر والوحدات الداخلية والخارجية، تعبئة الغاز الأصلي وحل مشاكل ضعف التبريد والأصوات المزعجة.",
      pricingType: "fixed" as const,
      price: 200,
      city: "القدس",
      images: [
        "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider5Id,
      categoryId: acCatId,
      title: "تركيب وفك أجهزة التكييف بمختلف الأحجام",
      description: "تركيب المكيفات السبلت والمركزية، تمديد النحاس بطرق هندسية، وفك ونقل المكيفات القديمة مع إعادة تشغيلها وضمان التركيب ضد عيوب العمل.",
      pricingType: "quote" as const,
      price: null,
      city: "القدس",
      images: [
        "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider6Id,
      categoryId: cleaningCatId,
      title: "تنظيف منازل وشقق سكنية شامل وعميق",
      description: "جلي وتلميع البلاط والرخام، تنظيف النوافذ والأبواب، تعقيم المطابخ والحمامات، وإزالة الأتربة والدهانات بعد أعمال الصيانة والتشطيب.",
      pricingType: "fixed" as const,
      price: 300,
      city: "رام الله",
      images: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider6Id,
      categoryId: cleaningCatId,
      title: "غسيل وتعقيم الكنب والسجاد بالبخار والمواد الألمانية",
      description: "غسيل الصالونات، الكنب، الستائر والسجاد في موقعها بأحدث أجهزة البخار والمذيبات الألمانية لإزالة أصعب البقع والروائح الكريهة.",
      pricingType: "fixed" as const,
      price: 120,
      city: "رام الله",
      images: [
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider7Id,
      categoryId: programmingCatId,
      title: "برمجة وتطوير المتاجر الإلكترونية والمواقع الكبيرة",
      description: "تصميم وبرمجة متاجر إلكترونية احترافية مخصصة، ربط بوابات الدفع المحلية والعالمية، لوحات تحكم مرنة، وتحسين أداء سرعة التصفح والأمان.",
      pricingType: "quote" as const,
      price: null,
      city: "نابلس",
      images: [
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider7Id,
      categoryId: programmingCatId,
      title: "تطوير مواقع ووردبريس تعريفية متكاملة وسريعة",
      description: "تصميم موقع تعريفي للشركات أو المحامين أو الأطباء، متوافق بالكامل مع الهواتف الذكية ومحركات البحث (SEO)، مع تدريب كامل على إدارة المحتوى.",
      pricingType: "fixed" as const,
      price: 800,
      city: "نابلس",
      images: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider8Id,
      categoryId: videoCatId,
      title: "تحرير ومونتاج فيديوهات اليوتيوب وصناع المحتوى",
      description: "مونتاج متكامل لفيديوهات اليوتيوب، إضافة المؤثرات الصوتية والبصرية، تعديل الألوان، إدخال النصوص والرسومات المتحركة لزيادة التفاعل.",
      pricingType: "fixed" as const,
      price: 150,
      city: "غزة",
      images: [
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      providerId: provider8Id,
      categoryId: videoCatId,
      title: "تصميم ومونتاج إعلانات الفيديو الترويجية والكرتونية",
      description: "إعداد إعلانات فيديو ترويجية للمنتجات والخدمات قصيرة ومؤثرة تزيد المبيعات، مونتاج فيديوهات ريلز وتيك توك سريعة باحترافية.",
      pricingType: "fixed" as const,
      price: 250,
      city: "غزة",
      images: [
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=800&q=80",
      ],
    },
  ]

  const seededServices: any[] = []

  for (const svc of servicesData) {
    const [insertedSvc] = await db
      .insert(schema.service)
      .values({
        providerId: svc.providerId!,
        categoryId: svc.categoryId!,
        title: svc.title,
        description: svc.description,
        pricingType: svc.pricingType,
        price: svc.price,
        city: svc.city,
      })
      .returning()

    seededServices.push({
      ...insertedSvc,
      originalImages: svc.images,
    })

    // Seed images for this service
    for (let i = 0; i < svc.images.length; i++) {
      await db.insert(schema.serviceImage).values({
        serviceId: insertedSvc.id,
        url: svc.images[i],
        isMain: i === 0,
        sortOrder: i,
      })
    }
  }
  console.log(`✅ Seeded ${seededServices.length} services with images`)

  // Helpers for order dates
  const now = new Date()
  const daysAgo = (d: number) => {
    const date = new Date()
    date.setDate(now.getDate() - d)
    return date
  }
  const hoursAgo = (h: number) => {
    const date = new Date()
    date.setHours(now.getHours() - h)
    return date
  }

  // Seed orders
  console.log("📦 Seeding orders...")
  const ordersData = [
    {
      clientId: client1Id!,
      providerId: provider1Id!,
      serviceId: seededServices[0].id,
      amount: 1200,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "طلب تصنيع خزانة ملابس 4 أبواب مع رفوف داخلية.",
      notes: "يرجى الالتزام بالموعد واللون الأبيض المطفي.",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(18),
    },
    {
      clientId: client2Id!,
      providerId: provider3Id!,
      serviceId: seededServices[4].id,
      amount: 100,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "تركيب فلتر مياه 5 مراحل وصيانة حنفية المطبخ.",
      notes: "الفلتر متوفر لدي، أحتاج التركيب فقط.",
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    },
    {
      clientId: client1Id!,
      providerId: provider2Id!,
      serviceId: seededServices[3].id,
      amount: 80,
      status: "pending" as const,
      paymentStatus: "pending",
      details: "تصليح مأخذ كهربائي تالف في الصالون وتركيب مفتاح جديد.",
      notes: null,
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      clientId: client2Id!,
      providerId: provider1Id!,
      serviceId: seededServices[0].id,
      amount: 1100,
      status: "quoted" as const,
      paymentStatus: "pending",
      details: "تفصيل سرير خشبي مزدوج مقاس 180*200.",
      notes: "أحتاج عرض سعر مناسب.",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      clientId: client1Id!,
      providerId: provider3Id!,
      serviceId: seededServices[5].id,
      amount: 1500,
      status: "accepted" as const,
      paymentStatus: "pending",
      details: "تأسيس خطوط الصرف الصحي للحمام الثاني بالمنزل.",
      notes: "تم الاتفاق على السعر وتاريخ البدء غداً.",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4),
    },
    {
      clientId: client2Id!,
      providerId: provider4Id!,
      serviceId: seededServices[6].id,
      amount: 500,
      status: "in_progress" as const,
      paymentStatus: "pending",
      details: "تصميم هوية بصرية كاملة لشركة تجارية ناشئة تشمل الشعار والكروت والملفات الرسمية.",
      notes: "الاسم هو 'مقدسي للتجارة'.",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      clientId: client1Id!,
      providerId: provider4Id!,
      serviceId: seededServices[7].id,
      amount: 50,
      status: "cancelled" as const,
      paymentStatus: "pending",
      details: "تصميم بوستر إعلاني لعرض نهاية الأسبوع.",
      notes: "تم الإلغاء بسبب تغير شروط العرض.",
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
    {
      clientId: client3Id!,
      providerId: provider5Id!,
      serviceId: seededServices[8].id,
      amount: 200,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "صيانة مكيف الصالون وتعبئة غاز التبريد بالكامل وتغيير الفلتر الداخلي.",
      notes: null,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
    },
    {
      clientId: client4Id!,
      providerId: provider6Id!,
      serviceId: seededServices[10].id,
      amount: 300,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "تنظيف فيلا سكنية بعد التشطيب تشمل جلي الأرضيات والمغاسل والنوافذ وتلميعها.",
      notes: "توجد بعض بقع الدهان على البلاط يرجى التركيز عليها.",
      createdAt: daysAgo(6),
      updatedAt: daysAgo(5),
    },
    {
      clientId: client5Id!,
      providerId: provider7Id!,
      serviceId: seededServices[13].id,
      amount: 800,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "برمجة وتصميم موقع تعريفي لعيادة أسنان خاصة مع نظام حجز المواعيد وتفاصيل الأطباء.",
      notes: "الموقع متوافق بالكامل مع الأجهزة المحمولة.",
      createdAt: daysAgo(15),
      updatedAt: daysAgo(10),
    },
    {
      clientId: client3Id!,
      providerId: provider8Id!,
      serviceId: seededServices[14].id,
      amount: 150,
      status: "completed" as const,
      paymentStatus: "paid",
      details: "مونتاج فيديو يوتيوب مدته 10 دقائق يشمل تعديل الصوت وتصحيح الألوان والترجمة.",
      notes: "سيتم تزويدك بالملفات الخام عبر جوجل درايف.",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(3),
    },
    {
      clientId: client4Id!,
      providerId: provider5Id!,
      serviceId: seededServices[9].id,
      amount: 450,
      status: "accepted" as const,
      paymentStatus: "pending",
      details: "فك وتركيب مكيفات عدد 2 من شقة إلى شقة أخرى في نفس البناية.",
      notes: "تم الاتفاق على السعر الإجمالي شامل تمديد النحاس الإضافي.",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      clientId: client5Id!,
      providerId: provider6Id!,
      serviceId: seededServices[11].id,
      amount: 120,
      status: "pending" as const,
      paymentStatus: "pending",
      details: "غسيل طقم كنب صالون 7 مقاعد مع تعقيم بالبخار وإزالة البقع العنيدة.",
      notes: "يرجى الحضور صباحاً بعد الساعة 10.",
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      clientId: client2Id!,
      providerId: provider7Id!,
      serviceId: seededServices[12].id,
      amount: 2500,
      status: "in_progress" as const,
      paymentStatus: "pending",
      details: "تصميم متجر إلكتروني لبيع العطور يشمل لوحة تحكم كاملة وإشعارات الطلبات على الواتساب.",
      notes: "تم دفع دفعة مقدمة خارج المنصة.",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
  ]

  const seededOrders: any[] = []
  for (const ord of ordersData) {
    const [insertedOrd] = await db
      .insert(schema.order)
      .values({
        clientId: ord.clientId,
        providerId: ord.providerId,
        serviceId: ord.serviceId,
        amount: ord.amount,
        status: ord.status,
        paymentStatus: ord.paymentStatus,
        details: ord.details,
        notes: ord.notes,
        createdAt: ord.createdAt,
        updatedAt: ord.updatedAt,
      })
      .returning()
    seededOrders.push(insertedOrd)
  }
  console.log(`✅ Seeded ${seededOrders.length} orders`)

  // Seed reviews
  console.log("⭐ Seeding reviews...")
  const reviewsData = [
    {
      orderId: seededOrders[0].id, // Order 1: client1, provider1, carpentry fixed
      clientId: client1Id!,
      serviceId: seededServices[0].id,
      rating: 5,
      comment: "عمل احترافي وراقي جداً! خزانة الملابس متينة ومطابقة تماماً للمواصفات والألوان التي طلبتها. خالد النجار شخص محترم وملتزم بالمواعيد. أنصح بشدة بالتعامل معه.",
      createdAt: daysAgo(17),
    },
    {
      orderId: seededOrders[1].id, // Order 2: client2, provider3, plumbing fixed
      clientId: client2Id!,
      serviceId: seededServices[4].id,
      rating: 4,
      comment: "سليم سباك ماهر جداً، جاء في الوقت المتفق عليه وأنهى تركيب فلتر المياه وصيانة الحنفية بسرعة. السعر كان مناسباً جداً مقارنة بجودة العمل.",
      createdAt: daysAgo(8),
    },
    {
      orderId: seededOrders[7].id, // Order 8: client3, provider5, ac fixed
      clientId: client3Id!,
      serviceId: seededServices[8].id,
      rating: 5,
      comment: "رائد مهندس تكييف مبدع ومحترف للغاية. قام بفحص المكيف بالكامل وتعبئة الغاز، والآن التبريد ممتاز وهادئ جداً. السعر ممتاز والتنفيذ سريع للغاية.",
      createdAt: daysAgo(11),
    },
    {
      orderId: seededOrders[8].id, // Order 9: client4, provider6, cleaning fixed
      clientId: client4Id!,
      serviceId: seededServices[10].id,
      rating: 5,
      comment: "فريق أمل للتنظيف متميزين جداً وأخلاقهم عالية. قاموا بتنظيف الفيلا وتلميع السيراميك بعد التشطيب بشكل مبهر، لم يتركوا أي أثر للأتربة أو الدهانات التالفة. شكراً جزيلاً لهم.",
      createdAt: daysAgo(5),
    },
    {
      orderId: seededOrders[9].id, // Order 10: client5, provider7, programming fixed
      clientId: client5Id!,
      serviceId: seededServices[13].id,
      rating: 5,
      comment: "محمد مبرمج متميز ومتعاون جداً. قام بتطوير عيادة الأسنان بمواصفات رائعة ونظام الحجز يسهل إدارته وتلقي المواعيد. سأستمر بالتعامل معه في مشاريع قادمة.",
      createdAt: daysAgo(9),
    },
    {
      orderId: seededOrders[10].id, // Order 11: client3, provider8, video editing
      clientId: client3Id!,
      serviceId: seededServices[14].id,
      rating: 4,
      comment: "وسام محرر فيديو سريع ومبدع ولديه ذوق رائع في اختيار المؤثرات البصرية. أخرج الفيديو بشكل أفضل مما توقعت وتواصله ممتاز.",
      createdAt: daysAgo(3),
    },
  ]

  for (const rev of reviewsData) {
    await db.insert(schema.review).values({
      orderId: rev.orderId,
      clientId: rev.clientId,
      serviceId: rev.serviceId,
      rating: rev.rating,
      comment: rev.comment,
      createdAt: rev.createdAt,
    })
  }
  console.log("✅ Seeded reviews")

  // Seed contact messages
  console.log("✉️ Seeding contact messages...")
  const contactMessagesData = [
    {
      name: "سامر الأحمد",
      email: "samer@example.com",
      subject: "استفسار بخصوص تسجيل مزود خدمة جديد",
      message: "مرحباً، أود الاستفسار عن الأوراق المطلوبة لتسجيل شركتي كعضو مزود خدمات في منصة خدماتي. شكراً لكم.",
      createdAt: daysAgo(4),
    },
    {
      name: "رنا سعيد",
      email: "rana@example.com",
      subject: "اقتراح لإضافة فئة جديدة",
      message: "أقترح إضافة فئة 'التدريس الخصوصي والتعليم' إلى المنصة لتسهيل الوصول للمدرسين في مختلف المواد الدراسية. تطبيق رائع، استمروا!",
      createdAt: daysAgo(2),
    },
  ]

  for (const msg of contactMessagesData) {
    await db.insert(schema.contactMessage).values({
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      createdAt: msg.createdAt,
    })
  }
  console.log("✅ Seeded contact messages")

  console.log("🎉 Seed complete!")
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})

import { db, schema } from "./index"
import { DEFAULT_CATEGORIES } from "../../shared/constants"
import { auth } from "../auth"
import { eq } from "drizzle-orm"

async function seed() {
  console.log("🌱 Seeding database...")

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

  console.log("🎉 Seed complete!")
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})

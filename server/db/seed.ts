import { db, schema } from "./index"
import { DEFAULT_CATEGORIES } from "../../shared/constants"

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

  console.log("🎉 Seed complete!")
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})

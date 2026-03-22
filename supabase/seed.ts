/**
 * Seed script to create technician accounts.
 * Usage: npx ts-node supabase/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL env vars.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Add technician phone numbers here
const TECHNICIANS = [
  { phone: "+15550000001", name: "Alex Rivera" },
  { phone: "+15550000002", name: "Jordan Smith" },
];

async function seedTechnicians() {
  console.log("Seeding technician accounts...\n");

  for (const tech of TECHNICIANS) {
    try {
      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          phone: tech.phone,
          phone_confirm: true,
          user_metadata: { name: tech.name, role: "technician" },
        });

      if (authError) {
        console.error(`Failed to create auth user for ${tech.phone}:`, authError.message);
        continue;
      }

      const userId = authData.user.id;

      // Upsert into users table
      const { error: dbError } = await supabase.from("users").upsert({
        id: userId,
        phone: tech.phone,
        name: tech.name,
        role: "technician",
        notification_preference: "sms",
      });

      if (dbError) {
        console.error(`Failed to insert user record for ${tech.phone}:`, dbError.message);
        continue;
      }

      console.log(`✅ Created technician: ${tech.name} (${tech.phone})`);
    } catch (err) {
      console.error(`Unexpected error for ${tech.phone}:`, err);
    }
  }

  console.log("\nSeeding complete.");
}

seedTechnicians();

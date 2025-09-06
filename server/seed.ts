import { hashPassword } from "./auth";
import { storage } from "./storage";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  // Only allow seeding in development or when explicitly enabled
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_SEED !== "true") {
    console.log("ℹ️ Demo seeding disabled in production environment");
    return false;
  }

  try {
    // Check if demo institution already exists by domain instead of ID
    const existingInstitution = await storage.getInstitutionByDomain("demo-university.edu");
    
    if (!existingInstitution) {
      console.log("📚 Creating demo institution...");
      
      // Create demo institution
      await storage.createInstitution({
        name: "Demo University",
        domain: "demo-university.edu",
        contactEmail: "admin@demo-university.edu",
        contactName: "Demo Admin",
        allowedDomains: ["demo-university.edu"],
        isActive: true
      });

      // Get the created institution to get its ID
      const createdInstitution = await storage.getInstitutionByDomain("demo-university.edu");
      if (!createdInstitution) {
        throw new Error("Failed to create demo institution");
      }

      // Check if license already exists for the institution
      const existingLicense = await storage.getInstitutionLicense(createdInstitution.id);
      
      if (!existingLicense) {
        // Create license for the institution
        await storage.createLicense({
          institutionId: createdInstitution.id,
          licenseType: "site",
          licensedSeats: 1000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          brandingEnabled: true,
          supportLevel: "enterprise",
          isActive: true
        });
        console.log("✅ Demo license created successfully");
      } else {
        console.log("ℹ️ Demo license already exists, skipping...");
      }

      console.log("✅ Demo institution created successfully");
    } else {
      console.log("ℹ️ Demo institution already exists, skipping...");
    }

    // Get institution reference for user creation
    const institution = existingInstitution || await storage.getInstitutionByDomain("demo-university.edu");
    if (!institution) {
      throw new Error("Demo institution not found");
    }

    // Check if demo admin exists
    const existingAdmin = await storage.getUserByEmail("admin@demo-university.edu");
    
    if (!existingAdmin) {
      console.log("👑 Creating demo admin user...");
      
      const hashedAdminPassword = await hashPassword("admin123");
      
      await storage.createUser({
        institutionId: institution.id,
        email: "admin@demo-university.edu",
        password: hashedAdminPassword,
        firstName: "Demo",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
        isActive: true
      });

      console.log("✅ Demo admin created successfully");
    } else {
      console.log("ℹ️ Demo admin already exists, skipping...");
    }

    // Check if demo student exists
    const existingStudent = await storage.getUserByEmail("student@demo-university.edu");
    
    if (!existingStudent) {
      console.log("🎓 Creating demo student user...");
      
      const hashedStudentPassword = await hashPassword("student123");
      
      await storage.createUser({
        institutionId: institution.id,
        email: "student@demo-university.edu",
        password: hashedStudentPassword,
        firstName: "Demo",
        lastName: "Student",
        role: "student",
        school: "Computer Science",
        major: "Software Engineering",
        gradYear: 2025,
        isVerified: true,
        isActive: true
      });

      console.log("✅ Demo student created successfully");
    } else {
      console.log("ℹ️ Demo student already exists, skipping...");
    }

    console.log("🎉 Database seeding completed successfully!");
    return true;

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    // Check if demo admin exists to determine if database is seeded
    const demoAdmin = await storage.getUserByEmail("admin@demo-university.edu");
    return !demoAdmin;
  } catch (error) {
    console.log("Database check failed, assuming empty:", error);
    return true;
  }
}
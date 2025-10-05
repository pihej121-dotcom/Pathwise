import { hashPassword } from "./auth";
import { storage } from "./storage";

export async function seedDatabase() {
  console.log("🌱 Database seeding disabled");
  return false;
}

export async function isDatabaseEmpty(): Promise<boolean> {
  return false;
}

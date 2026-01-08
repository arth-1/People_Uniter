import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Seed data constants
const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Arnav", "Ayaan", "Krishna", "Ishaan",
  "Aadhya", "Saanvi", "Kiara", "Diya", "Aanya", "Pari", "Navya", "Angel", "Aaradhya", "Ananya",
  "Rohan", "Aryan", "Kabir", "Reyansh", "Atharv", "Shaurya", "Rudra", "Advait", "Aarush", "Dev",
  "Priya", "Riya", "Sara", "Mira", "Zara", "Tara", "Nisha", "Meera", "Kavya", "Tanvi",
  "Raghav", "Karan", "Aakash", "Harsh", "Yash", "Varun", "Nikhil", "Sahil", "Siddharth", "Akshay",
];

const lastNames = [
  "Sharma", "Verma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Joshi", "Desai", "Rao",
  "Nair", "Iyer", "Mehta", "Kapoor", "Malhotra", "Chopra", "Bhatia", "Agarwal", "Bansal", "Sinha",
];

const branches = ["AIML", "Computer Science", "Electronics", "Mechanical", "Management"];
const years = ["First Year", "Second Year", "Third Year", "Fourth Year"];
const groupTypes = ["public", "private"];

const hobbies = [
  "photography", "music", "AI/ML", "web dev", "gaming", "sports", "reading", "traveling",
  "cooking", "art", "dancing", "coding", "hackathons", "volunteering", "design", "fitness",
];

const groupNames = [
  "AI/ML Club", "Photography Society", "Music Band", "Web Dev Guild", "Gaming Squad",
  "Sports Team", "Book Club", "Travel Enthusiasts", "Coding Ninjas", "Design Studio",
  "Dance Crew", "Fitness Warriors", "Robotics Lab", "Startup Incubator", "Community Volunteers",
  "Math Circle", "Physics Forum", "Chemistry Lab", "Biology Research", "Economics Society",
];

const eventTitles = [
  "Workshop: Introduction to Machine Learning",
  "Photography Walk in Campus",
  "Open Mic Night",
  "Hackathon 2026",
  "Sports Tournament",
  "Book Reading Session",
  "Tech Talk: Future of AI",
  "Design Sprint",
  "Coding Competition",
  "Community Cleanup Drive",
  "Guest Lecture Series",
  "Project Showcase",
  "Musical Evening",
  "Career Fair",
  "Innovation Challenge",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  await supabase.from("interactions").delete().neq("id", 0);
  await supabase.from("recommendations_metadata").delete().neq("id", 0);
  await supabase.from("events").delete().neq("id", 0);
  await supabase.from("group_members").delete().neq("group_id", 0);
  await supabase.from("groups").delete().neq("id", 0);
  await supabase.from("user_interests").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✅ Database cleared\n");
}

async function seedInterests() {
  console.log("🌱 Seeding interests...");
  
  const interests = [
    { name: "AI/ML", category: "tech" },
    { name: "Photography", category: "art" },
    { name: "Music", category: "art" },
    { name: "Web Development", category: "tech" },
    { name: "Community Volunteering", category: "social" },
    { name: "Design", category: "creative" },
    { name: "Gaming", category: "entertainment" },
    { name: "Sports", category: "physical" },
    { name: "Reading", category: "learning" },
    { name: "Traveling", category: "adventure" },
    { name: "Cooking", category: "lifestyle" },
    { name: "Dancing", category: "art" },
    { name: "Fitness", category: "physical" },
    { name: "Robotics", category: "tech" },
    { name: "Startups", category: "business" },
  ];

  const { data, error } = await supabase
    .from("interests")
    .upsert(interests, { onConflict: "name" })
    .select();
  
  if (error) throw error;
  console.log(`✅ Created ${data.length} interests\n`);
  return data;
}

async function seedUsers(count = 50) {
  console.log(`🌱 Seeding ${count} users...`);
  
  const users = [];
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.edu`;
    
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
    });

    if (authError) {
      console.error(`❌ Failed to create auth user ${email}:`, authError.message);
      continue;
    }

    const user = {
      auth_user_id: authData.user.id,
      name: `${firstName} ${lastName}`,
      year: randomItem(years),
      branch: randomItem(branches),
      bio: `Passionate about ${randomItem(hobbies)} and ${randomItem(hobbies)}. Love to connect with like-minded people!`,
      visibility: Math.random() > 0.2 ? "public" : "community",
    };
    users.push(user);
  }

  const { data, error } = await supabase.from("users").insert(users).select();
  if (error) throw error;
  
  console.log(`✅ Created ${data.length} users\n`);
  return data;
}

async function seedUserInterests(users, interests) {
  console.log("🌱 Seeding user interests...");
  
  const userInterests = [];
  for (const user of users) {
    const interestCount = randomInt(2, 6);
    const selectedInterests = randomItems(interests, interestCount);
    
    for (const interest of selectedInterests) {
      userInterests.push({
        user_id: user.id,
        interest_id: interest.id,
        weight: randomFloat(0.3, 1.0),
      });
    }
  }

  const { data, error } = await supabase.from("user_interests").insert(userInterests).select();
  if (error) throw error;
  
  console.log(`✅ Created ${data.length} user-interest relationships\n`);
  return data;
}

async function seedGroups(users, count = 20) {
  console.log(`🌱 Seeding ${count} groups...`);
  
  const groups = [];
  const usedNames = new Set();
  
  for (let i = 0; i < count; i++) {
    let groupName = randomItem(groupNames);
    let attempts = 0;
    while (usedNames.has(groupName) && attempts < 10) {
      groupName = randomItem(groupNames);
      attempts++;
    }
    if (attempts === 10) groupName = `${groupName} ${i}`;
    usedNames.add(groupName);

    groups.push({
      name: groupName,
      description: `A community for students interested in ${groupName.toLowerCase()}. Join us for exciting activities and networking!`,
      owner_id: randomItem(users).id,
      type: randomItem(groupTypes),
      rules: "Be respectful, collaborative, and inclusive.",
    });
  }

  const { data, error } = await supabase.from("groups").insert(groups).select();
  if (error) throw error;
  
  console.log(`✅ Created ${data.length} groups\n`);
  return data;
}

async function seedGroupMembers(users, groups) {
  console.log("🌱 Seeding group members...");
  
  const members = [];
  const membershipSet = new Set();
  
  // Each group gets 5-15 members
  for (const group of groups) {
    const memberCount = randomInt(5, 15);
    const selectedUsers = randomItems(users, memberCount);
    
    // Owner is always admin
    members.push({
      group_id: group.id,
      user_id: group.owner_id,
      role: "admin",
    });
    membershipSet.add(`${group.id}-${group.owner_id}`);
    
    for (const user of selectedUsers) {
      const key = `${group.id}-${user.id}`;
      if (!membershipSet.has(key)) {
        members.push({
          group_id: group.id,
          user_id: user.id,
          role: "member",
        });
        membershipSet.add(key);
      }
    }
  }

  const { data, error } = await supabase.from("group_members").insert(members);
  if (error) throw error;
  
  console.log(`✅ Created ${members.length} group memberships\n`);
  return members;
}

async function seedEvents(groups, count = 30) {
  console.log(`🌱 Seeding ${count} events...`);
  
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const group = randomItem(groups);
    const daysOffset = randomInt(-10, 30); // Past and future events
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + daysOffset);
    eventDate.setHours(randomInt(9, 20), randomInt(0, 59));

    events.push({
      group_id: group.id,
      title: randomItem(eventTitles),
      description: `Join us for an exciting ${randomItem(eventTitles).toLowerCase()}. Open to all students!`,
      time: eventDate.toISOString(),
    });
  }

  const { data, error } = await supabase.from("events").insert(events).select();
  if (error) throw error;
  
  console.log(`✅ Created ${data.length} events\n`);
  return data;
}

async function seedInteractions(users, groups, events, count = 200) {
  console.log(`🌱 Seeding ${count} interactions...`);
  
  const interactions = [];
  const actions = ["view", "join", "leave", "like", "click"];
  
  for (let i = 0; i < count; i++) {
    const user = randomItem(users);
    const targetType = randomItem(["group", "event", "user"]);
    let targetId;
    
    if (targetType === "group") {
      targetId = String(randomItem(groups).id);
    } else if (targetType === "event") {
      targetId = String(randomItem(events).id);
    } else {
      targetId = randomItem(users).id;
    }

    interactions.push({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      action: randomItem(actions),
      duration: randomInt(5, 300),
    });
  }

  const { data, error } = await supabase.from("interactions").insert(interactions);
  if (error) throw error;
  
  console.log(`✅ Created ${interactions.length} interactions\n`);
  return interactions;
}

async function seedRecommendations(users, groups, events) {
  console.log("🌱 Seeding sample recommendations...");
  
  const recommendations = [];
  const recoSet = new Set();
  
  // Give each user 3-8 recommendations
  for (const user of users.slice(0, 30)) { // Only for first 30 users to keep it manageable
    const recoCount = randomInt(3, 8);
    
    for (let i = 0; i < recoCount; i++) {
      const entityType = randomItem(["group", "event"]);
      let entityId;
      
      if (entityType === "group") {
        entityId = String(randomItem(groups).id);
      } else {
        entityId = String(randomItem(events).id);
      }

      const key = `${user.id}-${entityType}-${entityId}`;
      if (!recoSet.has(key)) {
        recommendations.push({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          score: randomFloat(0.5, 0.99),
        });
        recoSet.add(key);
      }
    }
  }

  const { error } = await supabase.from("recommendations_metadata").upsert(recommendations, {
    onConflict: "user_id,entity_type,entity_id",
  });
  
  if (error) throw error;
  
  console.log(`✅ Created ${recommendations.length} recommendations\n`);
  return recommendations;
}

async function main() {
  console.log("🚀 Starting database seeding...\n");
  
  try {
    // Optional: clear existing data (comment out if you want to keep existing data)
    // await clearDatabase();
    
    const interests = await seedInterests();
    const users = await seedUsers(50);
    await seedUserInterests(users, interests);
    const groups = await seedGroups(users, 20);
    await seedGroupMembers(users, groups);
    const events = await seedEvents(groups, 30);
    await seedInteractions(users, groups, events, 200);
    await seedRecommendations(users, groups, events);
    
    console.log("✅ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - ${interests.length} interests`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${groups.length} groups`);
    console.log(`   - ${events.length} events`);
    console.log(`   - 200 interactions`);
    console.log(`   - Sample recommendations for 30 users`);
    console.log("\n🎉 You can now login with any user:");
    console.log("   Email: aarav.sharma0@student.edu");
    console.log("   Password: password123");
    console.log("   (or any other generated email with password123)\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();

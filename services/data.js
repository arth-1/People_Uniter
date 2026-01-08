import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/supabase/server";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureUserProfile() {
  const supabase = await createSupabaseServerClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("users")
    .insert({ auth_user_id: user.id, name: user.email })
    .select("id, auth_user_id")
    .single();

  if (error) {
    // Race condition: another request created the user
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("users")
        .select("id, auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      return retry;
    }
    throw error;
  }
  return data;
}

export async function getProfile() {
  const supabase = await createSupabaseServerClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*, user_interests(interest_id, weight, interests(name, category))")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return data;
}

export async function upsertProfile(payload) {
  const supabase = await createSupabaseServerClient();
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure user profile exists first
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Failed to create user profile");

  const { data, error } = await supabase
    .from("users")
    .update({ ...payload })
    .eq("auth_user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInterests() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("interests").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function updateUserInterests(interestWeights) {
  const supabase = await createSupabaseServerClient();
  const userProfile = await ensureUserProfile();
  if (!userProfile) throw new Error("Missing user profile");

  const rows = interestWeights.map(({ interest_id, weight }) => ({
    user_id: userProfile.id,
    interest_id,
    weight,
  }));

  const { error } = await supabase.from("user_interests").upsert(rows, { onConflict: "user_id,interest_id" });
  if (error) throw error;
  return true;
}

export async function listGroups() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members(role, user_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getGroup(groupId) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members(role, user_id), events(*)")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createGroup({ name, description, type }) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, description, type, owner_id: profile.id })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("group_members").insert({ group_id: data.id, user_id: profile.id, role: "admin" });
  return data;
}

export async function joinGroup(groupId) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Not authenticated");

  await supabase.from("group_members").upsert({ group_id: groupId, user_id: profile.id, role: "member" });
  await supabase.from("interactions").insert({ user_id: profile.id, target_type: "group", target_id: String(groupId), action: "join" });
  return true;
}

export async function leaveGroup(groupId) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Not authenticated");

  await supabase.from("group_members").delete().match({ group_id: groupId, user_id: profile.id });
  await supabase.from("interactions").insert({ user_id: profile.id, target_type: "group", target_id: String(groupId), action: "leave" });
  return true;
}

export async function listEvents() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, groups(name, id)")
    .order("time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getEvent(eventId) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, groups(name, id)")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEvent({ group_id, title, description, time }) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .insert({ group_id, title, description, time })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function logInteraction(payload) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("interactions")
    .insert({ ...payload, user_id: profile.id });
  if (error) throw error;
  return true;
}

export async function getRecommendations(limit = 8) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from("recommendations_metadata")
    .select("*")
    .eq("user_id", profile.id)
    .eq("entity_type", "group")
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getRecommendedGroups(limit = 8) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) return [];

  // Get recommendations
  const { data: recs, error: recsError } = await supabase
    .from("recommendations_metadata")
    .select("entity_id, score")
    .eq("user_id", profile.id)
    .eq("entity_type", "group")
    .order("score", { ascending: false })
    .limit(limit);
  
  if (recsError || !recs?.length) return [];

  // Fetch full group details
  const groupIds = recs.map(r => parseInt(r.entity_id));
  const { data: groups } = await supabase
    .from("groups")
    .select("*, group_members(role, user_id)")
    .in("id", groupIds);
  
  if (!groups) return [];

  // Sort by recommendation score
  const scoreMap = Object.fromEntries(recs.map(r => [r.entity_id, r.score]));
  return groups
    .map(g => ({ ...g, rec_score: scoreMap[String(g.id)] ?? 0 }))
    .sort((a, b) => b.rec_score - a.rec_score);
}

export async function getRecommendedEvents(limit = 8) {
  const supabase = await createSupabaseServerClient();
  const profile = await ensureUserProfile();
  if (!profile) return [];

  const { data: recs, error: recsError } = await supabase
    .from("recommendations_metadata")
    .select("entity_id, score")
    .eq("user_id", profile.id)
    .eq("entity_type", "event")
    .order("score", { ascending: false })
    .limit(limit);

  if (recsError || !recs?.length) return [];

  const eventIds = recs.map(r => parseInt(r.entity_id));
  const { data: events } = await supabase
    .from("events")
    .select("*, groups(name, id)")
    .in("id", eventIds);

  if (!events) return [];

  const scoreMap = Object.fromEntries(recs.map(r => [r.entity_id, r.score]));
  return events
    .map(e => ({ ...e, rec_score: scoreMap[String(e.id)] ?? 0 }))
    .sort((a, b) => b.rec_score - a.rec_score);
}

export async function upsertRecommendationScores(records) {
  const serviceClient = createSupabaseServiceRoleClient();
  const { error } = await serviceClient.from("recommendations_metadata").upsert(records, { onConflict: "user_id,entity_type,entity_id" });
  if (error) throw error;
  return true;
}

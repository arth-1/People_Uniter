import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/supabase/server";
import { ensureUserProfile } from "@/services/data";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await ensureUserProfile();
    redirect("/dashboard");
  }

  redirect("/login");
}

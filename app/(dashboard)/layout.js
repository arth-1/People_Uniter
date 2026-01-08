import "../globals.css";
import { ensureUserProfile } from "@/services/data";

export default async function DashboardLayout({ children }) {
  await ensureUserProfile();
  return children;
}

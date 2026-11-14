// app/returns/page.tsx
// The Returns page now lives inside Parcels (Returns tab). This keeps old
// links, bookmarks and notification links working.
import { redirect } from "next/navigation";

export default function ReturnsRedirect() {
  redirect("/register?tab=returns");
}
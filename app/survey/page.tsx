import { redirect } from "next/navigation";

// The waitlist and the survey are one flow now.
export default function Page() {
  redirect("/waitlist");
}

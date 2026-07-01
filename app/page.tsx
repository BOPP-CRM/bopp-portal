import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  redirect("/login");
}

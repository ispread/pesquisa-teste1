import { redirect } from "next/navigation";
import { checkUserSubscription } from "@/app/actions";
import { createClient } from "../../supabase/server";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
  skipCheck?: boolean;
}

export async function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
  skipCheck = false,
}: SubscriptionCheckProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Skip subscription check if specified (for pages that should be accessible without subscription)
  if (skipCheck) {
    return <>{children}</>;
  }

  const isSubscribed = await checkUserSubscription(user?.id!);

  if (!isSubscribed) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}

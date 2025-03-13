import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/profile-settings";
import SecuritySettings from "@/components/settings/security-settings";
import BillingSettings from "@/components/settings/billing-settings";
import ApiSettings from "@/components/settings/api-settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch subscription data
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-gray-500 mt-2">
              Manage your account settings and preferences
            </p>
          </header>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-8 grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings user={user} profile={profile} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecuritySettings user={user} />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <BillingSettings user={user} subscription={subscription} />
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <ApiSettings user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}

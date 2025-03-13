"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "../../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

interface BillingSettingsProps {
  user: User;
  subscription: any;
}

export default function BillingSettings({
  user,
  subscription,
}: BillingSettingsProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // Redirect to customer portal or subscription management page
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: subscription?.price_id,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard/settings`,
          },
        },
      );

      if (error) throw error;

      // Redirect to Stripe checkout or customer portal
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to manage subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Current Plan</h2>

        {subscription ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  {subscription.status === "active"
                    ? "Active Subscription"
                    : "Subscription"}
                  <Badge
                    className="ml-2"
                    variant={
                      subscription.status === "active" ? "default" : "outline"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </h3>
                <p className="text-gray-500">
                  {formatCurrency(subscription.amount, subscription.currency)} /{" "}
                  {subscription.interval}
                </p>
              </div>
              <Button onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Current Period</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(subscription.current_period_start)} -{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-gray-500">
                    ••••{subscription?.metadata?.last4 || "4242"}
                  </p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Subscription Ending</AlertTitle>
                <AlertDescription>
                  Your subscription will end on{" "}
                  {formatDate(subscription.current_period_end)}. You can renew
                  it before this date.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">
              You don't have an active subscription
            </p>
            <Button asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Billing History</h2>

        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">
            Your billing history will appear here
          </p>
          <Button variant="outline" disabled>
            View Invoices
          </Button>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Usage</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 / 100</div>
              <CardDescription>0% used</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 MB / 1 GB</div>
              <CardDescription>0% used</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Extractions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 / 500</div>
              <CardDescription>0% used</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

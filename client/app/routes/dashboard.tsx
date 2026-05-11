import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Activity,
  ArrowRight,
  BarChart,
  Box,
  CreditCard,
  DollarSign,
  Package,
  Settings,
  ShoppingCart,
  // Users removed
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | RUN APPAREL" },
    {
      name: "description",
      content: "Main user dashboard for managing your account and orders.",
    },
  ];
}

export default function Dashboard() {
  const statsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".stat-card-item", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
    },
    { scope: statsRef },
  );

  return (
    <div className="min-h-screen bg-muted/10 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Typography.H1 className="font-bold text-3xl tracking-tight">Dashboard</Typography.H1>
            <Typography.P className="text-muted-foreground">
              Welcome back! Here's an overview of your account.
            </Typography.P>
          </div>
          <div className="flex items-center gap-4">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

        <Separator />

        {/* Overview Stats */}
        <div ref={statsRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card-item">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">$45,231.89</div>
                <p className="text-muted-foreground text-xs">+20.1% from last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="stat-card-item">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Active Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">+12</div>
                <p className="text-muted-foreground text-xs">+2 since last week</p>
              </CardContent>
            </Card>
          </div>
          <div className="stat-card-item">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Products</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">573</div>
                <p className="text-muted-foreground text-xs">+201 new items</p>
              </CardContent>
            </Card>
          </div>
          <div className="stat-card-item">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">+573</div>
                <p className="text-muted-foreground text-xs">+201 since last hour</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders - Col Span 4 */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>You have 3 active orders pending shipment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((order) => (
                  <div
                    key={order}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Order #{20240 + order}</p>
                        <p className="text-muted-foreground text-xs">Processing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-sm">$299.00</span>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Col Span 3 */}
          <div className="space-y-8 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and management</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Link to="/products">
                  <Button variant="outline" className="w-full justify-start">
                    <Box className="mr-2 h-4 w-4" />
                    Manage Products
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Your plan and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Pro Plan</span>
                  </div>
                  <span className="font-medium text-green-500 text-xs">Active</span>
                </div>
                <Button variant="secondary" className="w-full">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  DollarSign,
  type LucideIcon,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useLoaderData } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
// Badge import removed as unused
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/analytics";

export async function loader() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      // Mock API call - in a real app this would be an apiRequest
      return {
        totalRevenue: "$45,231.89",
        activeOrders: "126",
        productsSold: "1,203",
        activeUsers: "573",
      };
    },
  });

  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analytics Dashboard | RUN APPAREL" },
    {
      name: "description",
      content: "View detailed analytics and performance metrics for your manufacturing and sales.",
    },
  ];
}

const StatCard = ({
  title,
  value,
  trend,
  icon: Icon,
  trendUp,
}: {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  trendUp: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="font-medium text-sm">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="font-bold text-2xl">{value}</div>
      <p className={`flex items-center text-xs ${trendUp ? "text-green-500" : "text-red-500"}`}>
        {trendUp ? (
          <ArrowUpRight className="mr-1 h-3 w-3" />
        ) : (
          <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
        )}
        {trend}
      </p>
    </CardContent>
  </Card>
);

const data = [
  { name: "Jan", sales: 4000, revenue: 2400 },
  { name: "Feb", sales: 3000, revenue: 1398 },
  { name: "Mar", sales: 2000, revenue: 9800 },
  { name: "Apr", sales: 2780, revenue: 3908 },
  { name: "May", sales: 1890, revenue: 4800 },
  { name: "Jun", sales: 2390, revenue: 3800 },
  { name: "Jul", sales: 3490, revenue: 4300 },
];

import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";

export function Component() {
  const loaderData = useLoaderData<typeof loader>();

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics"],
    // No queryFn needed client-side if hydrated, or we can keep it as fallback
    queryFn: async () => {
      return {
        totalRevenue: "$45,231.89",
        activeOrders: "126",
        productsSold: "1,203",
        activeUsers: "573",
      };
    },
  });

  return (
    <ProtectedAdminRoute>
      <HydrationBoundary state={loaderData?.dehydratedState}>
        <div className="min-h-screen space-y-8 bg-muted/10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <Typography.H1 className="font-bold text-3xl tracking-tight">Analytics</Typography.H1>
              <Typography.P className="text-muted-foreground">
                Overview of your performance metrics and key indicators
              </Typography.P>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">Download Report</Button>
              <Button>View detailed stats</Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={analyticsData?.totalRevenue || "$0.00"}
              trend="+20.1% from last month"
              icon={DollarSign}
              trendUp={true}
            />
            <StatCard
              title="Active Orders"
              value={analyticsData?.activeOrders || "0"}
              trend="+180.1% from last month"
              icon={ShoppingCart}
              trendUp={true}
            />
            <StatCard
              title="Products Sold"
              value={analyticsData?.productsSold || "0"}
              trend="+19% from last month"
              icon={Package}
              trendUp={true}
            />
            <StatCard
              title="Active Users"
              value={analyticsData?.activeUsers || "0"}
              trend="+201 since last hour"
              icon={Users}
              trendUp={true}
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue performance for the current year</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-custom-space-283">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-muted-foreground text-xs" />
                      <YAxis className="text-muted-foreground text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-custom-space-284 text-muted-foreground uppercase">
                                      Sales
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {payload[0]?.value}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-custom-space-285 text-muted-foreground uppercase">
                                      Revenue
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      ${payload[1]?.value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest orders and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className="space-y-1">
                        <p className="font-medium text-sm leading-none">New Order #{2023 + i}</p>
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+$299.00</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/admin">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" /> System Health
                  </CardTitle>
                  <CardDescription>View system performance and logs</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/products">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Products
                  </CardTitle>
                  <CardDescription>Manage inventory and catalog</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/admin/media">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Reports
                  </CardTitle>
                  <CardDescription>Generate sales and specific reports</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </HydrationBoundary>
    </ProtectedAdminRoute>
  );
}

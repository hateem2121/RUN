import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const MetricCardSkeleton = React.memo(function MetricCardSkeleton() {
  return (
    <Card className="overflow-hidden border-green-200 bg-gradient-to-br from-white to-green-50">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="animate-pulse rounded-full bg-green-100 p-3">
            <div className="h-6 w-6 rounded bg-green-300" />
          </div>
          <div className="h-6 w-12 animate-pulse rounded-full bg-green-100" />
        </div>

        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="flex items-baseline gap-1">
            <div className="h-8 w-16 animate-pulse rounded bg-green-200" />
            <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
});

export const ProcessCardSkeleton = React.memo(function ProcessCardSkeleton() {
  return (
    <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="animate-pulse rounded-lg bg-blue-100 p-3">
            <div className="h-6 w-6 rounded bg-blue-300" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-blue-100" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-12 animate-pulse rounded bg-blue-200" />
          </div>
          <div className="h-2 animate-pulse rounded-full bg-gray-200" />
        </div>
      </CardContent>
    </Card>
  );
});

export const InnovationCardSkeleton = React.memo(function InnovationCardSkeleton() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 blur-xl" />
      <Card className="relative border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="animate-pulse rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 p-3">
              <div className="h-6 w-6 rounded bg-purple-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-purple-100" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export const DashboardStatSkeleton = React.memo(function DashboardStatSkeleton() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
      <div className="mx-auto mb-2 h-8 w-8 animate-pulse rounded bg-gray-300" />
      <div className="mx-auto mb-1 h-8 w-16 animate-pulse rounded bg-gray-300" />
      <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
});

export const ChartSkeleton = React.memo(function ChartSkeleton() {
  return (
    <div className="h-96 animate-pulse rounded-lg bg-gray-100 p-8">
      <div className="flex h-full items-center justify-center rounded bg-gray-200">
        <div className="text-gray-400">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gray-300" />
          <div className="h-4 w-32 rounded bg-gray-300" />
        </div>
      </div>
    </div>
  );
});

export const TableRowSkeleton = React.memo(function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="p-4">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="p-4">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
      </td>
    </tr>
  );
});

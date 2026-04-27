import { AlertCircle, CheckCircle, Pause, Play, RefreshCw, X } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  formatTimeRemaining,
  formatUploadSpeed,
  getFileTypeIcon,
  queueManager,
  type UploadQueueItem,
} from "./upload-utilities";

interface UploadItemProps {
  item: UploadQueueItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

export const UploadItem = React.memo(function UploadItem({
  item,
  onCancel,
  onRetry,
  onPause,
  onResume,
}: UploadItemProps) {
  const Icon = getFileTypeIcon(item.file.type);

  const getStatusIcon = () => {
    switch (item.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "uploading":
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return <Icon className="text-[#68869A] h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="bg-white/[0.03] flex items-center justify-between rounded-lg p-3 border border-white/5">
      <div className="flex flex-1 items-center gap-3">
        <div className="shrink-0">{getStatusIcon()}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-[#E3DFD6]">{item.file.name}</p>
            <Badge variant="outline" className="text-xs border-white/10 text-[#68869A]">
              {formatFileSize(item.file.size)}
            </Badge>
          </div>

          {item.status === "uploading" && (
            <div className="mt-1">
              <Progress value={item.progress} className="h-1" />
              <div className="text-[#68869A] mt-1 flex justify-between text-xs">
                <span>{item.progress.toFixed(1)}% uploaded</span>
                <div className="flex gap-2">
                  {item.uploadSpeed && <span>{formatUploadSpeed(item.uploadSpeed)}</span>}
                  {item.estimatedTimeRemaining && item.estimatedTimeRemaining > 0 && (
                    <span>• {formatTimeRemaining(item.estimatedTimeRemaining)} remaining</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {item.status === "error" && item.errorMessage && (
            <div className="mt-1">
              <p className="text-xs text-red-500">{item.errorMessage}</p>
              {item.retryCount && item.retryCount > 0 && (
                <p className="text-[#68869A] text-xs">Retry attempts: {item.retryCount}/3</p>
              )}
            </div>
          )}

          {item.status === "pending" && queueManager.peekNextInQueue()?.id !== item.id && (
            <p className="text-[#68869A] mt-1 text-xs">
              Queued • Position: {queueManager.getQueuePosition(item.id)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {item.status === "uploading" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPause(item.id)}
            className="h-8 w-8 p-0"
          >
            <Pause className="h-3 w-3" />
          </Button>
        )}

        {item.status === "paused" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResume(item.id)}
            className="h-8 w-8 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}

        {item.status === "error" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(item.id)}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}

        {(item.status === "pending" || item.status === "paused" || item.status === "error") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(item.id)}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}

        {item.status !== "completed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(item.id)}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
});

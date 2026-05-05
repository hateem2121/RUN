import { AlertCircle, CheckCircle, Edit2, Pause, Play, RefreshCw, Save, X } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onUpdateMetadata: (id: string, metadata: Partial<UploadQueueItem>) => void;
}

export const UploadItem = React.memo(function UploadItem({
  item,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onUpdateMetadata,
}: UploadItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempMetadata, setTempMetadata] = useState({
    title: item.title || "",
    altText: item.altText || "",
  });

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
        return <Icon className="text-admin-muted h-4 w-4" />;
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

  const handleSave = () => {
    onUpdateMetadata(item.id, tempMetadata);
    setIsEditing(false);
  };

  return (
    <div className="bg-white/[0.03] flex flex-col rounded-lg border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="shrink-0">{getStatusIcon()}</div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-admin-foreground">
                {item.title || item.file.name}
              </p>
              <Badge variant="outline" className="text-xs border-white/10 text-admin-muted">
                {formatFileSize(item.file.size)}
              </Badge>
            </div>

            {item.status === "uploading" && (
              <div className="mt-1">
                <Progress value={item.progress} className="h-1" />
                <div className="text-admin-muted mt-1 flex justify-between text-xs">
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
                  <p className="text-admin-muted text-xs">Retry attempts: {item.retryCount}/3</p>
                )}
              </div>
            )}

            {item.status === "pending" && queueManager.peekNextInQueue()?.id !== item.id && (
              <p className="text-admin-muted mt-1 text-xs">
                Queued • Position: {queueManager.getQueuePosition(item.id)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {item.status !== "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={`h-8 w-8 p-0 ${isEditing ? "text-primary" : "text-admin-muted"}`}
              title="Edit Metadata"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}

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

          {(item.status === "error" || item.status === "paused") && (
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

      {isEditing && (
        <div className="px-3 pb-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor={`title-${item.id}`} className="text-xxs text-admin-muted uppercase">
                Title
              </Label>
              <Input
                id={`title-${item.id}`}
                className="h-7 text-xs bg-black/20 border-white/10"
                value={tempMetadata.title}
                onChange={(e) => setTempMetadata((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`alt-${item.id}`} className="text-xxs text-admin-muted uppercase">
                Alt Text
              </Label>
              <Input
                id={`alt-${item.id}`}
                className="h-7 text-xs bg-black/20 border-white/10"
                value={tempMetadata.altText}
                onChange={(e) => setTempMetadata((prev) => ({ ...prev, altText: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-6 text-xxs gap-1"
            >
              <Save className="h-3 w-3" />
              Save Metadata
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

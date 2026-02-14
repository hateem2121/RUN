import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Key, Search, Send, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface OpenApiSpec {
  paths: Record<string, any>;
  components: any;
}

interface Endpoint {
  path: string;
  method: string;
  details: {
    summary?: string;
    requestBody?: any;
    parameters?: any[];
  };
}

export default function ApiPlayground() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [requestParams, setRequestParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    async function fetchSpec() {
      try {
        const res = await fetch("/openapi.json");
        if (!res.ok) throw new Error("Failed to fetch API specification");
        const data = await res.json();
        setSpec(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSpec();
  }, []);

  const endpoints: Endpoint[] = spec
    ? Object.entries(spec.paths).flatMap(([path, methods]: [string, any]) =>
        Object.keys(methods).map((method) => ({ path, method, details: methods[method] })),
      )
    : [];

  const filteredEndpoints = endpoints.filter(
    (e) =>
      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.details.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleExecute = async () => {
    if (!selectedEndpoint) return;
    setIsExecuting(true);
    setResponse(null);

    let url = selectedEndpoint.path;
    // Replace path params
    Object.entries(requestParams).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authHeader) {
        headers.Authorization = authHeader.startsWith("Bearer ")
          ? authHeader
          : `Bearer ${authHeader}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method.toUpperCase(),
        headers,
      };

      if (["post", "put", "patch"].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      setResponseStatus(res.status);
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message });
      setResponseStatus(500);
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <Typography.P>Loading API Specification...</Typography.P>
      </div>
    );

  if (error)
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardContent className="pt-6 flex items-center gap-4 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <div className="space-y-1">
            <Typography.H3>Error Loading Playground</Typography.H3>
            <Typography.P className="text-sm">{error}</Typography.P>
          </div>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* Sidebar: Endpoints List */}
      <div className="lg:col-span-4 flex flex-col space-y-4 h-full">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredEndpoints.map((e) => (
            <button
              key={`${e.path}-${e.method}`}
              onClick={() => {
                setSelectedEndpoint(e);
                setResponse(null);
                setRequestBody(
                  e.details.requestBody ? JSON.stringify({ example: "data" }, null, 2) : "",
                );
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all hover:border-blue-400 group",
                selectedEndpoint?.path === e.path && selectedEndpoint?.method === e.method
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "bg-card border-transparent",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    e.method === "get"
                      ? "status-info"
                      : e.method === "post"
                        ? "status-active"
                        : e.method === "put"
                          ? "status-warning"
                          : "destructive"
                  }
                  className="text-[10px] uppercase font-bold"
                >
                  {e.method}
                </Badge>
                <code className="text-[11px] font-mono font-medium truncate">{e.path}</code>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{e.details.summary}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Execution & Response */}
      <div className="lg:col-span-8 flex flex-col space-y-6 h-full overflow-y-auto pr-2">
        {selectedEndpoint ? (
          <motion.div
            key={`${selectedEndpoint.path}-${selectedEndpoint.method}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 pb-20"
          >
            <div className="flex items-center justify-between">
              <div>
                <Typography.H2 className="text-2xl">
                  {selectedEndpoint.details.summary}
                </Typography.H2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Badge variant="outline" className="font-mono">
                    {selectedEndpoint.method.toUpperCase()}
                  </Badge>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    {selectedEndpoint.path}
                  </code>
                </div>
              </div>
              <Button onClick={handleExecute} disabled={isExecuting} className="gap-2">
                {isExecuting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Execute
              </Button>
            </div>

            <Tabs defaultValue="params">
              <TabsList className="bg-muted/50 w-full justify-start">
                <TabsTrigger value="params">Parameters</TabsTrigger>
                <TabsTrigger value="auth">Authentication</TabsTrigger>
                {selectedEndpoint.details.requestBody && (
                  <TabsTrigger value="body">Request Body</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="params" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {selectedEndpoint.path.includes("{") ? (
                      <div className="space-y-4">
                        {selectedEndpoint.path
                          .split("{")
                          .slice(1)
                          .map((p, i) => {
                            const paramName = p.split("}")[0];
                            if (!paramName) return null;
                            return (
                              <div key={`${paramName}-${i}`} className="space-y-2">
                                <label className="text-xs font-medium">
                                  {paramName} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder={`Enter ${paramName}`}
                                  value={requestParams[paramName] || ""}
                                  onChange={(e) =>
                                    setRequestParams((prev) => ({
                                      ...prev,
                                      [paramName]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm italic">
                        No path parameters required for this endpoint.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auth" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-4 w-4" />
                      <span>Security Headers</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Authorization Header</label>
                      <Input
                        placeholder="Bearer <token> or just <token>"
                        value={authHeader}
                        onChange={(e) => setAuthHeader(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Note: Bearer prefix will be added if missing.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {selectedEndpoint.details.requestBody && (
                <TabsContent value="body" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Textarea
                        className="font-mono text-sm min-h-[200px] bg-neutral-900 text-green-400 border-neutral-800"
                        placeholder='{ "key": "value" }'
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Typography.H3 className="text-lg">Response</Typography.H3>
                    <Badge
                      variant={
                        responseStatus && responseStatus >= 200 && responseStatus < 300
                          ? "status-active"
                          : "destructive"
                      }
                      className="font-mono"
                    >
                      STATUS: {responseStatus}
                    </Badge>
                  </div>
                  <pre className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-blue-300 overflow-x-auto shadow-2xl">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="p-4 rounded-full bg-muted">
              <Terminal className="h-10 w-10" />
            </div>
            <div className="max-w-xs">
              <Typography.H3>Select an Endpoint</Typography.H3>
              <Typography.P className="text-sm">
                Choose an API endpoint from the sidebar to start testing your integration.
              </Typography.P>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

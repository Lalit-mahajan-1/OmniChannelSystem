import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Database, MessageSquare } from "lucide-react";

export function RAGMemoryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, customerId: "", employerId: "" }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RAG Customer Memory</h1>
        <p className="text-muted-foreground">Search customer conversation history and knowledge base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search conversations and knowledge base..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {result.type === "conversation" ? (
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                ) : (
                  <Database className="h-5 w-5 text-green-500" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{result.type}</Badge>
                    {result.score && (
                      <Badge variant="secondary">Score: {result.score.toFixed(3)}</Badge>
                    )}
                  </div>
                  <p className="text-sm">{result.text}</p>
                  {result.metadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {JSON.stringify(result.metadata)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, BookOpen, Edit, Trash2 } from "lucide-react";

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/knowledge-base");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`/api/knowledge-base/search?q=${searchQuery}`);
      const data = await res.json();
      setArticles(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleCreate = async (formData: FormData) => {
    try {
      await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          content: formData.get("content"),
          category: formData.get("category"),
        }),
      });
      setIsDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage support articles and documentation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(new FormData(e.currentTarget)); }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" required />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" rows={6} required />
                </div>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article._id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{article.title}</h3>
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.content}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

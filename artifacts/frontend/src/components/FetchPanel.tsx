import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFetchParagraph, type Paragraph } from "@/hooks/use-api";
import { useParagraphCount } from "@/context/CountContext";
import { format } from "date-fns";
import { History, BookOpen, AlertCircle, Sparkles, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FetchPanel() {
  const { mutate, isPending, error } = useFetchParagraph();
  const { totalParagraphs } = useParagraphCount();
  const [history, setHistory] = useState<Paragraph[]>([]);

  const handleFetch = () => {
    mutate(undefined, {
      onSuccess: (res) => {
        if (res.data) {
          setHistory((prev) => [res.data, ...prev]);
        }
      }
    });
  };

  const current = history[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-primary h-6 w-6" />
            Content Ingestion
          </h2>
          <p className="text-muted-foreground mt-1">
            Fetch random paragraphs from external sources and index them securely.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {totalParagraphs !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span className="font-mono font-bold text-foreground">{totalParagraphs}</span> stored
            </div>
          )}
          <Button onClick={handleFetch} isLoading={isPending} size="lg" className="flex-1 md:flex-initial shadow-primary/25">
            <Sparkles className="w-4 h-4 mr-2" />
            Fetch New Paragraph
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Fetch Failed</h4>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-b from-card to-background">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="success">Latest Acquisition</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {current.id}
                  </span>
                </div>
                <p className="text-lg leading-relaxed text-foreground/90 font-serif">
                  "{current.content}"
                </p>
                <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Fetched {format(new Date(current.fetched_at), "PPpp")}
                  </div>
                  <a href={current.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Source URL ↗
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 1 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
            <History className="text-muted-foreground w-5 h-5" />
            Session History
          </h3>
          <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {history.slice(1).map((p) => (
              <Card key={p.id} className="bg-secondary/30 border-transparent hover:border-border transition-colors">
                <CardContent className="p-5">
                  <p className="text-sm line-clamp-2 mb-3 text-foreground/80">{p.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">#{p.id}</span>
                    <span>{format(new Date(p.fetched_at), "HH:mm:ss")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && !isPending && !error && (
        <div className="py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-secondary/10">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No content yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Click the fetch button above to retrieve and index your first paragraph.
          </p>
        </div>
      )}
    </div>
  );
}

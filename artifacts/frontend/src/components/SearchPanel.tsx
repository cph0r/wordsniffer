import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParagraphs, type Paragraph } from "@/hooks/use-api";
import { Search, X, Layers, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function HighlightedText({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  
  // Create safe regex for words, escaping special chars
  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium shadow-[0_0_10px_rgba(var(--primary),0.2)] bg-transparent border border-primary/30">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SearchPanel() {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [operator, setOperator] = useState<"or" | "and">("or");
  const { mutate, data, isPending, error } = useSearchParagraphs();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSearch = () => {
    if (tags.length === 0) return;
    mutate({ words: tags, operator });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="text-primary h-6 w-6" />
          Semantic Search
        </h2>
        <p className="text-muted-foreground mt-1">
          Find paragraphs containing specific keywords. Use comma or enter to add words.
        </p>
      </div>

      <Card className="bg-secondary/20 backdrop-blur-sm border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/80">Search Terms</label>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-background border-2 border-border/50 rounded-xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/20">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Type a word and press Enter..." : "Add another word..."}
                className="flex-1 bg-transparent border-none outline-none min-w-[150px] text-sm py-1 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 p-1.5 bg-background rounded-xl border border-border/50 w-fit">
              <button
                onClick={() => setOperator("or")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${operator === "or" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Match ANY (OR)
              </button>
              <button
                onClick={() => setOperator("and")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${operator === "and" ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Match ALL (AND)
              </button>
            </div>

            <Button onClick={handleSearch} disabled={tags.length === 0} isLoading={isPending} className="w-full sm:w-auto px-8">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Search Failed</h4>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Search Results</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
              {data.meta.count} found
            </span>
          </div>

          {data.data.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-secondary/10">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No matches found</h3>
              <p className="text-muted-foreground mt-2">
                Try changing your search terms or using the OR operator.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence>
                {data.data.map((p: Paragraph, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors group">
                      <CardContent className="p-6">
                        <p className="text-foreground/90 leading-relaxed font-serif">
                          <HighlightedText text={p.content} words={data.meta.words} />
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {p.id}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

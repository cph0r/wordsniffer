import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParagraphs, type Paragraph } from "@/hooks/use-api";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function HighlightedText({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;

  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-foreground/15 text-foreground px-0.5 font-semibold">
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
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold">Search</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find paragraphs containing specific words.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border border-border bg-card min-h-[44px] focus-within:border-foreground/30 transition-colors">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-foreground/10 text-foreground"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? "Type a word, press Enter…" : "Add more…"}
            className="flex-1 bg-transparent border-none outline-none min-w-[120px] text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex text-xs font-medium">
            <button
              onClick={() => setOperator("or")}
              className={`px-3 py-1.5 border transition-colors ${
                operator === "or"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              OR
            </button>
            <button
              onClick={() => setOperator("and")}
              className={`px-3 py-1.5 border border-l-0 transition-colors ${
                operator === "and"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              AND
            </button>
          </div>

          <Button onClick={handleSearch} disabled={tags.length === 0} isLoading={isPending}>
            Search
          </Button>
        </div>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <span className="text-destructive">{error.message}</span>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Results</span>
            <span className="text-muted-foreground font-mono text-xs">{data.meta.count} found</span>
          </div>

          {data.data.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No matches found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {data.data.map((p: Paragraph, i: number) => (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border border-border p-4"
                  >
                    <p className="text-sm leading-relaxed text-foreground/85">
                      <HighlightedText text={p.content} words={data.meta.words} />
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono">
                      #{p.id}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

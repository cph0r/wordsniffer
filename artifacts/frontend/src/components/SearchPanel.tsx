import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParagraphs, type Paragraph } from "@/hooks/use-api";
import { Search, X, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function HighlightedText({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;

  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <span className="word-glow">
      {parts.map((part, i) =>
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
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
    <div className="space-y-3 animate-fade-in">
      <div className="terminal-card rounded">
        <div className="terminal-header">
          <Search className="w-3 h-3 text-cyan" />
          <span className="neon-text-cyan">QUERY_ENGINE</span>
        </div>

        <div className="terminal-body space-y-3">
          <div className="space-y-2">
            <label htmlFor="search-input" className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
              Search Terms
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-background/50 border border-border rounded min-h-[40px] focus-within:border-cyan/50 focus-within:shadow-[0_0_8px_#00e5ff15] transition-all">
              <span className="text-cyan text-[11px] shrink-0">$&gt;</span>
              <AnimatePresence>
                {tags.map(tag => (
                  <motion.span
                    key={tag}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded border neon-border-cyan text-cyan bg-cyan/5"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="hover:text-neon-red transition-colors ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              <input
                id="search-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "type word + enter..." : "add more..."}
                className="flex-1 bg-transparent border-none outline-none min-w-[100px] text-[12px] font-mono text-foreground placeholder:text-muted-foreground/50"
              />
              <span className="animate-blink text-cyan text-[11px]">█</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center bg-background/50 rounded border border-border overflow-hidden">
              <button
                onClick={() => setOperator("or")}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                  operator === "or"
                    ? "bg-cyan/15 text-cyan border-r border-cyan/30"
                    : "text-muted-foreground hover:text-foreground border-r border-border"
                }`}
              >
                OR
              </button>
              <button
                onClick={() => setOperator("and")}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
                  operator === "and"
                    ? "bg-cyan/15 text-cyan"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AND
              </button>
            </div>

            <Button
              onClick={handleSearch}
              disabled={tags.length === 0}
              isLoading={isPending}
              className="glitch-hover"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              EXEC
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="terminal-card rounded border-neon-red/30">
          <div className="terminal-header !border-neon-red/20">
            <AlertCircle className="w-3 h-3 text-neon-red" />
            <span className="text-neon-red">QUERY_FAILED</span>
          </div>
          <div className="terminal-body text-neon-red/80 text-[12px]">
            {error.message}
          </div>
        </div>
      )}

      {data && (
        <div className="terminal-card rounded">
          <div className="terminal-header">
            <span className="neon-text">RESULTS</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground">matches:</span>
              <span className="neon-text font-bold text-[13px]">{data.meta.count}</span>
            </span>
          </div>

          {data.data.length === 0 ? (
            <div className="terminal-body text-center py-10">
              <div className="text-xl font-display neon-text opacity-20 mb-2">NULL</div>
              <p className="text-[11px] text-muted-foreground font-mono">
                No matching records. Try different terms or OR operator.
              </p>
            </div>
          ) : (
            <div className="terminal-body space-y-0 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {data.data.map((p: Paragraph, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/20 last:border-0 py-2.5 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        [{String(i + 1).padStart(2, "0")}]
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/50">
                        ID:{p.id}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-foreground/70">
                      <HighlightedText text={p.content} words={data.meta.words} />
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {!data && !error && !isPending && (
        <div className="terminal-card rounded">
          <div className="terminal-body text-center py-10">
            <Search className="w-8 h-8 mx-auto text-cyan/20 mb-3" />
            <p className="text-[11px] text-muted-foreground font-mono">
              Add search terms and execute query
            </p>
            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-mono text-muted-foreground">
              <span className="text-cyan">$&gt;</span>
              <span>awaiting input</span>
              <span className="animate-blink text-cyan">█</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

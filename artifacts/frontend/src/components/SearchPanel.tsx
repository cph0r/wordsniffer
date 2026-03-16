import { useState, useMemo, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParagraphs, type Paragraph } from "@/hooks/use-api";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HighlightedText = memo(function HighlightedText({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;

  const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(${escapedWords.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="bg-foreground/30 text-foreground px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

export function SearchPanel() {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submittedTags, setSubmittedTags] = useState<string[]>([]);
  const [operator, setOperator] = useState<"or" | "and">("or");
  const [submittedOperator, setSubmittedOperator] = useState<"or" | "and">("or");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useSearchParagraphs(submittedTags, submittedOperator);

  const allResults = useMemo(
    () => data?.pages.flatMap(p => p.data) ?? [],
    [data]
  );

  const meta = data?.pages[0]?.meta;

  const totalMatches = useMemo(() => {
    if (!data?.pages.length) return 0;
    return data.pages[0].meta.total;
  }, [data]);

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

  const handleSearch = useCallback(() => {
    if (tags.length === 0) return;
    setSubmittedTags([...tags]);
    setSubmittedOperator(operator);
  }, [tags, operator]);

  const hasSearched = submittedTags.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold">Sniff</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Let the pup sniff out paragraphs by scent (words).
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
            placeholder={tags.length === 0 ? "Drop a scent, press Enter…" : "Add another scent…"}
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
              ANY SCENT
            </button>
            <button
              onClick={() => setOperator("and")}
              className={`px-3 py-1.5 border border-l-0 transition-colors ${
                operator === "and"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              ALL SCENTS
            </button>
          </div>

          <Button onClick={handleSearch} disabled={tags.length === 0} isLoading={isLoading && !isFetchingNextPage}>
            Sniff!
          </Button>
        </div>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <span className="text-destructive">{error.message}</span>
        </div>
      )}

      {hasSearched && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Trails found</span>
            <span className="text-muted-foreground font-mono text-xs">
              {allResults.length} of {totalMatches} sniffed out
            </span>
          </div>

          {allResults.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No scent found. Try different words!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {allResults.map((p: Paragraph, i: number) => (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.03 }}
                    className="border border-border p-4"
                  >
                    <p className="text-sm leading-relaxed text-foreground/85">
                      <HighlightedText text={p.content} words={meta?.words ?? []} />
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground font-mono">
                      #{p.id}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Sniffing…
                      </>
                    ) : (
                      "Keep sniffing"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isLoading && !isFetchingNextPage && hasSearched && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

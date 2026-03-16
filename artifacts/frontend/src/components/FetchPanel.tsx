import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFetchParagraph, useRecentParagraphs, type Paragraph } from "@/hooks/use-api";
import { useParagraphCount } from "@/context/CountContext";
import { AlertCircle, Eye, EyeOff, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function ParagraphCard({ p }: { p: Paragraph }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border border-border p-4 space-y-3"
    >
      <p
        className={`text-sm leading-relaxed text-foreground/85 ${expanded ? "" : "line-clamp-3"}`}
      >
        {p.content}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          #{p.id} · {timeFormatter.format(new Date(p.fetched_at))}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            {expanded ? (
              <>
                <EyeOff className="w-3 h-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Peek
              </>
            )}
          </button>
          <a
            href={p.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Trail
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export function FetchPanel() {
  const { mutate, isPending, error } = useFetchParagraph();
  const { totalParagraphs } = useParagraphCount();
  const {
    data,
    isLoading: isLoadingRecent,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecentParagraphs();

  const history: Paragraph[] = data?.pages.flatMap((p) => p.data) ?? [];

  const handleFetch = () => {
    mutate(undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Fetch</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send the pup out to retrieve a fresh paragraph.
          </p>
        </div>
        <Button onClick={handleFetch} isLoading={isPending}>
          {isPending ? "Fetching…" : "Fetch!"}
        </Button>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <span className="text-destructive">{error.message}</span>
        </div>
      )}

      {isLoadingRecent && history.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-muted w-full" />
              <div className="h-4 bg-muted w-3/4" />
              <div className="flex justify-between">
                <div className="h-3 bg-muted w-20" />
                <div className="h-3 bg-muted w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {history.map((p, i) => (
          <ParagraphCard key={`${p.id}-${i}`} p={p} />
        ))}
      </AnimatePresence>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs font-medium text-muted-foreground hover:text-foreground border border-border px-4 py-2 transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? "Digging…" : "Dig up more"}
          </button>
        </div>
      )}

      {history.length === 0 && !isPending && !error && !isLoadingRecent && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No bones buried yet. Hit Fetch to send the pup out!
          </p>
        </div>
      )}
    </div>
  );
}

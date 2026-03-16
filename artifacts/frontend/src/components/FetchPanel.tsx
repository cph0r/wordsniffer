import { Button } from "@/components/ui/button";
import { useFetchParagraph, useRecentParagraphs, type Paragraph } from "@/hooks/use-api";
import { useParagraphCount } from "@/context/CountContext";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function FetchPanel() {
  const { mutate, isPending, error } = useFetchParagraph();
  const { totalParagraphs } = useParagraphCount();
  const { data: recentData, isLoading: isLoadingRecent } = useRecentParagraphs();

  const history: Paragraph[] = recentData?.data ?? [];

  const handleFetch = () => {
    mutate(undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Fetch</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Retrieve and store paragraphs from external sources.
          </p>
        </div>
        <Button onClick={handleFetch} isLoading={isPending}>
          {isPending ? "Fetching…" : "Fetch"}
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
          <motion.article
            key={`${p.id}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-border p-4 space-y-3"
          >
            <p className="text-sm leading-relaxed text-foreground/85 line-clamp-3">
              {p.content}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>#{p.id} · {timeFormatter.format(new Date(p.fetched_at))}</span>
              <a
                href={p.source_url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground underline underline-offset-2 transition-colors"
              >
                source
              </a>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>

      {history.length === 0 && !isPending && !error && !isLoadingRecent && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No paragraphs fetched yet.
          </p>
        </div>
      )}
    </div>
  );
}

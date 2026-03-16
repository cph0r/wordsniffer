import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFetchParagraph, type Paragraph } from "@/hooks/use-api";
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

      <AnimatePresence>
        {history.map((p, i) => (
          <motion.article
            key={`${p.id}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-border p-4 space-y-3"
          >
            <p className="text-sm leading-relaxed text-foreground/85">
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

      {history.length === 0 && !isPending && !error && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No paragraphs fetched yet.
          </p>
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDictionary, type WordDefinition } from "@/hooks/use-api";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DictionaryPanel() {
  const { data, isFetching, error, refetch } = useDictionary();
  const maxFrequency = useMemo(
    () => data?.data?.reduce((max, w) => Math.max(max, w.frequency), 0) || 1,
    [data?.data]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Dictionary</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Top 10 most frequent words with definitions.
          </p>
        </div>
        <Button onClick={() => refetch()} isLoading={isFetching}>
          {isFetching ? "Scanning…" : "Rescan"}
        </Button>
      </div>

      {error && (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <span className="text-destructive">{error.message}</span>
        </div>
      )}

      {isFetching && !data && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-5 h-4 bg-muted" />
              <div className="h-4 bg-muted w-20" />
              <div className="flex-1 h-2 bg-muted" />
              <div className="w-8 h-4 bg-muted" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono mb-4">
            {data.meta.total_paragraphs} paragraphs analyzed
          </div>

          <AnimatePresence>
            {data.data.map((item: WordDefinition, i: number) => {
              const pct = (item.frequency / maxFrequency) * 100;

              return (
                <motion.div
                  key={item.word}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="group py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right tabular-nums">
                      {i + 1}
                    </span>

                    <span className="text-sm font-semibold min-w-[80px]">
                      {item.word}
                    </span>

                    <div className="flex-1 h-1 bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                        className="h-full bg-foreground/60"
                      />
                    </div>

                    <span className="text-xs font-mono font-semibold tabular-nums min-w-[28px] text-right">
                      {item.frequency}
                    </span>
                  </div>

                  <div className="ml-9 mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {item.phonetic && (
                      <span className="font-mono">{item.phonetic}</span>
                    )}
                    {item.part_of_speech && (
                      <span className="italic">{item.part_of_speech}</span>
                    )}
                    {item.found && item.definition !== "definition_not_found" ? (
                      <span className="text-foreground/60">— {item.definition}</span>
                    ) : (
                      <span className="text-muted-foreground/50">no definition</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!data && !error && !isFetching && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Loading word frequencies…
          </p>
        </div>
      )}
    </div>
  );
}

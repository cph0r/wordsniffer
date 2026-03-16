import { Button } from "@/components/ui/button";
import { useDictionary, type WordDefinition } from "@/hooks/use-api";
import { BookA, AlertCircle, Volume2, ChevronRight, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DictionaryPanel() {
  const { mutate, data, isPending, error } = useDictionary();
  const maxFrequency = data?.data?.reduce((max, w) => Math.max(max, w.frequency), 0) || 1;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="terminal-card rounded">
        <div className="terminal-header">
          <BookA className="w-3 h-3 text-amber" />
          <span className="neon-text-amber">LEXICON_ANALYZER</span>
          {data && (
            <span className="ml-auto text-muted-foreground">
              scanned <span className="neon-text-amber font-bold">{data.meta.total_paragraphs}</span> records
            </span>
          )}
        </div>

        <div className="terminal-body space-y-3">
          <div className="text-[11px] text-muted-foreground">
            Analyze top 10 most frequent non-stop words across all stored paragraphs.
          </div>
          <Button
            onClick={() => mutate()}
            isLoading={isPending}
            className="w-full glitch-hover"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            {isPending ? "ANALYZING..." : "RUN ANALYSIS"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="terminal-card rounded border-neon-red/30">
          <div className="terminal-header !border-neon-red/20">
            <AlertCircle className="w-3 h-3 text-neon-red" />
            <span className="text-neon-red">ANALYSIS_FAILED</span>
          </div>
          <div className="terminal-body text-neon-red/80 text-[12px]">
            {error.message}
          </div>
        </div>
      )}

      {isPending && !data && (
        <div className="terminal-card rounded">
          <div className="terminal-body space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-4 h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded flex-1 max-w-[100px]" />
                <div className="h-2 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="terminal-card rounded">
          <div className="terminal-header">
            <Hash className="w-3 h-3 text-neon" />
            <span className="neon-text">FREQUENCY_MAP</span>
            <span className="ml-auto text-muted-foreground">
              {data.meta.total_words} unique words
            </span>
          </div>

          <div className="terminal-body space-y-0">
            <AnimatePresence>
              {data.data.map((item: WordDefinition, i: number) => {
                const percentage = (item.frequency / maxFrequency) * 100;

                return (
                  <motion.div
                    key={item.word}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="border-b border-border/20 last:border-0 py-2.5 group hover:bg-[#ffffff02] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground w-4 text-right tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="font-display text-sm font-bold neon-text uppercase tracking-wider min-w-[80px]">
                        {item.word}
                      </span>

                      <div className="flex-1 h-[6px] bg-secondary/50 rounded-sm overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                          className={i === 0 ? "neon-bar h-full" : i < 3 ? "neon-bar h-full opacity-80" : "neon-bar-cyan neon-bar h-full opacity-60"}
                        />
                      </div>

                      <span className="text-sm font-display font-black neon-text tabular-nums min-w-[32px] text-right">
                        {item.frequency}
                      </span>
                    </div>

                    <div className="pl-7 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {item.phonetic && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Volume2 className="w-2.5 h-2.5" />
                          {item.phonetic}
                        </span>
                      )}

                      {item.part_of_speech && (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                          {item.part_of_speech}
                        </span>
                      )}

                      {item.found && item.definition !== "definition_not_found" ? (
                        <span className="text-[11px] text-foreground/50 italic">
                          {item.definition}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          no definition
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!data && !error && !isPending && (
        <div className="terminal-card rounded">
          <div className="terminal-body text-center py-10">
            <BookA className="w-8 h-8 mx-auto text-amber/20 mb-3" />
            <p className="text-[11px] text-muted-foreground font-mono">
              Run analysis to generate frequency map
            </p>
            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-mono text-muted-foreground">
              <span className="neon-text-amber">$</span>
              <span>idle</span>
              <span className="animate-blink neon-text-amber">█</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

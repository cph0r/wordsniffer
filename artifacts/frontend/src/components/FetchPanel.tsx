import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFetchParagraph, type Paragraph } from "@/hooks/use-api";
import { useParagraphCount } from "@/context/CountContext";
import { format } from "date-fns";
import { DownloadCloud, Database, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function TerminalLine({ children, prefix = ">", color = "text-neon" }: { children: React.ReactNode; prefix?: string; color?: string }) {
  return (
    <div className="flex gap-2 leading-relaxed">
      <span className={`${color} shrink-0 font-bold`}>{prefix}</span>
      <span className="text-foreground/80">{children}</span>
    </div>
  );
}

export function FetchPanel() {
  const { mutate, isPending, error } = useFetchParagraph();
  const { totalParagraphs } = useParagraphCount();
  const [history, setHistory] = useState<Paragraph[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  const handleFetch = () => {
    mutate(undefined, {
      onSuccess: (res) => {
        if (res.data) {
          setHistory((prev) => [...prev, res.data]);
        }
      }
    });
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="terminal-card rounded">
        <div className="terminal-header">
          <DownloadCloud className="w-3 h-3 text-neon" />
          <span className="neon-text">CONTENT_INGEST</span>
          <span className="ml-auto flex items-center gap-3">
            {totalParagraphs !== null && (
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span className="neon-text-cyan font-bold">{totalParagraphs}</span> stored
              </span>
            )}
          </span>
        </div>

        <div className="terminal-body space-y-1">
          <TerminalLine prefix="$" color="neon-text">
            <span className="text-muted-foreground">Fetch random paragraphs from external sources and index to database.</span>
          </TerminalLine>
          <TerminalLine prefix="$" color="neon-text">
            <span className="text-muted-foreground">
              Run <span className="neon-text font-bold">INGEST</span> to retrieve and store a new entry.
            </span>
          </TerminalLine>
        </div>

        <div className="px-3 pb-3 pt-1">
          <Button
            onClick={handleFetch}
            isLoading={isPending}
            className="w-full glitch-hover"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            {isPending ? "FETCHING..." : "EXECUTE INGEST"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="terminal-card rounded border-neon-red/30">
          <div className="terminal-header !border-neon-red/20">
            <AlertCircle className="w-3 h-3 text-neon-red" />
            <span className="text-neon-red">ERROR</span>
          </div>
          <div className="terminal-body text-neon-red/80">
            <TerminalLine prefix="!" color="text-neon-red">{error.message}</TerminalLine>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="terminal-card rounded">
          <div className="terminal-header">
            <span className="neon-text-amber">SESSION_LOG</span>
            <span className="ml-auto neon-text-amber">{history.length} entries</span>
          </div>
          <div className="terminal-body max-h-[500px] overflow-y-auto space-y-0">
            <AnimatePresence>
              {history.map((p, i) => (
                <motion.div
                  key={`${p.id}-${i}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-border/30 last:border-0 py-2.5"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono neon-text-amber">
                      [{format(new Date(p.fetched_at), "HH:mm:ss")}]
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ID:{p.id}
                    </span>
                    {i === history.length - 1 && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon/10 text-neon border border-neon/20 uppercase tracking-wider">
                        latest
                      </span>
                    )}
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-[10px] text-cyan hover:underline font-mono"
                    >
                      src ↗
                    </a>
                  </div>
                  <p className="text-[12px] leading-relaxed text-foreground/70 pl-0">
                    {p.content}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {history.length === 0 && !isPending && !error && (
        <div className="terminal-card rounded">
          <div className="terminal-body text-center py-12">
            <div className="text-2xl font-display neon-text opacity-20 mb-3">NO DATA</div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Execute ingest command to retrieve first paragraph
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-[11px] font-mono text-muted-foreground">
              <span className="neon-text">$</span>
              <span>waiting for input</span>
              <span className="animate-blink neon-text">█</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

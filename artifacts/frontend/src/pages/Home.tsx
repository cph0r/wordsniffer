import { useState, useEffect } from "react";
import { FetchPanel } from "@/components/FetchPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { MatrixRain } from "@/components/MatrixRain";
import { GlitchText } from "@/components/GlitchText";
import { useParagraphCount } from "@/context/CountContext";
import { Terminal, Search, BookA, DownloadCloud, Wifi, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

function SystemClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] neon-text tabular-nums">
      {time.toLocaleTimeString("en-US", { hour12: false })}
    </span>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"fetch" | "search" | "dictionary">("fetch");
  const { totalParagraphs } = useParagraphCount();

  const tabs = [
    { id: "fetch" as const, label: "INGEST", icon: DownloadCloud, shortcut: "F1" },
    { id: "search" as const, label: "SEARCH", icon: Search, shortcut: "F2" },
    { id: "dictionary" as const, label: "LEXICON", icon: BookA, shortcut: "F3" },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); setActiveTab("fetch"); }
      if (e.key === "F2") { e.preventDefault(); setActiveTab("search"); }
      if (e.key === "F3") { e.preventDefault(); setActiveTab("dictionary"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <MatrixRain />
      <div className="scanline-overlay" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-border bg-[hsl(120_8%_3%/0.95)] backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 h-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="terminal-dot bg-neon-red" />
                <div className="terminal-dot bg-amber" />
                <div className="terminal-dot bg-neon" />
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-neon" />
                <h1 className="font-display text-[11px] font-bold tracking-[0.2em] neon-text uppercase">
                  <GlitchText text="PARA//GRAPH_API" />
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wifi className="w-3 h-3 text-neon" />
                <span className="hidden sm:inline">CONN</span>
                <span className="terminal-dot bg-neon animate-pulse inline-block" />
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="w-3 h-3 text-cyan" />
                <span className="neon-text-cyan font-bold">
                  {totalParagraphs !== null ? totalParagraphs : "---"}
                </span>
                <span className="hidden sm:inline">REC</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground border-l border-border pl-4">
                <SystemClock />
              </div>
            </div>
          </div>

          <nav className="flex border-t border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-[0.15em] transition-all duration-200 border-b-2 relative",
                    isActive
                      ? "border-neon text-neon bg-[#00ff4108]"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[#ffffff04]"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={cn(
                    "text-[8px] px-1 py-0.5 rounded font-bold ml-1",
                    isActive ? "bg-neon/20 text-neon" : "bg-secondary text-muted-foreground"
                  )}>
                    {tab.shortcut}
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === "fetch" && <FetchPanel />}
            {activeTab === "search" && <SearchPanel />}
            {activeTab === "dictionary" && <DictionaryPanel />}
          </div>
        </main>

        <footer className="border-t border-border bg-[hsl(120_8%_3%/0.95)] backdrop-blur-sm px-4 py-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="neon-text">$</span>
              <span>paragraph-api v1.0.0</span>
              <span className="text-border">|</span>
              <span>FastAPI + React + PostgreSQL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="animate-blink neon-text">█</span>
              <span>READY</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

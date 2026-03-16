import { useState, useMemo } from "react";
import { FetchPanel } from "@/components/FetchPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { useParagraphCount } from "@/context/CountContext";
import { Dog, Search, BookA } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "fetch" as const, label: "Fetch", icon: Dog },
  { id: "search" as const, label: "Sniff", icon: Search },
  { id: "dictionary" as const, label: "Kennel", icon: BookA },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"fetch" | "search" | "dictionary">("fetch");
  const { totalParagraphs } = useParagraphCount();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border sticky top-0 z-50 bg-background">
        <div className="max-w-3xl mx-auto w-full px-5">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="WordSniffer" className="h-9 w-auto brightness-90" />
              <h1 className="text-2xl font-extrabold tracking-tighter select-none">
                <span className="text-foreground">Word</span>
                <span className="text-foreground/50">Sniffer</span>
              </h1>
            </div>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {totalParagraphs !== null ? `${totalParagraphs} records` : "—"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-5 mt-6">
        <nav className="flex gap-0 border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-8">
        {activeTab === "fetch" && <FetchPanel />}
        {activeTab === "search" && <SearchPanel />}
        {activeTab === "dictionary" && <DictionaryPanel />}
      </main>

      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto w-full px-5 py-3">
          <p className="text-xs text-muted-foreground">
            WordSniffer — good boy finds all the words
          </p>
        </div>
      </footer>
    </div>
  );
}

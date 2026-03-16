import React, { useState } from "react";
import { FetchPanel } from "@/components/FetchPanel";
import { SearchPanel } from "@/components/SearchPanel";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { useParagraphCount } from "@/context/CountContext";
import { Database, Search, BookA, DownloadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"fetch" | "search" | "dictionary">("fetch");
  const { totalParagraphs } = useParagraphCount();

  const tabs = [
    { id: "fetch", label: "Fetch", icon: DownloadCloud },
    { id: "search", label: "Search", icon: Search },
    { id: "dictionary", label: "Dictionary", icon: BookA },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Database className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-tight hidden sm:block">
                Paragraph API Explorer
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Total Paragraphs: 
                <span className="text-primary font-bold ml-1 font-mono">
                  {totalParagraphs !== null ? totalParagraphs : "?"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-border/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-70")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Panel Content */}
        <div className="min-h-[500px]">
          {activeTab === "fetch" && <FetchPanel />}
          {activeTab === "search" && <SearchPanel />}
          {activeTab === "dictionary" && <DictionaryPanel />}
        </div>
      </main>

      <footer className="mt-16 border-t border-border/40 bg-background/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Paragraph API Explorer &mdash; Python Skills Assessment</p>
            <p>Built with FastAPI, React &amp; PostgreSQL</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

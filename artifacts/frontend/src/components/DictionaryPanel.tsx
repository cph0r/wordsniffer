import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDictionary, type WordDefinition } from "@/hooks/use-api";
import { BookA, AlertCircle, Volume2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DictionaryPanel() {
  const { mutate, data, isPending, error } = useDictionary();

  const maxFrequency = data?.data?.reduce((max, w) => Math.max(max, w.frequency), 0) || 1;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookA className="text-primary h-6 w-6" />
            Top Vocabulary
          </h2>
          <p className="text-muted-foreground mt-1">
            Analyze the top 10 most frequently used non-stop words across all paragraphs.
          </p>
        </div>
        <Button onClick={() => mutate()} isLoading={isPending} size="lg" className="w-full md:w-auto shadow-primary/25">
          <Hash className="w-4 h-4 mr-2" />
          Get Top 10 Words
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Dictionary Analysis Failed</h4>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        </div>
      )}

      {isPending && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-border/50">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="border-border/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="bg-secondary px-3 py-1.5 rounded-lg border border-border/50">
              Analyzed <strong className="text-foreground">{data.meta.total_paragraphs}</strong> paragraphs
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {data.data.map((item: WordDefinition, i: number) => {
                const percentage = (item.frequency / maxFrequency) * 100;
                
                return (
                  <motion.div
                    key={item.word}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="h-full flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-foreground capitalize tracking-tight">
                              {item.word}
                            </h3>
                            {item.phonetic && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                                <Volume2 className="w-3 h-3" />
                                {item.phonetic}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-display font-black text-primary/80">
                              {item.frequency}
                            </span>
                            <span className="text-xs text-muted-foreground block uppercase tracking-widest mt-0.5">
                              uses
                            </span>
                          </div>
                        </div>

                        {/* Frequency Bar */}
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                            className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
                          />
                        </div>

                        <div className="flex-1">
                          {item.found && item.definition !== "definition_not_found" ? (
                            <div className="space-y-2">
                              {item.part_of_speech && (
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider mb-2">
                                  {item.part_of_speech}
                                </Badge>
                              )}
                              <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                {item.definition}
                              </p>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center py-4 text-center rounded-xl bg-secondary/20 border border-dashed border-border/50">
                              <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 opacity-50" />
                                Definition not available
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

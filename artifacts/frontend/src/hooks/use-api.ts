import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParagraphCount } from "@/context/CountContext";

const API_BASE = "/python-api/api";

export interface APIError {
  message: string;
  type: string;
}

export interface APIResponse<T, M> {
  data: T;
  meta: M;
  error: APIError | null;
}

export interface Paragraph {
  id: number;
  content: string;
  fetched_at: string;
  source_url: string;
}

export interface WordDefinition {
  word: string;
  frequency: number;
  definition: string;
  phonetic: string | null;
  part_of_speech: string | null;
  found: boolean;
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (res.status >= 400 || data.error) {
    throw new Error(data.error?.message || "An unexpected API error occurred.");
  }
  return data;
}

export function useFetchParagraph() {
  const { setTotalParagraphs } = useParagraphCount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<APIResponse<Paragraph, { duplicate: boolean; total_paragraphs: number }>>(
        `${API_BASE}/fetch`, { method: "GET" }
      ),
    onSuccess: (res) => {
      if (res.meta?.total_paragraphs !== undefined) {
        setTotalParagraphs(res.meta.total_paragraphs);
      }
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
    }
  });
}

export function useSearchParagraphs() {
  return useMutation({
    mutationFn: ({ words, operator }: { words: string[]; operator: "or" | "and" }) => {
      const params = new URLSearchParams({
        words: words.join(","),
        operator
      });
      return fetcher<APIResponse<Paragraph[], { count: number; operator: string; words: string[] }>>(
        `${API_BASE}/search?${params.toString()}`
      );
    }
  });
}

type DictionaryResponse = APIResponse<WordDefinition[], { total_paragraphs: number; total_words: number }>;

export function useDictionary() {
  const { setTotalParagraphs } = useParagraphCount();

  const query = useQuery<DictionaryResponse>({
    queryKey: ["dictionary"],
    queryFn: () => fetcher<DictionaryResponse>(`${API_BASE}/dictionary`),
    enabled: false,
  });

  if (query.data?.meta?.total_paragraphs !== undefined) {
    const count = query.data.meta.total_paragraphs;
    if (count !== undefined) {
      queueMicrotask(() => setTotalParagraphs(count));
    }
  }

  return query;
}

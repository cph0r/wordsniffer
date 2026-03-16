import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useParagraphCount } from "@/context/CountContext";

const API_BASE = import.meta.env.PROD ? "/api" : "/python-api/api";

const PAGE_SIZE = 5;

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
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      res.ok
        ? "The API returned an unexpected response. Please try again."
        : `API request failed (${res.status}). Please try again.`
    );
  }
  const data = await res.json();
  if (res.status >= 400 || data.error) {
    throw new Error(data.error?.message || "An unexpected API error occurred.");
  }
  return data;
}

type RecentMeta = {
  count: number;
  total_paragraphs: number;
  limit: number;
  offset: number;
  has_more: boolean;
};
type RecentResponse = APIResponse<Paragraph[], RecentMeta>;

export function useRecentParagraphs() {
  const { setTotalParagraphs } = useParagraphCount();

  const query = useInfiniteQuery<RecentResponse>({
    queryKey: ["recent-paragraphs"],
    queryFn: ({ pageParam = 0 }) =>
      fetcher<RecentResponse>(
        `${API_BASE}/paragraphs/recent?limit=${PAGE_SIZE}&offset=${pageParam}`
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more
        ? lastPage.meta.offset + lastPage.meta.limit
        : undefined,
    staleTime: Infinity,
  });

  const firstPage = query.data?.pages[0];
  if (firstPage?.meta?.total_paragraphs !== undefined) {
    const count = firstPage.meta.total_paragraphs;
    queueMicrotask(() => setTotalParagraphs(count));
  }

  return query;
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
      if (!res.meta?.duplicate) {
        queryClient.invalidateQueries({ queryKey: ["recent-paragraphs"] });
      }
      queryClient.invalidateQueries({ queryKey: ["dictionary"] });
    }
  });
}

const SEARCH_PAGE_SIZE = 10;

type SearchMeta = {
  count: number;
  total: number;
  operator: string;
  words: string[];
  limit: number;
  offset: number;
  has_more: boolean;
};
type SearchResponse = APIResponse<Paragraph[], SearchMeta>;

export function useSearchParagraphs(words: string[], operator: "or" | "and") {
  const enabled = words.length > 0;
  const params = new URLSearchParams({
    words: words.join(","),
    operator,
  });

  return useInfiniteQuery<SearchResponse>({
    queryKey: ["search", words.join(","), operator],
    queryFn: ({ pageParam = 0 }) =>
      fetcher<SearchResponse>(
        `${API_BASE}/search?${params.toString()}&limit=${SEARCH_PAGE_SIZE}&offset=${pageParam}`
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more
        ? lastPage.meta.offset + lastPage.meta.limit
        : undefined,
    enabled,
    staleTime: 30_000,
  });
}

type DictionaryResponse = APIResponse<WordDefinition[], { total_paragraphs: number; total_words: number }>;

export function useDictionary() {
  const { setTotalParagraphs } = useParagraphCount();

  const query = useQuery<DictionaryResponse>({
    queryKey: ["dictionary"],
    queryFn: () => fetcher<DictionaryResponse>(`${API_BASE}/dictionary`),
    enabled: true,
    staleTime: 60_000,
  });

  if (query.data?.meta?.total_paragraphs !== undefined) {
    const count = query.data.meta.total_paragraphs;
    if (count !== undefined) {
      queueMicrotask(() => setTotalParagraphs(count));
    }
  }

  return query;
}

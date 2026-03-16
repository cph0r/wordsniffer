import re
from collections import Counter

from config import STOP_WORDS


def normalize_text(text: str) -> str:
    return text.lower().strip()


def tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    words = re.findall(r"[a-z]+(?:'[a-z]+)?", normalized)
    return words


def filter_stop_words(words: list[str]) -> list[str]:
    return [w for w in words if w not in STOP_WORDS]


def word_frequency(texts: list[str]) -> list[tuple[str, int]]:
    counter: Counter[str] = Counter()
    for text in texts:
        tokens = tokenize(text)
        filtered = filter_stop_words(tokens)
        counter.update(filtered)
    return counter.most_common(10)


def search_paragraphs(
    content: str,
    words: list[str],
    operator: str,
) -> bool:
    content_tokens = set(tokenize(content))

    if operator == "and":
        return all(word in content_tokens for word in words)
    else:
        return any(word in content_tokens for word in words)


def normalize_search_words(raw_words: list[str]) -> list[str]:
    cleaned: list[str] = []
    for word in raw_words:
        w = re.sub(r"[^\w]", "", word.lower().strip())
        if w:
            cleaned.append(w)
    return cleaned

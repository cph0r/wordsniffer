import asyncio
import logging

import httpx

from config import DICTIONARY_API_URL, FETCH_TIMEOUT, METAPHORPSUM_URL

logger = logging.getLogger(__name__)


class HttpClient:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    def start(self) -> None:
        self._client = httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError("HTTP client not initialized. Call start() first.")
        return self._client


http_client = HttpClient()


def _not_found_result(word: str) -> dict:
    return {
        "word": word,
        "definition": None,
        "phonetic": None,
        "part_of_speech": None,
        "found": False,
    }


async def fetch_paragraph() -> str:
    response = await http_client.client.get(METAPHORPSUM_URL)
    response.raise_for_status()
    return response.text.strip()


async def fetch_definition(word: str) -> dict:
    url = f"{DICTIONARY_API_URL}/{word}"
    try:
        response = await http_client.client.get(url)

        if response.status_code == 404:
            return _not_found_result(word)

        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "json" not in content_type:
            logger.warning("Non-JSON response for word '%s': %s", word, content_type)
            return _not_found_result(word)

        try:
            data = response.json()
        except ValueError:
            logger.warning("Failed to parse JSON for word '%s'", word)
            return _not_found_result(word)

        if not isinstance(data, list) or len(data) == 0:
            return _not_found_result(word)

        entry = data[0]
        if not isinstance(entry, dict):
            return _not_found_result(word)

        phonetic = entry.get("phonetic", "")
        meanings = entry.get("meanings", [])
        if meanings and isinstance(meanings, list) and isinstance(meanings[0], dict):
            part_of_speech = meanings[0].get("partOfSpeech", "")
            definitions = meanings[0].get("definitions", [])
            definition = (
                definitions[0].get("definition", "")
                if definitions and isinstance(definitions[0], dict)
                else ""
            )
        else:
            part_of_speech = ""
            definition = ""

        return {
            "word": word,
            "definition": definition,
            "phonetic": phonetic,
            "part_of_speech": part_of_speech,
            "found": True,
        }
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.warning("HTTP error fetching definition for '%s': %s", word, exc)
        return _not_found_result(word)


async def fetch_definitions_batch(words: list[str]) -> list[dict]:
    tasks = [fetch_definition(word) for word in words]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    final: list[dict] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.warning("Exception fetching definition for '%s': %s", words[i], result)
            final.append(_not_found_result(words[i]))
        else:
            final.append(result)
    return final

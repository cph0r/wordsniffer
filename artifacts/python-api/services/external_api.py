import asyncio

import httpx

from config import DICTIONARY_API_URL, FETCH_TIMEOUT, METAPHORPSUM_URL


async def fetch_paragraph() -> str:
    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT) as client:
        response = await client.get(METAPHORPSUM_URL)
        response.raise_for_status()
        return response.text.strip()


async def fetch_definition(word: str) -> dict:
    url = f"{DICTIONARY_API_URL}/{word}"
    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT) as client:
        try:
            response = await client.get(url)
            if response.status_code == 404:
                return {
                    "word": word,
                    "definition": None,
                    "phonetic": None,
                    "part_of_speech": None,
                    "found": False,
                }
            response.raise_for_status()
            data = response.json()
            entry = data[0] if data else {}
            phonetic = entry.get("phonetic", "")
            meanings = entry.get("meanings", [])
            part_of_speech = meanings[0].get("partOfSpeech", "") if meanings else ""
            definitions = meanings[0].get("definitions", []) if meanings else []
            definition = definitions[0].get("definition", "") if definitions else ""
            return {
                "word": word,
                "definition": definition,
                "phonetic": phonetic,
                "part_of_speech": part_of_speech,
                "found": True,
            }
        except httpx.HTTPStatusError:
            return {
                "word": word,
                "definition": None,
                "phonetic": None,
                "part_of_speech": None,
                "found": False,
            }
        except httpx.RequestError:
            return {
                "word": word,
                "definition": None,
                "phonetic": None,
                "part_of_speech": None,
                "found": False,
            }


async def fetch_definitions_batch(words: list[str]) -> list[dict]:
    tasks = [fetch_definition(word) for word in words]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    final: list[dict] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            final.append(
                {
                    "word": words[i],
                    "definition": None,
                    "phonetic": None,
                    "part_of_speech": None,
                    "found": False,
                }
            )
        else:
            final.append(result)
    return final

from unittest.mock import AsyncMock, patch

import pytest

from models.paragraph import Paragraph

SAMPLE_PARAGRAPH = (
    "The quick brown fox jumps over the lazy dog. "
    "Python programming language is widely used for web development. "
    "Artificial intelligence and machine learning are transforming technology."
)


class TestFetchEndpoint:
    @patch("routes.fetch.fetch_paragraph", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_fetch_stores_paragraph(self, mock_fetch, client, db_session):
        mock_fetch.return_value = SAMPLE_PARAGRAPH
        response = await client.get("/api/fetch")
        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert body["data"]["content"] == SAMPLE_PARAGRAPH
        assert body["data"]["id"] is not None
        assert body["meta"]["duplicate"] is False

    @patch("routes.fetch.fetch_paragraph", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_fetch_duplicate_handling(self, mock_fetch, client, db_session):
        mock_fetch.return_value = SAMPLE_PARAGRAPH
        await client.get("/api/fetch")
        response = await client.get("/api/fetch")
        body = response.json()
        assert body["data"]["content"] == SAMPLE_PARAGRAPH
        assert body["meta"]["duplicate"] is True

    @patch("routes.fetch.fetch_paragraph", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_fetch_external_api_failure(self, mock_fetch, client):
        import httpx

        mock_fetch.side_effect = httpx.RequestError("Connection failed")
        response = await client.get("/api/fetch")
        assert response.status_code == 502
        body = response.json()
        assert body["error"] is not None
        assert body["error"]["type"] == "external_api_error"
        assert body["data"] is None
        assert "Connection failed" not in body["error"]["message"]

    @patch("routes.fetch.fetch_paragraph", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_fetch_empty_response(self, mock_fetch, client):
        mock_fetch.return_value = ""
        response = await client.get("/api/fetch")
        assert response.status_code == 502
        body = response.json()
        assert body["error"] is not None
        assert body["error"]["type"] == "empty_response"


class TestRecentParagraphsEndpoint:
    def _seed_paragraphs(self, db_session):
        from datetime import datetime, timedelta, timezone

        base = datetime(2024, 1, 1, tzinfo=timezone.utc)
        paragraphs = [
            Paragraph(
                content=f"Paragraph number {i}",
                source_url="http://test.com",
                fetched_at=base + timedelta(hours=i),
            )
            for i in range(5)
        ]
        for p in paragraphs:
            db_session.add(p)
        db_session.commit()

    @pytest.mark.asyncio
    async def test_recent_returns_ordered(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/paragraphs/recent")
        body = response.json()
        assert body["error"] is None
        assert body["meta"]["count"] == 5
        assert body["meta"]["total_paragraphs"] == 5
        assert body["data"][0]["content"] == "Paragraph number 4"
        assert body["data"][-1]["content"] == "Paragraph number 0"

    @pytest.mark.asyncio
    async def test_recent_respects_limit(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/paragraphs/recent?limit=2")
        body = response.json()
        assert body["meta"]["count"] == 2
        assert len(body["data"]) == 2

    @pytest.mark.asyncio
    async def test_recent_empty_db(self, client, db_session):
        response = await client.get("/api/paragraphs/recent")
        body = response.json()
        assert body["error"] is None
        assert body["data"] == []
        assert body["meta"]["count"] == 0


class TestSearchEndpoint:
    def _seed_paragraphs(self, db_session):
        paragraphs = [
            Paragraph(
                content="Python is a great programming language for beginners",
                source_url="http://test.com",
            ),
            Paragraph(
                content="Java and JavaScript are also popular languages",
                source_url="http://test.com",
            ),
            Paragraph(
                content="Python and Java can both be used for web development",
                source_url="http://test.com",
            ),
        ]
        for p in paragraphs:
            db_session.add(p)
        db_session.commit()

    @pytest.mark.asyncio
    async def test_search_or_operator(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=python,java&operator=or")
        body = response.json()
        assert body["error"] is None
        assert body["meta"]["count"] == 3
        assert body["meta"]["operator"] == "or"

    @pytest.mark.asyncio
    async def test_search_and_operator(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=python,java&operator=and")
        body = response.json()
        assert body["error"] is None
        assert body["meta"]["count"] == 1
        assert "Python and Java" in body["data"][0]["content"]

    @pytest.mark.asyncio
    async def test_search_no_results(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=nonexistentword&operator=or")
        body = response.json()
        assert body["error"] is None
        assert body["meta"]["count"] == 0
        assert body["data"] == []

    @pytest.mark.asyncio
    async def test_search_case_insensitive(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=PYTHON&operator=or")
        body = response.json()
        assert body["meta"]["count"] == 2

    @pytest.mark.asyncio
    async def test_search_default_operator(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=python")
        body = response.json()
        assert body["meta"]["operator"] == "or"
        assert body["meta"]["count"] == 2

    @pytest.mark.asyncio
    async def test_search_empty_words(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=")
        body = response.json()
        assert body["data"] == []

    @pytest.mark.asyncio
    async def test_search_invalid_operator(self, client, db_session):
        response = await client.get("/api/search?words=test&operator=xor")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_missing_words_param(self, client, db_session):
        response = await client.get("/api/search")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_no_substring_false_positive(self, client, db_session):
        db_session.add(
            Paragraph(
                content="JavaScript is a popular language",
                source_url="http://test.com",
            )
        )
        db_session.commit()
        response = await client.get("/api/search?words=java&operator=or")
        body = response.json()
        assert body["meta"]["count"] == 0

    @pytest.mark.asyncio
    async def test_search_pagination(self, client, db_session):
        for i in range(10):
            db_session.add(
                Paragraph(
                    content=f"Python example number {i}",
                    source_url="http://test.com",
                )
            )
        db_session.commit()
        response = await client.get("/api/search?words=python&limit=3&offset=0")
        body = response.json()
        assert body["meta"]["count"] == 3
        assert body["meta"]["total"] == 10

        response2 = await client.get("/api/search?words=python&limit=3&offset=3")
        body2 = response2.json()
        assert body2["meta"]["count"] == 3
        assert body2["meta"]["offset"] == 3

    @pytest.mark.asyncio
    async def test_search_meta_includes_pagination_fields(self, client, db_session):
        self._seed_paragraphs(db_session)
        response = await client.get("/api/search?words=python")
        body = response.json()
        assert "total" in body["meta"]
        assert "limit" in body["meta"]
        assert "offset" in body["meta"]


class TestDictionaryEndpoint:
    def _seed_paragraphs(self, db_session):
        paragraphs = [
            Paragraph(
                content=(
                    "Python python python programming programming "
                    "language language code code code code "
                    "developer developer developer software software "
                    "computer computer application application application "
                    "function function function function"
                ),
                source_url="http://test.com",
            ),
        ]
        for p in paragraphs:
            db_session.add(p)
        db_session.commit()

    @patch("routes.dictionary.fetch_definitions_batch", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_dictionary_returns_definitions(
        self, mock_fetch_defs, client, db_session
    ):
        self._seed_paragraphs(db_session)
        mock_fetch_defs.return_value = [
            {
                "word": "function",
                "definition": "a relation between sets",
                "phonetic": "/ˈfʌŋkʃən/",
                "part_of_speech": "noun",
                "found": True,
            },
            {
                "word": "code",
                "definition": "a system of symbols",
                "phonetic": "/koʊd/",
                "part_of_speech": "noun",
                "found": True,
            },
        ]
        response = await client.get("/api/dictionary")
        body = response.json()
        assert body["error"] is None
        assert len(body["data"]) > 0
        assert body["data"][0]["frequency"] > 0

    @pytest.mark.asyncio
    async def test_dictionary_empty_db(self, client, db_session):
        response = await client.get("/api/dictionary")
        body = response.json()
        assert body["error"] is None
        assert body["data"] == []
        assert body["meta"]["total_paragraphs"] == 0

    @patch("routes.dictionary.fetch_definitions_batch", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_dictionary_handles_missing_definitions(
        self, mock_fetch_defs, client, db_session
    ):
        self._seed_paragraphs(db_session)
        mock_fetch_defs.return_value = [
            {
                "word": "function",
                "definition": None,
                "phonetic": None,
                "part_of_speech": None,
                "found": False,
            },
        ]
        response = await client.get("/api/dictionary")
        body = response.json()
        assert body["error"] is None
        found_item = next((d for d in body["data"] if d["word"] == "function"), None)
        if found_item:
            assert found_item["definition"] == "definition_not_found"


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestGlobalErrorHandler:
    @patch("routes.fetch.fetch_paragraph", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_unhandled_exception_returns_structured_500(
        self, mock_fetch, client
    ):
        mock_fetch.side_effect = RuntimeError("Something unexpected")
        response = await client.get("/api/fetch")
        assert response.status_code == 500
        body = response.json()
        assert body["error"]["type"] == "internal_error"
        assert body["data"] is None
        assert body["meta"] is None

    @pytest.mark.asyncio
    async def test_health_still_works_after_error(self, client):
        response = await client.get("/health")
        assert response.status_code == 200


class TestDatabaseErrorHandling:
    @pytest.mark.asyncio
    async def test_search_db_error(self, client, db_session):
        from unittest.mock import MagicMock

        from sqlalchemy.exc import OperationalError

        mock_session = MagicMock()
        mock_session.query.side_effect = OperationalError(
            "connection refused", {}, None
        )

        def override():
            yield mock_session

        from db import get_db as real_get_db
        from main import app

        app.dependency_overrides[real_get_db] = override
        response = await client.get("/api/search?words=test")
        body = response.json()
        assert response.status_code == 500
        assert body["error"]["type"] == "database_error"
        app.dependency_overrides.clear()

    @patch("routes.dictionary.fetch_definitions_batch", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_dictionary_db_error(self, mock_defs, client, db_session):
        from unittest.mock import MagicMock

        from sqlalchemy.exc import OperationalError

        mock_session = MagicMock()
        mock_session.query.side_effect = OperationalError(
            "connection refused", {}, None
        )

        def override():
            yield mock_session

        from db import get_db as real_get_db
        from main import app

        app.dependency_overrides[real_get_db] = override
        response = await client.get("/api/dictionary")
        body = response.json()
        assert response.status_code == 500
        assert body["error"]["type"] == "database_error"
        app.dependency_overrides.clear()


class TestExternalApiParsing:
    @pytest.mark.asyncio
    async def test_fetch_definition_malformed_json(self):
        from unittest.mock import AsyncMock as AM

        from services.external_api import fetch_definition, http_client

        original = http_client._client
        mock_client = AM()
        mock_response = AM()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.side_effect = ValueError("bad json")
        mock_response.raise_for_status = AM()
        mock_client.get = AM(return_value=mock_response)
        http_client._client = mock_client

        result = await fetch_definition("test")
        assert result["found"] is False
        assert result["word"] == "test"
        http_client._client = original

    @pytest.mark.asyncio
    async def test_fetch_definition_non_json_content_type(self):
        from unittest.mock import AsyncMock as AM

        from services.external_api import fetch_definition, http_client

        original = http_client._client
        mock_client = AM()
        mock_response = AM()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "text/html"}
        mock_response.raise_for_status = AM()
        mock_client.get = AM(return_value=mock_response)
        http_client._client = mock_client

        result = await fetch_definition("test")
        assert result["found"] is False
        http_client._client = original

    @pytest.mark.asyncio
    async def test_fetch_definition_empty_list(self):
        from unittest.mock import AsyncMock as AM

        from services.external_api import fetch_definition, http_client

        original = http_client._client
        mock_client = AM()
        mock_response = AM()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = []
        mock_response.raise_for_status = AM()
        mock_client.get = AM(return_value=mock_response)
        http_client._client = mock_client

        result = await fetch_definition("test")
        assert result["found"] is False
        http_client._client = original

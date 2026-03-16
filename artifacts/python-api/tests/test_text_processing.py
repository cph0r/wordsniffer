from services.text_processing import (
    filter_stop_words,
    normalize_search_words,
    normalize_text,
    search_paragraphs,
    tokenize,
    word_frequency,
)


class TestNormalizeText:
    def test_basic(self):
        assert normalize_text("  Hello World  ") == "hello world"

    def test_mixed_case(self):
        assert normalize_text("FoO BAR") == "foo bar"

    def test_empty(self):
        assert normalize_text("") == ""


class TestTokenize:
    def test_simple_sentence(self):
        result = tokenize("Hello world, this is a test.")
        assert result == ["hello", "world", "this", "is", "a", "test"]

    def test_contractions(self):
        result = tokenize("I can't believe it's working")
        assert "can't" in result
        assert "it's" in result

    def test_numbers_excluded(self):
        result = tokenize("There are 42 items")
        assert "42" not in result
        assert "there" in result

    def test_empty_string(self):
        assert tokenize("") == []


class TestFilterStopWords:
    def test_removes_common_words(self):
        words = ["the", "cat", "is", "on", "mat"]
        result = filter_stop_words(words)
        assert result == ["cat", "mat"]

    def test_empty_list(self):
        assert filter_stop_words([]) == []

    def test_all_stop_words(self):
        words = ["the", "is", "a", "an", "to"]
        assert filter_stop_words(words) == []

    def test_no_stop_words(self):
        words = ["python", "programming", "language"]
        assert filter_stop_words(words) == ["python", "programming", "language"]


class TestWordFrequency:
    def test_basic_frequency(self):
        texts = ["hello world hello", "hello python world"]
        result = word_frequency(texts)
        words = [w for w, _ in result]
        assert words[0] == "hello"
        assert any(w == "world" for w in words)

    def test_stop_words_filtered(self):
        texts = ["the the the cat cat"]
        result = word_frequency(texts)
        words = [w for w, _ in result]
        assert "the" not in words
        assert "cat" in words

    def test_empty_texts(self):
        assert word_frequency([]) == []

    def test_returns_top_10(self):
        words = [
            "alpha",
            "bravo",
            "charlie",
            "delta",
            "echo",
            "foxtrot",
            "golf",
            "hotel",
            "india",
            "juliet",
            "kilo",
            "lima",
            "mike",
            "november",
            "oscar",
        ]
        parts = []
        for i, w in enumerate(words):
            parts.append(" ".join([w] * (20 - i)))
        text = " ".join(parts)
        result = word_frequency([text])
        assert len(result) == 10

    def test_frequency_counts(self):
        texts = ["apple apple apple banana banana cherry"]
        result = word_frequency(texts)
        freq_dict = dict(result)
        assert freq_dict["apple"] == 3
        assert freq_dict["banana"] == 2
        assert freq_dict["cherry"] == 1


class TestSearchParagraphs:
    def test_or_operator_matches_any(self):
        content = "The quick brown fox jumps over the lazy dog"
        assert search_paragraphs(content, ["fox", "cat"], "or") is True

    def test_or_operator_no_match(self):
        content = "The quick brown fox"
        assert search_paragraphs(content, ["cat", "dog"], "or") is False

    def test_and_operator_matches_all(self):
        content = "The quick brown fox jumps over the lazy dog"
        assert search_paragraphs(content, ["fox", "dog"], "and") is True

    def test_and_operator_partial_match(self):
        content = "The quick brown fox"
        assert search_paragraphs(content, ["fox", "dog"], "and") is False

    def test_case_insensitive(self):
        content = "Hello World Python"
        assert search_paragraphs(content, ["hello", "python"], "and") is True

    def test_word_boundary_matching(self):
        content = "Java and JavaScript are also popular languages"
        assert search_paragraphs(content, ["java"], "or") is True
        assert search_paragraphs(content, ["javascript"], "or") is True

    def test_no_substring_false_positive(self):
        content = "JavaScript is a popular language"
        assert search_paragraphs(content, ["java"], "or") is False
        assert search_paragraphs(content, ["javascript"], "or") is True

    def test_empty_words(self):
        content = "Some content here"
        assert search_paragraphs(content, [], "or") is False
        assert search_paragraphs(content, [], "and") is True


class TestNormalizeSearchWords:
    def test_basic(self):
        assert normalize_search_words(["Hello", "WORLD"]) == ["hello", "world"]

    def test_strips_punctuation(self):
        result = normalize_search_words(["hello!", "world?", "test."])
        assert result == ["hello", "world", "test"]

    def test_removes_empty(self):
        result = normalize_search_words(["hello", "", "  ", "world"])
        assert result == ["hello", "world"]

    def test_strips_whitespace(self):
        result = normalize_search_words(["  hello  ", " world "])
        assert result == ["hello", "world"]

"""
سرویس ChromaDB برای وکتورایز و جستجوی DocSection ها.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

COLLECTION_NAME = "guide_doc_sections"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """تقسیم متن به بلوک‌های با هم‌پوشانی. اول بر اساس پاراگراف."""
    if not text or not text.strip():
        return []
    text = text.strip()
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = []
    current_len = 0
    for para in paragraphs:
        para_len = len(para) + 2  # \n\n
        if current_len + para_len > chunk_size and current:
            chunks.append("\n\n".join(current))
            if overlap > 0 and len(current) > 1:
                current = [current[-1]]
                current_len = len(current[0]) + 2
            else:
                current = []
                current_len = 0
        current.append(para)
        current_len += para_len
    if current:
        chunks.append("\n\n".join(current))
    if not chunks and text:
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i : i + chunk_size]
            if chunk.strip():
                chunks.append(chunk)
    return chunks


class VectorStoreService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._client = None
        self._collection = None
        self._embedding_fn = None
        self._initialized = False
        self._configure()

    def _configure(self):
        chroma_mode = os.environ.get("CHROMA_MODE", "persistent").lower()
        if chroma_mode not in ("persistent", "http"):
            logger.warning("CHROMA_MODE not set or invalid, vector store disabled")
            return
        try:
            import chromadb
        except ImportError:
            logger.warning("chromadb not installed, vector store disabled")
            return
        try:
            if chroma_mode == "persistent":
                path = os.environ.get("CHROMA_PERSIST_PATH", "./chroma_data")
                self._client = chromadb.PersistentClient(path=path)
            else:
                host = os.environ.get("CHROMA_HOST", "localhost")
                port = int(os.environ.get("CHROMA_PORT", "8000"))
                self._client = chromadb.HttpClient(host=host, port=port)
            self._embedding_fn = self._get_embedding_fn()
            if not self._embedding_fn:
                logger.warning("Embedding function not available (check EMBEDDING_PROVIDER/OPENAI_API_KEY), vector store disabled")
                return
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
                embedding_function=self._embedding_fn,
            )
            self._initialized = True
        except Exception as e:
            logger.warning("ChromaDB init failed: %s", e)

    def _get_embedding_fn(self):
        provider = os.environ.get("EMBEDDING_PROVIDER", "sentence-transformers").lower()
        model = os.environ.get(
            "EMBEDDING_MODEL",
            "paraphrase-multilingual-MiniLM-L12-v2",
        )
        if provider == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            api_base = os.environ.get("OPENAI_API_BASE")
            if not api_key:
                return None
            # مدل‌های OpenAI: text-embedding-3-small، text-embedding-3-large، text-embedding-ada-002
            # اگر EMBEDDING_MODEL برای sentence-transformers ست شده، از پیش‌فرض OpenAI استفاده کن
            openai_model = model if model and "embedding" in model.lower() else "text-embedding-3-small"
            try:
                from chromadb.utils import embedding_functions
                kwargs = {
                    "api_key": api_key,
                    "model_name": openai_model,
                }
                if api_base:
                    kwargs["api_base"] = api_base
                return embedding_functions.OpenAIEmbeddingFunction(**kwargs)
            except Exception as e:
                logger.warning("OpenAI embedding init failed: %s", e)
                return None
        try:
            from chromadb.utils import embedding_functions
            return embedding_functions.SentenceTransformerEmbeddingFunction(model_name=model)
        except Exception as e:
            logger.warning("SentenceTransformer embedding init failed: %s", e)
            return None

    def is_available(self) -> bool:
        return self._initialized and self._embedding_fn is not None

    def add_document(self, doc_section_id: str, title: str, body: str, tags: list) -> bool:
        if not self.is_available():
            return False
        try:
            chunks = _chunk_text(body)
            if not chunks:
                chunks = [title]
            ids = [f"{doc_section_id}_{i}" for i in range(len(chunks))]
            documents = [f"{title}\n\n{chunk}" for chunk in chunks]
            metadatas = [
                {"doc_section_id": str(doc_section_id), "title": title[:200], "tags": ",".join(tags)[:500] if tags else ""}
                for _ in chunks
            ]
            self._collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            return True
        except Exception as e:
            logger.exception("add_document failed: %s", e)
            return False

    def update_document(self, doc_section_id: str, title: str, body: str, tags: list) -> bool:
        if not self.is_available():
            return False
        self.delete_document(doc_section_id)
        return self.add_document(doc_section_id, title, body, tags)

    def delete_document(self, doc_section_id: str) -> bool:
        if not self.is_available():
            return False
        try:
            existing = self._collection.get(
                where={"doc_section_id": str(doc_section_id)},
            )
            if existing["ids"]:
                self._collection.delete(ids=existing["ids"])
            return True
        except Exception as e:
            logger.exception("delete_document failed: %s", e)
            return False

    def query(
        self,
        question: str,
        doc_section_ids: Optional[list[str]] = None,
        top_k: int = 5,
    ) -> list[dict]:
        if not self.is_available():
            return []
        try:
            where = None
            if doc_section_ids:
                where = {"doc_section_id": {"$in": [str(i) for i in doc_section_ids]}}
            result = self._collection.query(
                query_texts=[question],
                n_results=top_k,
                where=where,
            )
            if not result or not result["documents"] or not result["documents"][0]:
                return []
            return [
                {"content": doc, "metadata": meta or {}}
                for doc, meta in zip(result["documents"][0], result["metadatas"][0])
            ]
        except Exception as e:
            logger.exception("query failed: %s", e)
            return []

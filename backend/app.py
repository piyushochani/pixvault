"""
app.py — PixVault Backend Entry Point
--------------------------------------
Starts FastAPI, registers all routers, initialises third-party services
(MongoDB indexes, Pinecone index), and loads AI models on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services.pinecone_service import init_pinecone_index
from services.mongodb_service import users_col, images_col, folders_col

from routes.auth_routes import router as auth_router
from routes.image_routes import router as image_router
from routes.folder_routes import router as folder_router
from routes.search_routes import router as search_router
from routes.recycle_routes import router as recycle_router
from routes.chat_routes import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    print("[Startup] Initialising Pinecone index...")
    init_pinecone_index()

    print("[Startup] Pre-loading BLIP model...")
    from services.blip_service import _load as blip_load
    blip_load()

    print("[Startup] Pre-loading CLIP model...")
    from services.clip_service import _load as clip_load
    clip_load()

    print("[Startup] All services ready. PixVault is running.")
    yield
    # ── Shutdown ────────────────────────────────────────────────────────────
    print("[Shutdown] Cleaning up.")


app = FastAPI(
    title="PixVault API",
    description="AI-powered image management with semantic search.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router,    prefix="/api")
app.include_router(image_router,   prefix="/api")
app.include_router(folder_router,  prefix="/api")
app.include_router(search_router,  prefix="/api")
app.include_router(recycle_router, prefix="/api/recycle")
app.include_router(chat_router,    prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "PixVault API is running."}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Run directly ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _default_model_path(lang: str) -> str:
    candidates = [
        BASE_DIR / f"../ai-training/trained_models/{lang.lower()}_model_improved.pkl",
        BASE_DIR / f"../ai-training/training_models/{lang.lower()}_model_improved.pkl",
        BASE_DIR / f"models/{lang.lower()}_model_improved.pkl",
    ]

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return str(candidates[0])

MODEL_PATHS = {
    'FSL': os.getenv('FSL_MODEL_PATH', _default_model_path('FSL')),
    'ASL': os.getenv('ASL_MODEL_PATH', _default_model_path('ASL')),
}

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')

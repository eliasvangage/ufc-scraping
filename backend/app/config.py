# app/config.py

# Toggle post-prediction confidence boosts
APPLY_FORM_BOOST = False
APPLY_STREAK_BOOST = False

# Toggle stat-based UI bonus (confidence +0.5% per stat won)
APPLY_STAT_DOMINANCE_BONUS = False

# Toggle UI-only champion badge
DISPLAY_CHAMPION_BADGE = True

# Logging verbosity
DEBUG_LOGGING = True

# Max allowed confidence boost above raw model base
MAX_BOOST = 35.0

# Static model version
MODEL_VERSION = "v1.2.3"
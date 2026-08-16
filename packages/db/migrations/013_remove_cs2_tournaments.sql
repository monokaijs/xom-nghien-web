-- Remove CS2 tournament tables now that tournament management is no longer part of the app.

DROP TABLE IF EXISTS cs2_tournament_players;
DROP TABLE IF EXISTS cs2_tournaments;

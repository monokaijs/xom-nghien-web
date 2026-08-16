-- Remove the retired game-server provisioning system and its legacy tables.

DROP TABLE IF EXISTS game_server_events;
DROP TABLE IF EXISTS server_host_jobs;
DROP TABLE IF EXISTS game_server_jobs;
DROP TABLE IF EXISTS server_host_port_allocations;
DROP TABLE IF EXISTS game_server_instances;
DROP TABLE IF EXISTS game_server_deployments;
DROP TABLE IF EXISTS game_credentials;
DROP TABLE IF EXISTS game_configuration_versions;
DROP TABLE IF EXISTS game_configurations;
DROP TABLE IF EXISTS server_hosts;

DROP TABLE IF EXISTS lobbies;
DROP TABLE IF EXISTS temp_game_servers;
DROP TABLE IF EXISTS steam_api_keys;
DROP TABLE IF EXISTS vps_instances;

-- Up
ALTER TABLE ombi ADD COLUMN urlBase TEXT;
ALTER TABLE sonarr ADD COLUMN urlBase TEXT;
ALTER TABLE radarr ADD COLUMN urlBase TEXT;

-- Down
ALTER TABLE ombi RENAME TO _ombi_old;
ALTER TABLE sonarr RENAME TO _sonarr_old;
ALTER TABLE radarr RENAME TO _radarr_old;

CREATE TABLE ombi
(
    id integer primary key asc,
    host text,
    port text,
    apikey text,
    requesttv text,
    requestmovie text,
    username text,
    limittvrequests text,
);

CREATE TABLE sonarr
(
    id integer primary key asc,
    host text,
    port text,
    apikey text
);

CREATE TABLE radarr
(
    id integer primary key asc,
    host text,
    port text,
    apikey text
);

INSERT INTO ombi(id, host, port, apikey, requesttv, requestmovie, username, limittvrequests)
    SELECT id, host, port, apikey, requesttv, requestmovie, username, limittvrequests
    FROM _ombi_old;

INSERT INTO sonarr(id, host, port, apikey,)
    SELECT id, host, port, apikey
    FROM _sonarr_old;

INSERT INTO radarr(id, host, port, apikey,)
    SELECT id, host, port, apikey
    FROM _radarr_old;

DROP TABLE _ombi_old;
DROP TABLE _sonarr_old;
DROP TABLE _radarr_old;

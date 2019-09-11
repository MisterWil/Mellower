-- Up
ALTER TABLE tautulli ADD COLUMN httpRoot TEXT;

-- Down
ALTER TABLE tautulli RENAME TO _tautulli_old;
CREATE TABLE tautulli
(
    id integer primary key asc,
    host text,
    port text,
    apikey text
);

INSERT INTO tautulli(id, host, port, apikey,)
    SELECT id, host, port, apikey
    FROM _tautulli_old;

DROP TABLE _tautulli_old;

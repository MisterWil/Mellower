-- Up
ALTER TABLE bot ADD COLUMN silentTimeout TEXT;

-- Down
ALTER TABLE bot RENAME TO _bot_old;
CREATE TABLE bot
(   id integer primary key asc,
    token text,
    ownerid text,
    commandprefix text,
    deletecommandmessages text,
    unknowncommandresponse text,
    channelname text
);
INSERT INTO bot (id, token, ownerid, commandprefix, deletecommandmessages, unknowncommandresponse, channelname)
    SELECT id, token, ownerid, commandprefix, deletecommandmessages, unknowncommandresponse, channelname
    FROM _bot_old;

DROP TABLE _bot_old;
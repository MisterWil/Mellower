# Mellower

[![Build Status](https://travis-ci.com/MisterWil/Mellower.svg?branch=next)](https://travis-ci.com/MisterWil/Mellower)

[![Coverage Status](https://coveralls.io/repos/github/MisterWil/Mellower/badge.svg?branch=next)](https://coveralls.io/github/MisterWil/Mellower?branch=next)

Discord Bot which can communicate with several APIs like Ombi, Sonarr, Radarr and Tautulli which are related to home streaming.

Hard fork of [Mellow](https://github.com/v0idp/Mellow) which I suggest you actually use.

## Features

* Search for Movies & TV Shows in Ombi
* Request Movies & TV Shows in Ombi
* Get a list of all Libraries on your Server in Tautulli
* More features for Ombi, Sonarr and Radarr following soon...

## Requirements

* [NodeJS 10.x +](https://nodejs.org/en/download/)
* [Yarn 1.x +](https://yarnpkg.com/en/docs/install)

## Installation & Configuration

Before starting your bot you will need to invite it to your server first. I recommend using this for beginners: https://discordapi.com/permissions.html

Your bot will need following permissions (518208):

* Read Messages
* Embed Links
* Read Message History
* Use External Emojis
* Send Messages
* Manage Messages
* Attach Files
* Mention @everyone
* Add Reactions

It's a bit more than the bot actually needs but if anything new is beeing added to the bot, it will already have the permissions to do it.
Enter your bot client id into the field down below in the Permission Calculator. You can get it from your bot application site where you created your bot.
Next click on the link at the bottom and invite the bot to your server.

Go into the Mellow root folder and type
```sh
yarn prestart
```

To start the bot just simply type
```sh
yarn start
```

After starting the bot you will need to configure it by visiting ``youripordomain:5060``
and filling out the Bot Settings which will start the bot with your token.

Note: It's recommended to set a username and password in General Settings. This way only you can access the web interface.

## Docker Setup & Start

If you want to use this bot in a docker container you have to follow these steps:
* Pull from docker hub: ``docker pull misterwil/mellower``
* Run docker image:
```
docker run -d --restart=always --name mellow \
   -v /opt/appdata/mellower/:/usr/src/app/data/ \
   -p 5060:5060 \
   misterwil/mellower
```
* if you want persistent data create a folder in ``/opt/appdata/mellower/``
or use docker compose. A yaml file is provided for this purpose.

## Development

You can start the bot in nodemon auto-restart mode by using:
```sh
yarn dev
```

## Contributing

I suggest you contribute to the [official Mellow](https://github.com/v0idp/Mellow) above all else.

However:

1. Fork it (<https://github.com/MisterWil/Mellower/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

# one-page-pub

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

A compliant, robust ActivityPub server in one page

This project has multiple goals. First, it's a demonstration of how to build an ActivityPub server, with most of the important parts implemented. It should be useful for implementers who want to know how ActivityPub works in the real world. Second, it's a platform for testing and experimentation with new client apps and new server features.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

[ActivityPub](https://www.w3.org/TR/activitypub/) ("AP") is a decentralized social networking protocol. It uses [Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) ("AS2") as its social data format.

ActivityPub defines a client API for creating, reading, updating, and deleting social data, and a server-to-server for delivering that data to remote servers.

onepage.pub implements as much as possible of the ActivityPub API and protocol.

It doesn't use any Activity Streams- or ActivityPub-specific libraries.

It includes only a rudimentary Web UI for registration, login, logout, and OAuth 2.0 authorization flow. Everything else is done through the API.

## Install

For now, you have to clone it to a directory.

```
git clone git@github.com:evanp/onepage.pub.git

cd onepage.pub
npm install
```

## Usage

Run in development:

```
npm start
```
Run in production:

```
npm run production
```

It takes a few environment variables as configuration options:

- OPP_DATABASE: the path to the SQLite database file for persistent data. Default is test.db. You can use  `:memory:` for no persistence.
- OPP_HOSTNAME: the hostname of the server (default: `localhost`). Once you
start a server, you can't change this without messing up all your links and
everyone's links to you.
- OPP_PORT: the port to listen on (default: `3000`). Same caveat as above.
- OPP_KEY: path to your SSL private key file (default: `localhost.key`).
- OPP_CERT: path to your SSL certificate file (default: `localhost.cert`).
- OPP_LOG_LEVEL: the level of logging to do (default: `info`). Can be `debug`, `info`, `warn`, or `error`.
- OPP_SESSION_SECRET: a random value to use for secrets in sessions. You should change this to something random.
- OPP_INVITE_CODE: If this is non-blank, then only users who have this code can register.
- OPP_BLOCK_LIST: a blocklist file for blocking domains. In Mastodon
blockfile format. Null by default, which is bad.
- OPP_NAME: a name to show for the server. Defaults to the hostname part
  of the origin.
- OPP_UPLOAD_DIR: a directory to store uploaded files. Defaults to a temporary dir, which changes every time you run it. You should set this to a permanent directory.
- OPP_RATE_LIMIT: Limits each IP to 100 requests per `window` (here, per 15 minutes). Can be changed in the .env file

## API

The server supports the following standards:

- [WebFinger](https://tools.ietf.org/html/rfc7033)
- [ActivityPub](https://www.w3.org/TR/activitypub/)
- [OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [HTTP Signatures](https://tools.ietf.org/html/draft-cavage-http-signatures-12)

The basic API usage is as follows:

- Manually register a user with `/register`. This will create a user account
  and a WebFinger resource.
- Use WebFinger to find the user's ActivityPub profile. It's listed as an `alternative` link with `type="application/activity+json"`.
- Get the user's profile with an HTTP GET to the profile URL. This will give the user's profile, which includes the `inbox`, `outbox`, `following`, `followers`, and `liked` URLs.
- Use the `outbox` URL to POST new activities to the user's outbox. This will deliver the activity to the user's followers.
- Use the `inbox` URL to read incoming activities for the user.

Note that the URLs for Activity Streams 2.0 objects, including user profiles and related collections, are pretty much random. You can't guess the URL of the user's `inbox` based on their username, for example.

The server implements the expected side effects for the ActivityPub protocol:

- `Follow`
- `Create`
- `Update`
- `Delete`
- `Like`
- `Block`
- `Add`
- `Remove`

## Status

The server is still in development. It's not ready for production use. There is a public GitHub project for tracking a 1.0 release at:

https://github.com/users/evanp/projects/4/views/1

## Maintainers

[@socialatm](https://github.com/socialatm) Ray Peaslee

## Contributing

PRs accepted. Please use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for your commit messages.

Please add a unit test for your change to prevent regressions.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

Apache-2.0 © 2024 Ray Peaslee

As required by the Apache-2.0 license: Please note that all files dated 12/15/2023 & newer have been modified from the [original](https://github.com/evanp/onepage.pub)...

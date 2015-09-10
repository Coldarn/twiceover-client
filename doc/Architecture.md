## Architecture

At a high level, Twice-Over utilizes a client/server architecture. The client supports code review creation, review, and commenting, and the server implements review tracking, persistence, synchronization, and email notification.

![Twice-Over Architecture](https://cdn.rawgit.com/Coldarn/twiceover-client/master/doc/Architecture.svg?5)

## Server

The Twice-Over server is written as a nodejs module. *(Note: I would have preferred to use iojs, but node-sqlite3 doesn't work with it currently.)* Though it is implemented in primarily JavaScript like the client, they are architecturally and functionally quite different and share little code.

![Server Architecture](https://cdn.rawgit.com/Coldarn/twiceover-client/master/doc/Server Architecture.svg?1)

The server codebase is by far the smaller of the two. Currently it is composed of just a few classes:

 - **Index (Web Server):** Exposes REST APIs for getting code reviews in a few different ways and responds to WebSocket connections by constructing Review instances.
 - **Reviews:** Provides an API for reading and writing review metadata such as owner, title, description, status, and reviewers and their status.
 - **Review:** Loads and saves review log events and merges and broadcasts events between clients in realtime.
 - **Notification:** Formats and sends emails when key review events occur, such as on new review creation, review/reviewer status changes, and when iterations are added.

## Client
 
The Twice-Over client is where most of the magic happens.

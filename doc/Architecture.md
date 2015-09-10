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
 
The Twice-Over client is where most of the magic happens. The Twice-Over client is implementented in JavaScript using [Electron](http://electron.atom.io/), the same toolkit used by the Atom and Visual Studio Code text editors.

![Client Architecture](https://cdn.rawgit.com/Coldarn/twiceover-client/master/doc/Client Architecture.svg?1)

There are a few notable features in the client codebase:

 - **It follows the [FLUX architecture](https://facebook.github.io/flux/)** for simple UI updating. (See EventBus above)
 - **Review data and state are persisted using the [Event Sourcing Pattern](https://msdn.microsoft.com/en-us/library/dn589792.aspx)**, facilitating simple event broadcast & synchronization, persistence, and history. (See EventLog above)
 - The materialized view of and mutation APIs for the review data are managed via a combined **Review Object Model**.
 - **There are no user accounts.** User authentication and email autocomplete are instead handled by an external Active Directory client [*EmailChecker*](https://github.com/Coldarn/twiceover-emailchecker).
 - **There is no UI framework used here.** The project leverages ES6 template strings and a very simple [*Component*](https://github.com/Coldarn/twiceover-client/blob/master/app/ui/util/Component.js) class to provide separation of concerns vaguely similar to Angular or ExtJS and a tiny [*ElementProxy*](https://github.com/Coldarn/twiceover-client/blob/master/app/ui/util/ElementProxy.js) class providing easy event binding and element selection. Modern browser APIs makes UI frameworks unnecessary for smaller projects IMO.

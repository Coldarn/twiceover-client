At a high level, Twice-Over utilizes a client/server architecture. The client supports code review creation, review, and commenting, and the server implements review tracking, persistence, synchronization, and email notification.

![Twice-Over Architecture](architecture.svg)

While both are implemented in JavaScript, they are architecturally and functionally quite different and share little code.
# dsh-http1

Sends DeepSeek Harness (dsh) outbound `fetch` requests over HTTP/1.1.

## Why

Node 26's `fetch` negotiates HTTP/2 and multiplexes every request to an origin over a few long-lived sessions. Anthropic can reset each new stream on one of those sessions without closing it:

```
ERR_HTTP2_STREAM_ERROR: Stream closed with error code NGHTTP2_ENHANCE_YOUR_CALM
```

undici aborts only the affected request and keeps the session in its pool, so every request and retry that lands there fails as `Connection error.` for minutes, while the other sessions and any fresh connection work. Over HTTP/1.1 a failure ends only its own connection and the next attempt opens a fresh one.

## Behavior

- Replaces the global undici dispatcher with an `Agent` that never negotiates HTTP/2, the same mechanism dsh's own proxy support uses. Every outbound `fetch` in the dsh process is affected, including model providers, web fetch and HTTP MCP servers.
- Requests already running when the plugin loads finish on their existing connections. New requests use HTTP/1.1.
- Removing the plugin restores the previous dispatcher and closes the HTTP/1.1 agent after its requests finish.
- An HTTP proxy configured through the environment is replaced by this dispatcher, so do not combine the two.

## Install

```sh
dsh plugin --profile web add github:YanzuoLu/dsh-http1
```

No dsh restart is required with a live profile.

/**
 * HTTP/1.1 for outbound fetch in DeepSeek Harness (dsh).
 *
 * Node 26's fetch negotiates HTTP/2 and multiplexes every request to an origin
 * over a few long-lived sessions. When a server resets each new stream on one
 * session with ENHANCE_YOUR_CALM yet keeps the session open, undici keeps
 * scheduling requests onto it, so every request and retry landing there fails
 * as `Connection error.` until the session closes. Over HTTP/1.1 a failure ends
 * only its own connection and the next attempt opens a fresh one.
 *
 * @module dsh-http1
 */
import { Agent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'

export const name = 'http1'

/**
 * Route global fetch through an HTTP/1.1-only agent for this plugin's lifetime.
 * Requests already running on the previous dispatcher finish there.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  ctx.effect(() => {
    const previous = getGlobalDispatcher()
    const agent = new Agent({ allowH2: false })
    setGlobalDispatcher(agent)
    return async () => {
      setGlobalDispatcher(previous)
      await agent.close()
    }
  }, 'http1 global dispatcher')
}

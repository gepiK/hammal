import { handleRequest } from './handler'

declare global {
  const HAMMAL_CACHE: KVNamespace
}

addEventListener('fetch', (event) => {
  console.log(event.request.url)
  event.respondWith(handleRequest(event.request))
})

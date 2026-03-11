export default defineEventHandler((event) => {
  const host = getRequestHost(event)

  if (host.includes('punkscape.xyz') && getRequestURL(event).pathname === '/') {
    return sendRedirect(event, 'https://scapes.xyz/', 301)
  }
})
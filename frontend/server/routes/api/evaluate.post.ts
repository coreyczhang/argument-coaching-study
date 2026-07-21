export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const response = await fetch('https://point-taken-ai-agent-production.up.railway.app/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
})

const payload = new Blob([new ArrayBuffer(5000000)]);
const startTime = Date.now();
fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: payload })
  .then(r => console.log('Uploaded in', Date.now() - startTime, 'ms, status:', r.status))
  .catch(e => console.error('Error:', e.message));

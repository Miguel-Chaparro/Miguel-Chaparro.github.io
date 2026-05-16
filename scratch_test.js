fetch('https://speed.cloudflare.com/__down?bytes=10000000')
  .then(r => r.blob())
  .then(b => console.log('Downloaded', b.size, 'bytes'))
  .catch(e => console.error('Error:', e.message));

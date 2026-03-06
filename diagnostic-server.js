import http from 'http';
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
});
server.listen(54369, '127.0.0.1', () => {
    console.log('Diagnostic server listening on 127.0.0.1:54369');
});

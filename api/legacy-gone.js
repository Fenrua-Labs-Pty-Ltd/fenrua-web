const allowedMethods = new Set(["GET", "HEAD"]);

export default function handler(request, response) {
  if (!allowedMethods.has(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.status(405).end();
    return;
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.status(410);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(`<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>Retired route | Fenrua Protocol</title>
  </head>
  <body>
    <main>
      <h1>This route has been retired.</h1>
      <p>It is not part of the current Fenrua Protocol public platform or Fenrua Labs Pty Ltd service boundary.</p>
      <nav aria-label="Current Fenrua links"><a href="https://fenrua.ai/">Fenrua Protocol</a> | <a href="https://fenrua.ai/legal">Fenrua Labs Pty Ltd</a></nav>
    </main>
  </body>
</html>`);
}

import { RETIRED_ROUTE_CACHE_CONTROL, RETIRED_ROUTE_ROBOTS } from "../scripts/retired-route-contract.mjs";

const allowedMethods = new Set(["GET", "HEAD"]);

export default function handler(request, response) {
  if (!allowedMethods.has(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    response.status(405).end();
    return;
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", RETIRED_ROUTE_CACHE_CONTROL);
  response.setHeader("X-Robots-Tag", RETIRED_ROUTE_ROBOTS);
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
    <title>Retired route | Fenrua BlackBox Protocol</title>
  </head>
  <body>
    <main>
      <h1>This route has been retired.</h1>
      <p>It is not part of the current Fenrua BlackBox Protocol public platform or Fenrua Labs Pty Ltd service boundary.</p>
      <nav aria-label="Current Fenrua links"><a href="https://fenrua.ai/">Fenrua Labs</a> | <a href="https://fenrua.ai/legal">Fenrua Labs Pty Ltd</a></nav>
    </main>
  </body>
</html>`);
}

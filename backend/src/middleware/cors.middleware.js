function createCorsMiddleware(allowedOrigins = []) {
  const originSet = new Set(allowedOrigins);
  const allowAll = originSet.has("*");

  return function corsMiddleware(req, res, next) {
    const requestOrigin = req.headers.origin;

    if (requestOrigin) {
      if (allowAll || originSet.has(requestOrigin)) {
        res.setHeader("Access-Control-Allow-Origin", allowAll ? "*" : requestOrigin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        res.setHeader("Access-Control-Expose-Headers", "Content-Length, X-Request-Id");
        res.setHeader("Access-Control-Max-Age", "86400");
      }
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  };
}

module.exports = {
  createCorsMiddleware,
};
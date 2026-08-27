const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const https = require('https');

/** Mismo host que producción; rutas bajo /api */
const UPSTREAM_HOST = 'carmanparking.com';
const UPSTREAM_PREFIX = '/api';

/**
 * Proxy /expo-api/* → https://carmanparking.com/api/*
 * Dev web en localhost: mismo origen que el bundle, sin CORS al dominio.
 */
function applyCors(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function handleExpoApiProxy(req, res) {
  const raw = req.url || '';
  const [pathname, search = ''] = raw.split('?');
  const query = search ? `?${search}` : '';

  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.statusCode = 204;
    res.end();
    return;
  }

  const sub = pathname.replace(/^\/expo-api(\/|$)/, '/');
  const normalized = sub.startsWith('/') ? sub : `/${sub}`;
  const upstreamPath = `${UPSTREAM_PREFIX}${normalized === '/' ? '' : normalized}${query}`;

  const headers = { ...req.headers };
  headers.host = UPSTREAM_HOST;
  delete headers.connection;

  const opts = {
    hostname: UPSTREAM_HOST,
    port: 443,
    path: upstreamPath,
    method: req.method,
    headers,
  };

  const proxyReq = https.request(opts, (proxyRes) => {
    applyCors(req, res);
    res.statusCode = proxyRes.statusCode || 502;
    const pass = ['content-type', 'content-length', 'etag', 'cache-control'];
    for (const key of Object.keys(proxyRes.headers)) {
      if (pass.includes(key.toLowerCase())) {
        res.setHeader(key, proxyRes.headers[key]);
      }
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      applyCors(req, res);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Proxy error', error: String(err.message) }));
    }
  });

  req.pipe(proxyReq);
}

let config = getDefaultConfig(__dirname);
config = withNativeWind(config, { input: './global.css' });

const prevEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const stack = prevEnhance ? prevEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      const pathname = (req.url || '').split('?')[0];
      if (pathname === '/expo-api' || pathname.startsWith('/expo-api/')) {
        handleExpoApiProxy(req, res);
        return;
      }
      return stack(req, res, next);
    };
  },
};

module.exports = config;

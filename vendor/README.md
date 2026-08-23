# Vendored browser dependencies

`chess.js` is pinned to version 1.4.0 and copied from its published ESM bundle
so TRA Chess can run without a CDN connection.  Keep its upstream license with
the vendored file and update the import in `games.js` only together with the
offline manifest.

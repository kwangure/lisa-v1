export function normalizeUrl(urlString, options = {}) {
    const {
        defaultProtocol = "https:",
        removeTrailingSlash = true,
        sortQueryParameters = true,
        stripHash = false,
    } = options;

    urlString = urlString.trim();
    // Prepend protocol
    urlString = urlString.replace(/^(?!(?:[\w-]+:)?\/\/)|^\/\//u, defaultProtocol);

    const urlObj = new URL(urlString);

    if (stripHash) {
        urlObj.hash = "";
    }

    // Decode URI octets
    if (urlObj.pathname) {
        try {
            urlObj.pathname = decodeURI(urlObj.pathname);
        } catch (_) {} // eslint-disable-line no-empty
    }

    if (sortQueryParameters) {
        urlObj.searchParams.sort();
    }

    if (removeTrailingSlash && urlObj.pathname !== "/") {
        urlObj.pathname = urlObj.pathname.replace(/\/+$/u, "");
    }

    return urlObj.toString();
}

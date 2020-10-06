let _isMacintosh = false;
let _isIOS = false;
let _userAgent = undefined;

if (typeof navigator === "object") {
    _userAgent = navigator.userAgent;
    _isMacintosh = _userAgent.indexOf("Macintosh") >= 0;
    _isIOS = _isIOS = (/iPad|iPhone|iPod|Macintosh/.test(_userAgent)) && navigator.maxTouchPoints > 0;
}

export const isMacintosh = _isMacintosh;
export const isIOS = _isIOS;
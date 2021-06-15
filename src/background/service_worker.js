try {
    console.log("Registered");
    // eslint-disable-next-line no-undef
    importScripts("background.js");
} catch (error) {
    console.error(error);
}

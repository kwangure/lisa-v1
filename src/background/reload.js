import { fileEntryToFile, getFilesIn } from "../common/chrome/file";
import chrome from "../common/chrome/promisify.js";

async function geAllFileTimestmaps(dirEntry) {
    const fileEntries = await getFilesIn(dirEntry);

    return (await Promise.all(
        fileEntries
            .map(async (fileOrDirEntry) => {
                if(fileOrDirEntry.isFile) {
                    const { name, lastModifiedDate } = await fileEntryToFile(fileOrDirEntry);
                    return `${name}${lastModifiedDate}`;
                }
                return await geAllFileTimestmaps(fileOrDirEntry);
            }))
    ).join("");
}

async function reload(options = {}) {
    const { reloadRuntime = true, reloadTabs = true } = options;

    if(reloadTabs) {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
    }

    if(reloadRuntime) {
        chrome.runtime.reload();
    }
}

async function watchDirectory(dirEntry, reloadOptions) {
    const mergedTimestamp = await geAllFileTimestmaps(dirEntry);

    async function reloadOnTimestampChange(mergedTimestamp) {
        const newMergedTimestamp = await geAllFileTimestmaps(dirEntry);

        if (newMergedTimestamp !== mergedTimestamp) {
            reload(reloadOptions);
        } else {
            setTimeout(reloadOnTimestampChange, 500, newMergedTimestamp);
        }
    }

    reloadOnTimestampChange(mergedTimestamp);
}

export async function reloadOnFileChange() {
    const thisExtension = await chrome.management.getSelf();

    if (thisExtension.installType === "development") {
        const rootDirEntry = await chrome.runtime.getPackageDirectoryEntry();
        watchDirectory(rootDirEntry);
    }
}
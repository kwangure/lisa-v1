export function getFilesIn(directoryEntry) {
    return new Promise((resolve) => {
        const dirReader = directoryEntry.createReader();
        dirReader.readEntries((entries) => resolve(entries));
    });
}

export function fileEntryToFile(fileEntry) {
    return new Promise((resolve, reject) => {
        const handleSucess = (file) => resolve(file);
        const handleError = (error) => reject(error);

        fileEntry.file(handleSucess, handleError);
    });
}

function getFileSystemEntry(rootDirEntry, entryName, options) {
    return new Promise((resolve, reject) => {
        const handleSuccess = (fileOrDirEntry) => resolve(fileOrDirEntry);
        const handleError = (fileError) => reject(fileError);

        if (options.getFile) {
            rootDirEntry.getFile(
                entryName,
                options,
                handleSuccess,
                handleError,
            );
        } else {
            rootDirEntry.getDirectory(
                entryName,
                options,
                handleSuccess,
                handleError
            );
        }
    });
}

export function getDirectoryEntry(rootDirEntry, directory, options = {}) {
    return getFileSystemEntry(
        rootDirEntry,
        directory,
        Object.assign(options, { getFile: false })
    );
}

export function getFileEntry(rootDirEntry, filename, options = {}) {
    return getFileSystemEntry(
        rootDirEntry,
        filename,
        Object.assign(options, { getFile: false })
    );
}

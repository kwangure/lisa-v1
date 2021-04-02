import archiver from "archiver";
import fs from "fs";
import numerable from "numerable";

export function zip(directory, zipOutput) {
    const archive = archiver("zip", {
        zlib: { level: 9 },
    });
    const output = fs.createWriteStream(zipOutput);

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(directory, false);

    archive.finalize();

    output.on("error", (error) => {
        throw error;
    });

    return new Promise((resolve) => {
        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on("close", () => {
            console.log("Written", numerable.format(archive.pointer(), "0.00bd"));
            resolve();
        });
    });
}

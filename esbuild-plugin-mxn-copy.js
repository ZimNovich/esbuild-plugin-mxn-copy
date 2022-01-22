// Esbuild-Plugin-MXN-Copy - Esbuild plugin for copying assets into the output directory of your bundle
// Copyright (C) 2022 Ilya Zimnovich <zimnovich@gmail.com>
//
// On Rollup plugin documentation see:
// - https://github.com/rollup/rollup/blob/master/docs/05-plugin-development.md

"use strict";
const fs   = require("fs");
const path = require("path");

/**
 * copy file to dir
 * @param src
 * @param dest
 * @returns {Promise<any>}
 */
// Inspired by rollup-plugin-copy-files
//
const copyFile = function(src, dst) {
    const rd = createReadStream(src);
    const wr = createWriteStream(dst);
    return new Promise((resolve, reject) => {
        rd.on("error", reject);
        wr.on("error", reject);
        wr.on("finish", resolve);
        rd.pipe(wr);
    }).catch((error) => {
        rd.destroy();
        wr.end();
        throw error;
    });
}

// See:
// - https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
//
// source <String> Note: if source is a directory it will copy everything inside of this directory, not the entire directory itself
// target <String> Note: if source is a file, target cannot be a directory

const copyFolderRecursive = async function(source, target)
{
    // Check if target folder needs to be created    
    // const targetFolder = path.join( target, path.basename( source ) );
    const targetExists = await fs.promises.lstat(target).then(r => true).catch(e => false);
    if ( !targetExists ) {
        await fs.promises.mkdir(target, { recursive: true });
    }

    // Copy files recursively
    const sourceStats = await fs.promises.lstat(source);

    if (sourceStats.isDirectory() ) {
        const dirEntries = await fs.promises.opendir(source);

        for await (const dirEntry of dirEntries) {
            const curSource = path.join(source, dirEntry.name);
            const curTarget = path.join(target, dirEntry.name);
            const curSourceStats = await fs.promises.lstat(curSource);
            if (curSourceStats.isDirectory() ) {
                await copyFolderRecursive(curSource, curTarget);
            }
            if (curSourceStats.isFile() ) {
                await fs.promises.copyFile(curSource, curTarget);
            }
        }
    }
}

// https://esbuild.github.io/plugins/#svelte-plugin
//
// An esbuild plugin is an object with a name and a setup function. They are passed
// in an array to the build API call. The setup function is run once for each build
// API call.
//
// A callback added using onResolve will be run on each import path in each module
// that esbuild builds. The callback can customize how esbuild does path resolution.
// For example, it can intercept import paths and redirect them somewhere else. It
// can also mark paths as external. A callback added using onLoad will be run for
// each unique path/namespace pair that has not been marked as external. Its job is
// to return the contents of the module and to tell esbuild how to interpret it.
//
// Register an on-start callback to be notified when a new build starts. This triggers
// for all builds, not just the initial build, so it's especially useful for incremental
// builds, watch mode, and the serve API. Register an on-end callback to be notified
// when a new build ends. This triggers for all builds, not just the initial build,
// so it's especially useful for incremental builds, watch mode, and the serve API.
//
// Plugins can access the initial build options from within the setup method. This lets
// you inspect how the build is configured as well as modify the build options before
// the build starts.

module.exports = function (options) {
    return {
        name: "mxn-copy",
        setup(build) {
            const defaults = { // Setting default options
                copy: [],
                verbose: false,
                restrictive: false
            };

            // Mixing mandatory and user provided arguments
            options = Object.assign(defaults, options);
            let sourceDir = "";
            // const options = build.initialOptions;
            // path.join(path.dirname(build.initialOptions.outfile), to)
            // let src = options.src || './static'
            // let dest = options.dest || '../public'

            // input: [ 'src/index.js' ]
            //
            /*
            if (Array.isArray(input) ) {
                sourceDir = path.dirname(input[0]);
            } else {
                sourceDir = path.dirname(input);
            }*/

            build.onEnd(async function(result) {
                return Promise.all(
                    options.copy.map(async asset => {
                        try {
                            let fromPath = asset.from;
                            let toPath   = asset.to;
            
                            // Correct toPath if it ends with slash ("/" or "\\")
                            if (toPath.endsWith("/") || toPath.endsWith("\\") ) {
                                toPath += path.basename(fromPath);
                            }
    
                            if (options.restrictive) { // Restrictive mode
                                // Check input path
                                const relFromPath = path.relative(sourceDir, fromPath);
                                if (relFromPath.startsWith("..") ) {
                                    throw new Error("Assets to copy should reside within the input directory");
                                }
    
                                // Check output path
                                const relToPath = path.relative(destDir, toPath);
                                if (relToPath.startsWith("..") ) {
                                    throw new Error("Resulting copies should reside within the output directory");
                                }
    
                                fromPath = path.join(sourceDir, relFromPath);
                                toPath   = path.join(destDir, relToPath);
                            }
    
                            if (options.verbose) {
                                console.log("Copying asset from %j to %j", fromPath, toPath);
                            }
    
                            const absFromPath = path.resolve(fromPath);
                            const absToPath   = path.resolve(toPath);
    
                            // Check if source exists
                            // Tests a user's permissions for the file or directory specified by path
                            // await fs.promises.access(absAssetPath);
                            try {
                                const stats = await fs.promises.lstat(absFromPath);
                                if (stats.isFile() ) {
                                    // Copying file. See:
                                    // - https://stackoverflow.com/questions/11293857/fastest-way-to-copy-a-file-in-node-js
                                    await fs.promises.copyFile(absFromPath, absToPath);
                                }
                                if (stats.isDirectory() ) {
                                    // Copying directory
                                    await copyFolderRecursive(absFromPath, absToPath);
                                }
                            }
                            catch (e) {
                                console.warn(`Asset ${asset.from} does not exist. ${e}`);
                            }
                        }
                        catch (e) {
                            console.warn(`Could not copy ${asset.from} because of an error: ${e}`);
                        }
                    })
                );
            });
        }
    }
}

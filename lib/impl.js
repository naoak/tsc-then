"use strict";
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const separatorIndex = process.argv.indexOf('--');
function usage() {
    console.error(`Usage: tsc-then [-p packageDir (maybe repeated)] -- command`);
    process.exit(1);
}
if (separatorIndex === -1) {
    usage();
}
const args = process.argv.slice(2, separatorIndex);
if (args.length % 2 !== 0) {
    usage();
}
const projectDirs = [];
for (let i = 0; i < args.length; i++) {
    if (i % 2 === 0 && args[i] !== '-p') {
        usage();
    }
    if (i % 2 === 1) {
        projectDirs.push(args[i]);
    }
}
if (projectDirs.length === 0) {
    projectDirs.push('');
}
const command = process.argv.slice(separatorIndex + 1);
const initialCompilationPromises = [];
for (const projectDir of projectDirs) {
    const options = { shell: true, cwd: process.cwd(), hideWindows: true, customFds: [0, 1, 2] };
    const tscArgs = ['-w'];
    if (projectDir !== '') {
        tscArgs.push('-p', projectDir);
    }
    const child = child_process_1.spawn('tsc', tscArgs, options);
    child.on('exit', (code, signal) => {
        console.error(`tsc exited with exit code: ${code}`);
        if (signal) {
            console.error(`signal: ${signal}`);
        }
    });
    let resolve;
    initialCompilationPromises.push(new Promise((r) => { resolve = r; }));
    let buffer = '';
    const marker = `. Watching for file changes.`;
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
        // process.stdout.write(chunk);
        buffer += chunk;
        while (true) {
            let index = buffer.indexOf(marker);
            if (index === -1) {
                break;
            }
            resolve();
            if (buffer.includes(`File change detected. Starting incremental compilation...`)) {
                console.log('\ntsc-then: File change detected. Compiling...\n');
            }
            buffer = buffer.slice(index + marker.length);
            runResponseCommand();
        }
    });
}
let running = undefined;
let nextRun = false;
let firstRun = true;
function runResponseCommand() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(initialCompilationPromises);
        if (running) {
            yield running;
            if (nextRun) {
                return;
            }
            nextRun = true;
        }
        running = new Promise((resolve) => {
            if (firstRun) {
                console.log('tsc-then: Initial compilation complete!');
                firstRun = false;
            }
            console.log(`\ntsc-then: Running ${command.join(' ')}\n`);
            const options = { shell: true, cwd: process.cwd(), hideWindows: true };
            const responseCommand = child_process_1.spawn(command[0], command.slice(1), options);
            responseCommand.stdout.setEncoding('utf8');
            responseCommand.stdout.on('data', (chunk) => {
                process.stdout.write(chunk);
            });
            responseCommand.stderr.on('data', (chunk) => {
                process.stderr.write(chunk);
            });
            responseCommand.on('exit', () => {
                resolve();
            });
        });
        yield running;
        console.log('\ntsc-then: command finished\n');
        running = undefined;
        nextRun = false;
    });
}
//# sourceMappingURL=impl.js.map
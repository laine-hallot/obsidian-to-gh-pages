#! /bin/node
import { argv } from 'node:process';
import { mdToHtml } from '../dist/index.js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const filePath = argv[2];
const tree = await mdToHtml(filePath);

await writeFile(path.resolve('./', 'tree.html'), tree.toString());

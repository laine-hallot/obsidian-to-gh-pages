import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { buildCss } from 'blog-frontend';
import { mdToHtml } from 'md-to-html/index.js';

const file = await mdToHtml('./test-doc.md');

const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="/output/app.css" rel="stylesheet">
  </head>
  <body>
      <article class="prose lg:prose-xl">
      ${String(file)}
      </article>
  </body>
</html>`;

await writeFile('./output/index.html', template, 'utf8');
await buildCss();

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { buildCss } from 'blog-frontend';

const value = await readFile(path.resolve('./test-doc.md'), 'utf8');

const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkMath);

const parseTree = processor.parse(value);
console.log(parseTree);
const tree = await processor.run(parseTree);

const hypeAstProcessor = processor().use(remarkRehype, {
  allowDangerousHtml: true,
});
const hypeAst = await hypeAstProcessor.run(parseTree);

const htmlProcessor = hypeAstProcessor().use(rehypeStringify);
const html = await htmlProcessor.run(parseTree);
const file = await htmlProcessor.process(value);

console.dir(tree, { depth: null });
console.log(hypeAst);

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

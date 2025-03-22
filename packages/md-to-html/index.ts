import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export const mdToHtml = async (filePath: string) => {
  const value = await readFile(path.resolve(filePath), 'utf8');

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

  return file;
};

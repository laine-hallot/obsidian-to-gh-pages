import type { VFile } from 'vfile';

import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { Root } from 'remark-parse/lib';

import { remarkObsidianLink } from './src/parser/obsidian-parser';

export const toTree = async (filePath: string): Promise<Root> => {
  const value = await readFile(path.resolve(filePath), 'utf8');

  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkMath)
    .use(remarkObsidianLink);

  return processor.parse(value);
};

export const mdToHtml = async (filePath: string): Promise<VFile> => {
  const value = await readFile(path.resolve(filePath), 'utf8');

  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkMath)
    .use(remarkObsidianLink);

  const parseTree = processor.parse(value);
  const tree = await processor.run(parseTree);

  const hypeAstProcessor = processor().use(remarkRehype, {
    allowDangerousHtml: true,
  });
  const hypeAst = await hypeAstProcessor.run(parseTree);
  console.log('hypeAst tree');
  console.log(hypeAst);

  const htmlProcessor = hypeAstProcessor().use(rehypeStringify);
  const html = await htmlProcessor.run(parseTree);
  console.log('hast tree');
  console.log(html);
  const file = await htmlProcessor.process(value);

  return file;
};

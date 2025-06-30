import m from 'mdast-builder';
import remarkWikiLink from 'remark-wiki-link';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { wikiLink } from '../tokenizer/index';
import { fromMarkdown } from './from-markdown';

export interface WikiLink {
  value: string;
  alias?: string;
}

export interface Link {
  value: string;
  uri: string;
  title?: string;
}

interface ASDF extends Node {
  tree: 'wikiLink';
  value: {};
}

export type ToLink = (wikiLink: WikiLink) => Link | string;

function remarkObsidianLink(this: any, opts = {}) {
  const data = this.data();

  function add(field: any, value: any) {
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }

  add('fromMarkdownExtensions', fromMarkdown(opts));
  add('micromarkExtensions', wikiLink(opts));
}

export { remarkObsidianLink };
export default remarkObsidianLink;

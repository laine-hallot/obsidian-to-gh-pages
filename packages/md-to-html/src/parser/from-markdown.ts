// this file is entirely copy pasted from https://github.com/landakram/mdast-util-wiki-link/blob/master/src/from-markdown.ts
// to check if the tokenizer code works correctly
// itll do for now though ill have to rewrite this later anyways to actually have it handle embeds correctly
type FromMarkdownOptions = {
  permalinks?: string[];
  pageResolver?: (name: string) => string[];
  newClassName?: string;
  wikiLinkEmbedClassName?: string;
  hrefTemplate?: (permalink: string) => string;
};

function fromMarkdown(opts: FromMarkdownOptions = {}) {
  const permalinks = opts.permalinks || [];
  const defaultPageResolver = (name: string) => [
    name.replace(/ /g, '_').toLowerCase(),
  ];
  const pageResolver = opts.pageResolver || defaultPageResolver;
  const newClassName = opts.newClassName || 'new';
  const wikiLinkEmbedClassName = opts.wikiLinkEmbedClassName || 'internal';
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`;
  const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate;
  let node: any;

  function enterWikiLinkEmbed(this: any, token: any) {
    node = {
      type: 'wikiLinkEmbed',
      value: null,
      data: {
        alias: null,
        permalink: null,
        exists: null,
      },
    };
    this.enter(node, token);
  }

  function top(stack: any) {
    return stack[stack.length - 1];
  }

  function exitWikiLinkEmbedAlias(this: any, token: any) {
    const alias = this.sliceSerialize(token);
    const current = top(this.stack);
    current.data.alias = alias;
  }

  function exitWikiLinkEmbedTarget(this: any, token: any) {
    const target = this.sliceSerialize(token);
    const current = top(this.stack);
    current.value = target;
  }

  function exitWikiLinkEmbed(this: any, token: any) {
    this.exit(token);
    const wikiLinkEmbed = node;

    const pagePermalinks = pageResolver(wikiLinkEmbed.value);
    const target = pagePermalinks.find((p) => permalinks.indexOf(p) !== -1);
    const exists = target !== undefined;

    let permalink: string;
    if (exists) {
      permalink = target;
    } else {
      permalink = pagePermalinks[0] || '';
    }

    let displayName = wikiLinkEmbed.value;
    if (wikiLinkEmbed.data.alias) {
      displayName = wikiLinkEmbed.data.alias;
    }

    let classNames = wikiLinkEmbedClassName;
    if (!exists) {
      classNames += ' ' + newClassName;
    }

    wikiLinkEmbed.data.alias = displayName;
    wikiLinkEmbed.data.permalink = permalink;
    wikiLinkEmbed.data.exists = exists;

    wikiLinkEmbed.data.hName = 'img';
    wikiLinkEmbed.data.hType = 'element';
    wikiLinkEmbed.data.hProperties = {
      className: classNames,
      src: hrefTemplate(permalink),
    };
    wikiLinkEmbed.data.hChildren = [
      {
        type: 'text',
        value: displayName,
      },
    ];
  }

  return {
    enter: {
      wikiLinkEmbed: enterWikiLinkEmbed,
    },
    exit: {
      wikiLinkEmbedTarget: exitWikiLinkEmbedTarget,
      wikiLinkEmbedAlias: exitWikiLinkEmbedAlias,
      wikiLinkEmbed: exitWikiLinkEmbed,
    },
  };
}

export { fromMarkdown };

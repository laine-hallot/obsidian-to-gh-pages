import type {} from 'unified';

type Consumer = (code: number) => Consumer;

const linkStart = '![[';
const linkEnd = ']]';

const codes = {
  horizontalTab: -2,
  virtualSpace: -1,
  nul: 0,
  eof: null,
  space: 32,
};

const markdownLineEnding = (code: number) => {
  return code < codes.horizontalTab;
};

const markdownLineEndingOrSpace = (code: number) => {
  return code < codes.nul || code === codes.space;
};

type Options = {};
// this is mostly modeled after https://github.com/landakram/micromark-extension-wiki-link/blob/master/src/index.js
export const wikiLink = (options: Options) => {
  const tokenize = (effects, ok, nok) => {
    let data: boolean;

    let linkStartCursor = 0;
    let linkEndCursor = 0;
    const consumeStart: Consumer = (code) => {
      if (linkStartCursor === linkStart.length) {
        effects.exit('wikiLinkEmbedMarker');
        return consumeData(code);
      }

      if (code !== linkStart.charCodeAt(linkStartCursor)) {
        return nok(code);
      }

      effects.consume(code);
      linkStartCursor += 1;

      return consumeStart;
    };

    const consumeEnd: Consumer = (code) => {
      if (linkEndCursor === linkEnd.length) {
        effects.exit('wikiLinkEmbedMarker');
        effects.exit('wikiLinkEmbed');
        return ok(code);
      }

      if (code !== linkEnd.charCodeAt(linkEndCursor)) {
        return nok(code);
      }

      effects.consume(code);
      linkEndCursor += 1;

      return consumeEnd;
    };

    const consumeData: Consumer = (code) => {
      if (markdownLineEnding(code) || code === codes.eof) {
        return nok(code);
      }

      effects.enter('wikiLinkEmbedData');
      effects.enter('wikiLinkEmbedTarget');
      return consumeTarget(code);
    };

    const consumeTarget: Consumer = (code) => {
      if (code === linkEnd.charCodeAt(linkEndCursor)) {
        if (!data) {
          return nok(code);
        }
        effects.exit('wikiLinkEmbedTarget');
        effects.exit('wikiLinkEmbedData');
        effects.enter('wikiLinkEmbedMarker');
        return consumeEnd(code);
      }

      if (markdownLineEnding(code) || code === codes.eof) {
        return nok(code);
      }

      if (!markdownLineEndingOrSpace(code)) {
        data = true;
      }

      effects.consume(code);

      return consumeTarget;
    };

    const start: Consumer = (code) => {
      if (code !== linkStart.charCodeAt(linkStartCursor)) {
        return nok(code);
      }
      effects.enter('wikiLinkEmbed');
      effects.enter('wikiLinkEmbedMarker');

      return consumeStart(code);
    };

    return start;
  };

  const call = { tokenize: tokenize };

  // 33 is the charcode for !
  return { text: { 33: call } };
};

import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import tailwindcss from '@tailwindcss/postcss';

export const buildCss = async () => {
  console.log(path.resolve('output/', 'app.css'));
  const fileData = await readFile('./packages/blog-frontend/style.css', 'utf8');

  const postCssResult = await postcss([
    tailwindcss,
    autoprefixer,
    postcssNested,
  ]).process(fileData, {
    from: './packages/blog-frontend/style.css',
    to: 'dest/app.css',
  });

  writeFile(path.resolve('output/', 'app.css'), postCssResult.css);

  if (postCssResult.map) {
    writeFile(
      path.resolve('../../output/', 'app.css.map'),
      postCssResult.map.toString()
    );
  }
};

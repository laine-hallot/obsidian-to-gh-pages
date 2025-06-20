import { writeFile, readFile, readdir, mkdir } from 'fs/promises';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import tailwindcss from '@tailwindcss/postcss';

export const buildCss = async () => {
  console.log(path.resolve('output/', 'app.css'));
  const fileData = await readFile('./style.css', 'utf8');

  const postCssResult = await postcss([
    tailwindcss,
    autoprefixer,
    postcssNested,
  ]).process(fileData, {
    from: './style.css',
    to: 'dest/app.css',
  });

  writeFile(path.resolve('output/', 'app.css'), postCssResult.css);

  if (postCssResult.map) {
    writeFile(
      path.resolve('./output/', 'app.css.map'),
      postCssResult.map.toString()
    );
  }
};

const blogPosts = await readdir(path.resolve('blog-posts'));

for (const post of blogPosts) {
  const file = await readFile(path.resolve('blog-posts', post), {
    encoding: 'utf-8',
  });
  const template = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="output/app.css" rel="stylesheet">
    </head>
    <body>
        <article class="prose lg:prose-xl mx-auto">
        ${file.toString()}
        </article>
    </body>
  </html>`;

  await mkdir(path.resolve('./output/'), { recursive: true });
  await writeFile(path.resolve('./output/', post), template, 'utf8');
  await buildCss();
}

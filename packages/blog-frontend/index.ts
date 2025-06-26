import { writeFile, readFile, readdir, mkdir, stat } from 'fs/promises';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import tailwindcss from '@tailwindcss/postcss';
import { Edge } from 'edge.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const edge = Edge.create();
edge.mount(new URL('./views', import.meta.url));

export const buildCss = async () => {
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
type DateInfo = { timestamp: number; shortDate: string; fullDate: string };
const getPostDate = async (file: string): Promise<DateInfo> => {
  const commandString = `git log --follow --format="{ \\"timestamp\\": %at, \\"date\\": \\"%aI\\"}" "${path.resolve(
    'blog-posts/',
    file
  )}" | tail -1`;
  const gitLogResult = await execPromise(commandString, {});
  if (gitLogResult.stderr !== undefined && gitLogResult.stderr !== '') {
    console.error(gitLogResult.stderr);
  }
  if (gitLogResult.stdout !== undefined && gitLogResult.stdout !== '') {
    const dateData = JSON.parse(gitLogResult.stdout.trim());
    const dateObj = new Date(dateData.date);
    return {
      // cast instead of validating because i decided i don't care
      timestamp: (dateData.timestamp as number) * 1000,
      shortDate: dateObj
        .toDateString()
        .replace(/^([A-Z][a-z]{2})(.*)( [0-9]{4})$/, '$1,$2'),
      fullDate: dateData.date,
    };
  } else {
    const fileStats = await stat(path.resolve('blog-posts/', file));
    const timestamp = Math.floor(fileStats.mtimeMs) - 31556952000;
    const dateObj = new Date(timestamp);
    return {
      timestamp,
      fullDate: dateObj.toISOString(),
      shortDate: `${dateObj
        .toDateString()
        .replace(/^([A-Z][a-z]{2})(.*)( [0-9]{4})$/, '$1,$2')}`,
    };
  }
};

type Post = {
  filename: string;
  postDate: DateInfo;
  title: string;
};

const getPosts = async (dir: string) => {
  const postFiles = await readdir(path.resolve(dir));

  const postsWithDate = await Promise.all(
    postFiles.map(async (post) => {
      const postDate = await getPostDate(post);
      return {
        filename: post,
        postDate: postDate,
        title: path.basename(post, path.extname(post)),
      };
    })
  );

  const posts = postsWithDate.sort(
    (postA, postB) => postB.postDate.timestamp - postA.postDate.timestamp
  );
  return posts;
};

const blogPosts = await getPosts('blog-posts');

const indexPageTemplate = `
@layout.app({ title: "Welcome page title" })
  @slot('content')
    <main class="max-w-prose mx-auto flex flex-col gap-8 my-16">
      <h1 class="text-4xl font-extrabold text-center">All Posts</h1>
      <div class="flex flex-col gap-6 px-4 lg:px-0">
        @each(group in blogPosts)
          <h2 class="text-3xl font-bold">{{group.year}}</h2>
          <div class="flex flex-col gap-4 px-2 mb-2">
            @each(post in group.posts)
              <a class="flex justify-between text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white text-xl" href="./{{post.filename}}">
                <span class="underline">{{post.title}}</span>
                <span class="font-light">{{post.postDate.shortDate}}</span>
              </a>
            @end
          </div>
        @end
      </div>
    </main>
  @endslot
@end`;

const groupByYear = (posts: Post[]): { year: number; posts: Post[] }[] =>
  Object.entries(
    posts.reduce<Record<string, Post[]>>((acc, post) => {
      const postYear = String(new Date(post.postDate.timestamp).getFullYear());
      return { ...acc, [postYear]: [...(acc[postYear] ?? []), post] };
    }, {})
  )
    .map(([year, value]) => ({ year: Number(year), posts: value }))
    .sort((groupA, groupB) => groupB.year - groupA.year);

const indexPage = await edge.renderRaw(indexPageTemplate, {
  blogPosts: groupByYear(blogPosts),
});

await mkdir(path.resolve('./output/'), { recursive: true });
await writeFile(path.resolve('./output/', 'index.html'), indexPage, 'utf8');

for (const post of Object.entries(blogPosts).flatMap(
  ([_key, value]) => value
)) {
  const file = await readFile(path.resolve('blog-posts', post.filename), {
    encoding: 'utf-8',
  });

  const template = `
  @layout.app({ title: "Welcome page title" })
    @slot('content')
        <nav class="w-full text-lg font-medium underline mx-6 my-4 lg:mx-16 lg:mt-6"><a href="index.html"><- Index</a></nav>
        <article class="px-4 prose lg:prose-xl dark:prose-invert mx-auto">
        ${file.toString()}
        </article>
    @endslot
  @end`;

  const htmlOut = await edge.renderRaw(template, { title: post.title });

  await writeFile(path.resolve('./output/', post.filename), htmlOut, 'utf8');
}

await buildCss();

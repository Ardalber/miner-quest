const fs = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist', 'hostinger');
const foldersToCopy = ['css', 'js', 'levels'];

async function ensureEmptyDist() {
  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });
}

async function copyFolder(folderName) {
  const source = path.join(projectRoot, folderName);
  if (!existsSync(source)) return;
  const target = path.join(distRoot, folderName);
  await fs.cp(source, target, { recursive: true });
}

async function copyHtmlFiles() {
  const entries = await fs.readdir(projectRoot, { withFileTypes: true });
  const htmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'));
  await Promise.all(
    htmlFiles.map((entry) => {
      const source = path.join(projectRoot, entry.name);
      const target = path.join(distRoot, entry.name);
      return fs.copyFile(source, target);
    })
  );
}

async function writeHtaccess() {
  const content = `Options -Indexes

<IfModule mod_headers.c>
  <FilesMatch "\\.(html|json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  <FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(png|jpg|jpeg|gif|svg|ico|webp)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
  await fs.writeFile(path.join(distRoot, '.htaccess'), content, 'utf8');
}

async function main() {
  console.log('Preparing Hostinger bundle...');
  await ensureEmptyDist();

  await copyHtmlFiles();
  await Promise.all(foldersToCopy.map(copyFolder));
  await writeHtaccess();

  console.log('Hostinger bundle ready in dist/hostinger');
}

main().catch((error) => {
  console.error('Build for Hostinger failed:', error);
  process.exit(1);
});

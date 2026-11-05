# How We Hosted KSB Solutions on GitHub Pages

Completed: October 28, 2026.

The KSB Solutions Angular website was successfully uploaded to GitHub,
built with GitHub Actions, and published on GitHub Pages.

## 1. Project and hosting details

| Item | Value |
| --- | --- |
| Local project folder | `D:\KSBaig_Solution\Ksbaig_co\ksbaig_co` |
| Framework found in the project | Angular 17.3 |
| Node.js used by the deployment workflow | Node.js 22 |
| GitHub account | `ksbaig` |
| Repository | https://github.com/ksbaig/ksbaig_co |
| Deployment branch | `main` |
| Live website | https://ksbaig.github.io/ksbaig_co/ |
| Deployment history | https://github.com/ksbaig/ksbaig_co/actions |
| Pages settings | https://github.com/ksbaig/ksbaig_co/settings/pages |

The repository URL displays source code. The `github.io` URL displays the
published website. These are different destinations.

Although the original hosting prompt mentioned Angular 21, the existing
project actually uses Angular 17.3. We preserved it rather than recreating
or upgrading the application.

## 2. Inspect the existing application

We checked:

- [package.json](./package.json) for Angular versions and npm scripts.
- [angular.json](./angular.json) for build configuration, assets, and output.
- [app.routes.ts](./src/app/app.routes.ts) for client-side routes.
- [.gitignore](./.gitignore) for files that must not be uploaded.
- Git status, the current branch, commits, and remotes.

Git was already initialized, but initially had no commits or remotes.
We kept the existing components, styling, images, slides, and content.

The Angular route list is empty; navigation uses same-page anchors.
No `404.html` routing fallback was needed. If nested Angular routes are
added later, revisit GitHub Pages routing before publishing them.

## 3. Use the correct project folder

In the VS Code PowerShell terminal:

```powershell
Set-Location D:\KSBaig_Solution\Ksbaig_co\ksbaig_co
Test-Path .\package.json
```

The second command should return `True`.

An early build attempt failed with `ENOENT: Could not read package.json`
because the terminal was in the parent folder:
`D:\KSBaig_Solution\Ksbaig_co`.
Entering the nested Angular project folder resolved that error.

## 4. Verify a production build for the repository subpath

We ran:

```powershell
npm run build -- --configuration production --base-href /ksbaig_co/
```

The build succeeded. The browser-ready files were found in:

```text
dist\ksbaig_co\browser
```

That folder contains `index.html`, JavaScript, CSS, and website assets.
Only the built static files are deployed, not the entire source repository.

The `/ksbaig_co/` base path is necessary because this is a project site:

```text
https://ksbaig.github.io/ksbaig_co/
```

We checked the built base href and 17 local bundle/asset references.
Images use relative paths such as `assets/slides/...`, so they resolve
under the repository subpath. The source base href remains `/` for local
development; the production command supplies the deployment base path.

## 5. Prepare Git exclusions

The existing [.gitignore](./.gitignore) already excluded dependency and
build folders. We added patterns for logs, local `.env` files, and private
key files.

Do not upload:

- `node_modules`, `dist`, or the Angular cache.
- Passwords, access tokens, API keys, or private keys.
- Environment files containing credentials.
- Confidential GIS data or private documents.

Ignore rules do not protect secrets already tracked by Git. Review
staged files before committing.

Anything included under `src\assets` is copied into the built website.
Do not put private PDFs or documents there, even if they are not linked
from a page. Keep hosting documentation in the project root instead.

## 6. Add the GitHub Actions deployment workflow

We created [.github/workflows/deploy.yml](./.github/workflows/deploy.yml).
That file is the source of truth for the deployment configuration.

It runs on:

- Pushes to `main`.
- Manual runs through **Actions > Run workflow**.

The build job:

1. Checks out the repository with `actions/checkout@v6`.
2. Sets up Node.js 22 with `actions/setup-node@v6`.
3. Installs the locked dependencies with `npm ci`.
4. Runs the production build with `/ksbaig_co/` as the base href.
5. Finds the built `index.html` under `dist`.
6. Fails explicitly if there is not exactly one matching index.
7. Uploads its containing folder with `actions/upload-pages-artifact@v3`.

The deployment job:

1. Waits for the build job to succeed.
2. Configures Pages with `actions/configure-pages@v5`.
3. Publishes the artifact with `actions/deploy-pages@v5`.

The workflow grants read access to repository contents and grants
`pages: write` and `id-token: write` to the deployment job. It uses the
`github-pages` environment and serializes deployments without cancelling
an in-progress deployment.

We validated the workflow YAML locally before publishing.

## 7. Create the empty GitHub repository

On https://github.com/new, we selected:

- Owner: `ksbaig`.
- Repository name: `ksbaig_co`.
- Visibility: **Public**.
- No initial README, license, or gitignore.

Creating an empty repository avoided introducing remote commits that
would conflict with the existing local project.

## 8. Commit and upload the project

This section records the initial setup. It has already been completed;
do not repeat `git init` or `git remote add origin` for this repository.

We configured a Git author name and email. On a new machine, use your own
name and verified GitHub email or your exact GitHub no-reply address:

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR GITHUB EMAIL"
```

The first-upload sequence was:

```powershell
Set-Location D:\KSBaig_Solution\Ksbaig_co\ksbaig_co
git status
git add .
git diff --cached --stat
git diff --cached
git commit -m "Prepare KSB Solutions website for GitHub Pages" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git branch -M main
git remote add origin https://github.com/ksbaig/ksbaig_co.git
git push -u origin main
```

Run commands individually and stop if a command fails. Before committing,
confirm that the staged contents are appropriate for a public repository.

During the actual setup, the branch and remote were configured before
the final commit and push. We checked their state rather than adding the
same remote again.

Git Credential Manager opened GitHub authentication in the browser.
We authorized the Git Credential Manager request initiated by the push
for the `ksbaig` account, then returned to the terminal to finish uploading.
Never put an access token in a remote URL or source file.

The initial published commit was:

```text
216a8a1 Prepare KSB Solutions website for GitHub Pages
```

## 9. Enable GitHub Pages

In the repository:

1. Open **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab.
4. Select **Deploy KSB Solutions to GitHub Pages**.
5. Wait for both the build and deploy jobs to succeed.

We did not configure the suggested Jekyll or Static HTML templates because
the Angular deployment workflow was already included in the repository.

If a run fails because Pages was not enabled, enable Pages and rerun it.
To start a manual run, select the workflow, choose **Run workflow**, select
`main`, and confirm.

## 10. Verify the published website

The first deployment completed successfully with a green checkmark.
The live URL then served the KSB Solutions HTML with the correct
`/ksbaig_co/` base href. The shared browser screenshot also showed the
rendered website and slideshow.

Live URL: https://ksbaig.github.io/ksbaig_co/

After each deployment, check:

- HTTPS and the home page.
- Desktop and mobile navigation, including dropdowns.
- Slideshow images and controls.
- CSS, JavaScript, fonts, and images for failed requests.
- Same-page links and page refreshes.
- Browser developer tools for errors.

The successful deployment and rendered home page were confirmed. Treat
the remaining interaction checks as a checklist, not an automated test
report.

## 11. Publish future updates

Edit and save the application, then validate website changes:

```powershell
Set-Location D:\KSBaig_Solution\Ksbaig_co\ksbaig_co
npm run build -- --configuration production --base-href /ksbaig_co/
```

Review changes and stage only the intended files. For example, to publish
this guide without including unrelated documents:

```powershell
git status
git add GITHUB_PAGES_HOSTING_GUIDE.md
git diff --cached --stat
git diff --cached
git commit -m "Document GitHub Pages hosting process"
git push
```

For application updates, stage the specific changed source files instead.
Review all staged changes because a previous operation may already have
staged other files. If Git says there is nothing to commit, no new staged
changes are available; check `git status` before proceeding.

Every successful push to `main` triggers a build and deployment. Wait for
the workflow to finish before checking the updated website. A local
commit alone does not publish changes; the push is required.

## 12. Troubleshooting reference

| Problem | What to check or do |
| --- | --- |
| `ENOENT` or missing `package.json` | Enter the nested Angular project folder shown above. |
| Website returns 404 before deployment | Create the repository, push the source, enable Pages, and wait for a successful deployment. |
| Repository URL returns 404 | Check the account, repository spelling, visibility, and whether it exists. |
| Git says `Author identity unknown` | Configure your Git name and email, then retry the commit. |
| Git says `remote origin already exists` | Inspect `git remote -v`; do not add or replace the remote blindly. |
| Authentication opens in a browser | Complete the Git-initiated sign-in for the intended account and return to the terminal. |
| No workflow run appears | Confirm the workflow was committed and pushed to `main`; then use **Run workflow** if needed. |
| Workflow fails | Open the failed job and step under Actions; resolve the reported error before retrying. |
| Images or scripts fail under the website URL | Check the `/ksbaig_co/` build base href and avoid root-relative `/assets/...` URLs. |
| Old 404 or old page remains after successful deployment | Try Ctrl+F5 or an incognito window. |
| Push rejected because remote history differs | Stop and inspect the histories; do not force-push or delete remote history. |

## 13. Hosting limitations

GitHub Pages hosts the static Angular frontend. It does not host a running
.NET API, database, or private backend. Deploy those separately if needed,
and never embed backend secrets in browser code.

The site is already configured. Normal updates need only a reviewed
commit and push, not another repository or another hosting setup.

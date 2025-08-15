# Deployment to GitHub Pages

1. Add the following to your `package.json`:

```
"homepage": "https://<your-github-username>.github.io/<your-repo-name>"
```

2. Install the `gh-pages` package:

```
npm install --save gh-pages
```

3. Add these scripts to your `package.json`:

```
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```

4. Push your code to GitHub, then run:

```
npm run deploy
```

Your app will be available at the URL you set in the `homepage` field.

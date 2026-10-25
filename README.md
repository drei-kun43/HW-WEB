[Uploading README.md…]()
# Homework Board.

A personal homework organizer. Plain HTML, CSS and JavaScript. No build step.

## Files
- `index.html` the page
- `css/style.css` all styling (colors are the variables at the top)
- `js/app.js` all logic, in numbered sections: subjects, data, .txt import, render, motion, 3D
- Three.js (r128) and GSAP 3.12.5 load from cdnjs, so visitors need an internet connection.

## Change the subjects
Edit the `SUBJECTS` list near the top of `js/app.js`.

## .txt import format
One homework per line: `General Science: [Homework Title][Details]`

## Put it online (GitHub Pages)
1. Create a repository and upload everything in this folder (keep the `css` and `js` folders).
2. Repo Settings > Pages > Deploy from a branch > `main` / root.
3. For your own domain: in Pages, enter the domain under Custom domain, then add the DNS records GitHub shows at your domain provider.

## Notes
Homework is saved with `localStorage` in each browser on each device. It does not sync between phone and laptop.

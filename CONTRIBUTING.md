# Contributing to Eco-Track AI

First off, thank you for considering contributing to Eco-Track AI! It's people like you that make Eco-Track AI such a great enterprise logistics platform.

## Where do I go from here?

If you've noticed a bug or have a question, feel free to open an issue on the GitHub repository.

## Fork & create a branch

If this is something you think you can fix, then fork Eco-Track AI and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-weather-api
```

## Get the test suite running

Make sure you're using Node.js. Install dependencies with `npm install` and start the local development server with `npm run dev`. Ensure the UI remains flawless and the Zero-Crash Fallback Engine still operates when the API key is disabled.

## Code Style

- We use **Tailwind CSS** for all styling. Do not introduce raw CSS files unless necessary for complex Leaflet map overrides.
- We utilize the **Lucide-React** icon library.
- Keep the `App.jsx` modular where possible, though currently optimized as a monolithic dashboard for the MVP showcase.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. You may merge the Pull Request in once you have the sign-off of the core repository manager.

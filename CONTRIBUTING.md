# How to contribute to Prism

First of all, thanks for considering contributing to Prism! ✨ It's people like you that make tools like Prism awesome. 💖

At Stoplight, we want contributing to Prism to be an enjoyable and educational project for everyone. Contributions go beyond commits in pull requests. We are excited to receive contributions in the form of:

- feature ideas
- pull requests
- triaging issues
- reviewing pull requests
- implementations of Prism in your own projects
- blog posts, talks referencing the project, tweets
- and much more!

If it is related to Prism, we consider it a contribution.

If you are new to contributing to open source, GitHub has created a helpful guide with lots of resources [here](https://opensource.guide/how-to-contribute/). If you want more help, post in our [Community forum](https://community.stoplight.io/c/open-source) or send an email to [support@stoplight.io](mailto:support@stoplight.io). We are happy to help you out there.

We want to encourage everyone to be welcoming to newcomers and encourage new contributors from all backgrounds.

To help create an environment where anyone could potentially be welcome to contribute, we have a Code of Conduct that applies to the project and adjacent spaces related to Prism.

## Stoplight Community Code of Conduct

The Stoplight Community is dedicated to providing a safe, inclusive, welcoming, and harassment-free space and experience for all community participants, regardless of gender identity and expression, sexual orientation, disability, physical appearance, socioeconomic status, body size, ethnicity, nationality, level of experience, age, religion (or lack thereof), or other identity markers.

Our Code of Conduct exists because of that dedication, and we do not tolerate harassment in any form. See our reporting guidelines [here](https://github.com/stoplightio/code-of-conduct/blob/master/incident-reporting.md). Our full Code of Conduct can be found at this [link](https://github.com/stoplightio/code-of-conduct/blob/master/long-form-code-of-conduct.md#long-form-code-of-conduct).

## Development

Yarn is a package manager for your code, similar to npm. While you can use npm to use Prism in your own project, we use yarn for development of Prism.

1. If you don't already have the yarn package manager on your machine, install [yarn](https://yarnpkg.com/lang/en/docs/install/).
2. Fork the [https://github.com/stoplightio/prism](https://github.com/stoplightio/prism) repo.
3. Git clone your fork (i.e. `git clone https://github.com/<your-username>/prism.git`) to your machine.
4. Run `yarn` to install dependencies and setup the project.
5. Because [oclif](https://oclif.io) does not respect the provided `tsconfig`, you can't use the bin directly, but we provide a script for that: `cd packages/cli && yarn cli mock openapi.yaml`.
6. Run `git checkout -b [name_of_your_new_branch]` to create a new branch for your work. To help build nicer changelogs, we have a convention for branch names. Please start your branch with either `feature/{branch-name}`, `chore/{branch-name}`, or `fix/{branch-name}`. For example, if I was adding a CLI, I would make my branch name: `feature/add-cli`.
7. Make changes, write code and tests, etc. The fun stuff!
8. Run `yarn test` to test your changes.
9. Commit your changes.
10. Don't forget to `git push` to your branch after you have committed changes.

Now, you are ready to make a pull request to the Stoplight repo! 😃

If this is your first Pull Request on GitHub, here's some [help](https://egghead.io/lessons/javascript-how-to-create-a-pull-request-on-github).

We have a pull request template setup that you will fill out when you open your pull request.

> We try to respond to all pull requests and issues within 7 days. We welcome feedback from everyone involved in the project in open pull requests.

### Dependencies

If you are adding a new `devDependency`, add it to the root workspace `package.json`: `yarn add -D -W {packageName}`.

If you are adding a new runtime dependency, add it to the relevant `package.json` file (inside of `prism-core`, `prism-http`, etc).

### Testing

Prism has an extensive test suite. To run it, just use the regular `test` script

```bash
yarn test
# or
npm test
```

### Debugging

The best way to debug a Prism behavior is probably to attach your debugger to the CLI and go from there. To make that happen:

```bash
cd packages/cli

yarn cli:debug mock file.oas.yml
```

The application will wait for a debugger to be attached and break on the first line; from there, you can put your breakpoint here and there and help us debug the software!

#### What is this `fp-ts` all about?

`fp-ts` is the library containing functions and data structures that help Prism lean toward a functional style. It might be annoying to step into its functions; fortunately according to your IDE, you might be able to skip the code. In case you're using Visual Studio Code, you can use the `skipFiles` section of your `launch.json` file:

```json
{
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Launch Program",
      "skipFiles": ["node_modules/fp-ts/*.js"]
    }
  ]
}

```

### Common issues

1. `jest --watch` throws ENOSPC error

- [optional] Install `watchman` as per [documentation](https://facebook.github.io/watchman/docs/install.html#installing-from-source)
- Modify `fs.inotify.max_user_watches` as per [issue resolution](https://github.com/facebook/jest/issues/3254)

2. I am receiving weird errors from TypeScript, but I didn't touch any part of the build process!

Prism is using TypeScript's incremental compiler capability that sometimes does not work. The best way to fix the issue is to simply remove any compiled file as well the incremental files:

```sh
rm -rf packages/**/dist
rm -rf packages/**/*.tsbuildinfo
```

…then try again. If it does not work, you can generally blame [Vincenzo](https://github.com/XVincentX) and write him.

## Creating an issue

We want to keep issues in this repo focused on bug reports and feature requests.

For support questions, please use the [Stoplight Community forum](https://community.stoplight.io/c/open-source). If you are unsure if you are experiencing a bug, the [forum](https://community.stoplight.io/c/open-source) is a great place to start.

Before you open an issue, try to see if anyone else has already opened an issue that might be similar to your issue or feature request. Start by commenting there to see if you are having the same issue or feature request.

We have an issue template setup:

```
### **I'm submitting a...**
  - bug report
  - feature request

### What is the current behavior?

If the current behavior is a bug, please provide the steps to reproduce and if possible a minimal demo of the problem.

### What is the expected behavior?

### What is the motivation / use case for changing the behavior?

### Please tell us about your environment:

  - Version: 2.0.0-beta.X
  - Framework: [ ]
  - Language: [all | TypeScript X.X | ES6/7 | ES5 | Dart]

### Other information

(e.g. detailed explanation, stacktraces, related issues, suggestions how to fix, links for us to have context, eg. stackoverflow, issues outside of the repo, forum, etc.)
```

We realize there is a lot of data requested here. We ask only that you do your best to provide as much information as possible so we can better help you.

## Support

For support questions, please use the [Stoplight Community forum](https://community.stoplight.io/c/open-source). If you are unsure if you are experiencing a bug, the [forum](https://community.stoplight.io/c/open-source) is a great place to start.

If you have found a bug, please create an issue.

We try to respond to all pull requests and issues within 7 days.

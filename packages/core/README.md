# Prism Core

This package contains base abstract interfaces. Generally, you do not want to look at this repository, as there's nothing more than philosophycal reasonments that aren't exactly that pragmatic.

## Anonymized analytics

Prism uses [Scarf](https://scarf.sh/) to collect [anonymized installation analytics](https://github.com/scarf-sh/scarf-js?tab=readme-ov-file#as-a-user-of-a-package-using-scarf-js-what-information-does-scarf-js-send-about-me). These analytics help support the maintainers of this library and ONLY run during installation. To [opt out](https://github.com/scarf-sh/scarf-js?tab=readme-ov-file#as-a-user-of-a-package-using-scarf-js-how-can-i-opt-out-of-analytics), you can set the `scarfSettings.enabled` field to `false` in your project's `package.json`:

```
// package.json
{
  // ...
  "scarfSettings": {
    "enabled": false
  }
  // ...
}
```

Alternatively, you can set the environment variable `SCARF_ANALYTICS` to `false` as part of the environment that installs your npm packages, e.g., `SCARF_ANALYTICS=false npm install`.

<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=d703ffa4-a736-40cc-a994-9116c1e7e4d8&page=README.md" />

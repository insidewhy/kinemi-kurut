# Kinemi Kurut

A chrome extension for dealing with tab groups

## Commands

Each of the keyboard shortcuts can be rebound:

  - `Ctrl+<` - Move to first tab in previous tab group
  - `Ctrl+>` - Move to first tab in next tab group
  - `Ctrl+g` - Open menu from which the following two items can be selected (they can also be bound to shortcuts)
    - Bookmark all open tab groups
    - Restore tab groups from bookmark

The next two items already have keyboard shortcuts in chrome but are provided by the plugin in case other keyboard shortcuts are prefered for these actions:
  - Move to next tab
  - Move to previous tab

Bookmarking the tab groups stores the tab groups in the user's bookmarks within the root folder `Tab Groups` which should make it easy to share the open tab groups across chrome profiles.

## Known issues

A chrome bug prevents navigating to tabs in saved tab groups

## Development

```bash
git clone git@github.com:insidewhy/kinemi-kurut.git
cd kinemi-kurut
pnpm install
pnpm dev
```

Install the extension once in chrome via developer mode, after this it will reload on changes.

Tabs won't see any changes to the content script which provides until they are reloaded, but modifying any of the code will trigger the current tab to reload.

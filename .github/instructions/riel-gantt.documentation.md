# New Features

<!-- >>> SR: Initial auto moving labels ------------------------------------------ -->
## Initially visible labels with `auto_move_label`

When `auto_move_label: true` is set, labels in very long task bars are now positioned based on the current horizontal viewport during the initial render.

Previously, the label was initially placed in the center of the full bar. For long tasks, such as a year-long task in the day view, this center could be far outside the visible area. The label only became visible after scrolling to the task center and then scrolling back.

The new behavior aligns a label that fits inside the bar with the center of the visible viewport while also clamping it to the bar boundaries. Short labels, or labels that are already fully visible, remain centered normally within the bar.

During horizontal scrolling, the previous continuous tracking behavior is preserved: as soon as the view center reaches the label, the label is moved within the bar again using the scroll delta. The initial positioning does not replace this scroll behavior; it only sets the correct starting state.

Affected files:

- `src/gantt-js/src/bar.js`
<!-- <<< SR: Initial auto moving labels ------------------------------------------ -->

<!-- >>> SR: Removed keep_scroll_position ------------------------------------------ -->
## Removed `keep_scroll_position` option

The `keep_scroll_position` option has been completely removed from `gantt-js`. In the current interaction with `refresh(tasks, scroll_after_refresh)`, it no longer had any visible standalone effect.

Scroll behavior is now controlled directly through:

- `scroll_to` during the initial render and when explicitly scrolling after `refresh()`
- `refresh(tasks)` or `refresh(tasks, false)` to preserve the current horizontal scroll position with pixel accuracy
- `refresh(tasks, true | 'today' | 'start' | Date)` to explicitly scroll after a refresh

Affected files:

- `src/gantt-js/src/defaults.js`
- `src/gantt-js/src/index.js`
- `src/gantt-js/src/popup.js`
<!-- <<< SR: Removed keep_scroll_position ------------------------------------------ -->

<!-- >>> SR: Refresh scroll control ------------------------------------------ -->
## Scroll behavior in `refresh()`

`refresh()` can now control whether scrolling should happen after updating the tasks.

Default behavior:

```js
gantt.refresh(tasks);
```

The current horizontal scroll area is preserved with pixel accuracy using the browser value `scrollLeft`. This prevents the Gantt from automatically jumping back to `scroll_to: 'today'` during repeated data updates, for example after scrolling an external SAP UI5 table, and also prevents it from gradually drifting to the left.

When `refresh(tasks)` automatically preserves the position, the horizontal position is set directly without a smooth-scroll animation and without converting the pixel position to a date and back. As a result, the Gantt does not visibly move from the left to the previous position during SAP table refreshes and does not lose pixels due to rounding or offset differences.

Explicit scrolling is still available optionally:

```js
gantt.refresh(tasks, true);      // uses options.scroll_to, e.g. 'today', still with smooth scrolling/jump behavior
gantt.refresh(tasks, 'today');   // jumps specifically to today
gantt.refresh(tasks, 'start');   // jumps to the start
gantt.refresh(tasks, date);      // jumps to a Date object
```

Initial scrolling when creating a new Gantt remains unchanged. Only `refresh()` preserves the current horizontal position by default.

Affected files:

- `src/gantt-js/src/index.js`
<!-- <<< SR: Refresh scroll control ------------------------------------------ -->

<!-- >>> SR: Global minimum view interval ------------------------------------------ -->
## Global minimum interval for views

The options `global_min_view_start` and `global_min_view_end` can be used to define a minimum visible date interval for the Gantt.

Options:

```js
global_min_view_start: null,
global_min_view_end: null,
```

The values use the same type as `task.start` and `task.end`, for example:

```js
global_min_view_start: '2027-07-01',
global_min_view_end: '2027-10-06',
```

Behavior:

- First, the earliest task start date and the latest task end date are calculated as before.
- If `global_min_view_start` is set and lies before the earliest task start, this value is used as the base start date.
- If `global_min_view_end` is set and lies after the latest task end, this value is used as the base end date.
- After that, the normal `view_mode.padding` is still applied.
- `include_today_in_padding` can still additionally extend the time range afterward.

This makes it possible to define the minimum size of the rendered view time interval independently of the currently available tasks.

Affected files:

- `src/gantt-js/src/defaults.js`
- `src/gantt-js/src/index.js`
<!-- <<< SR: Global minimum view interval ------------------------------------------ -->

<!-- >>> SR: Today button left scroll padding ------------------------------------------ -->
## Left scroll padding for the Today button

View modes can optionally define `today_button_left_scroll_padding`. The value uses the same type as `padding` in view modes, for example `'3d'`, `'1m'`, or an array with left/right values.

Example:

```js
{
  name: 'Day',
  padding: '7d',
  today_button_left_scroll_padding: '3d',
  step: '1d',
}
```

When the Today button is used and today's date lies within the rendered Gantt time range, the Gantt no longer scrolls directly to today, but to:

```text
today - today_button_left_scroll_padding
```

This means the today line is not placed directly at the far-left edge, but is shifted to the right by the configured padding value. If there is not enough rendered area on the left, the scroll target is clamped to `gantt_start`.

For view modes generated via `buildViewModesFromSimpleConfig()`, `today_button_left_scroll_padding` is copied from the simple view configuration.

Affected files:

- `src/gantt-js/src/defaults.js`
- `src/gantt-js/src/index.js`
- `src/gantt-js/tools/view-mode-builder.js`
<!-- <<< SR: Today button left scroll padding ------------------------------------------ -->

<!-- >>> SR: Respect configured initial view mode ------------------------------------------ -->
## Initial view with custom `view_modes`

When custom `view_modes` are passed in, an explicitly set `view_mode` is now respected.

Example:

```
view_modes: customViewModes,
view_mode: 'Quarters',
```

In this case, the Gantt starts with the `Quarters` view if it exists in `view_modes`. If no valid `view_mode` is set, the first view from `view_modes` is still used as the fallback.

Affected files:

- `src/gantt-js/src/index.js`
<!-- <<< SR: Respect configured initial view mode ------------------------------------------ -->

## Tabular aggregation popup list

The popup for aggregation blocks can be displayed either as a classic list or as a compact table structure using `popup_aggregate_style`.

Options:

```js
popup_aggregate_style: 'list'  // 'list' | 'table'
```

CSS classes:

- `agg-list`: old UL/LI list variant
- `agg-table`: new table variant

The list variant keeps the old appearance with `ul`, `li`, a color field on the left, and a compact text line. The table variant uses separate columns for color, start, separator, end, title, and duration.

Structure per entry:

```text
Color | Start | - | End | Title | Duration
```

The start date, separator, and end date are placed in separate columns. This keeps incomplete intervals correctly aligned as well. Start and end dates are emphasized in bold.

If an aggregation block additionally shows overlapping visible tasks from the upper row (`upperRowTasks`), these are rendered together with the member tasks in one shared table. This makes upper and lower entries use the same columns.

A visible, narrow separator line is placed below each individual entry. Between `upperRowTasks` and `members`, a clearly thicker separator line is placed directly on the first member row without an additional empty row.

Affected files:

- `src/gantt-js/src/popup.js`
- `src/gantt-js/src/styles/riel-gantt-gantt.css`

<!-- >>> SR: Aggregation popup Gantt ------------------------------------------ -->
## Popup Gantt for aggregation blocks

Using `popup_aggregate_expand_tasks`, the aggregation popup can be extended with its own small Gantt to the right of the existing list/table.

Options:

- `popup_aggregate_expand_tasks: false`
- `popup_aggregate_gantt_width: 360`

Behavior:

- If `popup_aggregate_expand_tasks: true` is set, a new Gantt is initialized with `new Gantt(...)` to the right of the aggregation list.
- The popup Gantt uses the same view as the main Gantt.
- The width of the popup Gantt is controlled in pixels via `popup_aggregate_gantt_width`.
- All tasks visible in the left popup are copied for the popup Gantt.
- Each copied task receives its own `lineIndex`, so each popup row on the right shows exactly one task bar.
- Dragging, progress changes, popups, and recursive popup Gantts are disabled inside the popup Gantt.

Affected files:

- `src/gantt-js/src/defaults.js`
- `src/gantt-js/src/index.js`
- `src/gantt-js/src/popup.js`
- `src/gantt-js/src/styles/riel-gantt-gantt.css`
<!-- <<< SR: Aggregation popup Gantt ------------------------------------------ -->

<!-- >>> SR: Priority aggregation top lane ------------------------------------------ -->
## Prioritized upper row for aggregation blocks

Tasks can optionally receive the `priority` attribute. During aggregation block calculation, this attribute is considered when selecting the upper row (`topLane`).

Behavior:

- If no task in a row has a numeric `priority`, the previous sorting remains unchanged.
- If tasks have a numeric `priority`, tasks with a higher `priority` are preferred for display in the upper row.
- Lower-priority tasks that overlap in time with a higher-priority task are moved to the lower aggregation/member lane.
- When priority logic is active, tasks without `priority` are sorted after tasks with a set `priority` and keep the previous end/start/ID sorting among themselves.

Example:

```js
const tasks = [
  { id: 'A', name: 'Important', start: '2026-06-01', end: '2026-06-05', priority: 10, lineIndex: 0 },
  { id: 'B', name: 'Normal', start: '2026-06-02', end: '2026-06-04', lineIndex: 0 },
];
```

Because of its higher priority, `A` remains visibly displayed in the upper row. `B` is aggregated below when there is a time overlap.

Affected files:

- `src/gantt-js/src/index.js`
<!-- <<< SR: Priority aggregation top lane ------------------------------------------ -->


<!-- >>> SR: Configurable date formatter ------------------------------------------ -->
## Configurable date formatter

An external date formatter can be configured for all calls to `date_utils.format()` using the options `date_formatter` and `date_format_default`.

The configuration is optimized for a fixed type:

- `date_formatter`: `null` or a function
- `date_format_default`: string with the fallback format

The formatter is prepared once during setup. `date_utils.format()` no longer resolves a formatter path and no longer checks the formatter type in the hot path.

Default behavior:

```
date_formatter: null,
date_format_default: 'YYYY-MM-DD HH:mm:ss.SSS',
```

If `date_formatter` is `null`, `date_utils.format()` uses the built-in `default_formatter()`.

External formatter:

```
date_formatter: window.exfTools.date.format,
date_format_default: 'yyyy-MM-dd HH:mm:ss.SSS',
```

If the external formatter requires an object context, it must be passed in already bound:

```
date_formatter: window.exfTools.date.format.bind(window.exfTools.date),
date_format_default: 'yyyy-MM-dd HH:mm:ss.SSS',
```

`date_format_default` is used as the fallback format when `date_utils.format(date)` is called without a specific format. If a concrete format is passed, for example `date_utils.format(date, 'dd.MM.yy', lang)`, that format is forwarded to the configured formatter.

Affected files:

- `src/gantt-js/src/date_utils.js`
- `src/gantt-js/src/index.js`
<!-- <<< SR: Configurable date formatter ------------------------------------------ -->

<!-- >>> SR: Manueller dist-Build ------------------------------------------ -->
## Manual `gantt-js` dist build via GitHub Action

The GitHub Action `Build dist` manually builds the customized Riel Gantt version in the `src/gantt-js` repository via `workflow_dispatch`.

The action performs the following steps in the `src/gantt-js` repository:

1. Install dependencies with `npm install`
2. Run the build with `npm run build`
3. Commit changed files under `dist` and push them to the selected workflow branch

For the push to work, the workflow sets `permissions: contents: write`. In addition, the `Read and write permissions` option must be enabled in the GitHub repository under `Settings -> Actions -> General -> Workflow permissions`. For protected branches, branch protection must allow pushes by GitHub Actions, or the build must be run on an unprotected feature branch.

Affected files:

- `src/gantt-js/.github/workflows/build-dist.yml`
<!-- <<< SR: Manueller dist-Build ------------------------------------------ -->

<!-- >>> SR: NPM Release Workflow ------------------------------------------ -->
## Manual `gantt-js` NPM release via GitHub Action

The GitHub Action `Publish npm package` prepares the customized Riel Gantt version for publication to NPM.

The action is started manually via `workflow_dispatch` and performs the following steps:

1. Check out the repository
2. Set up Node.js 20
3. Install npm CLI 11 so npm Trusted Publishing via OIDC is supported
4. Optionally increase the package version with `npm version --no-git-tag-version` if `publish = true` is selected when starting the workflow manually
5. Install dependencies with `npm install` and synchronize the lockfile on the Linux runner
6. Run the build with `npm run build`
7. Show the package contents with `npm pack --dry-run`
8. Create a `.tgz` NPM package and upload it as a GitHub Actions artifact
9. Optionally create the version commit and Git tag if `publish = true` is selected when starting the workflow manually
10. Optionally publish to NPM if `publish = true` is selected when starting the workflow manually
11. Push the version commit and Git tag to the selected workflow branch
12. Create a GitHub release for the new version tag and attach the generated `.tgz` package as a release asset

The NPM package contents are limited via `files` in `src/gantt-js/package.json`. Included are:

- `dist`
- `src/styles`, including `riel-gantt-gantt.css`
- `tools/view-mode-builder.js`
- `README.md`
- `license.txt`

When starting the workflow manually, `version_bump` can be used to select whether a `patch`, `minor`, or `major` version bump should be performed before publishing. The version bump only runs for real publications with `publish = true`; pure pack/artifact runs do not change the version. The workflow uses `npm install` instead of `npm ci` so npm can synchronize platform-specific optional dependencies, for example from Vite, Rollup, and esbuild, in `package-lock.json` on the Linux runner before creating the version commit.

For a real publication, npm Trusted Publishing is used. For this, the package on npmjs.com must be linked under `Trusted Publisher` with the GitHub repository and the `publish-npm.yml` workflow. The workflow authenticates `npm publish` through GitHub Actions OIDC with `permissions: id-token: write`; a permanent `NPM_TOKEN` secret is no longer required for publishing. Trusted Publishing requires npm CLI 11.5.1 or newer, so the workflow installs npm 11 before publishing. To write back the version commit, tag and GitHub release, the workflow also uses `permissions: contents: write`. Publications with `npm_tag: latest` are created as normal GitHub releases; other npm tags such as `next` or `beta` are marked as prereleases.

Affected files:

- `src/gantt-js/package.json`
- `src/gantt-js/.github/workflows/publish-npm.yml`
<!-- <<< SR: NPM Release Workflow ------------------------------------------ -->

<!-- >>> SR: Today missing callback ------------------------------------------ -->
## Callback when today is outside the Gantt interval

The `on_today_missing` option can be used to register a function that is called on every `scroll_current()` call when today's date is not part of the currently rendered Gantt interval.

Example:

```js
new Gantt('#gantt', tasks, {
  on_today_missing(today, gantt_start, gantt_end) {
    console.log('Today is outside the Gantt interval', {
      today,
      gantt_start,
      gantt_end,
    });
  },
});
```

The callback is no longer limited to direct clicks on the `Today` button. Internal or automatic calls that run through `scroll_current()`, for example `set_scroll_position('today')`, also trigger `on_today_missing` when today is outside the rendered interval.

Signature:

```js
on_today_missing(today, gantt_start, gantt_end)
```

Affected files:

- `src/gantt-js/src/defaults.js`
- `src/gantt-js/src/index.js`
<!-- <<< SR: Today missing callback ------------------------------------------ -->

<!-- >>> SR: Bundled moment dependency ------------------------------------------ -->
## Moment bundled as a package dependency

`date_utils.add()` now imports `moment` directly from the package dependency. Applications that use `riel-gantt` therefore no longer need to import `moment` themselves or provide it as `window.moment`.

Affected files:

- `src/gantt-js/src/date_utils.js`
<!-- <<< SR: Bundled moment dependency ------------------------------------------ -->
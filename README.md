<div align="center" markdown="1">
    <h1>Riel Gantt</h1>

**A modern, configurable Gantt chart library with aggregation support for overlapping tasks.**

</div>

![Aggregations Image](assets/riel-gantt-image.png)

`riel-gantt` is a fork of [Frappe Gantt](https://github.com/frappe/gantt). It keeps the familiar Frappe Gantt API and adds support for multiple tasks in the same logical row, aggregation bars for overlaps, configurable lanes, enhanced popups, custom date formatting and more simplified view configuration.

## Key Features

-   **Multiple tasks per row**: group tasks by `lineIndex` and render overlapping tasks in lanes.
-   **Aggregation bars**: when too many tasks overlap in one row, hidden lower-lane tasks are represented by a compact `+N` aggregation bar.
-   **Priority-aware aggregation**: use a task `priority` to keep important tasks visible in the upper lane.
-   **Aggregation popups**: show aggregate members as a list or table, optionally with a compact Gantt preview.
-   **Viewport-safe popups**: task and aggregation popups can overlay the Gantt header and scrollbar without being clipped by the chart container.
-   **Independent SVG resources**: multiple charts, including nested popup charts, can display the same task IDs without clipping each other's labels, thumbnails, aggregation legends or hatch patterns.
-   **Custom date formatter**: plug in your application date formatter globally.
-   **View build helpers**: build custom view modes from simplified configuration objects.
-   **Standard Frappe Gantt features**: custom views, ignored periods, localization, dependencies, read-only modes and progress display.

## Installation

```bash
npm install riel-gantt
```

### ES modules

```js
import Gantt from 'riel-gantt';
import 'riel-gantt/dist/riel-gantt.css';
```

### Browser bundle

```html
<script src="riel-gantt.umd.js"></script>
<link rel="stylesheet" href="riel-gantt.css" />
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/riel-gantt/dist/riel-gantt.umd.js"></script>
<link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/riel-gantt/dist/riel-gantt.css"
/>
```

## Basic Usage

```js
const tasks = [
    {
        id: 'task-1',
        name: 'Visible task',
        start: '2026-01-01',
        end: '2026-01-05',
        progress: 30,
        lineIndex: 0,
        priority: 10,
    },
    {
        id: 'task-2',
        name: 'Overlapping task',
        start: '2026-01-03',
        end: '2026-01-07',
        progress: 10,
        lineIndex: 0,
    },
];

const gantt = new Gantt('#gantt', tasks, {
    view_mode: 'Day',
    row_lanes: 2,
    popup_aggregate_style: 'table',
});
```

Tasks with the same `lineIndex` are rendered in the same logical row. If tasks overlap in time, the chart keeps visible tasks in the upper lane(s) and places lower-lane tasks or aggregation bars below them.

## Multiple Gantt Instances

Each chart automatically receives an internal SVG namespace that remains stable across `refresh()`, view changes, option updates and re-rendering. The allocator is shared per document, including separately loaded copies of the library. No additional option or unique container ID is required.

Resource IDs use internal bar identities rather than task IDs, so IDs such as `a.b` and `ab` cannot collide. Business task IDs, dependency references, events and task lookup behavior are unchanged. `label_overflow: 'clip'` remains supported when the same tasks appear in another chart or a popup.

Bar-owned clipping definitions are removed with the bar during `update_task()`, `refresh()` or rendering; labels that no longer need clipping release their previous clipping definition. Hiding a chart does not release its namespace. Use the existing `clear()` and `destroy()` APIs for cleanup; they do not remove resources from other charts. Newly constructed charts receive a fresh namespace, even when reusing a previous container.

## Task Properties

Riel Gantt supports the standard Frappe Gantt task fields and adds row, priority and styling properties.

| Property | Description                                                                                                                                                           |
| --- |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id` | Unique task id. Required.                                                                                                                                             |
| `name` | Task label. Required.                                                                                                                                                 |
| `start` | Task start date. If omitted, please refer to [Handling Incomplete Dates](#handling-incomplete-dates)                                                                  |
| `end` | Task end date. If omitted and no `duration` is set, `default_duration` is used. Refer to [Handling Incomplete Dates](#handling-incomplete-dates) for more information. |
| `duration` | Duration string such as `'2d'`, `'6h'` or combined values separated by spaces like `'1m 3d'`. Used to calculate `end` when `end` is omitted.                          |
| `progress` | Progress percentage.                                                                                                                                                  |
| `dependencies` | Comma-separated dependency ids or an array of ids.                                                                                                                    |
| `lineIndex` | Groups tasks into the same logical row. Tasks without `lineIndex` fall back to their task index.                                                                      |
| `priority` | Numeric priority used by aggregation logic. Higher values are kept visible first when tasks overlap.                                                                  |
| `columns` | Object with additional values rendered between the dates and duration in normal popups and between the task name and duration in table-style aggregation popups. Values can be strings or styled objects with `text`, `color` and `textcolor`. |
| `draggable` | Set to `false` to prevent dragging or resizing this task.                                                                                                             |
| `readonly` | Set to `true` for a task that should not be edited. (not stable)                                                                                                      |
| `custom_class` | Additional CSS class added to the task bar group.                                                                                                                     |
| `color` | Task bar fill color.                                                                                                                                                  |
| `colorHover` | Task bar hover fill color.                                                                                                                                            |
| `progressColor` | Progress bar fill color.                                                                                                                                              |
| `textColor` | Label text color while the label is inside the bar.                                                                                                                   |

## Configuration

| Option | Default | Description                                                                                                                                                                                                                                      |
| --- | --- |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `arrow_curve` | `5` | Curve radius of dependency arrows.                                                                                                                                                                                                               |
| `auto_move_label` | `false` | Moves long task labels with horizontal scrolling. When enabled, labels are also positioned correctly on the initial render.                                                                                                                      |
| `bar_corner_radius` | `3` | Task bar corner radius in pixels.                                                                                                                                                                                                                |
| `bar_height` | `30` | Height of a single task bar in pixels.                                                                                                                                                                                                           |
| `container_height` | `'auto'` | Container height. Use `'auto'` to fit the rendered rows or a number for pixels.                                                                                                                                                                  |
| `column_width` | `null` | Width of each timeline column. `null` uses the active view mode value.                                                                                                                                                                           |
| `date_format` | `'YYYY-MM-dd HH:mm'` | Default date format used by the chart.                                                                                                                                                                                                           |
| `upper_header_height` | `45` | Height of the upper timeline header in pixels.                                                                                                                                                                                                   |
| `lower_header_height` | `30` | Height of the lower timeline header in pixels.                                                                                                                                                                                                   |
| `snap_at` | `null` | Snap interval used while resizing or dragging. `null` uses the active view mode value.                                                                                                                                                           |
| `infinite_padding` | `false` | Extends the rendered timeline while scrolling. This option is currently not considered stable.                                                                                                                                                   |
| `holidays` | `{ 'var(--g-weekend-highlight-color)': 'weekend' }` | Highlighted holidays. Keys are colors, values are `'weekend'` or date definitions.                                                                                                                                                               |
| `is_weekend` | `(d) => d.getDay() === 0 \|\| d.getDay() === 6` | Function that decides whether a date is a weekend.                                                                                                                                                                                               |
| `ignore` | `[]` | Ignored periods for progress calculation and rendering, for example `'weekend'` or date arrays.                                                                                                                                                  |
| `language` | `'en'` | Localization language code.                                                                                                                                                                                                                      |
| `lines` | `'both'` | Grid lines: `'none'`, `'vertical'`, `'horizontal'` or `'both'`.                                                                                                                                                                                  |
| `move_dependencies` | `true` | Moves dependent tasks automatically when a task is moved.                                                                                                                                                                                        |
| `padding` | `18` | Legacy padding around bars. With aggregation layouts, vertical spacing is mainly controlled by row and lane options.                                                                                                                             |
| `popup` | `(ctx) => ctx.render_default_popup()` | Native renderer for normal task popups; `false` globally disables native popups and external requests. See [Popup Configuration](#popup-configuration). |
| `popup_aggregated` | `(ctx) => ctx.render_default_aggregated_popup()` | Independent renderer for aggregation popups; `false` disables only aggregation popups. |
| `on_popup_request` | `null` | Function exclusively replacing all native task and aggregation popups with application-owned opening requests. Only function, `null`, or `undefined` are allowed. |
| `popup_include_header` | `false` | Shows the `Start | - | End | [task columns] | Duration` header in the default task popup.                                                                                                                                        |
| `popup_on` | `'click'` | `'click'` or `'hover'`. Hover mode enables delayed hover and click requests. Native popups hide on mouseleave and pin on click; external closing and pinning belong to the application. |
| `readonly_progress` | `false` | Disables progress editing.                                                                                                                                                                                                                       |
| `readonly_dates` | `false` | Disables date editing.                                                                                                                                                                                                                           |
| `readonly` | `false` | Disables all editing.                                                                                                                                                                                                                            |
| `scroll_to` | `'today'` | Initial scroll target: `'today'`, `'start'`, `'end'` or a date value.                                                                                                                                                                            |
| `show_expected_progress` | `false` | Shows the expected progress overlay.                                                                                                                                                                                                             |
| `today_button` | `true` | Shows a button that scrolls to today.                                                                                                                                                                                                            |
| `on_today_missing` | `null` | Callback called when `scroll_current()` is triggered but today is outside the rendered interval. Signature: `(today, gantt_start, gantt_end)`.                                                                                                   |
| `view_mode` | `'Day'` | Initial view mode name or view mode object.                                                                                                                                                                                                      |
| `view_mode_select` | `false` | Shows a view mode dropdown.                                                                                                                                                                                                                      |
| `view_modes` | Default Day, Week, Month, Year modes | Available view modes. See [View Mode Configuration](#view-mode-configuration).                                                                                                                                                                   |
| `label_overflow` | `'outside'` | Label behavior when it does not fit inside the bar: `'outside'` or `'clip'`. Use `'clip'` if aggreagtions are used to prevent the label from overlaping with the next task on the same row.                                                      |
| `label_outside_color` | `'#555'` | Label color used when `label_overflow: 'outside'`.                                                                                                                                                                                               |
| `lane_padding` | `4` | Vertical spacing between lanes inside the same row.                                                                                                                                                                                              |
| `row_height` | `null` | Fixed row height. If `null`, it is calculated from `bar_height + padding`.                                                                                                                                                                       |
| `bar_inner_padding` | `6` | Total vertical inner padding within a row for task bars.                                                                                                                                                                                         |
| `row_keys` | `null` | Explicit row order and row list. Useful for rendering empty rows or stable row ordering.                                                                                                                                                         |
| `default_duration` | `2` | Duration in days used for tasks with missing start or end information.                                                                                                                                                                           |
| `start_of_week` | `'monday'` | Week alignment start. Use `'monday'`; `'sunday'` is present but not stable.                                                                                                                                                                      |
| `include_today_in_padding` | `false` | Extends the padded date range so today is included. When today is outside the task range, the end is extended far enough for the Today button target (`today - today_button_left_scroll_padding`) to reach the left viewport edge. Experimental. |
| `window_fill_padding_to_border` | `false` | Extends the padded date range so the rendered timeline fills the visible Gantt window. If disabled, the previous padding behavior is preserved. Experimental.                                                                                    |
| `global_min_view_start` | `null` | Minimum start date included before view padding is applied.                                                                                                                                                                                      |
| `global_min_view_end` | `null` | Minimum end date included before view padding is applied.                                                                                                                                                                                        |
| `stripe_rows` | `false` | Enables classic alternating row background colors.                                                                                                                                                                                               |
| `popup_aggregate_style` | `'list'` | Aggregation popup member layout: `'list'` or `'table'`. The table layout is experimental.                                                                                                                                                        |
| `popup_aggregate_include_header` | `false` | Shows column headers in table-style aggregation popups. Additional task `columns` use their object keys as headers.                                                                                                                             |
| `popup_aggregate_include_upper_row_tasks` | `true` | Includes overlapping visible upper-lane tasks in aggregation popups. Set to `false` to show only aggregate members.                                                                                                                              |
| `date_formatter` | `null` | Optional global formatter function. Signature: `(date, format_string, lang)`.                                                                                                                                                                    |
| `date_format_default` | `'YYYY-MM-DD HH:mm:ss.SSS'` | Fallback format passed to `date_formatter` when no explicit format is supplied.                                                                                                                                                                  |
| `row_lanes` | `2` | Number of vertical lanes per row. The last lane is reserved for lower tasks or aggregation bars. Minimum value is `2`.                                                                                                                           |
| `popup_aggregate_expand_tasks` | `false` | Shows a compact Gantt chart next to the aggregation popup task list. Experimental.                                                                                                                                                               |
| `popup_aggregate_gantt_width` | `360` | Width in pixels for the compact popup Gantt. Used only when `popup_aggregate_expand_tasks` is `true`.                                                                                                                                            |

## Aggregation Behavior

Aggregation is based on `lineIndex` and time overlap:

1. Tasks with the same `lineIndex` are placed in the same logical row.
2. The chart chooses visible upper-lane tasks using interval scheduling.
3. If a row contains numeric `priority` values, higher priority tasks are selected first.
4. Tasks that cannot fit in the upper lanes are moved to the reserved lower lane.
5. If two or more lower-lane tasks overlap, they are replaced by an aggregation bar named `+N`.
6. Clicking the aggregation bar opens a popup with the aggregated members.

Use `row_lanes` in combination with `row_height` to allow more visible upper lanes:

```js
new Gantt('#gantt', tasks, {
    row_lanes: 3, // two visible upper lanes, one lower aggregation lane
    row_height: 52, // enough height for three lanes
});
```

Use `row_keys` to enforce stable row ordering or render rows even when they have no tasks:

```js
new Gantt('#gantt', tasks, {
    row_keys: [1,2,3,4,5],
});
```
This example will display 5 rows, even if some of them have no tasks. Useful for rendering empty rows or when tasks are dynamically added to the chart.

## Handling Incomplete Dates

Tasks may omit `start`, `end` or both. Incomplete tasks are visually marked and rendered using the Gantt option `default_duration`:

```js
new Gantt('#gantt', [
    { id: 'a', name: 'Starts today automatically' },
    { id: 'b', name: 'Known start', start: '2026-01-10' },
    { id: 'c', name: 'Known end', end: '2026-01-20' },
    { id: 'd', name: 'Known end', start: '2026-01-10', duration: '5d' },
], {
    default_duration: 2,
});
```

- If task `duration` is provided and `end` is missing, the end date is calculated from `start + duration`.
    - if the `duration` is missed and `end` is missing, the end date is calculated from `start + default_duration`.
- If `start` is missing and `end` is provided, the start date is calculated from `end - default_duration`. 
- If both `start` and `end` are missing, the task is placed at the current date with a duration of `default_duration`.

## View Mode Configuration

The `view_modes` option defines all available timeline views. It is an array of objects.

| Property | Description |
| --- | --- |
| `name` | View mode name. |
| `padding` | Timeline padding around the task range, for example `'7d'`, `'1m'` or `[left, right]`. |
| `today_button_left_scroll_padding` | Optional left-side offset used when the Today button scrolls. Uses the same duration format as `padding`; if an array is supplied, the left value is used. |
| `step` | Timeline column interval, for example `'1d'`, `'7d'`, `'1m'` or `'1y'`. |
| `date_format` | Date format used by this view mode. |
| `column_width` | Column width for this view mode. |
| `snap_at` | Drag and resize snap interval for this view mode. |
| `lower_text` | Lower header formatter string or function `(currentDate, previousDate, lang)`. |
| `upper_text` | Upper header formatter string or function `(currentDate, previousDate, lang)`. |
| `upper_text_frequency` | Performance hint for how often upper text has a value. |
| `thick_line` | Function that decides whether a timeline line is emphasized. |

Example:

```js
const viewModes = [
    {
        name: 'Day',
        padding: '7d',
        today_button_left_scroll_padding: '3d',
        step: '1d',
        date_format: 'YYYY-MM-dd',
        column_width: 45,
        lower_text: 'dd',
        upper_text: 'MMMM',
    },
];

new Gantt('#gantt', tasks, {
    view_modes: viewModes,
    view_mode: 'Day',
});
```

When custom `view_modes` are supplied, an explicitly configured `view_mode` is respected if it exists in the custom list. Otherwise, the first custom view mode is used.

## Simple View Mode Config

`view_modes` also accepts a simplified configuration object directly. Riel Gantt detects this shape automatically and converts the simplified header and thick line definitions internally.

```js
new Gantt('#gantt', tasks, {
    view_modes: {
        Day: {
            padding: '7d',
            today_button_left_scroll_padding: '3d',
            step: '1d',
            date_format: 'YYYY-MM-dd',
            column_width: 45,
            header: {
                upper: { date_format: 'MMMM', interval: 'Month' },
                lower: { date_format: 'dd', interval: 'Date' },
            },
            thick_line: { interval: 'week', value: 1 },
        },
    },
});
```

Most standard view mode properties from [View Mode Configuration](#view-mode-configuration) can be used unchanged. The simplified config differs only in how view modes are named and how header and thick line helpers are described:

| Property | Description |
| --- | --- |
| `view_modes` object keys | The object key is used as the view mode `name`, for example `Day`, `Week` or `Monat_Prod`. A `name` property inside the view mode can still be used and takes precedence. |
| `header` | Simplified replacement for `upper_text` and `lower_text`. It can define `header.upper` and `header.lower`. If classic `upper_text` or `lower_text` are also set, they take precedence over `header`. |
| `header.upper` | Definition for the upper timeline header. Converted internally to `upper_text`. |
| `header.lower` | Definition for the lower timeline header. Converted internally to `lower_text`. |
| `header.*.date_format` | Format used for normal header cells. If `interval` is not set, this format is used for every cell. |
| `header.*.date_format_at_border` | Optional format used when the configured `interval` boundary changes. If omitted, `date_format` is used. |
| `header.*.interval` | Boundary detector for the header text. Supported values are `Date`, `Day`, `Month`, `Year` and `Decade`. If omitted, no boundary check is applied. |
| `header.*.date_format: '~weekRange'` | Special lower-header token for week views. It renders a range such as `01 Jan - 07`. |
| `header.*.date_format_at_border: '~decade'` | Special token for decade labels, for example `2020`, `2030`. |
| `thick_line` object | Simplified replacement for a `thick_line` function. If a classic `thick_line` function is supplied, it is used unchanged. |
| `thick_line.interval: 'week'` | Emphasizes days where `date.getDay()` equals `thick_line.value`. Example: `value: 1` for Monday. |
| `thick_line.interval: 'month_range_in_days'` | Emphasizes dates where the day of month is between `thick_line.from` and `thick_line.to`. |
| `thick_line.interval: 'year_quarter'` | Emphasizes quarter starts inside the rendered interval, useful for wider steps such as weekly quarter views. |

Supported header helper tokens include `~weekRange` for week ranges and `~decade` for decade labels.

## Popup Configuration

### Hover position

With `popup_on: 'hover'`, normal and aggregate popups open at the latest mouse
viewport position after the existing 200 ms delay. Movements during the delay
update the position without restarting the timer. Once open, the popup does not
follow the pointer or request another opening. Leaving the bar, refreshing a bar
or chart, clearing, and destroying cancel pending hover data.

Native popups and `on_popup_request` receive the same coordinates. External hover
requests contain the latest `mouseenter` or `mousemove` event in `ctx.event` and
its `clientX`/`clientY` in `ctx.x`/`ctx.y`. Click requests still use the click
event; popup disabling and native click pinning are unchanged.

Run `npm run test:popup` in the library directory for controlled-timer browser
regressions against source and distribution, plus existing popup compatibility checks.

<!-- >>> SR: External popup requests ---------------------------------------- -->
### Application-owned popups

Use `on_popup_request(ctx)` to build a popup entirely outside the library. Routing priority is:

1. `popup: false` disables **all** popup opening, including the external hook.
2. A function-valued `on_popup_request` exclusively handles normal and aggregate requests.
3. Otherwise the native `popup` / `popup_aggregated` renderers remain active.

External mode never creates a native `Popup`, `.popup-wrapper`, popup sections, or nested aggregation-popup Gantt. Neither native renderer is invoked. The hook runs once per accepted opening request with the chart as `this`. Its return value is ignored, including `false`, HTML strings, and promises; there is no native fallback or awaiting. Synchronous errors propagate. Invalid explicit non-function values throw `TypeError`, including when `popup: false` is set.

```js

const chart = new Gantt(element, tasks, {
    popup_on: 'hover',
    on_popup_request(ctx) {
        externalPopup.open({
            anchor: ctx.target,
            task: ctx.task,
            relatedTasks: ctx.chart.get_overlapping_upper_row_tasks(ctx.task),
        });
    },
});
```

`externalPopup` is illustrative application code, not a library API or dependency. The application owns accessible markup, focus handling, positioning, closing, asynchronous rendering, and destruction. No external lifecycle/close adapter is provided. Mouseleave, grid/outside clicks, scrolling, `hide_popup()`, `clear()`, `refresh()`, and `destroy()` do not close application-owned UI or invoke this hook. Refresh, clear, and destroy cancel pending delayed requests.

The external context has only these fields (native setters, actions, and mount/cleanup helpers remain exclusive to native renderer contexts):

| Field | Contract |
| --- | --- |
| `task` | Original chart task reference, preserving application-defined fields; may be a synthetic aggregate task. Not cloned. |
| `chart` | This Gantt instance. |
| `target` | Actual task-bar DOM anchor from the event path. Programmatic calls resolve the current task bar once if omitted; `null` if unavailable. |
| `trigger` | `'click'`, `'hover'`, or `'programmatic'`. The existing mouseup opening path reports `'click'`; the separate `on_click` event is unchanged. |
| `event` | Originating `MouseEvent`, or `null` for requests without one. |
| `x`, `y` | Existing library request coordinates, with their existing semantics; not a viewport-coordinate guarantee. Use `event.clientX` / `event.clientY` for pointer client coordinates. |

`show_popup({ task, target, x, y })` defaults to `trigger: 'programmatic'` and `event: null`. An explicitly supplied target is preserved. The chart does not retain dispatched contexts, events, or anchors.

`popup_on: 'hover'` enables **both** hover and click openings. The existing 200 ms hover delay and mouseleave cancellation are retained. External clicks never set the native hover-pin flag; the application decides how hover requests interact with its pinned UI.

`update_options({ on_popup_request: callback })` removes any native popup and cleans up its nested Gantt before entering external mode. Switching back with `on_popup_request: null` or `undefined` creates nothing until the next native opening. `update_options({ popup: false })` removes native state and suppresses every request. Changing callbacks or modes never opens or closes application UI. Nested native popup charts explicitly use `on_popup_request: null` and `popup: false`.

### Popup-independent overlap lookup

`chart.get_overlapping_upper_row_tasks(task)` works before any popup has opened and with `popup: false`. It returns a new ordered array of original visible, non-aggregate task references in the same row and in lanes above the aggregation lane. It excludes IDs in the supplied aggregate's `_members`, compares IDs as strings for exclusion, uses `orig_end` before `_end`, and requires strict temporal overlap (touching endpoints do not overlap). Sorting remains start date then numeric/string ID using the existing comparator.

A normal upper-lane task may include itself. This is **not** a complete aggregate-members query: synthetic `_members` contain partial records, not necessarily all application-defined task fields. Tasks are neither mutated nor cloned. The legacy `Popup.get_overlapping_upper_row_tasks(task)` delegates to this same implementation.

For **all** temporal overlaps, use `chart.get_overlapping_tasks(task)`. It searches original tasks in the same logical row across every lane, including hidden aggregation members. It returns original task references with application-defined fields such as `dataRow`, not partial `_members` records. Synthetic aggregate bars are excluded from the result. A normal task with a nonempty interval includes itself.

This method uses the same strict temporal overlap, `orig_end` before `_end`, and start-date/ID ordering as the upper-lane query. Touching endpoints are not overlaps. It does not exclude aggregate member IDs, mutate tasks, initialize popups, or require popups to be enabled. Missing dates return an empty array. Queries for aggregate bars use the aggregate's time interval; this remains a temporal-overlap query rather than an exact-membership query.

`get_overlapping_upper_row_tasks()` retains its existing narrower behavior. Use it when only visible upper-lane tasks are needed.

### Native content renderers

`popup` renders normal tasks. `popup_aggregated` renders aggregation bars (and tasks carrying aggregation members). Only the matching callback is invoked; custom aggregation content is never followed by an automatically appended member list.

Both defaults can be configured explicitly:

```js
popup: (ctx) => ctx.render_default_popup(),
popup_aggregated: (ctx) => ctx.render_default_aggregated_popup(),
```

The normal template renders the title, description, dates, task columns and duration using the built-in table and existing styles. The aggregation template preserves the list/table layout and optional mini Gantt, including row alignment and cleanup. Existing `popup_include_header` and `popup_aggregate_*` options still configure their respective templates.

`popup: false` is the global disable switch. `popup_aggregated: false` disables only native aggregation popups; it does not suppress external requests. To suppress only native normal popups while retaining aggregation popups, use `popup: () => false`. This restores global-disable priority compared with versions where `popup: false` disabled only normal popups. Aggregation content customizations belong in `popup_aggregated`.

Both callbacks receive the context below and share the same return-value contract. If a callback returns:

-   `false`, no popup is shown.
-   `undefined`, the popup is rendered by mutating the supplied popup context.
-   an HTML string, that string is used as popup content.

The function receives one context object:

```js
new Gantt('#gantt', tasks, {
    popup(ctx) {
        ctx.set_title(ctx.task.name);
        ctx.set_subtitle(ctx.task.description || '');
        ctx.set_details('Custom details');
    },
});
```

Context properties:

| Property | Description |
| --- | --- |
| `task` | Current task or aggregation bar. |
| `chart` | The Gantt instance. |
| `get_title`, `get_subtitle`, `get_details` | Read popup section nodes. |
| `set_title`, `set_subtitle`, `set_details` | Set popup section HTML. |
| `render_default_popup` | Renders the built-in task popup. A custom renderer may call this explicitly before adding its own content. |
| `render_default_aggregated_popup` | Renders the built-in aggregation popup with its configured list/table and optional mini Gantt. Available in both callback contexts. |
| `on_mount(callback)` | Registers a synchronous callback after popup content is attached and measurable, but before final viewport placement. |
| `on_cleanup(callback)` | Registers resource cleanup when the popup closes, is replaced or the chart is destroyed. Each registered callback runs once. |
| `add_action` | Adds an action button. Signature: `(html, callback)`. |


Custom renderers can use `ctx.on_mount(callback)` to initialize embedded components that need container measurements. During mounting the popup participates in layout but remains hidden until final placement. Use `ctx.on_cleanup(callback)` to dispose embedded charts, observers or listeners. Cleanup also runs for callbacks returning `false`; their mount callbacks do not run. Both hooks require a function. Built-in aggregation previews use the same mount phase so row alignment is measured after popup sections are finalized, including removal of empty action sections.


The popup is positioned next to the pointer when possible. It prefers the right side, then the left side. If neither side has enough room, it is placed below the pointer and falls back above the pointer when the lower side would leave too little visible space. Popups use viewport positioning, so short Gantt charts do not clip them at the sticky header or scrollbar. Their final position is limited to the browser viewport; oversized aggregation popups become internally scrollable. Any horizontal or vertical Gantt scroll closes the open popup because its task may have moved away from the fixed viewport position.

The default popup renders the task name as its title and a single table row below it:

```text
Start | - | End | [task columns] | Duration
```

Task `columns` are inserted in their object order. Supplying a custom `popup` function replaces this default renderer and remains authoritative.

Set `popup_include_header: true` to show the matching column header above this row. This option is independent of `popup_aggregate_include_header`.

Normal popups use a minimum content width of 240 px and otherwise grow with their title or detail content instead of filling the browser viewport. If the task title is wider than the detail row, the normal popup table expands to the title width. Start, separator, end and custom columns keep their intrinsic content widths and remain grouped on the left. A dedicated spacer absorbs the remaining space before the right-aligned duration. Aggregation tables are unaffected.

### Aggregation popup options

```js
new Gantt('#gantt', tasks, {
    popup_aggregate_style: 'table',
    popup_aggregate_include_header: true,
    popup_aggregate_include_upper_row_tasks: true,
    popup_aggregate_expand_tasks: true,
    popup_aggregate_gantt_width: 420,
});
```

`popup_aggregate_expand_tasks` creates a nested read-only Gantt inside the popup. The nested chart uses the same view mode as the main chart, disables recursive aggregation popups and renders one task per popup row. The left popup rows are aligned to the rendered rows of the nested Gantt and are re-aligned after popup Gantt view changes. Long task names are truncated with an ellipsis only in the expanded popup Gantt layout to keep row heights aligned; when `popup_aggregate_expand_tasks` is `false`, table task names can wrap normally. When `stripe_rows` is enabled, the left aggregation table uses the same alternating row colors as the Gantt rows.

For `popup_aggregate_style: 'table'`, tasks can provide a `columns` object:

```js
{
    id: '265',
    name: 'Planning procedure',
    columns: {
        status: {
            text: 'Done',
            color: 'green',
            textcolor: 'white',
        },
        type: 'Environment',
    },
}
```

Each object key defines an additional shared table column, and its value is shown between the task name and duration. Column order follows the first occurrence of each key across the displayed tasks. Missing values produce an empty cell so all rows stay aligned.

A column value can remain a string or use `{ text, color, textcolor }`. Styled values are rendered as rounded badges in normal task popups and table-style aggregation popups. `color` sets the badge background and `textcolor` sets its text color; both accept CSS color values.

Only values with a background color receive horizontal badge padding (`3px 7px`). Values without a background, including objects with only `text` or `textcolor`, use `3px 0` so their text starts directly below the column header. Colored badges keep their left background edge aligned with the header.

Set `popup_aggregate_include_header: true` to add the header `Start | - | End | Title | ... | Duration`. The `...` positions use the keys from task `columns`. With `popup_aggregate_expand_tasks: true`, the table header occupies the same vertical header area as the nested Gantt so task rows remain horizontally aligned.

## Date Formatting

By default, the package uses its built-in date formatter. To use an application formatter, pass `date_formatter`:

```js
new Gantt('#gantt', tasks, {
    date_formatter: window.exfTools.date.format.bind(window.exfTools.date),
    date_format_default: 'yyyy-MM-dd HH:mm:ss.SSS',
});
```

The formatter receives `(date, format_string, lang)`. `date_format_default` is used when the chart formats a date without an explicit format.

## Scrolling and Refreshing

Initial scrolling is controlled by `scroll_to`.

```js
new Gantt('#gantt', tasks, {
    scroll_to: 'today',
});
```

`refresh(tasks)` preserves the current horizontal `scrollLeft` by default. This prevents repeated data updates from jumping back to `scroll_to`.

```js
gantt.refresh(tasks);          // keep exact current horizontal scroll position
gantt.refresh(tasks, true);    // apply options.scroll_to
gantt.refresh(tasks, 'today'); // explicitly scroll to today
gantt.refresh(tasks, 'start'); // explicitly scroll to start
gantt.refresh(tasks, date);    // explicitly scroll to a Date
```

Use `on_today_missing` to react when today is outside the rendered interval:

```js
new Gantt('#gantt', tasks, {
    on_today_missing(today, gantt_start, gantt_end) {
        console.log('Today is outside the rendered interval', {
            today,
            gantt_start,
            gantt_end,
        });
    },
});
```

`include_today_in_padding: true` can extend the rendered date range so today is present even when it is outside the task range. If all tasks are in the past, the range end is extended to cover the Today button scroll target plus the visible Gantt viewport width. With `today_button_left_scroll_padding`, this target is `today - today_button_left_scroll_padding`, so pressing **Today** can place today at the configured left offset instead of being blocked by the right timeline edge.

`window_fill_padding_to_border: true` extends the padded range end when the timeline would otherwise be shorter than the visible Gantt viewport. This keeps the timeline filled to the window border without changing the default behavior when the option is `false`.

## API

| Method | Description |
| --- | --- |
| `update_options(new_options)` | Updates options and re-renders the chart. |
| `change_view_mode(view_mode, maintain_pos)` | Changes the current view mode. `view_mode` can be a name or a view mode object. |
| `scroll_current(animate = true, trigger_today_missing = false)` | Scrolls to today if it is inside the rendered interval. |
| `update_task(task_id, new_details)` | Updates and re-renders one task bar. |
| `refresh(tasks, scroll_after_refresh = false)` | Replaces tasks and re-renders the chart. By default it preserves the current horizontal scroll position. |
| `show_popup({ task, target, x, y, trigger, event })` | Requests a popup according to global disable / external / native routing. Missing trigger and event default to `'programmatic'` and `null`. |
| `hide_popup()` | Hides native popup content only; never closes application-owned UI. |
| `get_overlapping_upper_row_tasks(task)` | Returns ordered original same-row upper-lane overlaps without native popup state. Not an aggregate-members query. |
| `get_overlapping_tasks(task)` | Returns all original same-row temporal overlaps across lanes, including hidden aggregation members and self for a nonempty normal task interval; excludes synthetic aggregate bars. |
| `clear()` / `destroy()` | Cancel delayed openings and clear chart DOM / remove chart listeners and container. Application popup lifecycle remains independent. |

## Development Setup

```bash
npm install
npm run build
```

Use `npm run dev` to build in watch mode.

Run `npm run test:svg` for the SVG-resource browser regression suite. It builds the distribution and exercises source code and two independently loaded bundle copies in headless Chrome/Chromium. The runner uses Node.js 22+ and an installed browser; set `CHROME_PATH` if the executable is not at a detected default location. No browser automation package is required. Fixtures cover duplicate and punctuation-distinct task IDs, all SVG resource types, hidden/reopened charts, refresh/view changes, single-bar updates, pending label callbacks and instance-local cleanup.

<br />
<br />
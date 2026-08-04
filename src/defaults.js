import date_utils from './date_utils';

// >>> SR: Bar Aggregation -----------------------------------------------------
/**
 * The date format was changed to ICU, 
 * that´s why all capital "D" and "DD" was changed to lowercase "dd" in this file.
 */
// >>> SR: Bar Aggregation -----------------------------------------------------

function getDecade(d) {
    const year = d.getFullYear();
  // >>> SR: Bar Aggregation ---------------------------------------------------
  return String(year - (year % 10));
  // <<< SR: Bar Aggregation ---------------------------------------------------
  
}

function formatWeek(d, ld, lang) {
    let endOfWeek = date_utils.add(d, 6, 'day');
    let endFormat = endOfWeek.getMonth() !== d.getMonth() ? 'dd MMM' : 'dd';
    let beginFormat = !ld || d.getMonth() !== ld.getMonth() ? 'dd MMM' : 'dd';
    return `${date_utils.format(d, beginFormat, lang)} - ${date_utils.format(endOfWeek, endFormat, lang)}`;
}

const DEFAULT_VIEW_MODES = [
    // >>> SR: Bar Aggregation -------------------------------------------------
    // It currently doesn't work properly with PowerUI
/*    {
        name: 'Hour',
        padding: '7d',
        step: '1h',
        date_format: 'YYYY-MM-dd HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'dd MMMM', lang)
                : '',
        upper_text_frequency: 24,
    },
    {
        name: 'Quarter Day',
        padding: '7d',
        step: '6h',
        date_format: 'YYYY-MM-dd HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'dd MMM', lang)
                : '',
        upper_text_frequency: 4,
    },
    {
        name: 'Half Day',
        padding: '14d',
        step: '12h',
        date_format: 'YYYY-MM-dd HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? d.getMonth() !== d.getMonth()
                    ? date_utils.format(d, 'dd MMM', lang)
                    : date_utils.format(d, 'dd', lang)
                : '',
        upper_text_frequency: 2,
    },*/
    // <<< SR: Bar Aggregation -------------------------------------------------
    {
        name: 'Day',
        padding: '7d',
        // >>> SR: Today button left scroll padding --------------------------
        today_button_left_scroll_padding: null,
        // <<< SR: Today button left scroll padding --------------------------
        date_format: 'YYYY-MM-dd',
        step: '1d',
        lower_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'dd', lang)
                : '',
        upper_text: (d, ld, lang) =>
            !ld || d.getMonth() !== ld.getMonth()
                ? date_utils.format(d, 'MMMM', lang)
                : '',
        thick_line: (d) => d.getDay() === 1,
    },
    {
        name: 'Week',
        padding: '1m',
        // >>> SR: Today button left scroll padding --------------------------
        today_button_left_scroll_padding: null,
        // <<< SR: Today button left scroll padding --------------------------
        step: '7d',
        date_format: 'YYYY-MM-dd',
        column_width: 140,
        lower_text: formatWeek,
        upper_text: (d, ld, lang) =>
            !ld || d.getMonth() !== ld.getMonth()
                ? date_utils.format(d, 'MMMM', lang)
                : '',
        thick_line: (d) => d.getDate() >= 1 && d.getDate() <= 7,
        upper_text_frequency: 4,
    },
    {
        name: 'Month',
        padding: '2m',
        // >>> SR: Today button left scroll padding --------------------------
        today_button_left_scroll_padding: null,
        // <<< SR: Today button left scroll padding --------------------------
        step: '1m',
        column_width: 120,
        date_format: 'YYYY-MM',
        lower_text: 'MMMM',
        upper_text: (d, ld, lang) =>
            !ld || d.getFullYear() !== ld.getFullYear()
                ? date_utils.format(d, 'YYYY', lang)
                : '',
        thick_line: (d) => d.getMonth() % 3 === 0,
        snap_at: '7d',
    },
    {
        name: 'Year',
        padding: '2y',
        // >>> SR: Today button left scroll padding --------------------------
        today_button_left_scroll_padding: null,
        // <<< SR: Today button left scroll padding --------------------------
        step: '1y',
        column_width: 120,
        date_format: 'YYYY',
        upper_text: (d, ld, lang) =>
            !ld || getDecade(d) !== getDecade(ld) ? getDecade(d) : '',
        lower_text: 'YYYY',
        snap_at: '30d',
    },
];

const DEFAULT_OPTIONS = { //TODO SR Info: This is the old "default_options"
    arrow_curve: 5,
    auto_move_label: false,
    bar_corner_radius: 3,
    bar_height: 30, //TODO SR Info: The height of the individual bars
    container_height: 'auto',
    column_width: null,
    date_format: 'YYYY-MM-dd HH:mm',
    upper_header_height: 45, //TODO SR: There is no longer a ‘header_height’. Now it is "upper + lower + 10px"
    lower_header_height: 30,
    snap_at: null,
    infinite_padding: false, //TODO SR: At Wheel scroll it automatically expands the Gantt borders, regards of if we scroll in the middle or at the border.
    holidays: { 'var(--g-weekend-highlight-color)': 'weekend' },
    ignore: [],
    language: 'en',
    lines: 'both',
    move_dependencies: true,
    //TODO SR INFO: The padding here is the padding from the bar to the top and bottom edges of the line. 
    // With the new overlap logic, the padding no longer works. The logic from "Changed" version is still faulty and needs to be revised.
    padding: 18,
    popup: (ctx) => {
        ctx.set_title(ctx.task.name);
        if (ctx.task.description) ctx.set_subtitle(ctx.task.description);
        else ctx.set_subtitle('');

        const start_date = date_utils.format(
            ctx.task._start,
            'MMM dd',
            ctx.chart.options.language,
        );
        const end_date = date_utils.format(
            //date_utils.add(ctx.task._end, -1, 'second'),
            date_utils.add(ctx.task.orig_end, -1, 'second'),
            'MMM dd',
            ctx.chart.options.language,
        );

        // >>> SR: Bar Aggregation ---------------------------------------------
        // special treatment for tasks without start or end-date and duration
        const hasRealStart = !!(ctx.task.start);
        const hasRealEnd = (!!(ctx.task.end) || ctx.task.duration !== undefined);

        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            ctx.set_details(
                `${start_date} - ${end_date} (${ctx.task.actual_duration} days${ctx.task.ignored_duration ? ' + ' + ctx.task.ignored_duration + ' excluded' : ''})<br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`,
            );
          } else if (hasRealStart && !hasRealEnd) {
            ctx.set_details(
                `${start_date} - ... <br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`,
            );
          } else if (hasRealEnd && !hasRealStart) {
            ctx.set_details(
                `... - ${end_date} <br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`,
            );
          }
        }

/*        ctx.set_details(
            `${start_date} - ${end_date} (${ctx.task.actual_duration} days${ctx.task.ignored_duration ? ' + ' + ctx.task.ignored_duration + ' excluded' : ''})<br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`,
        );*/
      // <<< SR: Bar Aggregation -----------------------------------------------
    },
    popup_on: 'click', //hover
    readonly_progress: false,
    readonly_dates: false,
    readonly: false,
    scroll_to: 'today',
    show_expected_progress: false,
    today_button: true,
    // >>> SR: Today missing callback -----------------------------------------
    on_today_missing: null, // function(today, gantt_start, gantt_end)
    // <<< SR: Today missing callback -----------------------------------------
    view_mode: 'Day',
    view_mode_select: false,
    view_modes: DEFAULT_VIEW_MODES,
    is_weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
    // >>> SR: Bar Aggregation -------------------------------------------------
    label_overflow: 'outside', // 'outside' | 'clip' //TODO SR: The “hide” option has been removed for now.
    label_outside_color: '#555',
    keep_scroll_position: false, //TODO SR: Take a look at the new ‘maintain_pos’ in Bar. Maybe this is unnecessary here.
    lane_padding: 4, // vertical distance between lanes in the same row
    row_height: null, //is calculated automatically, if set to null. //TODO SR: Check whether this should also depend on the view_mode.
    bar_inner_padding: 6, // Total vertical padding within the row for each task
    row_keys: null, // For empty lines
    default_duration: 2, // Default duration in days for tasks without start / end date and duration
    start_of_week: 'monday', // 'monday' | 'sunday'
    include_today_in_padding: false, // Set to true to extend the padded date range until today is included.
    // >>> SR: Global minimum view interval ------------------------------------
    global_min_view_start: null, // Minimum date that should be included before view padding is applied.
    global_min_view_end: null, // Maximum date that should be included before view padding is applied.
    // <<< SR: Global minimum view interval ------------------------------------
    stripe_rows: false, // Set to false to disable alternating row background colors.
    popup_aggregate_style: 'list', // 'list' | 'table'
    popup_aggregate_include_upper_row_tasks: true, // Includes tasks that are in the top lane of the row in the aggregate popup. Set to false to only include tasks inside the aggregation block.
    date_formatter: null, // null | function(date, format_string, lang)
    date_format_default: 'YYYY-MM-DD HH:mm:ss.SSS', // fallback format for date_utils.format(date)
    row_lanes: 2, // Number of vertical lanes per row. The lowest lane is used for single lower tasks or aggregate bars.
    // >>> SR: Aggregation popup Gantt ----------------------------------------
    popup_aggregate_expand_tasks: false, // Shows a compact Gantt next to the aggregation popup task list.
    popup_aggregate_gantt_width: 360, // Width in px for the Gantt shown inside aggregation popups.
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    // <<< SR: Bar Aggregation -------------------------------------------------
};

export { DEFAULT_OPTIONS, DEFAULT_VIEW_MODES };
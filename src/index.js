import date_utils from './date_utils';
import { $, createSVG } from './svg_utils';

import Arrow from './arrow';
import Bar from './bar';
import Popup from './popup';

import { DEFAULT_OPTIONS, DEFAULT_VIEW_MODES } from './defaults';

import './styles/gantt.css';

export default class Gantt {
    constructor(wrapper, tasks, options) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        this.change_view_mode();
        this.bind_events();
        this.date_utils = date_utils; // expose date_utils for external usage
    }

    setup_wrapper(element) {
        let svg_element, wrapper_element;

        // CSS Selector is passed
        if (typeof element === 'string') {
            let el = document.querySelector(element);
            if (!el) {
                throw new ReferenceError(
                    `CSS selector "${element}" could not be found in DOM`,
                );
            }
            element = el;
        }

        // get the SVGElement
        if (element instanceof HTMLElement) {
            wrapper_element = element;
            svg_element = element.querySelector('svg');
        } else if (element instanceof SVGElement) {
            svg_element = element;
        } else {
            throw new TypeError(
                'Frappe Gantt only supports usage of a string CSS selector,' +
                    " HTML DOM element or SVG DOM element for the 'element' parameter",
            );
        }

        // svg element
        if (!svg_element) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapper_element,
                class: 'gantt',
            });
        } else {
            this.$svg = svg_element;
            this.$svg.classList.add('gantt');
        }

        // wrapper element
        this.$container = this.create_el({
            classes: 'gantt-container',
            append_to: this.$svg.parentElement,
        });

        this.$container.appendChild(this.$svg);
        this.$popup_wrapper = this.create_el({
            classes: 'popup-wrapper',
            append_to: this.$container,
        });

        // >>> SR: Bar Aggregation ---------------------------------------------
        // >>> SR: Refresh without scroll animation -----------------------------
        this._suppress_scroll_strategy = false;
        // <<< SR: Refresh without scroll animation -----------------------------
        //TODO SR: Why is the infinite padding is set to false here?
      
        // >>> SR: Date calculation Fix ----------------------------------------
        this._extending_infinite_padding = false;
        // <<< SR: Date calculation Fix ----------------------------------------
        // <<< SR: Bar Aggregation ---------------------------------------------
    }

    setup_options(options) {
        this.original_options = options;
        if (options?.view_modes) {
            // >>> SR: Respect configured initial view mode --------------------
            const requested_view_mode = options.view_mode;
            // <<< SR: Respect configured initial view mode --------------------
            options.view_modes = options.view_modes.map((mode) => {
                if (typeof mode === 'string') {
                    const predefined_mode = DEFAULT_VIEW_MODES.find(
                        (d) => d.name === mode,
                    );
                    if (!predefined_mode)
                        console.error(
                            `The view mode "${mode}" is not predefined in Frappe Gantt. Please define the view mode object instead.`,
                        );

                    return predefined_mode;
                }
                return mode;
            });
            // >>> SR: Respect configured initial view mode --------------------
            // Keep an explicitly configured view_mode (for example 'Quartale')
            // instead of always forcing the first view_modes entry. If no valid
            // view_mode is configured, fall back to the first available view.
            const resolved_view_mode =
                typeof requested_view_mode === 'string'
                    ? options.view_modes.find(
                          (mode) => mode?.name === requested_view_mode,
                      )
                    : requested_view_mode;

            options.view_mode = resolved_view_mode || options.view_modes[0];
            // <<< SR: Respect configured initial view mode --------------------
        }
        this.options = { ...DEFAULT_OPTIONS, ...options };

        // >>> SR: Configurable date formatter --------------------------------
        date_utils.set_date_formatter(
            this.options.date_formatter,
            this.options.date_format_default,
        );
        // <<< SR: Configurable date formatter --------------------------------

        // >>> SR: Bar Aggregation ---------------------------------------------
        if (this.options.row_height == null) {
          //TODO SR: The calculation here is incorrect (Must bar_inner_padding and lane_padding be taken into account?).
          this.options.row_height = this.options.bar_height + this.options.padding;
        }
  
        if (this.options.bar_inner_padding == null) {
          this.options.bar_inner_padding = 6;
        }

        // >>> SR: Configurable row lanes -------------------------------------
        // At least two lanes are needed: visible upper lane(s) plus the bottom
        // lane that contains either a single overlapping task or an aggregate.
        this.options.row_lanes = Math.max(
            2,
            Math.floor(Number(this.options.row_lanes) || 2),
        );
        // <<< SR: Configurable row lanes -------------------------------------
        // <<< SR: Bar Aggregation ---------------------------------------------
      
        const CSS_VARIABLES = {
            'grid-height': 'container_height',
            'bar-height': 'bar_height',
            'lower-header-height': 'lower_header_height',
            'upper-header-height': 'upper_header_height',
        };
        for (let name in CSS_VARIABLES) {
            let setting = this.options[CSS_VARIABLES[name]];
            if (setting !== 'auto')
                this.$container.style.setProperty(
                    '--gv-' + name,
                    setting + 'px',
                );
        }

        this.config = {
            ignored_dates: [],
            ignored_positions: [],
            extend_by_units: 10,
        };

        if (typeof this.options.ignore !== 'function') {
            if (typeof this.options.ignore === 'string')
                this.options.ignore = [this.options.ignore];
            for (let option of this.options.ignore) {
                if (typeof option === 'function') {
                    this.config.ignored_function = option;
                    continue;
                }
                if (typeof option === 'string') {
                    if (option === 'weekend')
                        this.config.ignored_function = (d) =>
                            d.getDay() == 6 || d.getDay() == 0;
                    else this.config.ignored_dates.push(new Date(option + ' '));
                }
            }
        } else {
            this.config.ignored_function = this.options.ignore;
        }
    }

    update_options(options) {
        this.setup_options({ ...this.original_options, ...options });
        this.change_view_mode(undefined, true);
    }

    setup_tasks(tasks) {
        this.tasks = tasks
            .map((task, i) => {
              // >>> SR: New missing start / end date treatment  ---------------
                /*if (!task.start) {
                    console.error(
                        `task "${task.id}" doesn't have a start date`,
                    );
                    return false;
                }*/
              
                if (task.start !== undefined) {
                  task._start = date_utils.parse(task.start);
                  if (task.end === undefined && task.duration !== undefined) {
                    task.end = task._start;
                    let durations = task.duration.split(' ');

                    durations.forEach((tmpDuration) => {
                      let { duration, scale } =
                          date_utils.parse_duration(tmpDuration);
                      task.end = date_utils.add(task.end, duration, scale);
                    });

                    if (!task.end) {
                      console.error(`task "${task.id}" doesn't have an end date`);
                      return false;
                    }
                    task._end = date_utils.parse(task.end);
                  }
                }
                
                if (task.start && task.end) {
                  task._start = date_utils.parse(task.start);
                  task._end = date_utils.parse(task.end);
                }

                // invalid dates
                if (!task.start && !task.end) {
                  const today = date_utils.today();
                  task._start = today;
                  task._end = date_utils.add(today, (this.options.default_duration - 1), 'day');
                }
  
                if (!task.start && task.end) {
                  task._end = date_utils.parse(task.end);
                  task._start = date_utils.add(task._end, - (this.options.default_duration - 1), 'day'); // -1
                }
  
                if (task.start && !task.end && task.duration === undefined) {
                  task._start = date_utils.parse(task.start);
                  task._end = date_utils.add(task._start, (this.options.default_duration - 1), 'day'); // 1
                }
                
                if (!task.start || !task.end) {
                  task.dateIncomplete = true;
                }
                // <<< SR: New missing start / end date treatment  -------------

                let diff = date_utils.diff(task._end, task._start, 'year');
                if (diff < 0) {
                    console.error(
                        `start of task can't be after end of task: in task "${task.id}"`,
                    );
                    return false;
                }

                // make task invalid if duration too large
                if (date_utils.diff(task._end, task._start, 'year') > 10) {
                    console.error(
                        `the duration of task "${task.id}" is too long (above ten years)`,
                    );
                    return false;
                }

                // cache index
                task._index = i;
                
                // >>> SR: Bar Aggregation -------------------------------------
              
                // if hours is not set, assume the last day is full day
                // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
                const task_end_values = date_utils.get_date_values(task._end);
                
                //TODO SR: This only works if you return the following under date_utils.parse(): "return new Date(...vals);
                if (task_end_values.slice(3).every((d) => d === 0)) {
                    task._end = date_utils.add(task._end, 24, 'hour');
                }

              //TODO SR: This lower logic did not work. Find out why.
              // TODO SR: The piece of code fixes the problem when a date is specified without hours, NOT!
/*              if ( this.options.step >= 24 && (this.options.step % 24) === 0) { //TODO SR: Check, why here is a ">=" in the condition.
                task._end = date_utils.add(task._end, 24, 'hour');
              }*/
              // <<< SR: Bar Aggregation ---------------------------------------

                // dependencies
                if (
                    typeof task.dependencies === 'string' ||
                    !task.dependencies
                ) {
                    let deps = [];
                    if (task.dependencies) {
                        deps = task.dependencies
                            .split(',')
                            .map((d) => d.trim().replaceAll(' ', '_'))
                            .filter((d) => d);
                    }
                    task.dependencies = deps;
                }

                // uids
                if (!task.id) {
                    task.id = generate_id(task);
                } else if (typeof task.id === 'string') {
                    task.id = task.id.replaceAll(' ', '_');
                } else {
                    task.id = `${task.id}`;
                }

                return task;
            })
            .filter((t) => t);
        this.setup_dependencies();
        // >>> SR: Bar Aggregation ---------------------------------------------
        this.compute_rows_and_lanes();
        this.compute_overlap_aggregates();
        this.relayout_visible_rows();
        // <<< SR: Bar Aggregation ---------------------------------------------
    }

    setup_dependencies() {
        this.dependency_map = {};
        for (let t of this.tasks) {
            for (let d of t.dependencies) {
                this.dependency_map[d] = this.dependency_map[d] || [];
                this.dependency_map[d].push(t.id);
            }
        }
    }

    // >>> SR: Refresh scroll control -----------------------------------------
    /**
     * Refreshes the Gantt tasks. By default, the current horizontal scroll
     * position is preserved so repeated data refreshes do not jump back to
     * `scroll_to` (for example `today`).
     *
     * @param tasks
     * @param scroll_after_refresh false keeps the exact current pixel position;
     * true applies options.scroll_to; a string or Date is used as explicit
     * scroll target.
     */
    refresh(tasks, scroll_after_refresh = false) {
        this.setup_tasks(tasks);

        if (scroll_after_refresh === false || scroll_after_refresh == null) {
            this.change_view_mode(undefined, true, true);
            return;
        }

        const original_scroll_to = this.options.scroll_to;
        if (scroll_after_refresh !== true) {
            this.options.scroll_to = scroll_after_refresh;
        }

        this.change_view_mode(undefined, false);
        this.options.scroll_to = original_scroll_to;
    }
    // <<< SR: Refresh scroll control -----------------------------------------

    // >>> SR: Date calculation after change fix -------------------------------
    refresh_overlap_aggregates_after_drop() {
        const scroll_left = this.$container.scrollLeft;
        const scroll_top = this.$container.scrollTop;

        this.compute_rows_and_lanes();
        this.compute_overlap_aggregates();
        this.relayout_visible_rows();
        this.render();

        this.$container.scrollLeft = scroll_left;
        this.$container.scrollTop = scroll_top;
    }
    // <<< SR: Date calculation after change fix -------------------------------

    update_task(id, new_details) {
        let task = this.tasks.find((t) => t.id === id);
        let bar = this.bars[task._index];
        Object.assign(task, new_details);
        bar.refresh();
    }

    change_view_mode(
        mode = this.options.view_mode,
        maintain_pos = false,
        maintain_exact_scroll_left = false,
    ) {
        if (typeof mode === 'string') {
            mode = this.options.view_modes.find((d) => d.name === mode);
        }
        let old_pos, old_scroll_op, anchor_date;
        if (maintain_pos) {
            old_pos = this.$container.scrollLeft;
            old_scroll_op = this.options.scroll_to;
            this.options.scroll_to = null;

          // >>> SR: Date calculation Fix -------------------------------------------
            if (!maintain_exact_scroll_left) {
                anchor_date = this.get_date_by_position
                    ? this.get_date_by_position(old_pos)
                    : date_utils.add(
                        this.gantt_start,
                        (old_pos / this.config.column_width) * this.config.step,
                        this.config.unit,
                    );
            }
          // <<< SR: Date calculation Fix -------------------------------------------
        }
        this.options.view_mode = mode.name;
        this.config.view_mode = mode;
        this.update_view_scale(mode);
        // >>> SR: Date calculation Fix ---------------------------------------------
        // Always recompute date boundaries for the selected view.
        // Scroll position is preserved separately below when maintain_pos is true.
        this.setup_dates(false);
        // <<< SR: Date calculation Fix ---------------------------------------------
        // >>> SR: Refresh without scroll animation -----------------------------
        // When the current position is maintained, render must not start the
        // normal scroll strategy first. Otherwise refresh() briefly scrolls to
        // the configured target/start and then animates back to the old position.
        this._suppress_scroll_strategy = maintain_pos;
        try {
            this.render();
        } finally {
            this._suppress_scroll_strategy = false;
        }
        // <<< SR: Refresh without scroll animation -----------------------------
        if (maintain_pos) {
          // >>> SR: Date calculation Fix -------------------------------------------
            // >>> SR: Refresh exact scroll position --------------------------------
            if (maintain_exact_scroll_left) {
                // refresh(tasks) is called very often while an external SAP table
                // scrolls. Keep the exact browser scrollLeft value instead of
                // converting pixels -> date -> pixels, because that conversion uses
                // the normal scroll offset and can drift a few pixels per refresh.
                this.$container.scrollLeft = old_pos;
            } else if (anchor_date) {
            // <<< SR: Refresh exact scroll position --------------------------------
                // >>> SR: Refresh without scroll animation ---------------------
                this.set_scroll_position(anchor_date, false);
                // <<< SR: Refresh without scroll animation ---------------------
            } else {
                this.$container.scrollLeft = old_pos;
            }
          // <<< SR: Date calculation Fix -------------------------------------------
            this.options.scroll_to = old_scroll_op;
        }
        this.trigger_event('view_change', [mode]);
    }

    update_view_scale(mode) {
        let { duration, scale } = date_utils.parse_duration(mode.step);
        this.config.step = duration;
        this.config.unit = scale;
        this.config.column_width =
            this.options.column_width || mode.column_width || 45; //TODO SR INFO: It replaces the old ‘this.options.column_width’.
        this.$container.style.setProperty(
            '--gv-column-width',
            this.config.column_width + 'px',
        );
        this.config.header_height =
            this.options.lower_header_height +
            this.options.upper_header_height +
            10; //TODO SR: Here, the extra 10 px are added.
    }

    setup_dates(refresh = false) {
        this.setup_gantt_dates(refresh);
        this.setup_date_values();
    }

    setup_gantt_dates(refresh) {
        let gantt_start, gantt_end;
        if (!this.tasks.length) {
            gantt_start = new Date();
            gantt_end = new Date();
        }

        for (let task of this.tasks) {
            if (!gantt_start || task._start < gantt_start) {
                gantt_start = task._start;
            }
            if (!gantt_end || task._end > gantt_end) {
                gantt_end = task._end;
            }
        }

        // >>> SR: Global minimum view interval -------------------------------
        ({ gantt_start, gantt_end } = this.apply_global_min_view_interval(
            gantt_start,
            gantt_end,
        ));
        // <<< SR: Global minimum view interval -------------------------------

        gantt_start = date_utils.start_of(gantt_start, this.config.unit);
        gantt_end = date_utils.start_of(gantt_end, this.config.unit);

        if (!refresh) {
            // TODO SR: Old code. Clean after test.
/*          if (!this.options.infinite_padding) {
            if (typeof this.config.view_mode.padding === 'string')
              this.config.view_mode.padding = [
                this.config.view_mode.padding,
                this.config.view_mode.padding,
              ];

            let [padding_start, padding_end] =
                this.config.view_mode.padding.map(
                    date_utils.parse_duration,
                );
            this.gantt_start = date_utils.add(
                gantt_start,
                -padding_start.duration,
                padding_start.scale,
            );
            this.gantt_end = date_utils.add(
                gantt_end,
                padding_end.duration,
                padding_end.scale,
            );
          } else {
            this.gantt_start = date_utils.add(
                gantt_start,
                -this.config.extend_by_units * 3,
                this.config.unit,
            );
            this.gantt_end = date_utils.add(
                gantt_end,
                this.config.extend_by_units * 3,
                this.config.unit,
            );
          }*/
          // >>> SR: Date calculation Fix -------------------------------------------
            const view_padding = Array.isArray(this.config.view_mode.padding)
                ? this.config.view_mode.padding
                : [
                      this.config.view_mode.padding,
                      this.config.view_mode.padding,
                  ];
            const [padding_start, padding_end] = view_padding.map(
                date_utils.parse_duration,
            );

            this.gantt_start = date_utils.add(
                gantt_start,
                -padding_start.duration,
                padding_start.scale,
            );
            this.gantt_end = date_utils.add(
                gantt_end,
                padding_end.duration,
                padding_end.scale,
            );
            // >>> SR: include_today_in_padding --------------------------------
            this.extend_gantt_range_to_include_today();
            // <<< SR: include_today_in_padding --------------------------------

            if (this.should_align_to_week_start()) {
                // Ensure week-based views still start on the configured week start after padding/extension.
                this.gantt_start = this.align_to_week_start(this.gantt_start);
            }
          // <<< SR: BDate calculation Fix -------------------------------------------
        }
        this.config.date_format =
            this.config.view_mode.date_format || this.options.date_format;
        this.gantt_start.setHours(0, 0, 0, 0);
    }

    // >>> SR: Global minimum view interval -----------------------------------
    /**
     * Extends the task-derived base date range with configured global minimum
     * view boundaries before the active view padding is applied.
     * @param gantt_start
     * @param gantt_end
     * @returns {{gantt_start: Date, gantt_end: Date}}
     */
    apply_global_min_view_interval(gantt_start, gantt_end) {
        const global_start = this.get_global_min_view_date('global_min_view_start');
        const global_end = this.get_global_min_view_date('global_min_view_end');

        if (global_start && (!gantt_start || gantt_start > global_start)) {
            gantt_start = global_start;
        }

        if (global_end && (!gantt_end || gantt_end < global_end)) {
            gantt_end = global_end;
        }

        return { gantt_start, gantt_end };
    }

    /**
     * Parses one configured global minimum view boundary. The option accepts
     * the same values as task start/end, for example '2027-07-01'.
     * @param option_name
     * @returns {Date|null}
     */
    get_global_min_view_date(option_name) {
        const value = this.options?.[option_name];
        if (!value) return null;

        const date = date_utils.parse(value);
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
            console.warn(`${option_name} must be a valid date value. Ignoring it.`);
            return null;
        }

        return date;
    }
    // <<< SR: Global minimum view interval -----------------------------------

    setup_date_values() {
        let cur_date = this.gantt_start;
        this.dates = [cur_date];

        while (cur_date < this.gantt_end) {
            cur_date = date_utils.add(
                cur_date,
                this.config.step,
                this.config.unit,
            );
            this.dates.push(cur_date);
        }
    }

    bind_events() {
        this.bind_grid_click();
        this.bind_holiday_labels();
        this.bind_bar_events();
        // >>> SR: Bar Aggregation ---------------------------------------------
        this.bind_outside_click();
        // <<< SR: Bar Aggregation ---------------------------------------------
    }

    render() {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_grid_extras();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_dimensions();
        // >>> SR: Removed obsolete scroll option ------------------------------
        if (!this._suppress_scroll_strategy) {
            this.set_scroll_position(this.options.scroll_to);
        }
        // <<< SR: Removed obsolete scroll option ------------------------------
    }

    setup_layers() {
        this.layers = {};
        const layers = ['grid', 'arrow', 'progress', 'bar'];
        // make group layers
        for (let layer of layers) {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg,
            });
        }
        this.$extras = this.create_el({
            classes: 'extras',
            append_to: this.$container,
        });
        this.$adjust = this.create_el({
            classes: 'adjust hide',
            append_to: this.$extras,
            type: 'button',
        });
        this.$adjust.innerHTML = '&larr;';
    }

    make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_side_header();
    }

    make_grid_extras() {
        this.make_grid_highlights();
        this.make_grid_ticks();
    }

    make_grid_background() {
        const grid_width = this.dates.length * this.config.column_width;
      // >>> SR: Bar Aggregation -----------------------------------------------
      //TODO SR: ACHTUNG! Das hier ist noch nicht richtig. Das this.options.header_height liefert andere Werte als in old.
      
      const grid_height = Math.max(
          this.config.header_height +
          this.options.padding +
          this.get_content_height() 
          //- 10 //TODO SR: Hier wurden die 10px in der neuen Version abgezogen, weil die am Header mit hängen
           ,
          this.options.container_height !== 'auto'
              ? this.options.container_height
              : 0,
      );
      
        //TODO SR: For debug purposes. Delete it if not more needed!
/*        console.log("content_height: ", this.get_content_height());
        console.log("grid_height: ", grid_height);
        console.log("task lenght: ", this.tasks.length);*/
        // <<< SR: Bar Aggregation ---------------------------------------------
      
        createSVG('rect', {
            x: 0,
            y: 0,
            width: grid_width,
            height: grid_height,
            class: 'grid-background',
            append_to: this.$svg,
        });

        $.attr(this.$svg, {
            height: grid_height,
            width: '100%',
        });
        this.grid_height = grid_height;
        if (this.options.container_height === 'auto')
            this.$container.style.height = grid_height + 'px';
    }

    make_grid_rows() {
        const rows_layer = createSVG('g', { append_to: this.layers.grid });

        const row_width = this.dates.length * this.config.column_width;
        // >>> SR: striped row backgrounds -------------------------------------
        const rows = this._rowMeta?.length
            ? this._rowMeta
            : Array.from({ length: this.tasks.length }, (_, index) => ({
                  index,
                  top: index * this.options.row_height,
                  height: this.options.row_height,
              }));

        rows.forEach((row) => {
            const row_class =
                'grid-row' +
                (this.options.stripe_rows && row.index % 2 === 1
                    ? ' grid-row-striped'
                    : '');

            createSVG('rect', {
                x: 0,
                y: this.config.header_height + row.top,
                width: row_width,
                height: row.height,
                class: row_class,
                append_to: rows_layer,
            });
        });
        // <<< SR: striped row backgrounds -------------------------------------
    }

    make_grid_header() {
        this.$header = this.create_el({
            width: this.dates.length * this.config.column_width,
            classes: 'grid-header',
            append_to: this.$container,
        });

        this.$upper_header = this.create_el({
            classes: 'upper-header',
            append_to: this.$header,
        });
        this.$lower_header = this.create_el({
            classes: 'lower-header',
            append_to: this.$header,
        });
    }

    make_side_header() {
        this.$side_header = this.create_el({ classes: 'side-header' });
        this.$upper_header.prepend(this.$side_header);

        // Create view mode change select
        if (this.options.view_mode_select) {
            const $select = document.createElement('select');
            $select.classList.add('viewmode-select');

            const $el = document.createElement('option');
            $el.selected = true;
            $el.disabled = true;
            $el.textContent = 'Mode';
            $select.appendChild($el);

            for (const mode of this.options.view_modes) {
                const $option = document.createElement('option');
                $option.value = mode.name;
                $option.textContent = mode.name;
                if (mode.name === this.config.view_mode.name)
                    $option.selected = true;
                $select.appendChild($option);
            }

            $select.addEventListener(
                'change',
                function () {
                    this.change_view_mode($select.value, true);
                }.bind(this),
            );
            this.$side_header.appendChild($select);
        }

        // Create today button
        if (this.options.today_button) {
            let $today_button = document.createElement('button');
            $today_button.classList.add('today-button');
            $today_button.textContent = 'Today';
            // >>> SR: Today missing callback ----------------------------------
            $today_button.onclick = this.scroll_current.bind(this, true, true);
            // <<< SR: Today missing callback ----------------------------------
            this.$side_header.prepend($today_button);
            this.$today_button = $today_button;
        }
    }

    make_grid_ticks() {
        if (this.options.lines === 'none') return;
        let tick_x = 0;
        let tick_y = this.config.header_height;
        let tick_height = this.grid_height - this.config.header_height;
        //let tick_height = this.get_content_height(); //TODO SR: It makes no difference.

        let $lines_layer = createSVG('g', {
            class: 'lines_layer',
            append_to: this.layers.grid,
        });

        let row_y = this.config.header_height;
        // >>> SR: striped row backgrounds -------------------------------------
        const row_width = this.dates.length * this.config.column_width;
        if (this.options.lines !== 'vertical') {
            const rows = this._rowMeta?.length
                ? this._rowMeta
                : Array.from({ length: this.tasks.length }, (_, index) => ({
                      top: index * this.options.row_height,
                      height: this.options.row_height,
                  }));

            rows.forEach((row) => {
                row_y = this.config.header_height + row.top;

                createSVG('line', {
                    x1: 0,
                    y1: row_y + row.height,
                    x2: row_width,
                    y2: row_y + row.height,
                    class: 'row-line',
                    append_to: $lines_layer,
                });
            });
            // <<< SR: striped row backgrounds ---------------------------------
        }
        if (this.options.lines === 'horizontal') return;

        for (let date of this.dates) {
            // >>> SR: Date calculation Fix ------------------------------------
            tick_x = this.get_position_by_date(date);
            // <<< SR: Date calculation Fix ------------------------------------
            let tick_class = 'tick';

            // >>> SR: Thick line color ----------------------------------------
            // >>> SR: Thick line quarter calculation fix  ---------------------
            const thickLineResult = this.config.view_mode.thick_line &&
                this.config.view_mode.thick_line(date, {
                    gantt: this,
                    step: this.config.step,
                    unit: this.config.unit,
                });
            const isThick = !!thickLineResult;
            const thickLineDate = thickLineResult instanceof Date
                ? thickLineResult
                : date;
            const line_x = isThick
                ? this.get_position_by_date(thickLineDate)
                : tick_x;
            // <<< SR: Thick line quarter calculation fix  ---------------------
            
            if (isThick) {
                tick_class += ' thick';
            }
          
            const attrs = {
              d: `M ${line_x} ${tick_y} v ${tick_height}`,
              class: tick_class,
              append_to: this.layers.grid,
            }

            if (isThick && this.config.view_mode.thick_line_color) {
              attrs.style = `stroke: ${this.config.view_mode.thick_line_color};`;
            }
            
            createSVG('path', attrs);
            // <<< SR: Thick line color ----------------------------------------

        }
    }

    highlight_holidays() {
        let labels = {};
        if (!this.options.holidays) return;

        for (let color in this.options.holidays) {
            let check_highlight = this.options.holidays[color];
            if (check_highlight === 'weekend')
                check_highlight = this.options.is_weekend;
            let extra_func;

            if (typeof check_highlight === 'object') {
                let f = check_highlight.find((k) => typeof k === 'function');
                if (f) {
                    extra_func = f;
                }
                if (this.options.holidays.name) {
                    let dateObj = new Date(check_highlight.date + ' ');
                    check_highlight = (d) => dateObj.getTime() === d.getTime();
                    labels[dateObj] = check_highlight.name;
                } else {
                    check_highlight = (d) =>
                        this.options.holidays[color]
                            .filter((k) => typeof k !== 'function')
                            .map((k) => {
                                if (k.name) {
                                    let dateObj = new Date(k.date + ' ');
                                    labels[dateObj] = k.name;
                                    return dateObj.getTime();
                                }
                                return new Date(k + ' ').getTime();
                            })
                            .includes(d.getTime());
                }
            }
            for (
                let d = new Date(this.gantt_start);
                d <= this.gantt_end;
                d.setDate(d.getDate() + 1)
            ) {
                if (
                    this.config.ignored_dates.find(
                        (k) => k.getTime() == d.getTime(),
                    ) ||
                    (this.config.ignored_function &&
                        this.config.ignored_function(d))
                )
                    continue;
                if (check_highlight(d) || (extra_func && extra_func(d))) {
                  // >>> SR: Date calculation Fix ------------------------------
                    const x = this.get_position_by_date(d);
                  // >>> SR: Date calculation Fix ------------------------------
                    const height = this.grid_height - this.config.header_height;
                    // >>> SR: Bar Aggregation ---------------------------------
                    const d_formatted = date_utils
                        .format(d, 'YYYY-MM-dd', this.options.language)
                        .replace(' ', '_');
                    // <<< SR: Bar Aggregation ---------------------------------

                    if (labels[d]) {
                        let label = this.create_el({
                            classes: 'holiday-label ' + 'label_' + d_formatted,
                            append_to: this.$extras,
                        });
                        label.textContent = labels[d];
                    }
                    createSVG('rect', {
                        x: Math.round(x),
                        y: this.config.header_height,
                        width:
                            this.config.column_width /
                            date_utils.convert_scales(
                                this.config.view_mode.step,
                                'day',
                            ),
                        height,
                        class: 'holiday-highlight ' + d_formatted,
                        style: `fill: ${color};`,
                        append_to: this.layers.grid,
                    });
                }
            }
        }
    }

    /**
     * Compute the horizontal x-axis distance and associated date for the current date and view.
     *
     * @returns Object containing the x-axis distance and date of the current date, or null if the current date is out of the gantt range.
     */
    highlight_current() {
        const res = this.get_closest_date();
        if (!res) return;

        const [_, el] = res;
        el.classList.add('current-date-highlight');
        // >>> SR: Date calculation Fix --------------------------------------------
        const left = this.get_position_by_date(new Date());
        // <<< SR: Date calculation Fix --------------------------------------------
        
        this.$current_highlight = this.create_el({
            top: this.config.header_height,
            left,
            height: this.grid_height - this.config.header_height,
            classes: 'current-highlight',
            append_to: this.$container,
        });
        this.$current_ball_highlight = this.create_el({
            top: this.config.header_height - 6,
            left: left - 2.5,
            width: 6,
            height: 6,
            classes: 'current-ball-highlight',
            append_to: this.$header,
        });
    }

    make_grid_highlights() {
        this.highlight_holidays();
        this.config.ignored_positions = [];
        // >>> SR: striped row backgrounds -------------------------------------
        // TODO SR: Take it back if the row padding is still broken:
        //const height = (this.options.bar_height + this.options.padding) * this.tasks.length;
        const height = this.get_content_height();
        
        // <<< SR: striped row backgrounds -------------------------------------
        
        //TODO SR: Test it once the padding has been fixed:
        //const height = this.get_content_height();
      
        this.layers.grid.innerHTML += `<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2
                   M0,4 l4,-4
                   M3,5 l2,-2"
                style="stroke:grey; stroke-width:0.3" />
        </pattern>`;

        for (
            let d = new Date(this.gantt_start);
            d <= this.gantt_end;
            d.setDate(d.getDate() + 1)
        ) {
            if (
                !this.config.ignored_dates.find(
                    (k) => k.getTime() == d.getTime(),
                ) &&
                (!this.config.ignored_function ||
                    !this.config.ignored_function(d))
            )
                continue;
            // >>> SR: Date calculation Fix ------------------------------------
            const x = this.get_position_by_date(d);

            this.config.ignored_positions.push(x);
            // >>> SR: Date calculation Fix ------------------------------------
            createSVG('rect', {
                x,
                y: this.config.header_height,
                width: this.config.column_width,
                height: height,
                class: 'ignored-bar',
                style: 'fill: url(#diagonalHatch);',
                append_to: this.$svg,
            });
        }

        const highlightDimensions = this.highlight_current(
            this.config.view_mode,
        );

        if (!highlightDimensions) return;
    }

    create_el({ left, top, width, height, id, classes, append_to, type }) {
        let $el = document.createElement(type || 'div');
        for (let cls of classes.split(' ')) $el.classList.add(cls);
        $el.style.top = top + 'px';
        $el.style.left = left + 'px';
        if (id) $el.id = id;
        if (width) $el.style.width = width + 'px';
        if (height) $el.style.height = height + 'px';
        if (append_to) append_to.appendChild($el);
        return $el;
    }

    make_dates() {
        this.get_dates_to_draw().forEach((date, i) => {
            if (date.lower_text) {
                let $lower_text = this.create_el({
                    left: date.x,
                    top: date.lower_y,
                    classes: 'lower-text date_' + sanitize(date.formatted_date),
                    append_to: this.$lower_header,
                });
                $lower_text.innerText = date.lower_text;
            }

            if (date.upper_text) {
                let $upper_text = this.create_el({
                    left: date.x,
                    top: date.upper_y,
                    classes: 'upper-text',
                    append_to: this.$upper_header,
                });
                $upper_text.innerText = date.upper_text;
            }
        });
        this.upperTexts = Array.from(
            this.$container.querySelectorAll('.upper-text'),
        );
    }

    get_dates_to_draw() {
        let last_date_info = null;
        const dates = this.dates.map((date, i) => {
            const d = this.get_date_info(date, last_date_info, i);
            last_date_info = d;
            return d;
        });
        return dates;
    }

    get_date_info(date, last_date_info) {
        let last_date = last_date_info ? last_date_info.date : null;

        let column_width = this.config.column_width;

        const x = last_date_info
            ? last_date_info.x + last_date_info.column_width
            : 0;

        let upper_text = this.config.view_mode.upper_text;
        let lower_text = this.config.view_mode.lower_text;

        if (!upper_text) {
            this.config.view_mode.upper_text = () => '';
        } else if (typeof upper_text === 'string') {
            this.config.view_mode.upper_text = (date) =>
                date_utils.format(date, upper_text, this.options.language);
        }

        if (!lower_text) {
            this.config.view_mode.lower_text = () => '';
        } else if (typeof lower_text === 'string') {
            this.config.view_mode.lower_text = (date) =>
                date_utils.format(date, lower_text, this.options.language);
        }

        return {
            date,
            formatted_date: sanitize(
                date_utils.format(
                    date,
                    this.config.date_format,
                    this.options.language,
                ),
            ),
            column_width: this.config.column_width,
            x,
            upper_text: this.config.view_mode.upper_text(
                date,
                last_date,
                this.options.language,
            ),
            lower_text: this.config.view_mode.lower_text(
                date,
                last_date,
                this.options.language,
            ),
            upper_y: 17,
            lower_y: this.options.upper_header_height + 5,
        };
    }
    
    make_bars() {
      // >>> SR: Bar Aggregation -----------------------------------------------
      // Only render non-hidden tasks + all aggregates
      const renderTasks = this.tasks.filter(t => !t._hidden)
      .concat(this._aggregateBars || []);

      // Draw the lower lanes first, then the upper ones (lane 0 last).
      renderTasks.sort((a, b) => {
        const ra = (a._rowIndex ?? a._index) - (b._rowIndex ?? b._index);
        if (ra !== 0) return ra;
        // Draw the larger lane first so that the smaller ones (above) lie on top of it.
        const la = (a._lane ?? 0), lb = (b._lane ?? 0);
        if (la !== lb) return lb - la;
        // stabile Tie-Breaker
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      });

      this.bars = renderTasks.map((task) => {
        const bar = new Bar(this, task);
        this.layers.bar.appendChild(bar.group);
        return bar;
      });
      // <<< SR: Bar Aggregation -----------------------------------------------
    }
    
    make_arrows() {
      // >>> SR: Bar Aggregation -----------------------------------------------
      this.arrows = [];
      if (!this.bars || !this.bars.length) return;
  
      // Quick access: taskId -> Bar (rendered bars only)
      const barById = new Map();
      for (const bar of this.bars) {
        if (bar && bar.task && bar.task.id != null) {
          barById.set(bar.task.id, bar);
        }
      }
  
      for (const task of this.tasks) {
        if (!task || !Array.isArray(task.dependencies) || !task.dependencies.length) continue;
  
        // Target bar must be visible
        const toBar = barById.get(task.id);
        if (!toBar) continue;
  
        for (const depId of task.dependencies) {
          const depTask = this.get_task(depId);
          if (!depTask) continue; // ungültige ID
  
          // Source bar (dependency) must be visible
          const fromBar = barById.get(depTask.id);
          if (!fromBar) continue;
  
          const arrow = new Arrow(this, fromBar, toBar);
          this.layers.arrow.appendChild(arrow.element);
          this.arrows.push(arrow);
        }
      }
      // <<< SR: Bar Aggregation -----------------------------------------------
    }

    map_arrows_on_bars() {
        for (let bar of this.bars) {
            bar.arrows = this.arrows.filter((arrow) => {
                return (
                    arrow.from_task.task.id === bar.task.id ||
                    arrow.to_task.task.id === bar.task.id
                );
            });
        }
    }

    set_dimensions() {
        const { width: cur_width } = this.$svg.getBoundingClientRect();
        const actual_width = this.$svg.querySelector('.grid .grid-row')
            ? this.$svg.querySelector('.grid .grid-row').getAttribute('width')
            : 0;
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    }

    // >>> SR: Refresh without scroll animation ---------------------------------
    /**
     * Scrolls the Gantt horizontally to a date or keyword.
     * @param date Date, string keyword, or parsable date string.
     * @param animate true keeps the existing smooth scroll behavior; false sets
     * the final scroll position immediately, used by refresh position restore.
     */
    set_scroll_position(date, animate = true) {
    // <<< SR: Refresh without scroll animation ---------------------------------
        if (this.options.infinite_padding && (!date || date === 'start')) {
            let [min_start, ..._] = this.get_start_end_positions();
            this.$container.scrollLeft = min_start;
            return;
        }
        if (!date || date === 'start') {
            date = this.gantt_start;
        } else if (date === 'end') {
            date = this.gantt_end;
        } else if (date === 'today') {
            return this.scroll_current(animate);
        } else if (typeof date === 'string') {
            date = date_utils.parse(date);
        }

        // Weird bug where infinite padding results in one day offset in scroll
        // Related to header-body displacement
        // >>> SR: Date calculation Fix ---------------------------------------------
        //State in PowerUI Version: solved?
        const scroll_pos = this.get_position_by_date(date);
        // <<< SR: Date calculation Fix ---------------------------------------------

        // >>> SR: Refresh without scroll animation -----------------------------
        const scroll_left = scroll_pos - this.config.column_width / 6;
        if (animate) {
            this.$container.scrollTo({
                left: scroll_left,
                behavior: 'smooth',
            });
        } else {
            this.$container.scrollLeft = scroll_left;
        }
        // <<< SR: Refresh without scroll animation -----------------------------

        // Calculate current scroll position's upper text
        if (this.$current) {
            this.$current.classList.remove('current-upper');
        }

        this.current_date = date_utils.add(
            this.gantt_start,
            this.$container.scrollLeft / this.config.column_width,
            this.config.unit,
        );

        let current_upper = this.config.view_mode.upper_text(
            this.current_date,
            null,
            this.options.language,
        );
        let $el = this.upperTexts.find(
            (el) => el.textContent === current_upper,
        );

        // Recalculate
        this.current_date = date_utils.add(
            this.gantt_start,
            (this.$container.scrollLeft + $el.clientWidth) /
                this.config.column_width,
            this.config.unit,
        );
        current_upper = this.config.view_mode.upper_text(
            this.current_date,
            null,
            this.options.language,
        );
        $el = this.upperTexts.find((el) => el.textContent === current_upper);
        $el.classList.add('current-upper');
        this.$current = $el;
    }

    // >>> SR: Refresh without scroll animation ---------------------------------
    /**
     * Scrolls to the current day. The optional animate flag allows refresh()
     * position restoration to reuse the same date logic without smooth scrolling.
     * @param animate true keeps the existing smooth scroll behavior.
     * @param trigger_today_missing true calls on_today_missing when today is outside the Gantt interval.
     */
    scroll_current(animate = true, trigger_today_missing = false) {
    // <<< SR: Refresh without scroll animation ---------------------------------
        let res = this.get_closest_date();
        // >>> SR: Today button left scroll padding ---------------------------
        if (res) {
            this.set_scroll_position(this.get_today_scroll_target_date(), animate);
            return;
        }
        // <<< SR: Today button left scroll padding ---------------------------
        // >>> SR: Today missing callback --------------------------------------
        const today = new Date();
        if (
            trigger_today_missing &&
            (today < this.gantt_start || today > this.gantt_end)
        ) {
            this.trigger_event('today_missing', [
                today,
                this.gantt_start,
                this.gantt_end,
            ]);
        }
        // <<< SR: Today missing callback --------------------------------------
    }

    // >>> SR: Today button left scroll padding -------------------------------
    /**
     * Returns the date that should be placed at the left side of the viewport
     * when the Today button is used. The current date stays highlighted at its
     * real position, while this optional padding moves it further to the right.
     * @returns {Date}
     */
    get_today_scroll_target_date() {
        const today = new Date();
        const padding = this.get_today_button_left_scroll_padding();
        if (!padding) return today;

        const target = date_utils.add(today, -padding.duration, padding.scale);
        return target < this.gantt_start ? this.gantt_start : target;
    }

    /**
     * Reads and parses the current view mode's today-button left scroll padding.
     * The value uses the same format as view mode padding. If an array is given,
     * the left-side value is used.
     * @returns {{duration: number, scale: string}|null}
     */
    get_today_button_left_scroll_padding() {
        const padding_config = this.config.view_mode?.today_button_left_scroll_padding;
        const left_padding = Array.isArray(padding_config)
            ? padding_config[0]
            : padding_config;

        if (!left_padding) return null;

        const parsed = date_utils.parse_duration(left_padding);
        if (!parsed?.duration || !parsed?.scale) return null;

        return parsed;
    }
    // <<< SR: Today button left scroll padding -------------------------------

    get_closest_date() {
        let now = new Date();
        if (now < this.gantt_start || now > this.gantt_end) return null;
        // >>> SR: include_today_in_padding ------------------------------------
        const current = this.get_date_tick_for_date(now);
        const el = current
            ? this.$container.querySelector(
                  '.date_' +
                      sanitize(
                          date_utils.format(
                              current,
                              this.config.date_format,
                              this.options.language,
                          ),
                      ),
              )
            : null;

        if (!el) return null;
        // <<< SR: include_today_in_padding ------------------------------------
        // >>> SR: Date calculation Fix ------------------------------------
        return [
            date_utils.parse(
                date_utils.format(
                    current,
                    this.config.date_format,
                    this.options.language,
                ),
            ),
            el,
        ];
        // <<< SR: Date calculation Fix ------------------------------------
    }

    bind_grid_click() {
        $.on(
            this.$container,
            'click',
            '.grid-row, .grid-header, .ignored-bar, .holiday-highlight',
            (e) => {
                // >>> SR: Aggregation popup Gantt outside click ---------------
                // A nested popup Gantt lives inside this popup wrapper. Its grid
                // clicks bubble to the parent Gantt container and would close
                // the main popup. Ignore clicks that originated inside this
                // Gantt instance's own popup wrapper; the nested Gantt can still
                // handle and close its own popups.
                if (this.$popup_wrapper?.contains(e.target)) return;
                // <<< SR: Aggregation popup Gantt outside click ---------------
                this.unselect_all();
                this.hide_popup();
            },
        );
    }

    bind_holiday_labels() {
        const $highlights =
            this.$container.querySelectorAll('.holiday-highlight');
        for (let h of $highlights) {
            const label = this.$container.querySelector(
                '.label_' + h.classList[1],
            );
            if (!label) continue;
            let timeout;
            h.onmouseenter = (e) => {
                timeout = setTimeout(() => {
                    label.classList.add('show');
                    label.style.left = (e.offsetX || e.layerX) + 'px';
                    label.style.top = (e.offsetY || e.layerY) + 'px';
                }, 300);
            };

            h.onmouseleave = (e) => {
                clearTimeout(timeout);
                label.classList.remove('show');
            };
        }
    }

    get_start_end_positions() {
        if (!this.bars.length) return [0, 0, 0];
        let { x, width } = this.bars[0].group.getBBox();
        let min_start = x;
        let max_start = x;
        let max_end = x + width;
        Array.prototype.forEach.call(this.bars, function ({ group }, i) {
            let { x, width } = group.getBBox();
            if (x < min_start) min_start = x;
            if (x > max_start) max_start = x;
            if (x + width > max_end) max_end = x + width;
        });
        return [min_start, max_start, max_end];
    }

    bind_bar_events() {
        let is_dragging = false;
        let x_on_start = 0;
        // >>> SR: Date calculation Fix ---------------------------------------------
        let x_on_scroll_start = this.$container.scrollLeft;
        // >>> SR: Date calculation Fix ---------------------------------------------
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id = null;
        let bars = []; // instanceof Bar
        // >>> SR: Date calculation after change fix ---------------------------
        let bar_action_started = false;
        // <<< SR: Date calculation after change fix ---------------------------
        this.bar_being_dragged = null;

        const action_in_progress = () =>
            is_dragging || is_resizing_left || is_resizing_right;

        // >>> SR: Date calculation after change fix ---------------------------------
        const reset_bar_action_state = () => {
            bars.forEach((bar) => {
                if (bar?.$bar) bar.$bar.finaldx = 0;
            });
            bars = [];
            bar_action_started = false;
        };

        //TODO SR: It should not be triggered if readonly.
        const finish_bar_action = () => {
            this.bar_being_dragged = null;

            if (!bar_action_started) return;

            let should_refresh_overlap_aggregates = false;

            bars.forEach((bar) => {
                const $bar = bar?.$bar;
                if (!$bar?.finaldx) return;
                bar.date_changed();
                bar.compute_progress();
                bar.set_action_completed();
                should_refresh_overlap_aggregates = true;
            });

            reset_bar_action_state();

            if (should_refresh_overlap_aggregates) {
                this.refresh_overlap_aggregates_after_drop();
            }
        };
      // <<< SR: Date calculation after change fix ---------------------------------
        
        this.$svg.onclick = (e) => {
            if (e.target.classList.contains('grid-row')) this.unselect_all();
        };

        let pos = 0;
        $.on(this.$svg, 'mousemove', '.bar-wrapper, .handle', (e) => {
            if (
                this.bar_being_dragged === false &&
                Math.abs((e.offsetX || e.layerX) - pos) > 10
            )
                this.bar_being_dragged = true;
        });

        $.on(this.$svg, 'mousedown', '.bar-wrapper, .handle', (e, element) => {
            const bar_wrapper = $.closest('.bar-wrapper', element);
            if (element.classList.contains('left')) {
                is_resizing_left = true;
                element.classList.add('visible');
            } else if (element.classList.contains('right')) {
                is_resizing_right = true;
                element.classList.add('visible');
            } else if (element.classList.contains('bar-wrapper')) {
                is_dragging = true;
            }

            if (this.popup) this.popup.hide();

            x_on_start = e.offsetX || e.layerX;

            parent_bar_id = bar_wrapper.getAttribute('data-id');
            // >>> SR: Date calculation after change fix ---------------------------------
            bar_action_started = true;
            // <<< SR: Date calculation after change fix ---------------------------------
            let ids;
            if (this.options.move_dependencies) {
                ids = [
                    parent_bar_id,
                    ...this.get_all_dependent_tasks(parent_bar_id),
                ];
            } else {
                ids = [parent_bar_id];
            }
            bars = ids.map((id) => this.get_bar(id));

            this.bar_being_dragged = false;
            pos = x_on_start;

            bars.forEach((bar) => {
                const $bar = bar.$bar;
                $bar.ox = $bar.getX();
                $bar.oy = $bar.getY();
                $bar.owidth = $bar.getWidth();
                $bar.finaldx = 0;
            });
        });
          
          //TODO SR: Old Code. Test and then remove.
/*        if (this.options.infinite_padding) {
          let extended = false;
          $.on(this.$container, 'mousewheel', (e) => {
            let trigger = this.$container.scrollWidth / 2;
            if (!extended && e.currentTarget.scrollLeft <= trigger) {
              let old_scroll_left = e.currentTarget.scrollLeft;
              extended = true;
  
              this.gantt_start = date_utils.add(
                  this.gantt_start,
                  -this.config.extend_by_units,
                  this.config.unit,
              );
              this.setup_date_values();
              this.render();
              e.currentTarget.scrollLeft =
                  old_scroll_left +
                  this.config.column_width * this.config.extend_by_units;
              setTimeout(() => (extended = false), 300);
            }
  
            if (
                !extended &&
                e.currentTarget.scrollWidth -
                (e.currentTarget.scrollLeft +
                    e.currentTarget.clientWidth) <=
                trigger
            ) {
              let old_scroll_left = e.currentTarget.scrollLeft;
              extended = true;
              this.gantt_end = date_utils.add(
                  this.gantt_end,
                  this.config.extend_by_units,
                  this.config.unit,
              );
              this.setup_date_values();
              this.render();
              e.currentTarget.scrollLeft = old_scroll_left;
              setTimeout(() => (extended = false), 300);
            }
          });
        }*/

        if (this.options.infinite_padding) {
          // >>> SR: Date calculation Fix -------------------------------------------
            this.$container.addEventListener('wheel', (e) => {
                const abs_delta_x = Math.abs(e.deltaX || 0);
                const abs_delta_y = Math.abs(e.deltaY || 0);
                const horizontal_intent =
                    abs_delta_x > 0 && abs_delta_x >= abs_delta_y;
                const shift_horizontal = e.shiftKey && abs_delta_y > 0;

                // Ignore pure vertical wheel gestures to keep weekly headers stable.
                if (!horizontal_intent && !shift_horizontal) return;

                this.maybe_extend_infinite_padding(e.currentTarget);
            // <<< SR: Date calculation Fix ---------------------------------------------
            });
        }

        $.on(this.$container, 'scroll', (e) => {
            let localBars = [];
            const ids = this.bars.map(({ group }) =>
                group.getAttribute('data-id'),
            );
            // >>> SR: Date calculation Fix -----------------------------------------
            const current_scroll_left = e.currentTarget.scrollLeft;
            const horizontal_scroll_changed =
                current_scroll_left !== x_on_scroll_start;
            // <<< SR: Date calculation Fix -----------------------------------------

            let dx;
            // >>> SR: Date calculation Fix -----------------------------------------
            if (horizontal_scroll_changed) {
                dx = current_scroll_left - x_on_scroll_start;
            }
            // >>> SR: Bar Aggregation -----------------------------------------
            // Calculate current scroll position's upper text
            this.current_date = date_utils.add(
                this.gantt_start,
                  // >>> SR: Date calculation Fix -----------------------------------
                    (current_scroll_left / this.config.column_width) *
                  // >>> SR: Date calculation Fix -----------------------------------
                    this.config.step,
                this.config.unit,
            );

            let current_upper = this.config.view_mode.upper_text(
                this.current_date,
                null,
                this.options.language,
            );
            let $el = this.upperTexts.find(
                (el) => el.textContent === current_upper,
            );

            // Recalculate for smoother experience
            this.current_date = date_utils.add(
                this.gantt_start,
                // >>> SR: Date calculation Fix -------------------------------------
                ((current_scroll_left + $el.clientWidth) / 
                    // <<< SR: Date calculation Fix ---------------------------------
                    this.config.column_width) *
                    this.config.step,
                this.config.unit,
            );
            current_upper = this.config.view_mode.upper_text(
                this.current_date,
                null,
                this.options.language,
            );
            $el = this.upperTexts.find(
                (el) => el.textContent === current_upper,
            );

            if ($el !== this.$current) {
                if (this.$current)
                    this.$current.classList.remove('current-upper');

                $el.classList.add('current-upper');
                this.$current = $el;
            }
            // >>> SR: Date calculation Fix -----------------------------------------
            x_on_scroll_start = current_scroll_left;
            // <<< SR: Date calculation Fix -----------------------------------------
            let [min_start, max_start, max_end] =
                this.get_start_end_positions();

            if (x_on_scroll_start > max_end + 100) {
                this.$adjust.innerHTML = '&larr;';
                this.$adjust.classList.remove('hide');
                this.$adjust.onclick = () => {
                    this.$container.scrollTo({
                        left: max_start,
                        behavior: 'smooth',
                    });
                };
            } else if (
                x_on_scroll_start + e.currentTarget.offsetWidth <
                min_start - 100
            ) {
                this.$adjust.innerHTML = '&rarr;';
                this.$adjust.classList.remove('hide');
                this.$adjust.onclick = () => {
                    this.$container.scrollTo({
                        left: min_start,
                        behavior: 'smooth',
                    });
                };
            } else {
                this.$adjust.classList.add('hide');
            }

            if (dx) {
                localBars = ids.map((id) => this.get_bar(id));
                if (this.options.auto_move_label) {
                    localBars.forEach((bar) => {
                        bar.update_label_position_on_horizontal_scroll({
                            x: dx,
                            sx: e.currentTarget.scrollLeft,
                        });
                    });
                }
            }
        });

        $.on(this.$svg, 'mousemove', (e) => {
            if (!action_in_progress()) return;
            const dx = (e.offsetX || e.layerX) - x_on_start;
            // >>> SR: Draggable -----------------------------------------------
            // draggable check: if any of the bars is not draggable, cancel the action
            let bDraggable = true;
            bars.forEach((bar) => {
              if (bar.task.draggable === false) {
                bDraggable = false;
              }
            });
            if (bDraggable === false) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            // <<< SR: Draggable -----------------------------------------------
            bars.forEach((bar) => {
                const $bar = bar.$bar;
                $bar.finaldx = this.get_snap_position(dx, $bar.ox);
                this.hide_popup();
                if (is_resizing_left) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx,
                            width: $bar.owidth - $bar.finaldx,
                        });
                    } else {
                        bar.update_bar_position({
                            x: $bar.ox + $bar.finaldx,
                        });
                    }
                } else if (is_resizing_right) {
                    if (parent_bar_id === bar.task.id) {
                        bar.update_bar_position({
                            width: $bar.owidth + $bar.finaldx,
                        });
                    }
                } else if (
                    is_dragging &&
                    !this.options.readonly &&
                    !this.options.readonly_dates
                ) {
                    bar.update_bar_position({ x: $bar.ox + $bar.finaldx });
                }
            });
        });

        // >>> SR: Aggregation popup Gantt ------------------------------------
        this._onDocumentMouseup = () => {
            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
            this.$container
                .querySelector('.visible')
                ?.classList?.remove?.('visible');
            // >>> SR: Date calculation after change fix ---------------------------------
            finish_bar_action();
            // <<< SR: Date calculation after change fix ---------------------------------
        };
        document.addEventListener('mouseup', this._onDocumentMouseup);
        // <<< SR: Aggregation popup Gantt ------------------------------------
      // >>> SR: Date calculation after change fix ---------------------------------
        $.on(this.$svg, 'mouseup', () => {
            finish_bar_action();
        });
      // <<< SR: Date calculation after change fix ---------------------------------

        this.bind_bar_progress();
    }

    bind_bar_progress() {
        let x_on_start = 0;
        let is_resizing = null;
        let bar = null;
        let $bar_progress = null;
        let $bar = null;

        $.on(this.$svg, 'mousedown', '.handle.progress', (e, handle) => {
            is_resizing = true;
            x_on_start = e.offsetX || e.layerX;

            const $bar_wrapper = $.closest('.bar-wrapper', handle);
            const id = $bar_wrapper.getAttribute('data-id');
            bar = this.get_bar(id);

            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;

            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.owidth;
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        });

        const range_positions = this.config.ignored_positions.map((d) => [
            d,
            d + this.config.column_width,
        ]);

        $.on(this.$svg, 'mousemove', (e) => {
            if (!is_resizing) return;
            let now_x = e.offsetX || e.layerX;

            let moving_right = now_x > x_on_start;
            if (moving_right) {
                let k = range_positions.find(
                    ([begin, end]) => now_x >= begin && now_x < end,
                );
                while (k) {
                    now_x = k[1];
                    k = range_positions.find(
                        ([begin, end]) => now_x >= begin && now_x < end,
                    );
                }
            } else {
                let k = range_positions.find(
                    ([begin, end]) => now_x > begin && now_x <= end,
                );
                while (k) {
                    now_x = k[0];
                    k = range_positions.find(
                        ([begin, end]) => now_x > begin && now_x <= end,
                    );
                }
            }

            let dx = now_x - x_on_start;
            //console.log($bar_progress); //TODO SR: It was already there before me. Take it in?
            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }

            $bar_progress.setAttribute('width', $bar_progress.owidth + dx);
            $.attr(bar.$handle_progress, 'cx', $bar_progress.getEndX());

            $bar_progress.finaldx = dx;
        });

        $.on(this.$svg, 'mouseup', () => {
            is_resizing = false;
            if (!($bar_progress && $bar_progress.finaldx)) return;

            $bar_progress.finaldx = 0;
            bar.progress_changed();
            bar.set_action_completed();
            bar = null;
            $bar_progress = null;
            $bar = null;
        });
    }

    get_all_dependent_tasks(task_id) {
        let out = [];
        let to_process = [task_id];
        while (to_process.length) {
            const deps = to_process.reduce((acc, curr) => {
                acc = acc.concat(this.dependency_map[curr]);
                return acc;
            }, []);

            out = out.concat(deps);
            to_process = deps.filter((d) => !to_process.includes(d));
        }

        return out.filter(Boolean);
    }

    get_snap_position(dx, ox) {
        let unit_length = 1;
        const default_snap =
            this.options.snap_at || this.config.view_mode.snap_at || '1d';

        if (default_snap !== 'unit') {
            const { duration, scale } = date_utils.parse_duration(default_snap);
            unit_length =
                date_utils.convert_scales(this.config.view_mode.step, scale) /
                duration;
        }

        const rem = dx % (this.config.column_width / unit_length);

        let final_dx =
            dx -
            rem +
            (rem < (this.config.column_width / unit_length) * 2
                ? 0
                : this.config.column_width / unit_length);
        let final_pos = ox + final_dx;

        const drn = final_dx > 0 ? 1 : -1;
        let ignored_regions = this.get_ignored_region(final_pos, drn);
        while (ignored_regions.length) {
            final_pos += this.config.column_width * drn;
            ignored_regions = this.get_ignored_region(final_pos, drn);
            if (!ignored_regions.length)
                final_pos -= this.config.column_width * drn;
        }
        return final_pos - ox;
    }

    get_ignored_region(pos, drn = 1) {
        if (drn === 1) {
            return this.config.ignored_positions.filter((val) => {
                return pos > val && pos <= val + this.config.column_width;
            });
        } else {
            return this.config.ignored_positions.filter(
                (val) => pos >= val && pos < val + this.config.column_width,
            );
        }
    }

    unselect_all() {
        if (this.popup) this.popup.parent.classList.add('hide');
        this.$container
            .querySelectorAll('.date-range-highlight')
            .forEach((k) => k.classList.add('hide'));
    }

    view_is(modes) {
        if (typeof modes === 'string') {
            return this.config.view_mode.name === modes;
        }

        if (Array.isArray(modes)) {
            return modes.some(view_is);
        }

        return this.config.view_mode.name === modes.name;
    }

    get_task(id) {
        return this.tasks.find((task) => {
            return task.id === id;
        });
    }

    get_bar(id) {
        return this.bars.find((bar) => {
            return bar.task.id === id;
        });
    }

    show_popup(opts) {
        if (this.options.popup === false) return;
        if (!this.popup) {
            this.popup = new Popup(
                this.$popup_wrapper,
                this.options.popup,
                this,
            );
        }
        this.popup.show(opts);
    }

    hide_popup() {
        this.popup && this.popup.hide();
    }

    trigger_event(event, args) {
        if (this.options['on_' + event]) {
            this.options['on_' + event].apply(this, args);
        }
    }

    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    get_oldest_starting_date() {
        if (!this.tasks.length) return new Date();
        return this.tasks
            .map((task) => task._start)
            .reduce((prev_date, cur_date) =>
                cur_date <= prev_date ? cur_date : prev_date,
            );
    }

    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    clear() {
        this.$svg.innerHTML = '';
        this.$header?.remove?.();
        this.$side_header?.remove?.();
        this.$current_highlight?.remove?.();
        this.$extras?.remove?.();
        this.popup?.hide?.();
    }

    // >>> SR: Aggregation popup Gantt ----------------------------------------
    /**
     * Removes global listeners and DOM nodes created by this Gantt instance.
     * This is mainly used for nested Gantt charts rendered inside aggregation
     * popups, which are recreated whenever the popup content changes.
     */
    destroy() {
        if (this._onDocumentMouseup) {
            document.removeEventListener('mouseup', this._onDocumentMouseup);
            this._onDocumentMouseup = null;
        }

        if (this._onDocClick) {
            document.removeEventListener('mousedown', this._onDocClick, true);
            this._onDocClick = null;
        }

        this.$container?.remove?.();
    }
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    
  // >>> SR: Bar Aggregation ---------------------------------------------------
  // >>> SR: Date calculation Fix ----------------------------------------------
  get_infinite_padding_extend_units() {
    const extend_units = Math.max(1, this.config.extend_by_units || 1);
    const step_units = Math.max(1, this.config.step || 1);

    // Keep day-based multi-day views (for example 7d calendar-week views)
    // anchored to the same weekday when the timeline is extended.
    if (this.config.unit === 'day' && step_units > 1) {
      return Math.ceil(extend_units / step_units) * step_units;
    }

    return extend_units;
  }

  get_infinite_padding_extend_width(extend_units) {
    return (extend_units / this.config.step) * this.config.column_width;
  }

  maybe_extend_infinite_padding(container = this.$container) {
    if (!this.options.infinite_padding || this._extending_infinite_padding) {
      return false;
    }

    const trigger = container.scrollWidth / 2;
    const extend_units = this.get_infinite_padding_extend_units();

    if (container.scrollLeft <= trigger) {
      const old_scroll_left = container.scrollLeft;
      this._extending_infinite_padding = true;

      this.gantt_start = date_utils.add(
          this.gantt_start,
          -extend_units,
          this.config.unit,
      );
      this.setup_date_values();
      this.render();
      container.scrollLeft =
          old_scroll_left +
          this.get_infinite_padding_extend_width(extend_units);
      setTimeout(() => (this._extending_infinite_padding = false), 300);
      return true;
    }

    if (
        container.scrollWidth -
        (container.scrollLeft + container.clientWidth) <=
        trigger
    ) {
      const old_scroll_left = container.scrollLeft;
      this._extending_infinite_padding = true;

      this.gantt_end = date_utils.add(
          this.gantt_end,
          extend_units,
          this.config.unit,
      );
      this.setup_date_values();
      this.render();
      container.scrollLeft = old_scroll_left;
      setTimeout(() => (this._extending_infinite_padding = false), 300);
      return true;
    }

    return false;
  }
  
  should_align_to_week_start() {
    return this.config.unit === 'day' && this.config.step % 7 === 0;
  }

  get_week_start_day() {
    const start_of_week = String(this.options.start_of_week || 'monday')
        .trim()
        .toLowerCase();

    if (start_of_week === 'sunday' || start_of_week === 'sonntag') {
      return 0;
    }

    return 1;
  }

  align_to_week_start(date) {
    const aligned = date_utils.clone(date);
    const start_day = this.get_week_start_day();
    const days_since_week_start = (aligned.getDay() - start_day + 7) % 7;
    return date_utils.add(aligned, -days_since_week_start, 'day');
  }

  // >>> SR: include_today_in_padding ------------------------------------------
  should_include_today_in_padding() {
    return Boolean(this.options.include_today_in_padding);
  }

  extend_gantt_range_to_include_today() {
    if (!this.should_include_today_in_padding()) return;

    const today_start = date_utils.today();
    const today_end = date_utils.add(today_start, 1, 'day');
    // >>> SR: Today button left scroll padding -------------------------------
    const today_scroll_start = this.get_today_scroll_padding_start_date(today_start);
    // <<< SR: Today button left scroll padding -------------------------------

    // >>> SR: Today button left scroll padding -------------------------------
    if (today_scroll_start < this.gantt_start) {
      this.gantt_start = date_utils.start_of(today_scroll_start, this.config.unit);
    }
    // <<< SR: Today button left scroll padding -------------------------------

    if (today_end > this.gantt_end) {
      this.gantt_end = today_end;
    }
  }

  // >>> SR: Today button left scroll padding ---------------------------------
  /**
   * Returns the earliest date that must be included when today is added to the
   * rendered Gantt range. This keeps enough left-side room for the Today button
   * scroll padding if today was outside the original task interval.
   * @param today_start
   * @returns {Date}
   */
  get_today_scroll_padding_start_date(today_start) {
    const padding = this.get_today_button_left_scroll_padding?.();
    if (!padding) return today_start;

    return date_utils.add(today_start, -padding.duration, padding.scale);
  }
  // <<< SR: Today button left scroll padding ---------------------------------

  get_date_tick_for_date(date) {
    if (!this.dates?.length) return null;

    for (let i = this.dates.length - 1; i >= 0; i--) {
      if (this.dates[i] <= date) {
        return this.dates[i];
      }
    }

    return this.dates[0];
  }
  // <<< SR: include_today_in_padding ------------------------------------------
  
  get_position_by_date(date) {
    if (!date) return 0;

    //TODO SR: New special calculation for the Month view:
    // config.unit is parsed from the mode.step
    // Attention! The "month" step option is still not correct. Fix it!
    if (this.config.unit === 'month') {
      const gantt_month_start = date_utils.start_of(this.gantt_start, 'month');
      const date_month_start = date_utils.start_of(date, 'month');
      const month_diff =
          (date_month_start.getFullYear() - gantt_month_start.getFullYear()) * 12 +
          (date_month_start.getMonth() - gantt_month_start.getMonth());
      const day_offset =
          date.getDate() -
          1 +
          date.getHours() / 24 +
          date.getMinutes() / 1440 +
          date.getSeconds() / 86400 +
          date.getMilliseconds() / 86400000;

      return (
          month_diff + day_offset / date_utils.get_days_in_month(date)
      ) * this.config.column_width;
    }

    if (this.config.unit === 'year') {
      const gantt_year_start = date_utils.start_of(this.gantt_start, 'year');
      const date_year_start = date_utils.start_of(date, 'year');
      const year_diff =
          date_year_start.getFullYear() - gantt_year_start.getFullYear();
      const day_offset =
          date_utils.diff(date, date_year_start, 'day') +
          date.getHours() / 24 +
          date.getMinutes() / 1440 +
          date.getSeconds() / 86400 +
          date.getMilliseconds() / 86400000;

      return (
          year_diff + day_offset / date_utils.get_days_in_year(date)
      ) * this.config.column_width;
    }
    // This works as usual:
    const diff_in_units = date_utils.diff(date, this.gantt_start, this.config.unit);
    return (diff_in_units / this.config.step) * this.config.column_width;
  }

  // >>> SR: Date calculation after change fix ---------------------------------
  get_date_by_position(x) {
    if (!x) return date_utils.clone(this.gantt_start);

    const units = (x / this.config.column_width) * this.config.step;

    if (this.config.unit === 'month') {
      return this.get_date_by_month_position(units);
    }

    if (this.config.unit === 'year') {
      return this.get_date_by_year_position(units);
    }

    return this.add_precise_units(this.gantt_start, units, this.config.unit);
  }

  get_date_by_month_position(month_units) {
    const gantt_month_start = date_utils.start_of(this.gantt_start, 'month');
    const whole_months = Math.floor(month_units);
    const month_fraction = month_units - whole_months;
    const month_start = date_utils.add(gantt_month_start, whole_months, 'month');
    const day_offset = month_fraction * date_utils.get_days_in_month(month_start);

    return this.add_precise_units(month_start, day_offset, 'day');
  }

  get_date_by_year_position(year_units) {
    const gantt_year_start = date_utils.start_of(this.gantt_start, 'year');
    const whole_years = Math.floor(year_units);
    const year_fraction = year_units - whole_years;
    const year_start = date_utils.add(gantt_year_start, whole_years, 'year');
    const day_offset = year_fraction * date_utils.get_days_in_year(year_start);

    return this.add_precise_units(year_start, day_offset, 'day');
  }

  add_precise_units(date, qty, unit) {
    const MS_PER_UNIT = {
      millisecond: 1,
      second: 1000,
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
    };

    const ms_per_unit = MS_PER_UNIT[unit];
    if (ms_per_unit) {
      return new Date(date.getTime() + qty * ms_per_unit);
    }

    return date_utils.add(date, qty, unit);
  }
  // <<< SR: Date calculation after change fix ---------------------------------
  // <<< SR: Date calculation Fix ----------------------------------------------
  
  /**
   * It computes the row and lane allocation for all tasks.
   */
  compute_rows_and_lanes() {
      // 1) Row key per task (lineIndex preferred)
      this.tasks.forEach(t => {
        t._rowKey = (t.lineIndex !== undefined) ? t.lineIndex : t._index;
      });
  
      // 2) Group by row
      const rowMap = new Map();
      this.tasks.forEach(t => {
        if (!rowMap.has(t._rowKey)) rowMap.set(t._rowKey, []);
        rowMap.get(t._rowKey).push(t);
      });
      
      // 3) Sorting row list:
      //    - if options.row_keys is set -> use these
      //    - otherwise: all keys from the tasks
      let rows;
      if (Array.isArray(this.options.row_keys) && this.options.row_keys.length) {
        rows = this.options.row_keys.slice();
      } else {
        rows = Array.from(rowMap.keys()).sort((a, b) =>
            a > b ? 1 : a < b ? -1 : 0
        );
      }
  
      // 4) Lane allocation per row (greedy)
      const rowMeta = [];
      rows.forEach((rowKey, rowIndex) => {
  
        const list = (rowMap.get(rowKey) || []).slice().sort((a, b) => +a._start - +b._start);
        const laneEnds = []; // laneIndex -> Date
  
        list.forEach(task => {
          let lane = 0;
          while (lane < laneEnds.length && !(laneEnds[lane] <= task._start)) lane++;
          task._lane = lane;
          task._rowIndex = rowIndex;
          laneEnds[lane] = task._end;
        });
  
        // calculates the overlap cluster size per task
        list.forEach(task => {
          // All tasks in the same row that overlap with another task bar:
          const overlapping = list.filter(t =>
              // classical interval overlap: [start_a, end_a) ∩ [start_b, end_b) ≠ ∅
              (t !== task) && (t._start < task._end) && (task._start < t._end)
          );
          // Number of lanes occupied during THIS time slot:
          const lanesSet = new Set([task._lane, ...overlapping.map(t => t._lane)]);
          task._clusterLanes = Math.max(1, lanesSet.size);
        });
  
        rowMeta.push({
          key: rowKey,
          index: rowIndex,
          lanes: Math.max(1, laneEnds.length),
          height: this.options.row_height,
        });
      });
  
      // 5) Top offsets with fixed row height
      let cum = 0;
      rowMeta.forEach(r => {
        r.top = cum;
        cum += r.height; // fix for each row
      });
  
      this._rows = rows;
      this._rowMeta = rowMeta;
    }

    /**
     * It aggregates overlapping tasks into one special aggregation bar.
     */
    compute_overlap_aggregates() {
      // Reset
      this.tasks.forEach(t => {
        t._hidden = false;
        t._isAggregate = false;
        t._aggMembers = undefined;
        t._aggregatedBy = undefined;
      });
      this._aggregateBars = [];
  
      const byEndStartId = (a,b) => {
        // Greedy für Top-Lane: sort by end, then start, then id
        if (+a._end !== +b._end) return +a._end - +b._end;
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
      // >>> SR: Priority aggregation top lane --------------------------------
      // Returns true when a task has a numeric priority. Rows without priority
      // keep the previous top-lane sorting unchanged.
      const hasPriority = (task) => Number.isFinite(Number(task?.priority));

      const overlaps = (a,b) => (a._start < b._end) && (b._start < a._end);

      const byPriorityThenEndStartId = (a,b) => {
        const aHasPriority = hasPriority(a);
        const bHasPriority = hasPriority(b);

        if (aHasPriority || bHasPriority) {
          if (aHasPriority && bHasPriority) {
            const priorityDiff = Number(b.priority) - Number(a.priority);
            if (priorityDiff !== 0) return priorityDiff;
          } else {
            return aHasPriority ? -1 : 1;
          }
        }

        return byEndStartId(a,b);
      };

      // >>> SR: Configurable row lanes ---------------------------------------
      /**
       * Selects all visible upper-lane tasks for one row.
       * The bottom lane is reserved for a single hidden task or an aggregate.
       * If no priority is present and row_lanes is 2, this keeps the previous
       * top-lane interval scheduling unchanged.
       */
      const selectUpperLanes = (listRaw, upperLaneCount) => {
        const rowHasPriority = listRaw.some(hasPriority);
        const candidates = listRaw.slice().sort(
            rowHasPriority ? byPriorityThenEndStartId : byEndStartId,
        );

        const lanes = Array.from({ length: upperLaneCount }, () => []);

        if (rowHasPriority) {
          for (const t of candidates) {
            const targetLaneIndex = lanes.findIndex(
                lane => !lane.some(selected => overlaps(selected, t)),
            );
            if (targetLaneIndex !== -1) {
              lanes[targetLaneIndex].push(t);
              t._lane = targetLaneIndex;
            }
          }
        } else {
          const remaining = new Set(candidates);
          lanes.forEach((lane, laneIndex) => {
            let lastEnd = null;
            for (const t of candidates) {
              if (!remaining.has(t)) continue;
              if (lastEnd == null || t._start >= lastEnd) {
                lane.push(t);
                t._lane = laneIndex;
                lastEnd = t._end;
                remaining.delete(t);
              }
            }
          });
        }

        return lanes.flat().sort(byStartThenId);
      };
      // <<< SR: Configurable row lanes ---------------------------------------
      // <<< SR: Priority aggregation top lane --------------------------------
      const byStartThenId = (a,b) => {
        if (+a._start !== +b._start) return +a._start - +b._start;
        const ia = isFinite(+a.id) ? +a.id : String(a.id);
        const ib = isFinite(+b.id) ? +b.id : String(b.id);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
      const fmt = this.options.date_format || 'YYYY-MM-dd';
  
      // group rows
      const rows = new Map();
      this.tasks.forEach(t => {
        const key = (t._rowIndex != null) ? t._rowIndex : t._index;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push(t);
      });
  
      for (const [rowIndex, listRaw] of rows.entries()) {
        if (!listRaw.length) continue;
  
        // 1) upper lanes via interval scheduling, optionally priority-aware
        // >>> SR: Priority aggregation top lane ------------------------------
        // >>> SR: Configurable row lanes -------------------------------------
        const bottomLane = this.get_aggregation_lane_index();
        const topLane = selectUpperLanes(listRaw, bottomLane);
        // <<< SR: Configurable row lanes -------------------------------------
        // <<< SR: Priority aggregation top lane ------------------------------
  
        const topSet = new Set(topLane);
        const hidden = listRaw.filter(t => !topSet.has(t)); // everything that is not at the top
  
        // Set lanes
        topLane.forEach(t => { t._rowIndex = rowIndex; });
        const rowHasAggregates = hidden.length > 0;
  
        if (!rowHasAggregates) {
          // 1. lane if not hidden
          topLane.forEach(t => { t._clusterLanes = 1; });
          continue;
        }
  
        // 2) Summarise hidden: sort with start and form union
        hidden.sort(byStartThenId);
        
        const aggs = [];
        let curStart = null, curEnd = null;
        let curMembers = new Set();
  
        const flush = () => {
          if (!curStart) return;
  
          const membersArr = Array.from(curMembers);
          if (membersArr.length >= 2) {
            // aggregation build
            let minStart = membersArr[0]._start, maxEnd = membersArr[0]._end;
            for (const m of membersArr) {
              // >>> SR: Date calculation Fix ----------------------------------
              const orig_end = m._end;
              // <<< SR: Date calculation Fix ----------------------------------
              
              if (m._start < minStart) minStart = m._start;
              //if (m._end > maxEnd) maxEnd = m._end; 
              // TODO SR: Date without hours fix. Test it.
              if (orig_end > maxEnd) maxEnd = orig_end;
            }
            
            const agg = {
              id: `agg_${rowIndex}_${this._aggregateBars.length + aggs.length}`,
              name: `+${membersArr.length}`,
              start: date_utils.format(minStart, fmt),
                
              //TODO SR: Check if it is needed for the time formating
              end: date_utils.format(maxEnd, fmt),
              
/*              end: this.options.step >= 24 && (this.options.step % 24) === 0
                  ? date_utils.format(date_utils.add(maxEnd, -24, 'hour'), fmt)
                  : date_utils.format(date_utils.add(maxEnd, -1, 'second'), fmt),*/
  
              _start: minStart,
              _end: maxEnd,
              _rowIndex: rowIndex,
              // >>> SR: Configurable row lanes -------------------------------
              _lane: bottomLane,         // always at the configured bottom lane
              _clusterLanes: this.options.row_lanes, // (Relayout sets real value later)
              // <<< SR: Configurable row lanes -------------------------------
              lineIndex: membersArr[0].lineIndex,
  
              draggable: false,
              progress: 0,
              
              // standard colors for aggregates
              color: '#d2d2ef',
              colorHover: '#c1c1dd',
              progressColor: '#a3a3ff',
              textColor: '#fff',
  
              custom_class: 'aggregate',
              _isAggregate: true,
              
              _members: membersArr.map(m => ({
                id: m.id, 
                name: m.name, 
                _start: m._start,
                _end: m._end,
                end: m.end, //TODO SR: Date without hours fix. Test it.
                color: m.color,
                // >>> SR: Priority aggregation top lane ----------------------
                priority: m.priority,
                // <<< SR: Priority aggregation top lane ----------------------
                actual_duration: m.actual_duration, //TODO SR: It is undefined here because it is only set under "bar.compute_duration()".
                ignored_duration: m.ignored_duration //TODO SR: It is undefined here because it is only set under "bar.compute_duration()".
              })),
              _memberNames: membersArr.map(m => m.name),
            };
  
            // hide members
            membersArr.forEach(m => { m._hidden = true; m._aggregatedBy = agg.id; });
            aggs.push(agg);
  
          } else if (membersArr.length === 1) {
            // No aggregation, if the bottom lane have only one task
            const single = membersArr[0];
            single._hidden = false;
            single._aggregatedBy = undefined;
            // >>> SR: Configurable row lanes ---------------------------------
            single._lane = bottomLane;
            // <<< SR: Configurable row lanes ---------------------------------
            single._rowIndex = rowIndex;
          }
  
          curStart = curEnd = null;
          curMembers.clear();
        };
  
        for (const t of hidden) {
          if (curStart == null) {
            curStart = t._start;
            curEnd = t._end;
            curMembers.add(t);
          } else if (t._start < curEnd) {
            // overlaps -> in this union segment
            if (t._end > curEnd) curEnd = t._end;
            curMembers.add(t);
          } else {
            // Gap -> flush old segment and start a new one
            flush();
            curStart = t._start;
            curEnd = t._end;
            curMembers.add(t);
          }
        }
        flush();
  
        // Take over aggregate bars
        this._aggregateBars.push(...aggs);
      }
    }

  /**
   * It re-calculates the visible rows, lanes and cluster sizes after aggregation.
   */
  relayout_visible_rows() {
      const visible = this.tasks.filter(t => !t._hidden)
      .concat(this._aggregateBars || []);
  
      const rowMap = new Map();
      visible.forEach(t => {
        const key = (t._rowIndex != null) ? t._rowIndex : t._index;
        if (!rowMap.has(key)) rowMap.set(key, []);
        rowMap.get(key).push(t);
      });
  
      const idKey = (t) => (Number.isFinite(+t.id) ? +t.id : String(t.id));
      const byStartThenId = (a,b) => {
        const da = +a._start, db = +b._start;
        if (da !== db) return da - db;
        const ia = idKey(a), ib = idKey(b);
        return ia > ib ? 1 : ia < ib ? -1 : 0;
      };
  
      rowMap.forEach((list, rowIndex) => {
        // hard resets for each row
        list.forEach(t => {
          t._rowIndex = rowIndex;
          // >>> SR: Configurable row lanes -----------------------------------
          // Keep lane assignments from compute_overlap_aggregates(). They
          // already decide which upper lanes remain visible before lower tasks
          // are aggregated into the configured bottom lane.
          t._lane = Number.isInteger(t._lane) ? t._lane : undefined;
          // <<< SR: Configurable row lanes -----------------------------------
          t._clusterLanes = 1; // Default
        });
  
        const overlaps = (a,b) => (a._start < b._end) && (b._start < a._end);
  
        const aggs = list.filter(t => t._isAggregate === true);
        const topsAll = list.filter(t => !t._isAggregate).sort(byStartThenId);
        // >>> SR: Configurable row lanes -------------------------------------
        const bottomLane = this.get_aggregation_lane_index();
        const upperLaneCount = bottomLane;
        // <<< SR: Configurable row lanes -------------------------------------
  
        // 1) Aggregates always on the bottom lane (they have partners above)
        aggs.forEach(a => {
          // >>> SR: Configurable row lanes -----------------------------------
          a._lane = bottomLane;
          a._clusterLanes = this.options.row_lanes;
          // <<< SR: Configurable row lanes -----------------------------------
        });
  
        // Top-Tasks:
        // 2) Tasks that already got an upper lane stay there; tasks without a
        // lane are placed in the first free upper lane.
        const hitAgg = [];
        const noAgg  = [];
        topsAll.forEach(t => (aggs.some(a => overlaps(t,a)) ? hitAgg : noAgg).push(t));
  
        // 3) Collect allocations per lane (by time)
        const laneTasks = new Map(); // lane -> Array<Task>
        const assignToLane = (task, lane) => {
          task._lane = lane;
          if (!laneTasks.has(lane)) laneTasks.set(lane, []);
          laneTasks.get(lane).push(task);
        };
  
        // Seed: already assigned (aggregate + hitAgg)
        // >>> SR: Configurable row lanes -------------------------------------
        aggs.forEach(a => assignToLane(a, bottomLane));
        hitAgg.forEach(t => {
          const lane = Number.isInteger(t._lane) && t._lane < upperLaneCount
              ? t._lane
              : 0;
          assignToLane(t, lane);
        });
        // <<< SR: Configurable row lanes -------------------------------------
  
        // 4) Place noAgg in the first collision-free lane, sorted by start
        // >>> SR: Configurable row lanes -------------------------------------
        const placeInFirstFreeLane = (t) => {
          let lane = 0;
          while (lane < this.options.row_lanes) {
            const arr = laneTasks.get(lane) || [];
            const collides = arr.some(x => overlaps(t, x));
            if (!collides) {
              assignToLane(t, lane);
              break;
            }
            lane++;
          }

          if (t._lane == null) {
            assignToLane(t, bottomLane);
          }
        };

        const unassignedNoAgg = [];
        const noAggWithLane = noAgg.filter(
            t => Number.isInteger(t._lane) && t._lane < this.options.row_lanes,
        );
        const noAggWithoutLane = noAgg.filter(t => !noAggWithLane.includes(t));

        noAggWithLane
            .sort((a, b) => a._lane - b._lane || byStartThenId(a, b))
            .forEach(t => {
              const arr = laneTasks.get(t._lane) || [];
              if (!arr.some(x => overlaps(t, x))) {
                assignToLane(t, t._lane);
              } else {
                t._lane = undefined;
                unassignedNoAgg.push(t);
              }
            });

        noAggWithoutLane
            .concat(unassignedNoAgg)
            .sort(byStartThenId)
            .forEach(placeInFirstFreeLane);
        // <<< SR: Configurable row lanes -------------------------------------
  
        // 5) define cluster lanes (visible only)
        const visible = list;
        visible.forEach(t => {
          const sameRow = visible.filter(o => o !== t && overlaps(o, t));
          // >>> SR: Configurable row lanes -----------------------------------
          const overlappingLanes = [t._lane, ...sameRow.map(o => o._lane)]
              .filter(lane => Number.isInteger(lane));
          t._clusterLanes = Math.max(0, ...overlappingLanes) + 1;
          // <<< SR: Configurable row lanes -----------------------------------
        });
      });
    }

    // >>> SR: Configurable row lanes -----------------------------------------
    /**
     * Returns the lane index reserved for single lower-row tasks or aggregate
     * bars. The value depends on the configured row_lanes option.
     */
    get_aggregation_lane_index() {
      return Math.max(1, this.options.row_lanes - 1);
    }
    // <<< SR: Configurable row lanes -----------------------------------------

    /**
     * Gets the total content height based on the number of rows and row height
     * @returns {number}
     */
    get_content_height() {
      // Height of the content zone = rows * row_height
      return (this._rows?.length || 0) * this.options.row_height;
    }

    /**
     * Binds the outside click to hide popups and unselect tasks.
     */
    bind_outside_click() {
      this._onDocClick = (e) => {
  
        if (this.bar_being_dragged) return;
  
        const container = this.$container;
        const target = e.target;
  
        // >>> SR: Aggregation popup Gantt outside click -----------------------
        if (
            (container && container.contains(target)) ||
            this.$popup_wrapper?.contains(target)
        ) return;
        // <<< SR: Aggregation popup Gantt outside click -----------------------
  
        // If clicked outside the gantt chard
        this.hide_popup();
        this.unselect_all();
      };
      document.addEventListener('mousedown', this._onDocClick, true);
    }

  // <<< SR: Bar Aggregation ---------------------------------------------------
}

Gantt.VIEW_MODE = {
  // >>> SR: Bar Aggregation ---------------------------------------------------
  // It currently doesn't work properly with PowerUI
/*    HOUR: DEFAULT_VIEW_MODES[0],
    QUARTER_DAY: DEFAULT_VIEW_MODES[1],
    HALF_DAY: DEFAULT_VIEW_MODES[2],*/
  // <<< SR: Bar Aggregation ---------------------------------------------------
    DAY: DEFAULT_VIEW_MODES[0],
    WEEK: DEFAULT_VIEW_MODES[1],
    MONTH: DEFAULT_VIEW_MODES[2],
    YEAR: DEFAULT_VIEW_MODES[3],
};

function generate_id(task) {
    return task.name + '_' + Math.random().toString(36).slice(2, 12);
}

function sanitize(s) {
    return s.replaceAll(' ', '_').replaceAll(':', '_').replaceAll('.', '_');
}
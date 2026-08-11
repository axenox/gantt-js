import date_utils from './date_utils';
import { $, createSVG, animateSVG } from './svg_utils';

export default class Bar {
    constructor(gantt, task) {
        this.set_defaults(gantt, task);
        this.prepare_wrappers();
        this.prepare_helpers();
        this.refresh();
    }

    refresh() {
        this.bar_group.innerHTML = '';
        this.handle_group.innerHTML = '';
        if (this.task.custom_class) {
            this.group.classList.add(this.task.custom_class);
        } else {
            this.group.classList = ['bar-wrapper'];
        }

        this.prepare_values();
        this.draw();
        this.bind();
    }

    set_defaults(gantt, task) {
        this.action_completed = false;
        this.gantt = gantt;
        this.task = task;
        this.name = this.name || '';
    }

    prepare_wrappers() {
        this.group = createSVG('g', {
            class:
                'bar-wrapper' +
                (this.task.custom_class ? ' ' + this.task.custom_class : ''),
            'data-id': this.task.id,
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group,
        });
        this.handle_group = createSVG('g', {
            class: 'handle-group',
            append_to: this.group,
        });
    }

    prepare_values() {
        this.invalid = this.task.invalid;
        // >>> SR: Bar Aggregation ---------------------------------------------
        this.height = this.get_bar_height_for_task(this.task);
        // <<< SR: Bar Aggregation ---------------------------------------------
        
        this.image_size = this.height - 5;
        
        // >>> SR: Bar Aggregation ---------------------------------------------
        //this.task._start = date_utils.parse(this.task.start);
        //this.task._end = date_utils.parse(this.task.end);
      
        // attention, this.task.end is nullable!
        // >>> SR: Date calculation Fix ------------------------------------
        // Use the already normalized local _end date. Native new Date('YYYY-MM-DD')
        // parses as UTC and can create small offsets around DST changes.
        this.task.orig_end = this.task.end ? date_utils.clone(this.task._end) : null; //TODO SR: Date without hours fix. Test it.
        // <<< SR: Date calculation Fix ------------------------------------
        // <<< SR: Bar Aggregation ---------------------------------------------
        this.compute_x();
        this.compute_y();
        this.compute_duration();

        // >>> SR: Bar Aggregation ---------------------------------------------
        this.corner_radius = Math.min(this.gantt.options.bar_corner_radius, this.height / 2);
        // <<< SR: Bar Aggregation ---------------------------------------------

        // <<< SR: Date calculation Fix ---------------------------------------------
        this.width = this.compute_width();
        // >>> SR: Date calculation Fix ---------------------------------------------
        if (!this.task.progress || this.task.progress < 0)
            this.task.progress = 0;
        if (this.task.progress > 100) this.task.progress = 100;
    }

    prepare_helpers() {
        SVGElement.prototype.getX = function () {
            return +this.getAttribute('x');
        };
        SVGElement.prototype.getY = function () {
            return +this.getAttribute('y');
        };
        SVGElement.prototype.getWidth = function () {
            return +this.getAttribute('width');
        };
        SVGElement.prototype.getHeight = function () {
            return +this.getAttribute('height');
        };
        SVGElement.prototype.getEndX = function () {
            return this.getX() + this.getWidth();
        };
    }

    prepare_expected_progress_values() {
        this.compute_expected_progress();
        this.expected_progress_width =
            this.gantt.options.column_width *
                this.duration *
                (this.expected_progress / 100) || 0;
    }

    draw() {
        this.draw_bar();
        this.draw_progress_bar();
        if (this.gantt.options.show_expected_progress) {
            this.prepare_expected_progress_values();
            this.draw_expected_progress_bar();
        }
        this.draw_label();
        this.draw_resize_handles();

        if (this.task.thumbnail) {
            this.draw_thumbnail();
        }
    }

    draw_bar() {
        this.$bar = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar',
            append_to: this.bar_group,
        });

        // >>> SR: Bar Aggregation ---------------------------------------------
        this.set_bar_colors();
        this.build_aggregation_bar();
        // <<< SR: Bar Aggregation ---------------------------------------------
        
        animateSVG(this.$bar, 'width', 0, this.width);
        
        if (this.invalid) {
            this.$bar.classList.add('bar-invalid');
        }

        // >>> SR: bar invalid overlay -----------------------------------------
        if (this.task.dateIncomplete) {
          this.$bar.classList.add('bar-date-incomplete');
          this.draw_invalid_overlay();
        }
        // <<< SR: bar invalid overlay -----------------------------------------
    }

    draw_expected_progress_bar() {
        if (this.invalid) return;
        this.$expected_bar_progress = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.expected_progress_width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar-expected-progress',
            append_to: this.bar_group,
        });

        animateSVG(
            this.$expected_bar_progress,
            'width',
            0,
            this.expected_progress_width,
        );
    }

    draw_progress_bar() {
        if (this.invalid) return;
        this.progress_width = this.calculate_progress_width();
        let r = this.corner_radius;
        if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
            r = this.corner_radius + 2;
        this.$bar_progress = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.progress_width,
            height: this.height,
            rx: r,
            ry: r,
            class: 'bar-progress',
            append_to: this.bar_group,
        });
        if (this.task.color_progress)
            this.$bar_progress.style.fill = this.task.color_progress;
        // >>> SR: Date calculation Fix ---------------------------------------------
        const x = this.gantt.get_position_by_date(this.task._start);
        // <<< SR: Date calculation Fix ---------------------------------------------
        let $date_highlight = this.gantt.create_el({
            classes: `date-range-highlight hide highlight-${this.task.id}`,
            width: this.width,
            left: x,
        });
        this.$date_highlight = $date_highlight;
        this.gantt.$lower_header.prepend(this.$date_highlight);

        animateSVG(this.$bar_progress, 'width', 0, this.progress_width);
    }

    calculate_progress_width() {
        const width = this.$bar.getWidth();
        const ignored_end = this.x + width;
        const total_ignored_area =
            this.gantt.config.ignored_positions.reduce((acc, val) => {
                return acc + (val >= this.x && val < ignored_end);
            }, 0) * this.gantt.config.column_width;
        let progress_width =
            ((width - total_ignored_area) * this.task.progress) / 100;
        const progress_end = this.x + progress_width;
        const total_ignored_progress =
            this.gantt.config.ignored_positions.reduce((acc, val) => {
                return acc + (val >= this.x && val < progress_end);
            }, 0) * this.gantt.config.column_width;

        progress_width += total_ignored_progress;

        let ignored_regions = this.gantt.get_ignored_region(
            this.x + progress_width,
        );

        while (ignored_regions.length) {
            progress_width += this.gantt.config.column_width;
            ignored_regions = this.gantt.get_ignored_region(
                this.x + progress_width,
            );
        }
        this.progress_width = progress_width;
        return progress_width;
    }

    draw_label() {
        let x_coord = this.x + this.$bar.getWidth() / 2;

        if (this.task.thumbnail) {
            x_coord = this.x + this.image_size + 5;
        }

        // >>> SR: Bar Aggregation ---------------------------------------------
        const $label = createSVG('text', {
            x: x_coord,
            y: this.y + this.height / 2,
            innerHTML: this.task.name,
            class: 'bar-label',
            append_to: this.bar_group,
        });
        
        if (this.task.textColor) {
          $label.style.fill = String(this.task.textColor);
        }
        // <<< SR: Bar Aggregation ---------------------------------------------
        
        // labels get BBox in the next tick
        requestAnimationFrame(() => this.update_label_position());
    }

    draw_thumbnail() {
        let x_offset = 10,
            y_offset = 2;
        let defs, clipPath;

        defs = createSVG('defs', {
            append_to: this.bar_group,
        });

        createSVG('rect', {
            id: 'rect_' + this.task.id,
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            rx: '15',
            class: 'img_mask',
            append_to: defs,
        });

        clipPath = createSVG('clipPath', {
            id: 'clip_' + this.task.id,
            append_to: defs,
        });

        createSVG('use', {
            href: '#rect_' + this.task.id,
            append_to: clipPath,
        });

        createSVG('image', {
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            class: 'bar-img',
            href: this.task.thumbnail,
            clipPath: 'clip_' + this.task.id,
            append_to: this.bar_group,
        });
    }

    draw_resize_handles() {
        if (this.invalid || this.gantt.options.readonly) return;

        const bar = this.$bar;
        const handle_width = 3;
        this.handles = [];
        if (!this.gantt.options.readonly_dates) {
            this.handles.push(
                createSVG('rect', {
                    x: bar.getEndX() - handle_width / 2,
                    y: bar.getY() + this.height / 4,
                    width: handle_width,
                    height: this.height / 2,
                    rx: 2,
                    ry: 2,
                    class: 'handle right',
                    append_to: this.handle_group,
                }),
            );

            this.handles.push(
                createSVG('rect', {
                    x: bar.getX() - handle_width / 2,
                    y: bar.getY() + this.height / 4,
                    width: handle_width,
                    height: this.height / 2,
                    rx: 2,
                    ry: 2,
                    class: 'handle left',
                    append_to: this.handle_group,
                }),
            );
        }
        if (!this.gantt.options.readonly_progress) {
            const bar_progress = this.$bar_progress;
            this.$handle_progress = createSVG('circle', {
                cx: bar_progress.getEndX(),
                cy: bar_progress.getY() + bar_progress.getHeight() / 2,
                r: 4.5,
                class: 'handle progress',
                append_to: this.handle_group,
            });
            this.handles.push(this.$handle_progress);
        }

        for (let handle of this.handles) {
            $.on(handle, 'mouseenter', () => handle.classList.add('active'));
            $.on(handle, 'mouseleave', () => handle.classList.remove('active'));
        }
    }

    bind() {
      // >>> SR: Bar Aggregation -----------------------------------------------
        // the invalid case is treated inside setup_click_event()
        //if (this.invalid) return;
      // <<< SR: Bar Aggregation -----------------------------------------------
        this.setup_click_event();
    }

    setup_click_event() {
        let task_id = this.task.id;
        $.on(this.group, 'mouseover', (e) => {
            this.gantt.trigger_event('hover', [
                this.task,
                e.screenX,
                e.screenY,
                e,
            ]);
        });

        if (this.gantt.options.popup_on === 'click') {
            $.on(this.group, 'mouseup', (e) => {
                const posX = e.offsetX || e.layerX;
                if (this.$handle_progress) {
                    const cx = +this.$handle_progress.getAttribute('cx');
                    if (cx > posX - 1 && cx < posX + 1) return;
                    if (this.gantt.bar_being_dragged) return;
                }
                this.gantt.show_popup({
                    x: e.offsetX || e.layerX,
                    y: e.offsetY || e.layerY,
                    task: this.task,
                    target: this.$bar,
                });
            });
        }
        let timeout;
        $.on(this.group, 'mouseenter', (e) => {
            timeout = setTimeout(() => {
                if (this.gantt.options.popup_on === 'hover')
                    this.gantt.show_popup({
                        x: e.offsetX || e.layerX,
                        y: e.offsetY || e.layerY,
                        task: this.task,
                        target: this.$bar,
                    });
                // >>> SR: Bar Aggregation -------------------------------------
                //New: Added "CSS.escape" to escape special characters in task IDs
                if(!this.invalid) {
                  this.gantt.$container
                    .querySelector(`.highlight-${CSS.escape(task_id)}`)
                    .classList.remove('hide');
                }
                // <<< SR: Bar Aggregation -------------------------------------
          }, 200);
        });
        $.on(this.group, 'mouseleave', () => {
            clearTimeout(timeout);
            if (this.gantt.options.popup_on === 'hover')
                this.gantt.popup?.hide?.();
            
            // >>> SR: Bar Aggregation -----------------------------------------
          if(!this.invalid) {
            //New: Added "CSS.escape" to escape special characters in task IDs
            this.gantt.$container
                .querySelector(`.highlight-${CSS.escape(task_id)}`)
                .classList.add('hide');
          }
            // <<< SR: Bar Aggregation -----------------------------------------
        });

        $.on(this.group, 'click', () => {
            this.gantt.trigger_event('click', [this.task]);
        });

        $.on(this.group, 'dblclick', (e) => {
            if (this.action_completed) {
                // just finished a move action, wait for a few seconds
                return;
            }
            this.group.classList.remove('active');
            if (this.gantt.popup)
                this.gantt.popup.parent.classList.remove('hide');

            this.gantt.trigger_event('double_click', [this.task]);
        });
        let tapedTwice = false;
        $.on(this.group, 'touchstart', (e) => {
            if (!tapedTwice) {
                tapedTwice = true;
                setTimeout(function () {
                    tapedTwice = false;
                }, 300);
                return false;
            }
            e.preventDefault();
            //action on double tap goes below

            if (this.action_completed) {
                // just finished a move action, wait for a few seconds
                return;
            }
            this.group.classList.remove('active');
            if (this.gantt.popup)
                this.gantt.popup.parent.classList.remove('hide');

            this.gantt.trigger_event('double_click', [this.task]);
        });
    }

    update_bar_position({ x = null, width = null }) {
        // >>> SR: Bar Aggregation ---------------------------------------------
        if (this.invalid) return;
        // <<< SR: Bar Aggregation ---------------------------------------------
      
        const bar = this.$bar;

        if (x) {
            const xs = this.task.dependencies.map((dep) => {
                return this.gantt.get_bar(dep).$bar.getX();
            });
            const valid_x = xs.reduce((prev, curr) => {
                return prev && x >= curr;
            }, true);
            if (!valid_x) return;
            this.update_attr(bar, 'x', x);
            this.x = x;
            this.$date_highlight.style.left = x + 'px';
        }
        if (width > 0) {
            this.update_attr(bar, 'width', width);
            this.$date_highlight.style.width = width + 'px';
        }

        this.update_label_position();
        this.update_handle_position();

        //TODO SR: (rerender  of aggregate bars problem) If you comment out the bottom line, on_date_change will only be triggered on drop. 
        // However, this does not solve the problem: the tasks do not stack up and the task status is not updated.
        this.date_changed();
        this.compute_duration();

        if (this.gantt.options.show_expected_progress) {
            this.update_expected_progressbar_position();
        }

        this.update_progressbar_position();
        this.update_arrow_position();

        // >>> SR: bar invalid overlay -----------------------------------------
        this.update_invalid_overlay_position(x, width);
        // <<< SR: bar invalid overlay -----------------------------------------
    }
    
    // >>> SR: Initial auto moving labels ------------------------------------------
    /**
     * Aligns an inside-bar label with the current horizontal viewport center and
     * keeps it clamped inside the task bar, so long task titles are visible even
     * before the user has scrolled back and forth.
     */
    update_label_position_for_current_viewport(sx = this.gantt.$container.scrollLeft) {
        const container = this.gantt.$container;
        const label = this.group.querySelector('.bar-label');
        const img = this.group.querySelector('.bar-img') || '';
        const img_mask = this.bar_group.querySelector('.img_mask') || '';

        if (!container || !label || label.classList.contains('big')) return;

        const padding = 5;
        const trailingPadding = 7;
        const barStartX = this.$bar.getX();
        const barEndX = this.$bar.getEndX();
        const barWidth = this.$bar.getWidth();
        const labelWidth = label.getBBox().width;
        const imgWidth = (img && img.getBBox().width + trailingPadding) || 0;

        if (labelWidth > barWidth) return;

        const viewportStart = sx;
        const viewportEnd = sx + container.clientWidth;
        const currentLabelX = label.getX();
        const currentLabelEndX = currentLabelX + labelWidth + trailingPadding;
        const labelIsFullyVisible =
            currentLabelX >= viewportStart && currentLabelEndX <= viewportEnd;

        if (barWidth <= container.clientWidth && labelIsFullyVisible) return;

        const minLabelX = barStartX + (img ? imgWidth : padding);
        const maxLabelX = barEndX - labelWidth - trailingPadding;
        if (maxLabelX < minLabelX) return;

        const viewportCentral = sx + container.clientWidth / 2;
        const centeredLabelX = viewportCentral - labelWidth - trailingPadding;
        const nextLabelX = Math.min(
            Math.max(centeredLabelX, minLabelX),
            maxLabelX,
        );

        if (Math.abs(currentLabelX - nextLabelX) < 0.1) return;

        label.setAttribute('x', nextLabelX);

        if (img) {
            const nextImgX = Math.max(barStartX + padding, nextLabelX - imgWidth);
            img.setAttribute('x', nextImgX);
            img_mask.setAttribute('x', nextImgX);
        }
    }

    // >>> SR: Continuous auto moving labels --------------------------------------
    /**
     * Moves inside-bar labels continuously with the horizontal scroll delta once
     * the viewport center reaches the label, preserving the original scrolling
     * behavior while initial rendering can still pre-align long task labels.
     */
    update_label_position_on_horizontal_scroll({ x, sx }) {
        const container = this.gantt.$container;
        const label = this.group.querySelector('.bar-label');
        const img = this.group.querySelector('.bar-img') || '';
        const img_mask = this.bar_group.querySelector('.img_mask') || '';

        if (!container || !label || label.classList.contains('big')) return;

        const padding = 5;
        const trailingPadding = 7;
        const barStartX = this.$bar.getX();
        const barEndX = this.$bar.getEndX();
        const labelWidth = label.getBBox().width;
        const imgWidth =
            (img && img.getBBox().width + trailingPadding) || trailingPadding;
        const minLabelX = barStartX + (img ? imgWidth : padding);
        const currentLabelX = label.getX();
        const currentImgX = (img && img.getX()) || 0;
        const viewportCentral = sx + container.clientWidth / 2;
        const scrollDelta = x;

        if (!scrollDelta) return;

        const nextLabelX = currentLabelX + scrollDelta;
        const nextImgX = currentImgX + scrollDelta;
        const nextLabelEndX = nextLabelX + labelWidth + trailingPadding;

        if (
            scrollDelta > 0 &&
            nextLabelEndX <= viewportCentral &&
            nextLabelEndX < barEndX
        ) {
            label.setAttribute('x', nextLabelX);
            if (img) {
                img.setAttribute('x', nextImgX);
                img_mask.setAttribute('x', nextImgX);
            }
        } else if (
            scrollDelta < 0 &&
            nextLabelEndX >= viewportCentral &&
            nextLabelX >= minLabelX
        ) {
            label.setAttribute('x', nextLabelX);
            if (img) {
                img.setAttribute('x', nextImgX);
                img_mask.setAttribute('x', nextImgX);
            }
        }
    }
    // <<< SR: Continuous auto moving labels --------------------------------------
    // <<< SR: Initial auto moving labels ------------------------------------------

    date_changed() {
        let changed = false;
        const { new_start_date, new_end_date } = this.compute_start_end_date();
        if (Number(this.task._start) !== Number(new_start_date)) {
            changed = true;
            this.task._start = new_start_date;
        }

        // >>> SR: Bar Aggregation ---------------------------------------------
        // >>> SR: Gantt rerender fix ------------------------------------------
        const current_end_date = this.task.orig_end ?? this.task._end;
        if (Number(current_end_date) !== Number(new_end_date)) {
            changed = true;
            this.task._end = new_end_date;
            this.task.orig_end = new_end_date;
        }
        // <<< SR: Gantt rerender fix ------------------------------------------
        // <<< SR: Bar Aggregation ---------------------------------------------

        if (!changed) return;
        // >>> SR: Date calculation after change fix ---------------------------------
        this.sync_task_date_values(new_start_date, new_end_date);
        // <<< SR: Date calculation after change fix ---------------------------------
        this.gantt.trigger_event('date_change', [
            this.task,
            new_start_date,
            date_utils.add(new_end_date, -1, 'second'),
        ]);
    }

    progress_changed() {
        this.task.progress = this.compute_progress();
        this.gantt.trigger_event('progress_change', [
            this.task,
            this.task.progress,
        ]);
    }

    set_action_completed() {
        this.action_completed = true;
        setTimeout(() => (this.action_completed = false), 1000);
    }

    compute_start_end_date() {
        const bar = this.$bar;
      // >>> SR: Date calculation after change fix ---------------------------------
        let new_start_date = this.gantt.get_date_by_position(bar.getX());

        const width_changed =
            bar.owidth != null &&
            Math.abs(bar.getWidth() - bar.owidth) > 0.001;
        let new_end_date;

        if (!width_changed) {
            const current_end_date = this.task.orig_end ?? this.task._end;
            const duration = current_end_date - this.task._start;
            new_end_date = new Date(new_start_date.getTime() + duration);
        } else {
            new_end_date = this.gantt.get_date_by_position(bar.getEndX());
        }
        // <<< SR: Date calculation after change fix ---------------------------------
        return { new_start_date, new_end_date };
    }

    compute_progress() {
        // >>> SR: Bar Aggregation ---------------------------------------------
        if (this.invalid) return;
        // <<< SR: Bar Aggregation ---------------------------------------------
      
        this.progress_width = this.$bar_progress.getWidth();
        this.x = this.$bar_progress.getBBox().x;
        const progress_area = this.x + this.progress_width;
        const progress =
            this.progress_width -
            this.gantt.config.ignored_positions.reduce((acc, val) => {
                return acc + (val >= this.x && val <= progress_area);
            }, 0) *
                this.gantt.config.column_width;
        if (progress < 0) return 0;
        const total =
            this.$bar.getWidth() -
            this.ignored_duration_raw * this.gantt.config.column_width;
        return parseInt((progress / total) * 100, 10);
    }

    compute_expected_progress() {
        this.expected_progress =
            date_utils.diff(date_utils.today(), this.task._start, 'hour') /
            this.gantt.config.step;
        this.expected_progress =
            ((this.expected_progress < this.duration
                ? this.expected_progress
                : this.duration) *
                100) /
            this.duration;
    }

    compute_x() {
        // >>> SR: Date calculation Fix ---------------------------------------------
        // The usual code was moved to the new function get_position_by_date()
        // It threats the tasks with mode.step = "m" or "y" differently.
        this.x = this.gantt.get_position_by_date(this.task._start);
        // <<< SR: Date calculation Fix ---------------------------------------------
    }

    compute_y() {
      
      // >>> SR: Bar Aggregation -----------------------------------------------
      const rowIndex = (this.task._rowIndex != null) ? this.task._rowIndex : this.task._index;
      const lane = (this.task._lane != null) ? this.task._lane : 0;

      const baseY =
          this.gantt.config.header_height +
          
          //TODO SR: The padding already malfunctioned in the old adapted version and needs to be reworked.
          //this.gantt.options.padding + //TODO SR: Put the padding back as soon as the problem has been fixed!
          this.rowTop(rowIndex);

      const innerTop = (this.gantt.options.bar_inner_padding || 0) / 2;
      
      // Lane offset remains the same, but starts below the inner top padding
      let y = baseY + innerTop + lane * (this.height + this.gantt.options.lane_padding);
      // <<< SR: Bar Aggregation -----------------------------------------------
      
      this.y = y;
    }

    compute_duration() {
        let actual_duration_in_days = 0,
            duration_in_days = 0;
        let endDate = this.task.orig_end ?? this.task._end;
        
        for (
            let d = new Date(this.task._start);
            // >>> SR: Bar Aggregation -----------------------------------------
            //d < this.task._end;
            d < endDate;
            // <<< SR: Bar Aggregation -----------------------------------------
            d.setDate(d.getDate() + 1)
        ) {
            duration_in_days++;
            if (
                !this.gantt.config.ignored_dates.find(
                    (k) => k.getTime() === d.getTime(),
                ) &&
                (!this.gantt.config.ignored_function ||
                    !this.gantt.config.ignored_function(d))
            ) {
                actual_duration_in_days++;
            }
        }
        this.task.actual_duration = actual_duration_in_days;
        this.task.ignored_duration = duration_in_days - actual_duration_in_days;

        this.duration =
            date_utils.convert_scales(
                duration_in_days + 'd',
                this.gantt.config.unit,
            ) / this.gantt.config.step;

        this.actual_duration_raw =
            date_utils.convert_scales(
                actual_duration_in_days + 'd',
                this.gantt.config.unit,
            ) / this.gantt.config.step;

        this.ignored_duration_raw = this.duration - this.actual_duration_raw;
    }

    update_attr(element, attr, value) {
        value = +value;
        if (!isNaN(value)) {
            element.setAttribute(attr, value);
        }
        return element;
    }

    update_expected_progressbar_position() {
        if (this.invalid) return;
        this.$expected_bar_progress.setAttribute('x', this.$bar.getX());
        this.compute_expected_progress();
        this.$expected_bar_progress.setAttribute(
            'width',
            this.gantt.config.column_width *
                this.actual_duration_raw *
                (this.expected_progress / 100) || 0,
        );
    }

    update_progressbar_position() {
        if (this.invalid || this.gantt.options.readonly) return;
        this.$bar_progress.setAttribute('x', this.$bar.getX());

        this.$bar_progress.setAttribute(
            'width',
            this.calculate_progress_width(),
        );
    }

    update_label_position() {
        const img_mask = this.bar_group.querySelector('.img_mask') || '';
        const bar = this.$bar,
            label = this.group.querySelector('.bar-label'),
            img = this.group.querySelector('.bar-img');

        let padding = 5;
        let x_offset_label_img = this.image_size + 10;
        const labelWidth = label.getBBox().width;
        const barWidth = bar.getWidth();

        // >>> SR: Bar Aggregation ---------------------------------------------
        const overflow = this.gantt.options.label_overflow || 'outside';
        const isStacked = (this.task._clusterLanes || 1) > 1;
        const isLowHeight = this.height <= 14;

        // Reset classes
        label.classList.remove('big');
        label.classList.remove('clip-left');
        label.classList.remove('small');

        if (isStacked || isLowHeight) {
          label.classList.add('small');
        }
        
        const labelMidStartX = bar.getX() + barWidth / 2 - labelWidth / 2
        const imgEndX = bar.getX() + x_offset_label_img;
        const imgLabelCollision = (img && imgEndX >= labelMidStartX);
        
        // label (and image) fit within bar
        if (!imgLabelCollision && (labelWidth <= barWidth)) {
          label.classList.remove('big');
          
          if (img) {
            img.setAttribute('x', bar.getX() + padding);
            img_mask.setAttribute('x', bar.getX() + padding);
          }
            
          label.setAttribute( //TODO SR: New temp fix for image + label collision
              'x',
              labelMidStartX,
          );
            
          label.removeAttribute('clip-path');
          label.style.fill = this.task.textColor;

          // >>> SR: Initial auto moving labels --------------------------------------
          if (this.gantt.options.auto_move_label) {
            this.update_label_position_for_current_viewport();
          }
          // <<< SR: Initial auto moving labels --------------------------------------
          
          return;
        }
        
        if (overflow === 'outside') {
          label.classList.add('big');
          if (img) {
            img.setAttribute('x', bar.getEndX() + padding);
            img_mask.setAttribute('x', bar.getEndX() + padding);
            label.setAttribute('x', bar.getEndX() + x_offset_label_img);
          } else {
            label.setAttribute('x', bar.getEndX() + padding);
          }
  
          label.removeAttribute('clip-path');
          label.style.fill = String(this.gantt.options.label_outside_color);
          
        } else if (overflow === 'clip') {
          // The label is clipped inside the bar. 
          // It is useful if multiple bars are at the same line index, 
          // so that the labels do not overlap. 
          
          label.classList.remove('big');
          const insetX = 2;
          const insetY = 1;
          
          if (img) {
            img.setAttribute('x', bar.getX() + padding);
            img_mask.setAttribute('x', bar.getX() + padding);
          }
  
          label.classList.add('clip-left');
          label.setAttribute('x', bar.getX() + insetX + (img ? x_offset_label_img : 0));
          label.setAttribute('y', bar.getY() + bar.getHeight() / 2);
  
          // ClipPath: cuts ONLY on the right (and top/bottom), not on the left
          const clipId = `clip-label-${String(this.task.id).replace(/[^a-zA-Z0-9_-]/g,'')}`;
          let defs = this.gantt.$svg.querySelector('defs');
          if (!defs) defs = createSVG('defs', { append_to: this.gantt.$svg });
  
          // Removes old clip
          const old = this.gantt.$svg.querySelector(`#${clipId}`);
          if (old) old.remove();
  
          const cp = createSVG('clipPath', { id: clipId, append_to: defs });
          
          createSVG('rect', {
            x:  bar.getX() + insetX + (img ? x_offset_label_img : 0),
            y: bar.getY() + insetY,
            width: Math.max(0, bar.getWidth() - (img ? x_offset_label_img : 0) - insetX * 2),
            height: Math.max(0, bar.getHeight() - insetY * 2),
            rx: Math.max(0, this.corner_radius - insetX),
            ry: Math.max(0, this.corner_radius - insetY),
            append_to: cp
          });
  
          label.setAttribute('clip-path', `url(#${clipId})`);
        }
        // <<< SR: Bar Aggregation -----------------------------------------------
    }

    update_handle_position() {
        if (this.invalid || this.gantt.options.readonly) return;
        const bar = this.$bar;
        this.handle_group
            .querySelector('.handle.left')
            .setAttribute('x', bar.getX());
        this.handle_group
            .querySelector('.handle.right')
            .setAttribute('x', bar.getEndX());
        const handle = this.group.querySelector('.handle.progress');
        handle && handle.setAttribute('cx', this.$bar_progress.getEndX());
    }

    update_arrow_position() {
        this.arrows = this.arrows || [];
        for (let arrow of this.arrows) {
            arrow.update();
        }
    }
    
    // >>> SR: Bar Aggregation -------------------------------------------------

    // >>> SR: Date calculation after change fix ---------------------------------
    sync_task_date_values(new_start_date, new_end_date) {
      if (this.task.start) {
        this.task.start = this.format_task_date_like_original(
            new_start_date,
            this.task.start,
        );
      }
  
      if (this.task.end) {
        this.task.end = this.format_task_date_like_original(
            date_utils.add(new_end_date, -1, 'second'),
            this.task.end,
        );
      }
    }
  
    format_task_date_like_original(date, original_value) {
      if (original_value instanceof Date) {
        return date_utils.clone(date);
      }
  
      if (typeof original_value === 'string') {
        const has_time = original_value.trim().includes(' ');
        return date_utils.format(
            date,
            has_time ? this.gantt.options.date_format : 'YYYY-MM-dd',
            this.gantt.options.language,
        );
      }
  
      return date;
    }
    // <<< SR: Date calculation after change fix ---------------------------------
  
    // >>> SR: Date calculation Fix --------------------------------------------
    compute_width() {
      const endDate = this.task.orig_end ?? this.task._end;
      return Math.max(0, this.gantt.get_position_by_date(endDate) - this.x);
    }
    // <<< SR: Date calculation Fix --------------------------------------------
  
    /**
     * Aggregation bar buildup
     *
     * here, the Aggregation look is made.
     * It contains all the bars that overlaps more than 2 times with another bars.
     */
    build_aggregation_bar() {
      
      let defs = this.gantt.$svg.querySelector('defs');
      if (!defs) defs = createSVG('defs', { append_to: this.gantt.$svg });

      const inset = 1.5; // px: minimum distance to edge/frame
      const clipId = `clip-legend-${String(this.task.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

      const oldClip = this.gantt.$svg.querySelector(`#${clipId}`);
      if (oldClip) oldClip.remove();

      // ClipPath: ClipPath: rounded rectangle within the bar
      const $cp = createSVG('clipPath', { id: clipId, append_to: defs });
      createSVG('rect', {
        x: this.x + inset,
        y: this.y + inset,
        width: Math.max(0, this.width - inset * 2),
        height: Math.max(0, this.height - inset * 2),
        rx: Math.max(0, this.corner_radius - inset),
        ry: Math.max(0, this.corner_radius - inset),
        append_to: $cp
      });

      // color swatches, that show the member task colors
      if (this.task._isAggregate && Array.isArray(this.task._members)) {
        const colorSwatches = this.task._members.map(m => m && m.color).filter(Boolean);

        if (colorSwatches.length) {
          const swatchW = 8; // The wide of shown swatches in pixel
          const gapX = 1; // the gap between the swatches
          const h = Math.max(0, this.height - inset * 2);
          let xSwatch = this.x + inset; // starting from the left

          // Group of swatches with clip
          const swatchesGroup = createSVG('g', {
            append_to: this.bar_group
          });
          swatchesGroup.setAttribute('clip-path', `url(#${clipId})`);

          colorSwatches.forEach(c => {
            const r = createSVG('rect', {
              x: xSwatch,
              y: this.y + inset,
              width: swatchW,
              height: h,
              class: 'agg-swatch-v',
              append_to: swatchesGroup
            });
            r.setAttribute('fill', c);
            r.setAttribute('pointer-events', 'none');
            xSwatch += swatchW + gapX;
            if (xSwatch > this.x + this.width - inset) return; // Safety, if the bar is too narrow
          });
        }
      }
    }

  /**
   * It sets the bar colors from task properties.
   */
  set_bar_colors() {
      if (this.task.color) {
        // This section overrides the hover. Therefore, CSS variables are used instead.
        this.$bar.style.setProperty('--bar-fill', String(this.task.color));
      }

      if (this.task.colorHover) {
        this.$bar.style.setProperty('--bar-fill-hover', String(this.task.colorHover));
      }
    }

  /**
   * Calculates the bar height for a task, considering cluster lanes and paddings.
   * @param task
   * @returns {number}
   */
    get_bar_height_for_task(task) {
      const lanes = Math.max(1, task._clusterLanes || 1);
      const inner = Math.max(0, this.gantt.options.bar_inner_padding || 0);
      const laneGaps = (lanes - 1) * this.gantt.options.lane_padding;
  
      // available height = row height minus inner padding minus gaps between lanes
      const available = this.gantt.options.row_height - inner - laneGaps;
  
      const h = available / lanes;
      return Math.max(6, h); // small lower limit so that handles/labels remain usable
    }
    
    rowTop(rowIndex) {
      return this.gantt._rowMeta[rowIndex]?.top || 0;
    }

  /**
   * Defines an SVG pattern for hatching, which is used to indicate invalid bars.
   * The pattern consists of diagonal lines and is added to the SVG defs. It is only defined once, even if multiple bars use it.
   * The pattern can then be applied as a fill to an overlay rectangle on top of the bar to visually indicate invalidity.
   */
  define_svg_hatch_pattern() {
      const svg = this.gantt.$svg;
      if (!svg) return;
  
      let defs = svg.querySelector('defs');
      if (!defs) defs = createSVG('defs', { append_to: svg });
      
      if (svg.querySelector('#hatchPattern')) return;
  
      const pattern = createSVG('pattern', {
        id: 'hatchPattern',
        patternUnits: 'userSpaceOnUse',
        width: 12,
        height: 12,
        append_to: defs,
      });
      
      pattern.setAttribute('patternTransform', 'rotate(45 4 4)');
      
      const line = createSVG('line', {
        x1: 0, y1: 0,
        x2: 0, y2: 12,
        append_to: pattern,
      })
  
      line.setAttribute('stroke', '#8D99A6');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('opacity', '0.75');
    }

  /**
   * draws a diagonal hatch overlay on top of the bar to indicate that it is invalid. 
   * It uses the defined "hatchPattern" SVG pattern as a fill for a rectangle that covers the entire bar area. 
   * The overlay is non-interactive, allowing clicks and drags to pass through to the bar below.
   */
  draw_invalid_overlay() {
      this.define_svg_hatch_pattern();
      
      if (this.$bar_invalid_overlay) {
        this.$bar_invalid_overlay.remove();
        this.$bar_invalid_overlay = null;
      }

      this.$bar_invalid_overlay = createSVG('rect', {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        rx: this.corner_radius,
        ry: this.corner_radius,
        class: 'bar-invalid-overlay',
        append_to: this.bar_group,
      });

      this.$bar_invalid_overlay.setAttribute('fill', 'url(#hatchPattern)');
      this.$bar_invalid_overlay.setAttribute('pointer-events', 'none');
    }

  /**
   * updates the position and size of the invalid overlay to match the bar's current position and size.
   * 
   * @param x
   * @param width
   */
  update_invalid_overlay_position(x, width) {
      if (!this.$bar_invalid_overlay) return;
        
      if (x) this.update_attr(this.$bar_invalid_overlay, 'x', x);
      if (width > 0) this.update_attr(this.$bar_invalid_overlay, 'width', width);
    }
    // <<< SR: Bar Aggregation -------------------------------------------------
}
import date_utils from './date_utils';
export default class Popup {
    constructor(parent, popup_func, gantt) {
        this.parent = parent;
        this.popup_func = popup_func;
        this.gantt = gantt;

        this.make();
    }

    make() {
        this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="details"></div>
            <div class="actions"></div>
        `;
        this.hide();

        this.title = this.parent.querySelector('.title');
        this.subtitle = this.parent.querySelector('.subtitle');
        this.details = this.parent.querySelector('.details');
        this.actions = this.parent.querySelector('.actions');
    }

    show({ x, y, task, target }) {
        // >>> SR: Stable hover popup ------------------------------------------
        // In hover mode the popup is only informational. If it captures the
        // pointer while it appears near the cursor, the bar receives mouseleave,
        // hides the popup, receives mouseenter again, etc. This causes flicker.
        this.parent.style.pointerEvents =
            this.gantt.options.popup_on === 'hover' ? 'none' : '';
        // <<< SR: Stable hover popup ------------------------------------------
        this.actions.innerHTML = '';
        let html = this.popup_func({
            task,
            chart: this.gantt,
            get_title: () => this.title,
            set_title: (title) => (this.title.innerHTML = title),
            get_subtitle: () => this.subtitle,
            set_subtitle: (subtitle) => (this.subtitle.innerHTML = subtitle),
            get_details: () => this.details,
            set_details: (details) => (this.details.innerHTML = details),
            add_action: (html, func) => {
                let action = this.gantt.create_el({
                    classes: 'action-btn',
                    type: 'button',
                    append_to: this.actions,
                });
                if (typeof html === 'function') html = html(task);
                action.innerHTML = html;
                action.onclick = (e) => func(task, this.gantt, e);
            },
        });
        if (html === false) return;
        if (html) this.parent.innerHTML = html;

        if (this.actions.innerHTML === '') this.actions.remove();
        else this.parent.appendChild(this.actions);

        // >>> SR: Bar Aggregation ---------------------------------------------
        this.clear_aggregation_list();
        const members = task._isAggregate ? (task._members || []) : (task._aggMembers || []);
  
        if (members?.length) {
          // clearing the details section of the aggregates bar because it is containing wrong date information.
          this.parent.querySelector('.details').innerHTML = '';
          // >>> SR: upperRowTasks ---------------------------------------------
          //TODO SR: Work in progress: currently, the upper part looks exactly like the lower. Format the popup so the user can differentiate then visually.
          // >>> SR: Aggregation popup Gantt ----------------------------------
          let appendTarget = this.parent;
          let popupGanttTarget = null;
          let popupGanttListContent = null;
          const append = element => appendTarget.appendChild(element);
          // <<< SR: Aggregation popup Gantt ----------------------------------

          let upperRowTasks;

          if (
              this.gantt.options.popup_aggregate_include_upper_row_tasks === true &&
              task._isAggregate
          ) {
            upperRowTasks = this.get_overlapping_upper_row_tasks(task);
          }

          // >>> SR: Aggregation popup Gantt ----------------------------------
          const aggregationTasks = upperRowTasks?.length
              ? upperRowTasks.concat(members)
              : members;

          if (this.gantt.options.popup_aggregate_expand_tasks === true) {
            const layout = this.build_aggregation_popup_layout();
            this.move_popup_content_to_aggregation_layout(layout.listHeader);
            appendTarget = layout.listContent;
            popupGanttTarget = layout.ganttPane;
            popupGanttListContent = layout.listContent;
            this.parent.appendChild(layout.wrapper);
          }
          // <<< SR: Aggregation popup Gantt ----------------------------------

          if (upperRowTasks?.length) {
            if (this.gantt.options.popup_aggregate_style === 'table') {
              append(this.build_aggregation_table(
                  upperRowTasks.concat(members),
                  upperRowTasks.length,
              ));
            } else {
              append(this.build_aggregation_part(upperRowTasks));
              append(this.build_aggregation_part(members));
            }
          } else {
            append(this.build_aggregation_part(members));
          }

          // >>> SR: Aggregation popup Gantt ----------------------------------
          if (popupGanttTarget) {
            this.render_aggregation_popup_gantt(
                popupGanttTarget,
                aggregationTasks,
            );
            this.align_aggregation_popup_rows(popupGanttListContent);
          }
          // <<< SR: Aggregation popup Gantt ----------------------------------
          // <<< SR: upperRowTasks ---------------------------------------------
        }
        // <<< SR: Bar Aggregation ---------------------------------------------
        // >>> SR: Popup outside container fix ---------------------------------
        this.position_inside_visible_container(x, y);
        // <<< SR: Popup outside container fix ---------------------------------
        this.parent.classList.remove('hide');
    }

    // <<< SR: Popup outside container fix -------------------------------------
    position_inside_visible_container(x, y) {
        const container = this.gantt.$container;
        const margin = 8;

        this.parent.style.visibility = 'hidden';
        this.parent.style.left = '0px';
        this.parent.style.top = '0px';
        this.parent.style.maxWidth = Math.max(160, container.clientWidth - margin * 2) + 'px';
        this.parent.classList.remove('hide');

        const popupWidth = this.parent.offsetWidth;
        const popupHeight = this.parent.offsetHeight;

        const minLeft = container.scrollLeft + margin;
        const maxLeft = container.scrollLeft + container.clientWidth - popupWidth - margin;
        const minTop = container.scrollTop + margin;
        const maxTop = container.scrollTop + container.clientHeight - popupHeight - margin;

        const desiredLeft = x + 10;
        const desiredTop = y - 10;

        this.parent.style.left = Math.max(minLeft, Math.min(desiredLeft, Math.max(minLeft, maxLeft))) + 'px';
        this.parent.style.top = Math.max(minTop, Math.min(desiredTop, Math.max(minTop, maxTop))) + 'px';
        this.parent.style.visibility = '';
    }
    // >>> SR: Popup outside container fix ---------------------------------------------
    hide() {
        // >>> SR: Aggregation popup Gantt ------------------------------------
        this.destroy_popup_gantt?.();
        // <<< SR: Aggregation popup Gantt ------------------------------------
        this.parent.classList.add('hide');
    }

    build_aggregation_part(members, sectionStartIndex = null) {
      switch (this.gantt.options.popup_aggregate_style) {
        case 'list':
          return this.build_aggregation_list(members);
        case 'table':
          return this.build_aggregation_table(members, sectionStartIndex);
        default:
          console.warn(`Unknown aggregation style: ${this.gantt.options.popup_aggregate_style}. Falling back to 'list'.`);
          return this.build_aggregation_list(members);
      }
    }

    // >>> SR: Aggregation popup Gantt ----------------------------------------
    /**
     * Builds the two-column popup body used when the aggregation popup also
     * shows a small Gantt next to the task list.
     * @returns {{wrapper: HTMLDivElement, listPane: HTMLDivElement, listHeader: HTMLDivElement, listContent: HTMLDivElement, ganttPane: HTMLDivElement}}
     */
    build_aggregation_popup_layout() {
      const wrapper = document.createElement('div');
      wrapper.className = 'agg-popup-expanded';
      // >>> SR: Aggregation popup Gantt layout fix ---------------------------
      wrapper.style.display = 'inline-flex';
      wrapper.style.flexDirection = 'row';
      wrapper.style.flexWrap = 'nowrap';
      wrapper.style.alignItems = 'flex-start';
      // <<< SR: Aggregation popup Gantt layout fix ---------------------------

      const listPane = document.createElement('div');
      listPane.className = 'agg-popup-list-pane';
      // >>> SR: Aggregation popup Gantt layout fix ---------------------------
      listPane.style.flex = '0 0 auto';
      // <<< SR: Aggregation popup Gantt layout fix ---------------------------
      wrapper.appendChild(listPane);

      const listHeader = document.createElement('div');
      listHeader.className = 'agg-popup-list-header';
      listPane.appendChild(listHeader);

      const listContent = document.createElement('div');
      listContent.className = 'agg-popup-list-content';
      listPane.appendChild(listContent);

      const ganttPane = document.createElement('div');
      ganttPane.className = 'agg-popup-gantt-pane';
      const width = this.get_popup_gantt_width();
      ganttPane.style.width = `${width}px`;
      ganttPane.style.flexBasis = `${width}px`;
      // >>> SR: Aggregation popup Gantt layout fix ---------------------------
      ganttPane.style.flexGrow = '0';
      ganttPane.style.flexShrink = '0';
      // <<< SR: Aggregation popup Gantt layout fix ---------------------------
      wrapper.appendChild(ganttPane);

      return { wrapper, listPane, listHeader, listContent, ganttPane };
    }

    /**
     * Moves the standard popup title/subtitle/details/actions into the left
     * pane of the expanded aggregation popup. This lets the popup Gantt on the
     * right start at the very top instead of below the popup title.
     * @param listHeader
     */
    move_popup_content_to_aggregation_layout(listHeader) {
      [this.title, this.subtitle, this.details, this.actions].forEach((node) => {
        if (node?.parentElement) {
          listHeader.appendChild(node);
        }
      });
    }

    /**
     * Creates the small Gantt instance displayed inside the aggregation popup.
     * Every popup task gets its own lineIndex so the right-side Gantt mirrors
     * the left-side task list one entry per row.
     * @param target
     * @param tasks
     */
    render_aggregation_popup_gantt(target, tasks) {
      if (!target || !tasks?.length) return;

      this.destroy_popup_gantt();

      const popupTasks = tasks
          .map((task, index) => this.create_popup_gantt_task(task, index))
          .filter(Boolean);

      if (!popupTasks.length) return;

      const PopupGantt = this.gantt.constructor;
      this.popup_gantt = new PopupGantt(
          target,
          popupTasks,
          this.get_popup_gantt_options(popupTasks),
      );

      if (this.gantt.config?.view_mode?.name) {
        this.popup_gantt.change_view_mode(this.gantt.config.view_mode.name);
      }
    }

    /**
     * Returns a copied task object that is safe to pass to a nested Gantt.
     * @param task
     * @param index
     * @returns {object|null}
     */
    create_popup_gantt_task(task, index) {
      const originalTask = this.gantt.get_task ? this.gantt.get_task(task.id) : null;
      const taskEnd = this.get_task_end(task);

      if (!task?._start || !taskEnd) return null;

      const start = originalTask?.start || this.format_popup_gantt_date(task._start);
      const end = originalTask?.end || this.format_popup_gantt_date(
          date_utils.add(taskEnd, -1, 'second'),
      );

      if (!start || !end) return null;

      return {
        id: `popup_${index}_${task.id}`,
        name: task.name,
        start,
        end,
        progress: originalTask?.progress ?? task.progress ?? 0,
        dependencies: [],
        lineIndex: index,
        readonly: true,
        color: originalTask?.color ?? task.color,
        colorHover: originalTask?.colorHover ?? task.colorHover,
        progressColor: originalTask?.progressColor ?? task.progressColor,
        textColor: originalTask?.textColor ?? task.textColor,
        custom_class: originalTask?.custom_class ?? task.custom_class,
      };
    }

    /**
     * Formats Date objects for popup Gantt input without losing time-of-day.
     * @param date
     * @returns {string|null}
     */
    format_popup_gantt_date(date) {
      if (!date) return null;
      return date_utils.to_string(date, true);
    }

    /**
     * Creates safe options for the nested popup Gantt and prevents recursive
     * aggregation popups inside that nested chart.
     * @param popupTasks
     * @returns {object}
     */
    get_popup_gantt_options(popupTasks) {
      return {
        ...this.gantt.options,
        view_modes: this.gantt.options.view_modes,
        view_mode: this.gantt.config?.view_mode?.name || this.gantt.options.view_mode,
        row_keys: popupTasks.map((_, index) => index),
        row_height: 30,
        upper_header_height: 30,
        lower_header_height: 25,
        container_height: 'auto',
        infinite_padding: false,
        scroll_to: 'start',
        view_mode_select: this.gantt.options.view_mode_select,
        today_button: this.gantt.options.today_button,
        readonly: true,
        readonly_dates: true,
        readonly_progress: true,
        move_dependencies: false,
        popup: false,
        stripe_rows: true,
        holidays: null,
        //popup_on: 'click', //TODO SR: currently dont work.
        popup_aggregate_expand_tasks: false,
        popup_aggregate_include_upper_row_tasks: false,
      };
    }

    /**
     * Aligns the first left list/table row with the first task row of the
     * nested popup Gantt and applies the popup Gantt row height to list rows.
     * @param listContent
     */
    align_aggregation_popup_rows(listContent) {
      if (!listContent || !this.popup_gantt) return;

      const listHeader = listContent.parentElement?.querySelector(
          '.agg-popup-list-header',
      );
      const popupHeaderHeight = this.popup_gantt.config?.header_height || 0;
      const leftHeaderHeight = listHeader?.offsetHeight || 0;
      const rowHeight = this.popup_gantt.options?.row_height || 0;

      // TODO SR: Die "- 15" sind gerade fest eingebaut. Mache es dynamisch!
      listContent.style.marginTop = `${Math.max(
          0,
          popupHeaderHeight - leftHeaderHeight - 15,
      )}px`;

      if (!rowHeight) return;

      listContent
          .querySelectorAll('.agg-table .agg-list-row, .agg-list li')
          .forEach((row) => {
            row.style.height = `${rowHeight}px`;
            row.style.minHeight = `${rowHeight}px`;
          });
    }

    /**
     * Returns the configured popup Gantt width in px.
     * @returns {number}
     */
    get_popup_gantt_width() {
      return Math.max(
          120,
          Number(this.gantt.options.popup_aggregate_gantt_width) || 360,
      );
    }

    /**
     * Destroys the previous nested popup Gantt before a new popup body is built.
     */
    destroy_popup_gantt() {
      if (this.popup_gantt?.destroy) {
        this.popup_gantt.destroy();
      }
      this.popup_gantt = null;
    }
    // <<< SR: Aggregation popup Gantt ----------------------------------------
    
  // >>> SR: Bar Aggregation ---------------------------------------------------
  /**
   * Builds the aggregation table for given aggregation members.
   * 
   * @param members
   * @param sectionStartIndex index where the member section starts after upper-row tasks
   * @returns {HTMLTableElement}
   */
    build_aggregation_table(members, sectionStartIndex = null) {
      
      const table = document.createElement('table');
      // >>> SR: Aggregation popup list/table styles --------------------------
      table.className = 'agg-table';
      // <<< SR: Aggregation popup list/table styles --------------------------
      const tbody = document.createElement('tbody');
      table.appendChild(tbody);
      
      //TODO SR: Check if we need adjustEnd function for the new time logic here.
  
      /*        const adjustEnd = (d) => {
                const step = this.gantt.options.step;
                const du = date_utils;
                return (step >= 24 && (step % 24) === 0)
                    ? du.add(d, -24, 'hour')     // Tages-/Wochen-/Monats-Skalierung: -24h
                    : du.add(d, -1, 'second');   // Feiner als Tag: -1s
              };*/
  
      // filling the aggregation bar popup
      members.forEach((m, index) => {
        const tr = document.createElement('tr');
        // >>> SR: Tabular aggregation popup list ------------------------------
        tr.className = 'agg-list-row';
        if (sectionStartIndex != null && index === sectionStartIndex) {
          tr.classList.add('agg-section-start');
        }
        // <<< SR: Tabular aggregation popup list ------------------------------
  
        // Color-Swatch at the left
        const colorCell = document.createElement('td');
        colorCell.className = 'agg-color-cell';
        const swatch = document.createElement('span');
        swatch.className = 'agg-color-swatch';
        if (m.color) {
          swatch.style.backgroundColor = String(m.color);
        }
        colorCell.appendChild(swatch);
        tr.appendChild(colorCell);
        
        // Getting the original task to know real start/end
        const originalTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        const hasRealStart = !!(originalTask && originalTask.start);
        const hasRealEnd = !!(originalTask && originalTask.end);

        let ogTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        this.compute_duration(ogTask);
        
        let labelText = m.name;
        let durationText = '';
        
        const start_date = date_utils.format(
            m._start,
            'dd.MM.yy',
            this.gantt.options.language,
        );
        // >>> SR: Date calculation Fix ----------------------------------------
        let org_end = m.orig_end ?? m._end; //TODO SR: Date without hours fix. Test it.
        // <<< SR: Date calculation Fix ----------------------------------------
        const end_date = date_utils.format(
            //date_utils.add(m._end, -1, 'second'),
            date_utils.add(org_end, -1, 'second'), //TODO SR: Date without hours fix. Test it.
            'dd.MM.yy',
            this.gantt.options.language,
        );
        let startText = hasRealStart ? start_date : '...';
        let endText = hasRealEnd ? end_date : '...';
        
        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            durationText = `${ogTask.actual_duration} Tage${ogTask.ignored_duration ? ' + ' + ogTask.ignored_duration + ' Ausgeschlossen' : ''}`;
          }
        }

        // >>> SR: Tabular aggregation popup list ------------------------------
        const startCell = document.createElement('td');
        startCell.className = 'agg-start-date';
        startCell.textContent = startText;
        tr.appendChild(startCell);

        const separatorCell = document.createElement('td');
        separatorCell.className = 'agg-interval-separator';
        separatorCell.textContent = '-';
        tr.appendChild(separatorCell);

        const endCell = document.createElement('td');
        endCell.className = 'agg-end-date';
        endCell.textContent = endText;
        tr.appendChild(endCell);

        const titleCell = document.createElement('td');
        titleCell.className = 'agg-title';
        titleCell.textContent = labelText;
        tr.appendChild(titleCell);

        const durationCell = document.createElement('td');
        durationCell.className = 'agg-duration';
        durationCell.textContent = durationText;
        tr.appendChild(durationCell);
        // <<< SR: Tabular aggregation popup list ------------------------------
  
        tbody.appendChild(tr);
      });
  
      return table;
    }
    

    /**
     * This is the list overlapping popup version
     * This one may be removed in the future.
     * 
     * @param members
     * @returns {HTMLUListElement}
     */
    build_aggregation_list(members) {
  
      const ul = document.createElement('ul');
      ul.className = 'agg-list';
      
      // filling the aggregation bar popup
      members.forEach(m => {
        const li = document.createElement('li');
  
        // Color-Swatch at the left
        const swatch = document.createElement('span');
        swatch.className = 'agg-color-swatch';
        if (m.color) {
          swatch.style.backgroundColor = String(m.color);
        }
        li.appendChild(swatch);
  
        // Getting the original task to know real start/end
        const originalTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        const hasRealStart = !!(originalTask && originalTask.start);
        const hasRealEnd = !!(originalTask && originalTask.end);
  
        let ogTask = this.gantt.get_task ? this.gantt.get_task(m.id) : null;
        this.compute_duration(ogTask);
  
        let labelText = m.name;
        let rangeText = '';
  
        const start_date = date_utils.format(
            m._start,
            'dd.MM.yy',
            this.gantt.options.language,
        );
        // >>> SR: Date calculation Fix ----------------------------------------
        let org_end = m.orig_end ?? m._end; //TODO SR: Date without hours fix. Test it.
        // <<< SR: Date calculation Fix ----------------------------------------
        const end_date = date_utils.format(
            //date_utils.add(m._end, -1, 'second'),
            date_utils.add(org_end, -1, 'second'), //TODO SR: Date without hours fix. Test it.
            'dd.MM.yy',
            this.gantt.options.language,
        );
  
        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            rangeText =
                ` (${start_date} - ${end_date}) (${ogTask.actual_duration} Tage${ogTask.ignored_duration ? ' + ' + ogTask.ignored_duration + ' Ausgeschlossen' : ''})`;
          } else if (hasRealStart && !hasRealEnd) {
            rangeText =
                ` (${start_date} - ... )`;
          } else if (hasRealEnd && !hasRealStart) {
            rangeText =
                ` (... - ${end_date})`;
          }
        }
  
        const textSpan = document.createElement('span');
        textSpan.textContent = labelText + rangeText;
        li.appendChild(textSpan);
  
        ul.appendChild(li);
      });
  
      return ul;
    }
  
    /**
     * Removes existing old aggregation list.
     */
    clear_aggregation_list() {
      // >>> SR: upperRowTasks -------------------------------------------------
      // >>> SR: Aggregation popup Gantt --------------------------------------
      this.destroy_popup_gantt();
      this.restore_popup_content_from_aggregation_layout();
      this.parent
          .querySelectorAll('.agg-popup-expanded, .agg-list, .agg-table')
          .forEach((list) => list.remove());
      // <<< SR: Aggregation popup Gantt --------------------------------------
      // <<< SR: upperRowTasks -------------------------------------------------
    }

    /**
     * Moves title/subtitle/details/actions back to the popup root before an old
     * expanded aggregation layout is removed. This keeps normal popups working
     * after an expanded popup was shown once.
     */
    restore_popup_content_from_aggregation_layout() {
      [this.title, this.subtitle, this.details, this.actions].forEach((node) => {
        if (node?.closest?.('.agg-popup-expanded')) {
          this.parent.appendChild(node);
        }
      });
    }

    // >>> SR: upperRowTasks ---------------------------------------------------

  /**
   * Returns the tasks from the same row that are overlapping with the aggregate task and are not members of the aggregate task. 
   * This is needed to show all relevant tasks in the popup of an aggregate task,
   * even those that are not part of the aggregation but are visually overlapping with it in the same row.
   * @param aggregateTask
   * @returns {T[]|*[]}
   */
  get_overlapping_upper_row_tasks(aggregateTask) {
      const aggregateStart = aggregateTask?._start;
      const aggregateEnd = this.get_task_end(aggregateTask);
      // >>> SR: Configurable row lanes ---------------------------------------
      const aggregationLane = this.gantt.get_aggregation_lane_index
          ? this.gantt.get_aggregation_lane_index()
          : 1;
      // <<< SR: Configurable row lanes ---------------------------------------

      if (!aggregateStart || !aggregateEnd) return [];

      const memberIds = new Set(
          (aggregateTask._members || []).map((member) => String(member.id))
      );

      return (this.gantt.tasks || [])
          .filter((task) => task && !task._hidden && !task._isAggregate)
          .filter((task) => task._rowIndex === aggregateTask._rowIndex)
          // >>> SR: Configurable row lanes -----------------------------------
          .filter((task) => (task._lane ?? 0) < aggregationLane)
          // <<< SR: Configurable row lanes -----------------------------------
          .filter((task) => !memberIds.has(String(task.id)))
          .filter((task) => this.tasks_overlap(task, aggregateTask))
          .sort((a, b) => {
            if (+a._start !== +b._start) return +a._start - +b._start;

            const aId = Number.isFinite(+a.id) ? +a.id : String(a.id);
            const bId = Number.isFinite(+b.id) ? +b.id : String(b.id);
            return aId > bId ? 1 : aId < bId ? -1 : 0;
          });
    }

  /**
   * Checks if two tasks overlap in time. Used to find upper row tasks that are overlapping with the aggregate task.
   * 
   * @param a
   * @param b
   * @returns {boolean}
   */
    tasks_overlap(a, b) {
      const aEnd = this.get_task_end(a);
      const bEnd = this.get_task_end(b);

      if (!a?._start || !b?._start || !aEnd || !bEnd) return false;

      return a._start < bEnd && b._start < aEnd;
    }

    get_task_end(task) {
      return task?.orig_end ?? task?._end ?? null;
    }
    // <<< SR: upperRowTasks ---------------------------------------------------
    
    compute_duration(task) {
      if (task == null) return;

      //TODO SR: Date without hours fix. Test it.
      // >>> SR: Date calculation Fix ------------------------------------
      task.orig_end = task.orig_end ?? date_utils.clone(task._end);
      // <<< SR: Date calculation Fix ------------------------------------

      let actual_duration_in_days = 0,
          duration_in_days = 0;
      for (
          let d = new Date(task._start);
          //d < task._end;
          d < task.orig_end; //TODO SR: Date without hours fix. Test it.
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
      task.actual_duration = actual_duration_in_days;
      task.ignored_duration = duration_in_days - actual_duration_in_days;
    }
  // <<< SR: Bar Aggregation
}
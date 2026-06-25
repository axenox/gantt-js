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
          const upperRowTasks = task._isAggregate
              ? this.get_overlapping_upper_row_tasks(task)
              : [];

          if (upperRowTasks.length) {
            this.parent.appendChild(
                this.build_aggregation_list(upperRowTasks)
            );
          }
          // <<< SR: upperRowTasks ---------------------------------------------
          this.parent.appendChild(
              this.build_aggregation_list(members)
          );
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
        this.parent.classList.add('hide');
    }

  // >>> SR: Bar Aggregation ---------------------------------------------------
  /**
   * Builds the aggregation list for given aggregation members.
   * 
   * @param members
   * @returns {HTMLUListElement}
   */
    build_aggregation_list(members) {
      
      const ul = document.createElement('ul');
      ul.className = 'agg-list';
      
      //TODO SR: Check if we need adjustEnd function for the new time logic here.
  
      /*        const adjustEnd = (d) => {
                const step = this.gantt.options.step;
                const du = date_utils;
                return (step >= 24 && (step % 24) === 0)
                    ? du.add(d, -24, 'hour')     // Tages-/Wochen-/Monats-Skalierung: -24h
                    : du.add(d, -1, 'second');   // Feiner als Tag: -1s
              };*/
  
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
            'MMM dd',
            this.gantt.options.language,
        );
        // >>> SR: Date calculation Fix ----------------------------------------
        let org_end = m.orig_end ?? m._end; //TODO SR: Date without hours fix. Test it.
        // <<< SR: Date calculation Fix ----------------------------------------
        const end_date = date_utils.format(
            //date_utils.add(m._end, -1, 'second'),
            date_utils.add(org_end, -1, 'second'), //TODO SR: Date without hours fix. Test it.
            'MMM dd',
            this.gantt.options.language,
        );
        
        if (hasRealStart || hasRealEnd) {
          if (hasRealStart && hasRealEnd) {
            rangeText =
                `${start_date} - ${end_date} (${ogTask.actual_duration} Tage${ogTask.ignored_duration ? ' + ' + ogTask.ignored_duration + ' Ausgeschlossen' : ''})`;
          } else if (hasRealStart && !hasRealEnd) {
            rangeText =
                `${start_date} - ... `;
          } else if (hasRealEnd && !hasRealStart) {
            rangeText =
                `... - ${end_date}`;
          }
        }
        
        const textSpan = document.createElement('span');
        textSpan.textContent = labelText + ' [ ' + rangeText + ' ]';
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
      this.parent.querySelectorAll('.agg-list').forEach((list) => list.remove());
      // <<< SR: upperRowTasks -------------------------------------------------
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

      if (!aggregateStart || !aggregateEnd) return [];

      const memberIds = new Set(
          (aggregateTask._members || []).map((member) => String(member.id))
      );

      return (this.gantt.tasks || [])
          .filter((task) => task && !task._hidden && !task._isAggregate)
          .filter((task) => task._rowIndex === aggregateTask._rowIndex)
          .filter((task) => (task._lane ?? 0) === 0)
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
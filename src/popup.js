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
          this.parent.appendChild(
              this.build_aggregation_list(members)
          );
        }
        // <<< SR: Bar Aggregation ---------------------------------------------

        this.parent.style.left = x + 10 + 'px';
        this.parent.style.top = y - 10 + 'px';
        this.parent.classList.remove('hide');
    }

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
        
        let org_end = new Date(m.end); //TODO SR: Date without hours fix. Test it.
        
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
      this.parent.querySelector('.agg-list')?.remove();
    }
    
    compute_duration(task) {
      if (task == null) return;

      //TODO SR: Date without hours fix. Test it.
      task.orig_end = new Date(task.end);

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
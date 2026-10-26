// >>> SR: External popup request acceptance ----------------------------------
/**
 * Runs opening, overlap, and native compatibility scenarios in an existing
 * browser demo. Pass the source or distribution Gantt constructor; no runner
 * or dependencies are required. Throws on failure and removes every fixture.
 * @param {Function} Gantt Chart constructor to exercise.
 * @returns {Promise<string[]>} Passed scenario names.
 */
export async function run_popup_request_acceptance(Gantt) {
    const passed = [];
    const charts = [];
    const host = document.createElement('div');
    host.style.width = '900px';
    document.body.appendChild(host);

    /** Fails immediately with the scenario name rather than masking errors. */
    function assert(condition, name) {
        if (!condition) throw new Error(name);
        passed.push(name);
    }

    /** Waits for the existing hover delay without polling. */
    function wait(ms = 240) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /** Creates isolated chart tasks with aggregate and ordinary bars. */
    function create(options = {}) {
        const element = document.createElement('div');
        host.appendChild(element);
        const tasks = [
            {
                id: 'a',
                name: 'Upper',
                start: '2026-10-03',
                end: '2026-10-06',
                lineIndex: 0,
                custom: { value: 42 },
            },
            {
                id: 'b',
                name: 'Member B',
                start: '2026-10-01',
                end: '2026-10-10',
                lineIndex: 0,
            },
            {
                id: 'c',
                name: 'Member C',
                start: '2026-10-02',
                end: '2026-10-07',
                lineIndex: 0,
            },
            {
                id: 'd',
                name: 'Other row',
                start: '2026-10-01',
                end: '2026-10-05',
                lineIndex: 1,
            },
        ];
        const chart = new Gantt(element, tasks, {
            scroll_to: 'start',
            readonly: true,
            ...options,
        });
        charts.push(chart);
        return chart;
    }

    /** Asserts the absence of all native popup state on this chart. */
    function no_native(chart, name) {
        assert(
            !chart.popup &&
                !chart.$popup_wrapper &&
                !chart.$container.querySelector('.popup-wrapper'),
            name,
        );
    }

    /** Dispatches the actual mouseup / hover bar event paths. */
    function pointer(bar, type) {
        const event = new MouseEvent(type, {
            bubbles: type === 'mouseup' || type === 'click',
            clientX: 123,
            clientY: 87,
        });
        bar.group.dispatchEvent(event);
        return event;
    }

    try {
        const requests = [];
        let receiver;
        const chart = create({
            popup_on: 'hover',
            popup() {
                throw new Error('Native task renderer reached');
            },
            popup_aggregated() {
                throw new Error('Native aggregate renderer reached');
            },
            on_popup_request(ctx) {
                receiver = this;
                requests.push(ctx);
            },
        });
        no_native(chart, 'external construction has no native state');
        const upper = chart.get_bar('a');
        const other = chart.get_bar('d');
        const aggregate = chart.bars.find((bar) => bar.task._isAggregate);
        assert(!!aggregate, 'fixture generates a real aggregate');
        const overlaps = chart.get_overlapping_upper_row_tasks(aggregate.task);
        assert(
            overlaps.includes(upper.task),
            'overlap query works before any popup',
        );
        // >>> SR: All same-row overlapping tasks -----------------------------
        const allOverlaps = chart.get_overlapping_tasks(upper.task);
        assert(
            allOverlaps.map((task) => task.id).join(',') === 'b,c,a' &&
                allOverlaps.every((task) => task === chart.get_task(task.id)),
            'normal task query includes original hidden members and self before any popup',
        );
        assert(
            chart
                .get_overlapping_tasks(aggregate.task)
                .map((task) => task.id)
                .join(',') === 'b,c,a',
            'aggregate query returns full original overlapping tasks, not member records',
        );
        no_native(chart, 'all-task overlap lookup creates no native state');
        // <<< SR: All same-row overlapping tasks -----------------------------
        const event = pointer(upper, 'mouseup');
        const ctx = requests[0];
        assert(
            requests.length === 1 &&
                receiver === chart &&
                ctx.chart === chart &&
                ctx.task === upper.task &&
                ctx.task.custom.value === 42 &&
                ctx.target === upper.$bar &&
                ctx.event === event &&
                ctx.trigger === 'click' &&
                ctx.x === 123 &&
                ctx.y === 87,
            'ordinary mouseup dispatches one identity-preserving request',
        );
        assert(
            Object.keys(ctx).sort().join(',') ===
                'chart,event,target,task,trigger,x,y',
            'external context contains no native helpers',
        );
        pointer(aggregate, 'mouseup');
        assert(
            requests.length === 2 &&
                requests[1].task === aggregate.task &&
                requests[1].target === aggregate.$bar,
            'aggregate uses the same exclusive route',
        );
        no_native(chart, 'interactive requests create no native state');
        let clicks = 0;
        chart.options.on_click = () => clicks++;
        pointer(upper, 'click');
        assert(
            clicks === 1 && requests.length === 2,
            'separate click event remains unchanged and does not open twice',
        );
        const externalUI = document.createElement('div');
        externalUI.textContent = 'Application-owned popup';
        host.parentElement.appendChild(externalUI);
        try {
            externalUI.dispatchEvent(
                new MouseEvent('mousedown', { bubbles: true }),
            );
            chart.$svg
                .querySelector('.grid-row')
                .dispatchEvent(new MouseEvent('click', { bubbles: true }));
            chart.hide_popup();
            assert(
                externalUI.isConnected && requests.length === 2,
                'outside and grid clicks leave external UI and callbacks untouched',
            );
        } finally {
            externalUI.remove();
        }

        pointer(other, 'mouseenter');
        pointer(other, 'mouseleave');
        await wait();
        assert(requests.length === 2, 'mouseleave cancels delayed opening');
        const hoverEvent = pointer(other, 'mouseenter');
        await wait();
        assert(
            requests.length === 3 &&
                requests[2].trigger === 'hover' &&
                requests[2].event === hoverEvent &&
                requests[2].target === other.$bar &&
                !chart.is_popup_locked_by_click(),
            'external click does not block later hover',
        );
        pointer(other, 'mouseleave');

        chart.show_popup({ task: upper.task, x: 12, y: 34 });
        assert(
            requests.at(-1).trigger === 'programmatic' &&
                requests.at(-1).event === null &&
                requests.at(-1).target === upper.$bar &&
                requests.at(-1).x === 12,
            'programmatic request resolves current bar',
        );
        chart.show_popup({ task: upper.task, target: host });
        assert(
            requests.at(-1).target === host,
            'programmatic supplied anchor is preserved',
        );
        chart.show_popup({ task: { id: 'missing' } });
        assert(
            requests.at(-1).target === null,
            'missing programmatic bar exposes null',
        );

        for (const value of [
            undefined,
            false,
            '<b>HTML</b>',
            Promise.resolve(false),
        ]) {
            chart.update_options({
                on_popup_request() {
                    return value;
                },
            });
            chart.show_popup({ task: chart.get_task('a') });
            no_native(
                chart,
                `callback return ${String(value)} has no native fallback`,
            );
        }
        const failure = new Error('External callback failure');
        chart.update_options({
            on_popup_request() {
                throw failure;
            },
        });
        let caught;
        try {
            chart.show_popup({ task: chart.get_task('a') });
        } catch (error) {
            caught = error;
        }
        assert(
            caught === failure,
            'synchronous callback error propagates unchanged',
        );
        no_native(chart, 'throwing callback has no native fallback');

        for (const invalid of [false, true, 0, '', {}, []]) {
            const previous = chart.options;
            let error;
            try {
                chart.update_options({ on_popup_request: invalid });
            } catch (failure) {
                error = failure;
            }
            assert(
                error instanceof TypeError &&
                    /on_popup_request/.test(error.message) &&
                    chart.options === previous,
                `invalid hook ${String(invalid)} is rejected atomically`,
            );
        }

        let count = 0;
        const disabled = create({
            popup: false,
            on_popup_request() {
                count++;
            },
        });
        disabled.show_popup({ task: disabled.get_task('a') });
        no_native(
            disabled,
            'globally disabled construction has no native state',
        );
        assert(count === 0, 'global disable has priority from construction');
        for (const invalid of [false, 42, 'callback']) {
            let error;
            try {
                create({ popup: false, on_popup_request: invalid });
            } catch (failure) {
                error = failure;
            }
            assert(
                error instanceof TypeError &&
                    /on_popup_request/.test(error.message),
                'constructor rejects invalid hook even when globally disabled',
            );
        }
        chart.update_options({
            on_popup_request() {
                count++;
            },
        });
        chart.update_options({ popup: false });
        pointer(chart.get_bar('a'), 'mouseup');
        pointer(chart.get_bar('d'), 'mouseenter');
        await wait();
        chart.show_popup({ task: chart.get_task('a') });
        assert(
            count === 0,
            'global disable suppresses click, hover, and programmatic requests',
        );
        assert(
            chart
                .get_overlapping_upper_row_tasks(chart.get_task('a'))
                .includes(chart.get_task('a')),
            'disabled overlap query works and normal upper task includes itself',
        );
        no_native(chart, 'globally disabled chart has no native state');
        // >>> SR: All same-row overlapping tasks -----------------------------
        assert(
            chart.get_overlapping_tasks(chart.get_task('a')).length === 3,
            'all-task lookup works with popups globally disabled',
        );
        // <<< SR: All same-row overlapping tasks -----------------------------

        chart.update_options({ popup: (ctx) => ctx.render_default_popup() });
        for (const operation of ['hide_popup', 'clear', 'refresh', 'destroy']) {
            const lifecycle = create({
                popup_on: 'hover',
                on_popup_request() {
                    count++;
                },
            });
            const before = count;
            pointer(lifecycle.get_bar('a'), 'mouseenter');
            if (operation === 'refresh')
                lifecycle.refresh(
                    lifecycle.tasks.filter((task) => !task._isAggregate),
                );
            else lifecycle[operation]();
            if (operation === 'hide_popup')
                pointer(lifecycle.get_bar('a'), 'mouseleave');
            await wait();
            assert(
                count === before,
                `${operation} causes no external lifecycle call or stale request`,
            );
            no_native(lifecycle, `${operation} initializes no native state`);
        }

        const native = create({
            popup_on: 'hover',
            popup_aggregate_expand_tasks: true,
        });
        no_native(native, 'native initialization is lazy');
        pointer(native.get_bar('a'), 'mouseup');
        assert(
            !!native.popup && native.is_popup_locked_by_click(),
            'native click rendering and hover pinning remain',
        );
        pointer(native.get_bar('a'), 'mouseleave');
        assert(
            !native.$popup_wrapper.classList.contains('hide'),
            'native pinned popup survives mouseleave',
        );
        document.body.dispatchEvent(
            new MouseEvent('mousedown', { bubbles: true }),
        );
        assert(
            native.$popup_wrapper.classList.contains('hide') &&
                !native.is_popup_locked_by_click(),
            'native outside click hides and unpins',
        );
        pointer(native.get_bar('a'), 'mouseenter');
        await wait();
        pointer(native.get_bar('a'), 'mouseleave');
        assert(
            native.$popup_wrapper.classList.contains('hide'),
            'native unpinned hover closes on leave',
        );

        const nativeAggregate = native.bars.find(
            (bar) => bar.task._isAggregate,
        );
        native.show_popup({
            task: nativeAggregate.task,
            target: nativeAggregate.$bar,
            x: 100,
            y: 100,
        });
        const nested = native.popup.popup_gantt;
        assert(
            !!nested &&
                nested.options.popup === false &&
                nested.options.on_popup_request === null &&
                !nested.popup &&
                !nested.$popup_wrapper,
            'native aggregation renders a nonrecursive nested chart',
        );
        const legacyOverlaps = native.popup.get_overlapping_upper_row_tasks(
            nativeAggregate.task,
        );
        const publicOverlaps = native.get_overlapping_upper_row_tasks(
            nativeAggregate.task,
        );
        assert(
            legacyOverlaps.length === publicOverlaps.length &&
                legacyOverlaps.every((task, i) => task === publicOverlaps[i]),
            'native overlap compatibility delegates',
        );
        const wrapper = native.$popup_wrapper;
        native.update_options({
            on_popup_request() {
                count++;
            },
        });
        assert(
            !wrapper.isConnected &&
                !nested.$container.isConnected &&
                !native._popup_locked_by_click,
            'native to external removes wrapper, nested chart, and pin',
        );
        no_native(native, 'native to external discards native references');
        const beforeTransition = count;
        native.update_options({ on_popup_request: undefined });
        no_native(native, 'external to native remains lazy');
        assert(
            count === beforeTransition,
            'option transitions never dispatch requests',
        );
        native.show_popup({ task: native.get_task('a'), x: 100, y: 100 });
        assert(!!native.popup, 'native can reopen after external mode');
        native.update_options({ popup: false });
        no_native(native, 'native to disabled removes native state');

        /** Creates untouched overlap inputs for exact filter/comparator checks. */
        function task(id, start, end, extra = {}) {
            return {
                id,
                _start: new Date(start),
                _end: new Date(end),
                _rowIndex: 0,
                _lane: 0,
                ...extra,
            };
        }
        const members = [task('10', 2, 8), task('2', 2, 8), task('x', 1, 8)];
        const query = task('aggregate', 2, 6, { _members: [{ id: 10 }] });
        const fixture = {
            tasks: [
                ...members,
                task('edge', 6, 8),
                task('end', 0, 9, { orig_end: new Date(2) }),
                task('hidden', 0, 9, { _hidden: true }),
                task('lower', 0, 9, { _lane: 2 }),
                task('row', 0, 9, { _rowIndex: 1 }),
                task('agg', 0, 9, { _isAggregate: true }),
                task('upper2', 3, 8, { _lane: 1 }),
            ],
            get_aggregation_lane_index() {
                return 2;
            },
        };
        const snapshot = JSON.stringify(fixture.tasks);
        const result = Gantt.prototype.get_overlapping_upper_row_tasks.call(
            fixture,
            query,
        );
        assert(
            result.map((entry) => entry.id).join(',') === 'x,2,upper2' &&
                result[0] === members[2] &&
                result[1] === members[1] &&
                JSON.stringify(fixture.tasks) === snapshot,
            'overlap preserves strict endpoints, orig_end, lanes, IDs, sorting, identity, and input data',
        );
        assert(
            Gantt.prototype.get_overlapping_upper_row_tasks.call(fixture, {})
                .length === 0,
            'overlap without dates returns an empty array',
        );
        // >>> SR: All same-row overlapping tasks -----------------------------
        const allResult = Gantt.prototype.get_overlapping_tasks.call(
            fixture,
            query,
        );
        assert(
            allResult.map((entry) => entry.id).join(',') ===
                'hidden,lower,x,2,10,upper2' &&
                allResult[2] === members[2] &&
                allResult[4] === members[0] &&
                JSON.stringify(fixture.tasks) === snapshot,
            'all-task lookup includes every lane and member ID while preserving overlap, sorting, identity, and input',
        );
        assert(
            Gantt.prototype.get_overlapping_tasks
                .call(fixture, fixture.tasks[6])
                .includes(fixture.tasks[6]),
            'lower-lane normal query includes the clicked task itself',
        );
        assert(
            Gantt.prototype.get_overlapping_tasks.call(fixture, null).length ===
                0 &&
                Gantt.prototype.get_overlapping_tasks.call(fixture, {})
                    .length === 0,
            'all-task lookup without dates returns an empty array',
        );
        // <<< SR: All same-row overlapping tasks -----------------------------
        return passed;
    } finally {
        charts.forEach((chart) => chart.destroy());
        host.remove();
    }
}
// <<< SR: External popup request acceptance ----------------------------------
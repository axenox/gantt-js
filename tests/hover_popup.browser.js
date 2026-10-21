// >>> SR: Latest hover popup position acceptance ------------------------------
/**
 * Checks real bar event handlers with a synchronous, controlled timeout clock.
 * Native and external routes share the same position and lifecycle assertions.
 */
export function run_hover_popup_acceptance(Gantt) {
    const passed = [];
    const charts = [];
    const host = document.createElement('div');
    host.style.width = '900px';
    document.body.appendChild(host);
    const original_set = window.setTimeout;
    const original_clear = window.clearTimeout;
    const timers = new Map();
    let now = 0;
    let next_id = -1;

    /** Fails with the exact regression scenario. */
    function assert(condition, name) {
        if (!condition) throw new Error(name);
        passed.push(name);
    }

    /** Advances to each due timeout without restarting or sleeping. */
    function tick(ms) {
        const end = now + ms;
        while (true) {
            const next = [...timers.entries()]
                .filter(([, timer]) => timer.at <= end)
                .sort((a, b) => a[1].at - b[1].at)[0];
            if (!next) break;
            timers.delete(next[0]);
            now = next[1].at;
            next[1].callback();
        }
        now = end;
    }

    /** Sends viewport coordinates through actual wrapper listeners. */
    function pointer(bar, type, x = 100, y = 80) {
        const event = new MouseEvent(type, {
            bubbles: type === 'mouseup' || type === 'mousemove',
            clientX: x,
            clientY: y,
        });
        bar.group.dispatchEvent(event);
        return event;
    }

    /** Builds actual ordinary and aggregate bars and records accepted openings. */
    function create(mode, options = {}) {
        const element = document.createElement('div');
        host.appendChild(element);
        const requests = [];
        const chart = new Gantt(
            element,
            [
                {
                    id: 'a',
                    name: 'Upper',
                    start: '2026-10-03',
                    end: '2026-10-06',
                    lineIndex: 0,
                },
                {
                    id: 'b',
                    name: 'B',
                    start: '2026-10-01',
                    end: '2026-10-10',
                    lineIndex: 0,
                },
                {
                    id: 'c',
                    name: 'C',
                    start: '2026-10-02',
                    end: '2026-10-07',
                    lineIndex: 0,
                },
            ],
            {
                readonly: true,
                scroll_to: 'start',
                popup_on: 'hover',
                ...(mode === 'external'
                    ? {
                          on_popup_request(ctx) {
                              requests.push(ctx);
                          },
                      }
                    : {}),
                ...options,
            },
        );
        charts.push(chart);
        if (mode === 'native') {
            chart.setup_native_popup();
            const show = chart.popup.show.bind(chart.popup);
            /** Observes native input without bypassing rendering or placement. */
            chart.popup.show = (ctx) => {
                requests.push(ctx);
                show(ctx);
            };
        }
        return { chart, requests };
    }

    try {
        const fixtures = ['external', 'native'].map((mode) => ({
            mode,
            ...create(mode),
        }));
        const click = create('external', { popup_on: 'click' });
        const disabled = create('external', { popup: false });

        /** Schedules deterministic browser timeouts only for this synchronous suite. */
        window.setTimeout = (callback, delay = 0, ...args) => {
            const id = next_id--;
            timers.set(id, {
                at: now + Number(delay),
                callback: () => callback(...args),
            });
            return id;
        };
        /** Cancels controlled timeouts, preserving unrelated browser timers. */
        window.clearTimeout = (id) => {
            if (!timers.delete(id)) original_clear(id);
        };

        for (const { mode, chart, requests } of fixtures) {
            const bars = [
                chart.get_bar('a'),
                chart.bars.find((bar) => bar.task._isAggregate),
            ];
            assert(!!bars[1], `${mode}: real aggregate exists`);
            for (const bar of bars) {
                const label = `${mode}/${bar.task._isAggregate ? 'aggregate' : 'task'}`;
                requests.length = 0;
                pointer(bar, 'mouseenter', 100, 80);
                tick(100);
                const moved = pointer(bar, 'mousemove', 170, 95);
                tick(99);
                assert(requests.length === 0, `${label}: not before 200 ms`);
                tick(1);
                assert(
                    requests.length === 1 &&
                        requests[0].x === 170 &&
                        requests[0].y === 95 &&
                        requests[0].event === moved &&
                        requests[0].task === bar.task &&
                        requests[0].target === bar.$bar &&
                        requests[0].trigger === 'hover',
                    `${label}: A to B opens once at B with latest event`,
                );
                const placement = chart.$popup_wrapper?.getAttribute('style');
                pointer(bar, 'mousemove', 230, 110);
                tick(500);
                assert(
                    requests.length === 1 &&
                        chart.$popup_wrapper?.getAttribute('style') ===
                            placement &&
                        bar._popup_hover_event === null,
                    `${label}: opening does not follow or retain later movement`,
                );
                pointer(bar, 'mouseleave');

                requests.length = 0;
                const entered = pointer(bar, 'mouseenter', 110, 85);
                tick(200);
                assert(
                    requests.length === 1 &&
                        requests[0].x === 110 &&
                        requests[0].y === 85 &&
                        requests[0].event === entered,
                    `${label}: no movement opens at A`,
                );
                pointer(bar, 'mouseleave');

                requests.length = 0;
                pointer(bar, 'mouseenter');
                tick(50);
                pointer(bar, 'mousemove', 140, 90);
                tick(100);
                const last = pointer(bar, 'mousemove', 190, 105);
                tick(49);
                assert(
                    requests.length === 0,
                    `${label}: multiple movements keep delay`,
                );
                tick(1);
                assert(
                    requests.length === 1 &&
                        requests[0].x === 190 &&
                        requests[0].y === 105 &&
                        requests[0].event === last,
                    `${label}: last movement wins at original deadline`,
                );
                pointer(bar, 'mouseleave');

                requests.length = 0;
                pointer(bar, 'mouseenter', 120, 90);
                tick(100);
                pointer(bar, 'mousemove', 200, 100);
                pointer(bar, 'mouseleave');
                tick(100);
                assert(
                    requests.length === 0 &&
                        bar._popup_timeout === null &&
                        bar._popup_hover_event === null,
                    `${label}: leave cancels timer and releases event`,
                );
                const reentered = pointer(bar, 'mouseenter', 130, 88);
                tick(199);
                assert(
                    requests.length === 0,
                    `${label}: reentry gets a fresh delay`,
                );
                tick(1);
                assert(
                    requests.length === 1 &&
                        requests[0].x === 130 &&
                        requests[0].y === 88 &&
                        requests[0].event === reentered,
                    `${label}: reentry has no stale position`,
                );
                pointer(bar, 'mouseleave');

                requests.length = 0;
                pointer(bar, 'mouseenter');
                tick(100);
                bar.refresh();
                tick(100);
                assert(
                    requests.length === 0 && bar._popup_hover_event === null,
                    `${label}: bar refresh cancels pending hover`,
                );
                pointer(bar, 'mouseenter', 150, 90);
                tick(200);
                assert(
                    requests.length === 1,
                    `${label}: refresh binds handlers only once`,
                );
                pointer(bar, 'mouseleave');

                requests.length = 0;
                const clicked = pointer(bar, 'mouseup', 210, 115);
                assert(
                    requests.length === 1 &&
                        requests[0].x === 210 &&
                        requests[0].y === 115 &&
                        requests[0].event === clicked &&
                        requests[0].trigger === 'click',
                    `${label}: click retains click coordinates`,
                );
                if (mode === 'native') {
                    pointer(bar, 'mouseenter');
                    pointer(bar, 'mousemove', 240, 120);
                    tick(200);
                    assert(
                        chart.is_popup_locked_by_click() &&
                            requests.length === 1,
                        `${label}: native click lock still blocks hover`,
                    );
                    pointer(bar, 'mouseleave');
                    document.body.dispatchEvent(
                        new MouseEvent('mousedown', { bubbles: true }),
                    );
                }
            }
        }

        const click_bar = click.chart.get_bar('a');
        pointer(click_bar, 'mouseenter');
        pointer(click_bar, 'mousemove', 180, 95);
        tick(200);
        assert(
            click.requests.length === 0,
            'click mode does not open on hover',
        );
        const click_event = pointer(click_bar, 'mouseup', 220, 130);
        assert(
            click.requests.length === 1 &&
                click.requests[0].event === click_event &&
                click.requests[0].x === 220 &&
                click.requests[0].y === 130,
            'click mode uses click coordinates',
        );
        const disabled_bar = disabled.chart.get_bar('a');
        pointer(disabled_bar, 'mouseenter');
        pointer(disabled_bar, 'mousemove', 180, 95);
        tick(200);
        pointer(disabled_bar, 'mouseup');
        assert(
            disabled.requests.length === 0,
            'disabled popups suppress hover and click',
        );

        for (const operation of ['clear', 'refresh', 'destroy']) {
            const { chart, requests } = create('external');
            const bar = chart.get_bar('a');
            pointer(bar, 'mouseenter');
            pointer(bar, 'mousemove', 180, 95);
            tick(100);
            if (operation === 'refresh') {
                chart.refresh(chart.tasks.filter((task) => !task._isAggregate));
            } else {
                chart[operation]();
            }
            tick(100);
            assert(
                requests.length === 0 &&
                    bar._popup_timeout === null &&
                    bar._popup_hover_event === null,
                `${operation}: cancels pending timer and releases event`,
            );
        }
        return passed;
    } finally {
        charts.forEach((chart) => chart.destroy());
        timers.clear();
        window.setTimeout = original_set;
        window.clearTimeout = original_clear;
        host.remove();
    }
}
// <<< SR: Latest hover popup position acceptance ------------------------------
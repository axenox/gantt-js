// >>> SR: Instance-scoped SVG resource acceptance -----------------------------
/**
 * Exercises actual SVG resolution and existing chart lifecycle APIs in a browser.
 * The second constructor may come from a separately loaded library copy.
 */
export async function run_svg_resource_acceptance(Gantt, OtherGantt = Gantt) {
    const passed = [];
    const charts = [];
    const host = document.createElement('div');
    host.style.width = '1000px';
    document.body.appendChild(host);
    const task_ids = ['1961', 'a.b', 'ab', 'a:b', 'a_b', 'task-\u00e4'];

    /** Reports a failed requirement without hiding its cause. */
    function assert(condition, name) {
        if (!condition) throw new Error(name);
        passed.push(name);
    }

    /** Waits until all scheduled label positioning callbacks have run. */
    function painted() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
    }

    /** Creates fresh task references with images, dependencies and aggregates. */
    function tasks() {
        return [...task_ids.map((id, index) => ({
            id,
            name: `Long label for ${id} that must be clipped inside a narrow bar`,
            start: '2026-10-03',
            end: '2026-10-04',
            lineIndex: index,
            progress: 20,
            dateIncomplete: id === '1961' || id === 'ab',
            dependencies: id === 'ab' ? ['1961'] : [],
            thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="8" height="8"%3E%3Crect width="8" height="8" fill="red"/%3E%3C/svg%3E',
        })), ...['red', 'green', 'blue'].map((color, index) => ({
            id: `member-${index}`,
            name: `Aggregate member ${index}`,
            start: '2026-10-03',
            end: '2026-10-05',
            lineIndex: 10,
            color,
        }))];
    }

    /** Constructs a chart using only the existing public constructor/options. */
    function create(Constructor, options = {}, parent = host) {
        const element = document.createElement('div');
        parent.appendChild(element);
        const chart = new Constructor(element, tasks(), {
            label_overflow: 'clip',
            scroll_to: 'start',
            ignore: ['weekend'],
            column_width: 60,
            ...options,
        });
        charts.push(chart);
        return chart;
    }

    /** Resolves every local SVG URL/href through the document, like the browser. */
    function resources_resolve_locally(chart, name) {
        const elements = chart.$svg.querySelectorAll('*');
        let references = 0;
        for (const element of elements) {
            for (const attr of element.attributes) {
                const ids = Array.from(
                    attr.value.matchAll(/url\(#([^)]+)\)/g),
                    (match) => match[1],
                );
                if (
                    (attr.name === 'href' || attr.name === 'xlink:href') &&
                    attr.value.startsWith('#')
                ) {
                    ids.push(attr.value.slice(1));
                }
                for (const id of ids) {
                    const target = document.getElementById(id);
                    if (!target || target.closest('svg') !== chart.$svg) {
                        throw new Error(`${name}: foreign or missing resource ${id}`);
                    }
                    references++;
                }
            }
        }
        assert(references > task_ids.length * 2, name);
    }

    /** Checks actual document-wide uniqueness, not just disjoint chart prefixes. */
    function unique_ids(name) {
        const ids = Array.from(document.querySelectorAll('svg [id]'), (el) => el.id);
        assert(
            ids.length === new Set(ids).size &&
                ids.every((id) => /^riel-gantt-\d+-[a-z-]+(?:-\d+)?$/.test(id)),
            name,
        );
    }

    /** Counts resources to detect accumulation across repeated lifecycle calls. */
    function counts(chart) {
        return [
            chart.$svg.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'clipPath').length,
            chart.$svg.querySelectorAll('pattern').length,
            chart.$svg.querySelectorAll('defs').length,
        ].join(',');
    }

    /** Returns the document-resolved clip rectangle of a particular bar label. */
    function label_clip(chart, id = '1961') {
        const label = chart.get_bar(id).group.querySelector('.bar-label');
        const clip_id = label.getAttribute('clip-path')?.match(/^url\(#(.+)\)$/)?.[1];
        const clip = clip_id && document.getElementById(clip_id);
        assert(
            clip?.closest('svg') === chart.$svg &&
                +clip.firstElementChild.getAttribute('width') > 0 &&
                +clip.firstElementChild.getAttribute('x') === +label.getAttribute('x'),
            `label ${id} resolves to its own nonempty clipping area`,
        );
        return clip.firstElementChild;
    }

    try {
        let clicked;
        const outer = create(Gantt, { on_click: (task) => { clicked = task; } });
        await painted();
        const original_task = outer.get_task('1961');
        const original_ids = outer.tasks.map((task) => task.id).join(',');
        const original_resources = counts(outer);
        const outer_clip = label_clip(outer);
        assert(
            outer.$svg.querySelector('.agg-swatch-v') &&
                outer.$svg.querySelector('.bar-invalid-overlay') &&
                outer.$svg.querySelector('.ignored-bar') &&
                outer.arrows.length === 1,
            'fixture exercises legend clips, both patterns and dependency arrows',
        );

        // The popup is inserted first to reproduce document-order URL resolution.
        const popup = document.createElement('div');
        host.prepend(popup);
        const inner = create(OtherGantt, {
            column_width: 30,
            global_min_view_start: '2026-09-01',
        }, popup);
        await painted();
        assert(
            outer_clip.getAttribute('x') !== label_clip(inner).getAttribute('x'),
            'outer and inner clipping areas have different coordinates',
        );
        label_clip(outer);
        unique_ids('concurrent library copies have no duplicate SVG IDs');
        resources_resolve_locally(outer, 'outer resources resolve locally with popup open');
        resources_resolve_locally(inner, 'inner resources resolve locally');
        assert(
            outer.get_bar('a.b').group.querySelector('[clip-path]').getAttribute('clip-path') !==
                outer.get_bar('ab').group.querySelector('[clip-path]').getAttribute('clip-path'),
            'punctuation-distinct task IDs retain distinct resource IDs',
        );
        outer.get_bar('1961').group.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        assert(
            clicked === original_task &&
                outer.get_task('ab').dependencies.join(',') === '1961' &&
                outer.tasks.map((task) => task.id).join(',') === original_ids,
            'task identity, IDs, click events and dependencies remain unchanged',
        );
        const namespace = outer._svg_ids.instance_id;
        const inner_resources = counts(inner);
        for (let iteration = 0; iteration < 3; iteration++) {
            popup.style.display = 'none';
            outer.refresh(outer.tasks);
            outer.change_view_mode('Week');
            outer.change_view_mode('Day');
            outer.render();
            popup.style.display = '';
            await painted();
            label_clip(outer);
            resources_resolve_locally(outer, `refresh/render iteration ${iteration} remains local`);
            assert(
                counts(outer) === original_resources &&
                    counts(inner) === inner_resources &&
                    outer._svg_ids.instance_id === namespace,
                `iteration ${iteration} preserves namespace and resource counts`,
            );
        }

        const bar = outer.get_bar('1961');
        const bar_namespace_clip = label_clip(outer).parentElement.id;
        for (let iteration = 0; iteration < 3; iteration++) {
            outer.update_task('1961', { name: original_task.name });
            await painted();
            assert(
                counts(outer) === original_resources &&
                    label_clip(outer).parentElement.id === bar_namespace_clip,
                `single-bar update ${iteration} has stable IDs and no orphan definitions`,
            );
            resources_resolve_locally(outer, 'shared invalid pattern survives a bar refresh');
        }
        const label = bar.group.querySelector('.bar-label');
        outer.update_task('1961', { name: 'x', thumbnail: null });
        await painted();
        assert(
            !bar.group.querySelector('.bar-label').hasAttribute('clip-path') &&
                !document.getElementById(bar_namespace_clip),
            'a fitting label releases its obsolete clip',
        );
        outer.update_task('1961', { name: 'A long label '.repeat(20) });
        await painted();
        outer.update_options({ label_overflow: 'outside' });
        await painted();
        assert(
            !outer.get_bar('1961').group.querySelector('.bar-label').hasAttribute('clip-path') &&
                outer.$svg.querySelectorAll('[id*="-clip-label-"]').length === 0 &&
                !label.isConnected,
            'outside labels leave no label clipping definitions after rerender',
        );
        outer.update_options({ label_overflow: 'clip' });
        await painted();

        inner.destroy();
        await painted();
        resources_resolve_locally(outer, 'destroying the popup preserves outer resources');
        popup.style.display = 'none';
        const reopened = create(OtherGantt, {}, popup);
        await painted();
        resources_resolve_locally(reopened, 'hidden popup resources remain instance-local');
        unique_ids('hidden replacement has no colliding resources');
        popup.style.display = '';
        reopened.refresh(reopened.tasks);
        await painted();
        label_clip(reopened);
        unique_ids('reopening popup allocates a new namespace');
        reopened.clear();
        assert(reopened.$svg.children.length === 0, 'clear removes all instance SVG resources');
        resources_resolve_locally(outer, 'clearing popup leaves outer resources intact');
        reopened.render();
        await painted();
        resources_resolve_locally(reopened, 'render after clear restores only owned resources');

        // Old rAF callbacks must not repopulate the cleared, still-connected SVG.
        const transient = create(OtherGantt);
        transient.refresh(transient.tasks);
        transient.clear();
        await painted();
        assert(transient.$svg.children.length === 0, 'pending label callbacks do not repopulate clear');
        assert(
            outer._svg_ids.instance_id === namespace,
            'option updates also preserve the instance namespace',
        );
        unique_ids('all surviving resources remain unique at lifecycle end');
        return passed;
    } finally {
        for (const chart of charts) chart.destroy();
        host.remove();
    }
}
// <<< SR: Instance-scoped SVG resource acceptance -----------------------------
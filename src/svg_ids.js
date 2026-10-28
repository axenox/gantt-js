// >>> SR: Instance-scoped SVG resources --------------------------------------
const allocator_key = Symbol.for('riel-gantt.svg-instance-allocator');

/** Allocates CSS-safe SVG resource IDs without using business task IDs. */
export default class SvgIds {
    /** Shares a monotonic allocator across library copies in the same document. */
    constructor(document) {
        if (!document[allocator_key]) {
            Object.defineProperty(document, allocator_key, {
                value: { next: 0 },
            });
        }
        this.instance_id = `riel-gantt-${++document[allocator_key].next}`;
        this.bar_ids = new WeakMap();
        this.next_bar_id = 0;
    }

    /**
     * Returns a stable ID for an internal resource type and optional bar owner.
     * Resource types are library constants, never user-supplied selector text.
     */
    get(resource_type, bar) {
        if (!bar) return `${this.instance_id}-${resource_type}`;
        if (!this.bar_ids.has(bar)) {
            this.bar_ids.set(bar, ++this.next_bar_id);
        }
        return `${this.instance_id}-${resource_type}-${this.bar_ids.get(bar)}`;
    }
}
// <<< SR: Instance-scoped SVG resources --------------------------------------
// >>> SR: Popup-independent overlap lookup -----------------------------------
/**
 * Returns the original end before the normalized chart end, without mutation.
 */
export function get_task_end(task) {
    return task?.orig_end ?? task?._end ?? null;
}

/**
 * Checks strict temporal overlap using the native popup's end-date precedence.
 */
export function tasks_overlap(a, b) {
    const aEnd = get_task_end(a);
    const bEnd = get_task_end(b);
    if (!a?._start || !b?._start || !aEnd || !bEnd) return false;
    return a._start < bEnd && b._start < aEnd;
}

// >>> SR: All same-row overlapping tasks -------------------------------------
/**
 * Preserves the existing popup ordering by start date and numeric/string ID.
 */
function compare_tasks_by_start_and_id(a, b) {
    if (+a._start !== +b._start) return +a._start - +b._start;

    const aId = Number.isFinite(+a.id) ? +a.id : String(a.id);
    const bId = Number.isFinite(+b.id) ? +b.id : String(b.id);
    return aId > bId ? 1 : aId < bId ? -1 : 0;
}

/**
 * Returns all strictly overlapping original tasks in the same row, across lanes.
 * Includes hidden aggregate members and the supplied normal task when it overlaps
 * itself. Excludes synthetic aggregates and does not mutate or clone tasks.
 */
export function get_overlapping_tasks(chart, task) {
    if (!task?._start || !get_task_end(task)) return [];

    return (chart.tasks || [])
        .filter((candidate) => candidate && !candidate._isAggregate)
        .filter((candidate) => candidate._rowIndex === task._rowIndex)
        .filter((candidate) => tasks_overlap(candidate, task))
        .sort(compare_tasks_by_start_and_id);
}
// <<< SR: All same-row overlapping tasks -------------------------------------

/**
 * Returns ordered, original visible upper-lane task references in the same row.
 * Aggregate member IDs are excluded; a normal upper-lane task may include itself.
 * This is not an aggregate-members query and does not mutate chart tasks.
 */
export function get_overlapping_upper_row_tasks(chart, aggregateTask) {
    const aggregateStart = aggregateTask?._start;
    const aggregateEnd = get_task_end(aggregateTask);
    const aggregationLane = chart.get_aggregation_lane_index
        ? chart.get_aggregation_lane_index()
        : 1;

    if (!aggregateStart || !aggregateEnd) return [];

    const memberIds = new Set(
        (aggregateTask._members || []).map((member) => String(member.id)),
    );

    return (
        (chart.tasks || [])
            .filter((task) => task && !task._hidden && !task._isAggregate)
            .filter((task) => task._rowIndex === aggregateTask._rowIndex)
            .filter((task) => (task._lane ?? 0) < aggregationLane)
            .filter((task) => !memberIds.has(String(task.id)))
            .filter((task) => tasks_overlap(task, aggregateTask))
            // >>> SR: All same-row overlapping tasks -----------------------------
            .sort(compare_tasks_by_start_and_id)
    );
    // <<< SR: All same-row overlapping tasks -----------------------------
}
// <<< SR: Popup-independent overlap lookup -----------------------------------
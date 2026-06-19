import date_utils from '../src/date_utils'; //TODO SR: Check Path in PowerUI

function getDecade(d) {
  const year = d.getFullYear();
  return String(year - (year % 10));
}

function isBorder(d, ld, interval) {
  if (!ld) return true;

  switch (interval) {
    case 'Date':
      return d.getDate() !== ld.getDate();
    case 'Month':
      return d.getMonth() !== ld.getMonth();
    case 'Year':
      return d.getFullYear() !== ld.getFullYear();
    case 'Decade':
      return getDecade(d) !== getDecade(ld);
    default:
      // fallback: treat as always-border
      return true;
  }
}

//Thick line quarter calculation fix:
function getQuarterStartInInterval(d, step, unit) {
  const intervalStart = date_utils.start_of(d, 'day');
  const intervalEnd = date_utils.add(intervalStart, step, unit);
  const year = intervalStart.getFullYear();

  for (const month of [0, 3, 6, 9]) {
    const quarterStart = new Date(year, month, 1);

    if (quarterStart >= intervalStart && quarterStart < intervalEnd) {
      return quarterStart;
    }
  }

  const nextYearStart = new Date(year + 1, 0, 1);
  return nextYearStart >= intervalStart && nextYearStart < intervalEnd
      ? nextYearStart
      : false;
}

function createHeaderFormatter(def) {
  if (!def) return '';
  const { date_format = '', date_format_at_border = '', interval = null } = def;

  // Token: ~weekRange (start - end of week)
  if (date_format === '~weekRange') {
    
    return (d, ld, lang) => {
      const endOfWeek = date_utils.add(d, 6, 'day');

      const endFormat = endOfWeek.getMonth() !== d.getMonth() ? 'dd MMM' : 'dd';
      const beginFormat = !ld || d.getMonth() !== ld.getMonth() ? 'dd MMM' : 'dd';

      return `${date_utils.format(d, beginFormat, lang)} - ${date_utils.format(endOfWeek, endFormat, lang)}`;
    };
  }
  
  // No interval: always use date_format as string
  if (!interval) {
    return date_format || '';
  }

  // Token: ~decade (2020, 2030, ...))
  const formatValue = (d, fmt, lang) => {
    if (!fmt) return '';
    if (fmt === '~decade') return getDecade(d);
    return date_utils.format(d, fmt, lang);
  };
  
  // If no date_format_at_border is given, date_format is used.
  const borderFmt = date_format_at_border ?? date_format ?? '';
  const normalFmt = date_format ?? '';

  return (d, ld, lang) => {
    const border = isBorder(d, ld, interval);

    // If no normalFmt is given, only show at border
    if (!normalFmt) {
      return border ? formatValue(d, borderFmt, lang) : '';
    }

    // Standard case
    return border
        ? formatValue(d, borderFmt, lang)
        : formatValue(d, normalFmt, lang);
  };
}

/**
 * 
 * Builds frappe-gantt view modes from a simple PowerUI friendly configuration object.
 * 
 * @param simpleConfig
 * @returns {{name: *, padding: *, step: *, date_format: *, column_width, snap_at, upper_text_frequency, upper_text: string|(function(*, *, *): string)|*|(function(*, *, *): (string|string|*)), lower_text: string|(function(*, *, *): string)|*|(function(*, *, *): (string|string|*)), thick_line: (function(*): (boolean|*))|undefined}[]}
 */
function buildViewModesFromSimpleConfig(simpleConfig) {
  return Object.entries(simpleConfig).map(([name, vm]) => {
    const upperDef = vm.header?.upper;
    const lowerDef = vm.header?.lower;

    return {
      name, //
      padding: vm.padding, //
      step: vm.step, //
      date_format: vm.date_format, //
      column_width: vm.column_width ?? undefined, //
      snap_at: vm.snap_at ?? undefined, //
      upper_text_frequency: vm.upper_text_frequency ?? undefined, //
      thick_line_color: vm.thick_line_color,

      upper_text: createHeaderFormatter({
        date_format: upperDef?.date_format ?? '',
        date_format_at_border: upperDef?.date_format_at_border ?? upperDef?.date_format ?? '',
        interval: upperDef?.interval ?? null,
      }),

      lower_text: createHeaderFormatter({
        date_format: lowerDef?.date_format ?? '',
        date_format_at_border: lowerDef?.date_format_at_border ?? lowerDef?.date_format ?? '',
        interval: lowerDef?.interval ?? null,
      }),
      
      thick_line: vm.thick_line
          ? (d, ctx = {}) => {
            // Beispiel: Week + Monday
            if (vm.thick_line.interval === 'week') {
              return d.getDay() === vm.thick_line.value;
            }
            if (vm.thick_line.interval === 'month_range_in_days') {
              return d.getDate() >= vm.thick_line.from && d.getDate() <= vm.thick_line.to;
            }
            if (vm.thick_line.interval === 'year_quarter') {
              return getQuarterStartInInterval(
                  d,
                  ctx.step ?? 1,
                  ctx.unit ?? 'day',
              );
            }
            return false;
          }
          : undefined,
    };
  });
}

export { buildViewModesFromSimpleConfig };
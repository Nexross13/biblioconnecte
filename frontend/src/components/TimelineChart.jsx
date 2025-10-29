import { useMemo } from 'react'

const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric' })
const numberFormatter = new Intl.NumberFormat('fr-FR')

const COLORS = {
  books: '#6366F1',
  members: '#10B981',
}

const buildPath = (points) =>
  points.length
    ? points
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ')
    : ''

const TimelineChart = ({ data = [] }) => {
  const {
    pointsBooks,
    pointsMembers,
    ticks,
    minValue,
    maxValue,
    yTicks,
    dimensions,
  } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        pointsBooks: [],
        pointsMembers: [],
        ticks: [],
        minValue: 0,
        maxValue: 1,
        yTicks: [],
        dimensions: {
          width: 640,
          height: 260,
          paddingX: 32,
          paddingY: 28,
          baselineY: 232,
        },
      }
    }

    const valuesBooks = data.map((entry) => Number(entry.books) || 0)
    const valuesMembers = data.map((entry) => Number(entry.members) || 0)
    const combinedValues = [...valuesBooks, ...valuesMembers]
    const minValueLocal = Math.min(...combinedValues)
    const maxValueLocal = Math.max(...combinedValues)
    const span = maxValueLocal - minValueLocal || 1

    const width = 640
    const height = 260
    const paddingX = 32
    const paddingY = 28
    const usableWidth = width - paddingX * 2
    const usableHeight = height - paddingY * 2
    const stepX = data.length > 1 ? usableWidth / (data.length - 1) : 0

    const toPoint = (value, index) => {
      const ratio = (value - minValueLocal) / span
      const x = paddingX + index * stepX
      const y = height - paddingY - ratio * usableHeight
      return { x, y }
    }

    const booksPts = valuesBooks.map((value, index) => toPoint(value, index))
    const membersPts = valuesMembers.map((value, index) => toPoint(value, index))

    const labelIndices =
      data.length <= 6
        ? data.map((_, index) => index)
        : [0, Math.floor(data.length / 2), data.length - 1]

    const ticksLocal = labelIndices.map((index) => ({
      label: data[index].date,
      x: paddingX + index * stepX,
    }))

    const yTickCount = 4
    const yTicksLocal = Array.from({ length: yTickCount + 1 }, (_, index) => {
      const value = minValueLocal + (span * index) / yTickCount
      const ratio = span === 0 ? 0 : (value - minValueLocal) / span
      const y = height - paddingY - ratio * usableHeight
      return { value, y }
    })

    return {
      pointsBooks: booksPts,
      pointsMembers: membersPts,
      ticks: ticksLocal,
      minValue: minValueLocal,
      maxValue: maxValueLocal,
       yTicks: yTicksLocal,
      dimensions: {
        width,
        height,
        paddingX,
        paddingY,
        baselineY: height - paddingY,
      },
    }
  }, [data])

  const pathBooks = buildPath(pointsBooks)
  const pathMembers = buildPath(pointsMembers)
  const { width, height, baselineY, paddingX, paddingY } = dimensions

  if (!pointsBooks.length && !pointsMembers.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Pas encore assez de données pour tracer la courbe.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-8 rounded-full" style={{ background: COLORS.books }} />
          Livres
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-2 w-8 rounded-full"
            style={{ background: COLORS.members }}
          />
          Comptes
        </span>
        <span className="ms-auto text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {`Min ${numberFormatter.format(minValue)} • Max ${numberFormatter.format(maxValue)}`}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cumul des livres et des comptes créés sur les 30 derniers jours"
        className="h-64 w-full"
      >
        <defs>
          <linearGradient id="booksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.books} stopOpacity="0.35" />
            <stop offset="100%" stopColor={COLORS.books} stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="membersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.members} stopOpacity="0.35" />
            <stop offset="100%" stopColor={COLORS.members} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="none" rx="16" />

        <line
          x1={paddingX}
          x2={paddingX}
          y1={paddingY - 8}
          y2={baselineY}
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-300 dark:text-slate-600"
        />

        {yTicks.slice(1, -1).map((tick) => (
          <line
            key={`grid-${tick.value}`}
            x1={paddingX}
            x2={width - paddingX}
            y1={tick.y}
            y2={tick.y}
            stroke="currentColor"
            strokeDasharray="4 6"
            className="text-slate-200 dark:text-slate-700"
          />
        ))}

        {yTicks.map((tick) => (
          <g key={`ytick-${tick.value}`}>
            <line
              x1={paddingX - 4}
              x2={paddingX}
              y1={tick.y}
              y2={tick.y}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-600"
            />
            <text
              x={paddingX - 8}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              className="text-slate-500 dark:text-slate-400"
            >
              {numberFormatter.format(Math.round(tick.value))}
            </text>
          </g>
        ))}

        {pathMembers ? (
          <g>
            {pointsMembers.length > 0 && (
              <path
                d={`${pathMembers} L${pointsMembers[pointsMembers.length - 1].x.toFixed(
                  2,
                )} ${baselineY} L${pointsMembers[0].x.toFixed(2)} ${baselineY} Z`}
                fill="url(#membersGradient)"
                fillOpacity="0.5"
              />
            )}
            <path d={pathMembers} fill="none" stroke={COLORS.members} strokeWidth="3" />
          </g>
        ) : null}

        {pathBooks ? (
          <g>
            {pointsBooks.length > 0 && (
              <path
                d={`${pathBooks} L${pointsBooks[pointsBooks.length - 1].x.toFixed(2)} ${baselineY} L${pointsBooks[0].x.toFixed(2)} ${baselineY} Z`}
                fill="url(#booksGradient)"
                fillOpacity="0.5"
              />
            )}
            <path d={pathBooks} fill="none" stroke={COLORS.books} strokeWidth="3" />
          </g>
        ) : null}

        {ticks.map((tick) => (
          <g key={tick.label}>
            <line
              x1={tick.x}
              x2={tick.x}
              y1={baselineY}
              y2={baselineY + 4}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-600"
            />
            <text
              x={tick.x}
              y={baselineY + 16}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              className="text-slate-500 dark:text-slate-400"
            >
              {formatter.format(new Date(tick.label))}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default TimelineChart

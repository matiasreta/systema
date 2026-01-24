'use client';

interface HabitProgressProps {
    percentage: number;
    color: string;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

export default function HabitProgress({
    percentage,
    color,
    size = 'medium',
    showLabel = true
}: HabitProgressProps) {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    const getBarColor = () => {
        if (clampedPercentage >= 70) return color;
        if (clampedPercentage >= 30) return '#f59e0b';
        return '#ef4444';
    };

    const heights = {
        small: 4,
        medium: 8,
        large: 12
    };

    const fontSizes = {
        small: '0.65rem',
        medium: '0.75rem',
        large: '0.85rem'
    };

    return (
        <div className="progress-container">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${clampedPercentage}%`,
                        backgroundColor: getBarColor(),
                        height: heights[size]
                    }}
                />
            </div>
            {showLabel && (
                <span className="progress-label" style={{ fontSize: fontSizes[size] }}>
                    {clampedPercentage.toFixed(1)}%
                </span>
            )}

            <style jsx>{`
        .progress-container {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .progress-bar {
          flex: 1;
          height: ${heights[size]}px;
          background: #f1f5f9;
          border-radius: ${heights[size] / 2}px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: ${heights[size] / 2}px;
          transition: width 0.3s ease-out;
        }

        .progress-label {
          color: #64748b;
          font-weight: 600;
          min-width: 48px;
          text-align: right;
        }
      `}</style>
        </div>
    );
}

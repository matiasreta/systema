'use client';

import { Task } from './DailyCalendar';

export type TaskMode = 'idle' | 'setting-ideal' | 'marking-real';

interface ConfigPanelProps {
    currentMode: TaskMode;
    onModeChange: (mode: TaskMode) => void;
    hasIdealTasks: boolean;
    selectedIdealTask: Task | null;
    onCancelMarkingReal: () => void;
}

export default function ConfigPanel({
    currentMode,
    onModeChange,
    hasIdealTasks,
}: ConfigPanelProps) {
    const handleIdealClick = () => {
        if (currentMode === 'setting-ideal') {
            onModeChange('idle');
        } else if (currentMode === 'idle') {
            onModeChange('setting-ideal');
        }
    };

    return (
        <div className="config-panel">
            <h3 className="panel-title">CONFIGURACIÓN</h3>

            <div className="button-group">
                <button
                    className={`config-btn ideal-btn ${currentMode === 'setting-ideal' ? 'active' : ''}`}
                    onClick={handleIdealClick}
                    disabled={currentMode === 'marking-real'}
                >
                    <span className="btn-icon">◆</span>
                    <span className="btn-text">CREAR TAREA IDEAL</span>
                    {currentMode === 'setting-ideal' ? (
                        <span className="btn-status">CLICK EN EL CALENDARIO...</span>
                    ) : (
                        <span className="btn-hint">Planifica tu día</span>
                    )}
                </button>
            </div>

            <div className="instructions">
                <h4 className="instructions-title">CÓMO USAR</h4>
                {!hasIdealTasks && (
                    <ol className="steps">
                        <li>Click en <strong>CREAR TAREA IDEAL</strong></li>
                        <li>Selecciona el rango horario en el calendario</li>
                        <li>Completa título y descripción</li>
                    </ol>
                )}
                {hasIdealTasks && currentMode === 'idle' && (
                    <ol className="steps">
                        <li>Click en un <strong>TAG verde</strong> del header</li>
                        <li>Selecciona cuándo realmente lo hiciste</li>
                        <li>Se creará el bloque rojo comparativo</li>
                    </ol>
                )}
                {currentMode === 'setting-ideal' && (
                    <p className="active-msg">Selecciona el rango en el calendario</p>
                )}
                {currentMode === 'marking-real' && (
                    <p className="active-msg real">Marca cuándo lo hiciste realmente</p>
                )}
            </div>

            <div className="legend">
                <h4 className="legend-title">LEYENDA</h4>
                <div className="legend-item">
                    <span className="legend-color ideal"></span>
                    <span className="legend-label">IDEAL (lo que planificaste)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color real"></span>
                    <span className="legend-label">REAL (lo que hiciste)</span>
                </div>
            </div>

            <style jsx>{`
                .config-panel {
                    width: 260px;
                    background: #000000;
                    border: 4px solid #ffffff;
                    padding: 20px;
                    font-family: 'Courier New', Courier, monospace;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    height: fit-content;
                }

                .panel-title {
                    font-size: 0.9rem;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 0.15em;
                    margin: 0;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #333333;
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .config-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                    padding: 14px;
                    background: #111111;
                    border: 3px solid #333333;
                    color: #888888;
                    cursor: pointer;
                    font-family: 'Courier New', Courier, monospace;
                    text-align: left;
                }

                .config-btn:hover:not(:disabled) {
                    background: #1a1a1a;
                    border-color: #00ff00;
                    color: #ffffff;
                }

                .config-btn.ideal-btn.active {
                    background: #00ff00;
                    border-color: #00ff00;
                    color: #000000;
                }

                .config-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .btn-icon {
                    font-size: 1rem;
                }

                .btn-text {
                    font-size: 0.8rem;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                }

                .btn-status {
                    font-size: 0.65rem;
                    letter-spacing: 0.05em;
                    animation: blink 1s infinite;
                }

                .btn-hint {
                    font-size: 0.6rem;
                    opacity: 0.6;
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }

                .instructions {
                    padding: 12px;
                    background: #0a0a0a;
                    border: 2px solid #222222;
                }

                .instructions-title {
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: #666666;
                    letter-spacing: 0.1em;
                    margin: 0 0 10px 0;
                }

                .steps {
                    margin: 0;
                    padding-left: 16px;
                    font-size: 0.65rem;
                    color: #888888;
                    line-height: 1.6;
                }

                .steps li {
                    margin-bottom: 4px;
                }

                .steps strong {
                    color: #ffffff;
                }

                .active-msg {
                    margin: 0;
                    font-size: 0.7rem;
                    color: #00ff00;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                }

                .active-msg.real {
                    color: #ff0000;
                }

                .legend {
                    padding-top: 12px;
                    border-top: 2px solid #333333;
                }

                .legend-title {
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: #666666;
                    letter-spacing: 0.1em;
                    margin: 0 0 10px 0;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .legend-color {
                    width: 14px;
                    height: 14px;
                    border: 2px solid;
                }

                .legend-color.ideal {
                    background: #00ff00;
                    border-color: #00cc00;
                }

                .legend-color.real {
                    background: #ff0000;
                    border-color: #cc0000;
                }

                .legend-label {
                    font-size: 0.6rem;
                    color: #888888;
                    letter-spacing: 0.03em;
                }
            `}</style>
        </div>
    );
}

import React from 'react';
import './ConformanceCheckBox.css';

export default function ConformanceCheckBox({ fitness, precision, fScore }) {
    return (
        <div className="conformance-check-box">
            <div className="conformance-header">
                <h3>📊 Conformance Metrics</h3>
            </div>
            <div className="conformance-metrics">
                <div className="metric-item">
                    <div className="metric-label">Fitness</div>
                    <div className="metric-value">{fitness.toFixed(4)}</div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Precision</div>
                    <div className="metric-value">{precision.toFixed(4)}</div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">F-Score</div>
                    <div className="metric-value">{fScore.toFixed(4)}</div>
                </div>
            </div>
        </div>
    );
}

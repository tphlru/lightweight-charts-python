import { ViewPoint } from "../drawing/pane-view";
import { CanvasRenderingTarget2D } from "fancy-canvas";
import { TwoPointDrawingPaneRenderer } from "../drawing/pane-renderer";
import { MeasureOptions } from "./measure";
import { setLineStyle } from "../helpers/canvas-rendering";
import { IChartApi, ISeriesApi, SeriesOptionsMap } from "lightweight-charts";
import { Point } from "../drawing/data-source";

export class MeasurePaneRenderer extends TwoPointDrawingPaneRenderer {
    declare _options: MeasureOptions;
    private series: ISeriesApi<keyof SeriesOptionsMap>;
    private chart: IChartApi;
    private _point1: Point;
    private _point2: Point;

    constructor(series: ISeriesApi<keyof SeriesOptionsMap>, chart: IChartApi, p1: ViewPoint, p2: ViewPoint, options: MeasureOptions, showCircles: boolean, point1: Point, point2: Point) {
        super(p1, p2, options, showCircles);
        this.series = series;
        this.chart = chart;
        this._point1 = point1;
        this._point2 = point2;
    }

    draw(target: CanvasRenderingTarget2D) {
        console.log('DEBUG: MeasurePaneRenderer draw called');
        target.useBitmapCoordinateSpace(scope => {
            const ctx = scope.context;
            const scaled = this._getScaledCoordinates(scope);
            if (!scaled) return;
            ctx.lineWidth = this._options.width;
            ctx.strokeStyle = this._options.lineColor;
            setLineStyle(ctx, this._options.lineStyle);
            ctx.fillStyle = this._options.fillColor;
            const mainX = Math.min(scaled.x1, scaled.x2);
            const mainY = Math.min(scaled.y1, scaled.y2);
            const width = Math.abs(scaled.x1 - scaled.x2);
            const height = Math.abs(scaled.y1 - scaled.y2);
            // Calculate Price Percentage Difference
            let priceDiff = 0;
            if (this._p1.y != null && this._p2.y != null) {
                priceDiff = ((this._p1.y - this._p2.y) / this._p1.y) * 100;
            }
            const priceDiffText = `Price: ${priceDiff.toFixed(2)}%`;

            // Set fill color based on priceDiff
            if (priceDiff > 0) {
                ctx.fillStyle = 'rgba(0, 200, 0, 0.1)'; // green
            } else if (priceDiff < 0) {
                ctx.fillStyle = 'rgba(200, 0, 0, 0.1)'; // red
            } else {
                ctx.fillStyle = this._options.fillColor;
            }
            // Draw the rectangle
            ctx.strokeRect(mainX, mainY, width, height);
            ctx.fillRect(mainX, mainY, width, height);
            // Only proceed if both points have valid data
            if (this._point1 && this._point2) {
                // Use p1/p2 for coordinates, _point1/_point2 for logical/price
                const p1 = this._p1;
                const p2 = this._p2;
                if (p1.x == null || p2.x == null || p1.y == null || p2.y == null) return;
                const price1 = this.series.coordinateToPrice(p1.y);
                const price2 = this.series.coordinateToPrice(p2.y);
                const time1 = this.chart.timeScale().coordinateToTime(p1.x);
                const time2 = this.chart.timeScale().coordinateToTime(p2.x);
                if (price1 == null || price2 == null || time1 == null || time2 == null) return;
                // Calculate Time Difference
                let timeDiffMs = 0;
                if (typeof time1 === 'number' && typeof time2 === 'number') {
                    timeDiffMs = Math.abs(time2 - time1);
                }
                const timeDiffText = `Time: ${this._formatTimeDifference(timeDiffMs)}`;
                // Calculate Bars Difference
                let l1 = Number(this._point1 && typeof this._point1.logical === 'number' && isFinite(this._point1.logical) ? this._point1.logical : 0);
                let l2 = Number(this._point2 && typeof this._point2.logical === 'number' && isFinite(this._point2.logical) ? this._point2.logical : 0);
                let bars = 0;
                if (isFinite(l1) && isFinite(l2)) {
                    bars = Math.abs(l2 - l1);
                }
                const barsDiffText = `Bars: ${bars}`;
                // Set text styles
                ctx.font = "12px Arial";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const centerX = mainX + width / 2;
                const topY = mainY - 10;
                const bottomY = mainY + height + 10;
                // Always show priceDiffText at the top
                ctx.fillText(priceDiffText, centerX, topY);
                // Show length info at the bottom according to lengthDisplay
                const display = typeof (this._options as any).lengthDisplay === 'string'
                    ? (this._options as any).lengthDisplay
                    : 'both';
                let bottomText = '';
                if (display === 'both') {
                    bottomText = [timeDiffText, barsDiffText].filter(Boolean).join(', ');
                } else if (display === 'time') {
                    bottomText = timeDiffText || 'Time: 0s';
                } else if (display === 'bars') {
                    bottomText = barsDiffText || 'Bars: 0';
                }
                ctx.fillText(bottomText, centerX, bottomY);
            }
            if (!this._hovered) return;
            this._drawEndCircle(scope, mainX, mainY);
            this._drawEndCircle(scope, mainX + width, mainY);
            this._drawEndCircle(scope, mainX + width, mainY + height);
            this._drawEndCircle(scope, mainX, mainY + height);
        });
    }

    /**
     * Formats the time difference from milliseconds to a human-readable string.
     * You can adjust this function based on your application's requirements.
     * @param ms Time difference in milliseconds
     * @returns Formatted time difference string
     */
    private _formatTimeDifference(ms: number): string {
        const seconds = Math.floor(ms);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
}
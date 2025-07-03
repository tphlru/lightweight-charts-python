import { CanvasRenderingTarget2D } from "fancy-canvas";
import { TwoPointDrawingPaneRenderer } from "../drawing/pane-renderer";
import { DrawingOptions } from "../drawing/options";
import { ViewPoint } from "../drawing/pane-view";

export class VerticalSpanPaneRenderer extends TwoPointDrawingPaneRenderer {
    constructor(p1: ViewPoint, p2: ViewPoint, options: DrawingOptions, hovered: boolean) {
        super(p1, p2, options, hovered);
    }

    draw(target: CanvasRenderingTarget2D) {
        target.useBitmapCoordinateSpace(scope => {
            if (
                this._p1.x === null ||
                this._p2.x === null
            ) return;
            const ctx = scope.context;
            const x1 = Math.round(this._p1.x * scope.horizontalPixelRatio);
            const x2 = Math.round(this._p2.x * scope.horizontalPixelRatio);
            const left = Math.min(x1, x2);
            const right = Math.max(x1, x2);
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.fillStyle = this._options.lineColor;
            ctx.fillRect(left, 0, right - left, scope.bitmapSize.height);
            ctx.restore();
        });
    }
} 
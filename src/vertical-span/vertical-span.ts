import { TwoPointDrawing } from '../drawing/two-point-drawing';
import { Point } from '../drawing/data-source';
import { DrawingOptions } from '../drawing/options';
import { VerticalSpanPaneView } from './pane-view';

export class VerticalSpan extends TwoPointDrawing {
    _type = 'VerticalSpan';

    constructor(
        p1: Point,
        p2: Point,
        options?: Partial<DrawingOptions>
    ) {
        super(p1, p2, options);
        this._paneViews = [new VerticalSpanPaneView(this)];
    }

    // --- Реализация абстрактных методов ---
    protected _onMouseDown(): void {}
    protected _onDrag(): void {}
    protected _moveToState(): void {}
    protected _mouseIsOverDrawing(): boolean { return false; }
} 
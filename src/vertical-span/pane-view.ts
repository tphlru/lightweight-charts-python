import { VerticalSpan } from './vertical-span';
import { VerticalSpanPaneRenderer } from './pane-renderer';
import { TwoPointDrawingPaneView } from '../drawing/pane-view';

export class VerticalSpanPaneView extends TwoPointDrawingPaneView {
    constructor(source: VerticalSpan) {
        super(source);
    }

    renderer() {
        return new VerticalSpanPaneRenderer(
            this._p1,
            this._p2,
            this._source._options,
            this._source.hovered,
        );
    }
} 
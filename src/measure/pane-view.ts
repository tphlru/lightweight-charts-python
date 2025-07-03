import { Measure } from './measure';
import { MeasurePaneRenderer } from './pane-renderer';
import { TwoPointDrawingPaneView } from '../drawing/pane-view';
import { MeasureOptions } from './measure';
import { Logical } from 'lightweight-charts';

export class MeasurePaneView extends TwoPointDrawingPaneView {
    constructor(source: Measure) {
        super(source)
    }

    renderer() {
        const safeP1 = this._source.p1 || { logical: 0 as Logical, price: 0, time: null };
        const safeP2 = this._source.p2 || { logical: 0 as Logical, price: 0, time: null };
        return new MeasurePaneRenderer(
            this._source.series, // use public getter
            this._source.chart, // use public getter
            this._p1,
            this._p2,
            this._source._options as MeasureOptions,
            this._source.hovered,
            safeP1, // pass safe Point
            safeP2  // pass safe Point
        );
    }
}
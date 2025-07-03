import { VolumeProfile } from './volume-profile';
import { VolumeProfilePaneRenderer } from './pane-renderer';

export class VolumeProfilePaneView {
    constructor(private _source: VolumeProfile) {}

    update() {
        // Для совместимости с интерфейсом, можно оставить пустым или обновлять внутренние данные
    }

    renderer() {
        return new VolumeProfilePaneRenderer(
            this._source.bars,
            this._source.options,
            this._source.renderMeta,
            this._source.series as any // series для priceToCoordinate
        );
    }
} 
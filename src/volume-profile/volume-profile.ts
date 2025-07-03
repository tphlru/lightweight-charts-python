import { PluginBase } from '../plugin-base';
import { ISeriesApi, SeriesType, Time } from 'lightweight-charts';
import { VolumeProfilePaneView } from './pane-view';

export interface VolumeProfileOptions {
    enabled?: boolean;
    bins?: number;
    color?: string;
    widthPercentage?: number;
    textColor?: string;
    adaptiveVerticalBounds?: boolean;
    volumeLabelPosition?: 'right' | 'inside';
    volumeLabelFormat?: 'value' | 'percent';
    volumeLabelVisible?: boolean;
    minBarWidthForInsideLabel?: number;
    rangeMode?: 'visible' | 'last_n_visible' | 'last_n_total';
    lastN?: number;
}

const defaultVolumeProfileOptions: VolumeProfileOptions = {
    enabled: true,
    bins: 40,
    color: 'rgba(231,156,250,0.1)',
    widthPercentage: 10,
    textColor: 'white',
    adaptiveVerticalBounds: false,
    volumeLabelPosition: 'right',
    volumeLabelFormat: 'value',
    volumeLabelVisible: true,
    minBarWidthForInsideLabel: 40,
    rangeMode: 'visible',
    lastN: 100,
};

export interface VolumeProfileBar {
    priceLow: number;
    priceHigh: number;
    volume: number;
}

export interface VolumeProfileRenderMeta {
    minPrice: number;
    maxPrice: number;
}

export class VolumeProfile extends PluginBase {
    private _options: VolumeProfileOptions;
    private _paneViews: VolumeProfilePaneView[];
    private _bars: VolumeProfileBar[] = [];
    private _renderMeta: VolumeProfileRenderMeta = { minPrice: 0, maxPrice: 1 };
    constructor(options: Partial<VolumeProfileOptions> = {}) {
        super();
        this._options = { ...defaultVolumeProfileOptions, ...options };
        this._paneViews = [new VolumeProfilePaneView(this)];
        setTimeout(() => this.updateProfile(), 0);
    }

    public applyOptions(options: Partial<VolumeProfileOptions>) {
        this._options = { ...this._options, ...options };
        this.requestUpdate();
    }

    public get options() {
        return this._options;
    }

    public get bars() {
        return this._bars;
    }

    public paneViews() {
        return this._paneViews;
    }

    public get renderMeta() {
        return this._renderMeta;
    }

    // Type guard для candlestick bar
    private isCandlestickBar(bar: any): bar is { open: number; high: number; low: number; close: number; time: Time } {
        return (
            typeof bar === 'object' &&
            bar !== null &&
            typeof bar.open === 'number' &&
            typeof bar.high === 'number' &&
            typeof bar.low === 'number' &&
            typeof bar.close === 'number'
        );
    }
    // Type guard для histogram bar
    private isHistogramBar(bar: any): bar is { value: number; time: Time } {
        return (
            typeof bar === 'object' &&
            bar !== null &&
            typeof bar.value === 'number' &&
            bar.time !== undefined
        );
    }

    public updateProfile() {
        if (!this._options.enabled) {
            this._bars = [];
            this._renderMeta = { minPrice: 0, maxPrice: 1 };
            this.requestUpdate();
            return;
        }
        const priceDataRaw = (this.series as ISeriesApi<SeriesType>).data ? (this.series as ISeriesApi<SeriesType>).data() : [];
        const priceData = priceDataRaw.filter(this.isCandlestickBar);
        // Получаем volumeSeries напрямую из window.mainHandler
        let volumeSeries: ISeriesApi<SeriesType> | undefined = undefined;
        const handler = (window as any).mainHandler;
        if (handler && handler.volumeSeries) {
            volumeSeries = handler.volumeSeries;
        }
        const volumeDataRaw = volumeSeries && volumeSeries.data ? volumeSeries.data() : [];
        const volumeData = volumeDataRaw.filter(this.isHistogramBar);
        // Подписка на обновление данных объёма (однократно)
        if (volumeSeries && (volumeSeries as any).subscribeDataChanged && !(volumeSeries as any)._vp_subscribed) {
            (volumeSeries as any).subscribeDataChanged(() => this.updateProfile());
            (volumeSeries as any)._vp_subscribed = true;
        }
        const volumeByTime = new Map<number, number>();
        for (const v of volumeData) {
            // @ts-ignore
            volumeByTime.set(Number(v.time), v.value);
        }
        // Объединяем OHLC и volume по времени
        const mergedBars = priceData.map(bar => ({
            ...bar,
            // @ts-ignore
            volume: volumeByTime.get(Number(bar.time)) ?? 0
        }));
        // Получаем видимый диапазон
        const timeScale = this.chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        if (!visibleRange) {
            this._bars = [];
            this._renderMeta = { minPrice: 0, maxPrice: 1 };
            this.requestUpdate();
            return;
        }
        // Фильтруем бары по режиму
        let filteredBars = mergedBars;
        if (this._options.rangeMode === 'visible' || !this._options.rangeMode) {
            // По видимому диапазону
            filteredBars = mergedBars.filter(bar => {
                // @ts-ignore
                const t = Number(bar.time);
                return (
                    typeof t === 'number' &&
                    t >= Number(visibleRange.from) &&
                    t <= Number(visibleRange.to)
                );
            });
        } else if (this._options.rangeMode === 'last_n_visible') {
            // Последние N видимых баров (от правого края видимого диапазона)
            const visibleBars = mergedBars.filter(bar => {
                // @ts-ignore
                const t = Number(bar.time);
                return (
                    typeof t === 'number' &&
                    t >= Number(visibleRange.from) &&
                    t <= Number(visibleRange.to)
                );
            });
            filteredBars = visibleBars.slice(-Math.abs(this._options.lastN || 100));
        } else if (this._options.rangeMode === 'last_n_total') {
            // Последние N баров всего датасета
            filteredBars = mergedBars.slice(-Math.abs(this._options.lastN || 100));
        }
        if (filteredBars.length === 0) {
            this._bars = [];
            this._renderMeta = { minPrice: 0, maxPrice: 1 };
            this.requestUpdate();
            return;
        }
        // Расчёт бинов по ценам
        let minPrice = Math.min(...filteredBars.map(b => b.low));
        let maxPrice = Math.max(...filteredBars.map(b => b.high));
        if (!this._options.adaptiveVerticalBounds) {
            // Если не адаптивно, используем границы окна (pane)
            // (оставляем как есть, min/max по видимым свечам)
        }
        this._renderMeta = { minPrice, maxPrice };
        const bins = this._options.bins || 40;
        const binSize = (maxPrice - minPrice) / bins;
        const bars: VolumeProfileBar[] = [];
        for (let i = 0; i < bins; ++i) {
            const priceLow = minPrice + i * binSize;
            const priceHigh = priceLow + binSize;
            const volume = filteredBars
                .filter(b => b.low < priceHigh && b.high > priceLow)
                .reduce((sum, b) => sum + (b.volume || 0), 0);
            bars.push({ priceLow, priceHigh, volume });
        }
        this._bars = bars;
        this.requestUpdate();
    }

    // Для совместимости с pane-view
    public dataUpdated() {
        this.updateProfile();
    }

    public visible() {
        return !!this._options.enabled;
    }

    public attached({ chart }: { chart: any }) {
        super.attached.apply(this, arguments as any);
        if (chart && chart.timeScale && chart.timeScale().subscribeVisibleLogicalRangeChange) {
            chart.timeScale().subscribeVisibleLogicalRangeChange(() => this.updateProfile());
        }
        this.updateProfile();
    }
} 
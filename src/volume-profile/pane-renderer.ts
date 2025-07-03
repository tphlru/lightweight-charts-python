import { VolumeProfileBar, VolumeProfileOptions, VolumeProfileRenderMeta } from './volume-profile';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { ISeriesApi, SeriesType } from 'lightweight-charts';

export class VolumeProfilePaneRenderer {
    constructor(
        private bars: VolumeProfileBar[],
        private options: VolumeProfileOptions,
        private renderMeta: VolumeProfileRenderMeta,
        private series: ISeriesApi<SeriesType>
    ) {}

    // Функция для форматирования объёма с сокращениями
    private formatVolume(value: number): string {
        const abs = Math.abs(value);
        if (abs >= 1e12) return (value / 1e12).toFixed(1) + 'T';
        if (abs >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value.toFixed(1);
    }

    draw(target: CanvasRenderingTarget2D) {
        console.log('[VolumeProfile] draw called', this.bars.length, this.options);
        if (!this.bars || this.bars.length === 0) {
            console.log('[VolumeProfile] No bars to draw');
            return;
        }
        target.useBitmapCoordinateSpace(scope => {
            const ctx = scope.context;
            const width = scope.bitmapSize.width;
            const height = scope.bitmapSize.height;
            const maxVol = Math.max(...this.bars.map(b => b.volume));
            if (maxVol === 0) {
                console.log('[VolumeProfile] maxVol is 0');
                return;
            }
            const maxBarWidth = width * (this.options.widthPercentage || 10) / 100;
            for (const bar of this.bars) {
                let y1, y2;
                if (this.options.adaptiveVerticalBounds && this.series && typeof this.series.priceToCoordinate === 'function') {
                    y1 = this.series.priceToCoordinate(bar.priceHigh);
                    y2 = this.series.priceToCoordinate(bar.priceLow);
                } else {
                    const minPrice = this.renderMeta.minPrice;
                    const maxPrice = this.renderMeta.maxPrice;
                    y1 = Math.round((1 - (bar.priceHigh - minPrice) / (maxPrice - minPrice)) * height);
                    y2 = Math.round((1 - (bar.priceLow - minPrice) / (maxPrice - minPrice)) * height);
                }
                if (y1 == null || y2 == null) continue;
                const barHeight = y2 - y1;
                const barWidth = (bar.volume / maxVol) * maxBarWidth;
                ctx.fillStyle = this.options.color || 'rgba(231,156,250,0.1)';
                ctx.fillRect(width - barWidth, y1, barWidth, barHeight);
                // Подписи объёма
                if (this.options.volumeLabelVisible && bar.volume > 0) {
                    let label = '';
                    if (this.options.volumeLabelFormat === 'percent') {
                        const percent = (bar.volume / maxVol) * 100;
                        label = percent.toFixed(1) + '%';
                    } else {
                        label = this.formatVolume(bar.volume);
                    }
                    ctx.font = `${Math.max(10, Math.abs(barHeight) / 2)}px Arial`;
                    ctx.fillStyle = this.options.textColor || 'white';
                    ctx.textBaseline = 'middle';
                    const minInside = this.options.minBarWidthForInsideLabel ?? 40;
                    const useInside = this.options.volumeLabelPosition === 'inside' && barWidth >= minInside;
                    if (useInside) {
                        ctx.textAlign = 'left';
                        ctx.fillText(label, width - barWidth + 4, y1 + barHeight / 2);
                    } else {
                        ctx.textAlign = 'right';
                        ctx.fillText(label, width - barWidth - 5, y1 + barHeight / 2);
                    }
                }
            }
            console.log('[VolumeProfile] draw finished');
        });
    }
} 
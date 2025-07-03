import { DrawingTool } from "../drawing/drawing-tool";
import { TrendLine } from "../trend-line/trend-line";
import { Box } from "../box/box";
import { Drawing } from "../drawing/drawing";
import { ContextMenu } from "../context-menu/context-menu";
import { GlobalParams } from "./global-params";
import { IChartApi, ISeriesApi, SeriesType } from "lightweight-charts";
import { HorizontalLine } from "../horizontal-line/horizontal-line";
import { RayLine } from "../horizontal-line/ray-line";
import { VerticalLine } from "../vertical-line/vertical-line";
import { VerticalSpan } from "../vertical-span/vertical-span";
import { Measure, MeasureOptions } from "../measure/measure";
import { Point } from "../drawing/data-source";


interface Icon {
    div: HTMLDivElement,
    group: SVGGElement,
    type: new (...args: any[]) => Drawing
}

declare const window: GlobalParams

// Helper class for Measure with callback
class MeasureWithCallback extends Measure {
    constructor(p1: Point, p2: Point, options?: Partial<MeasureOptions>) {
        // Use window.measureCallbackName if set, else random
        const callbackName = (window as any).measureCallbackName || `measure_${Math.random().toString(36).substr(2, 9)}`;
        super(p1, p2, options, callbackName);
    }
}

export class ToolBox {
    private static readonly TREND_SVG: string = '<rect x="3.84" y="13.67" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -5.9847 14.4482)" width="21.21" height="1.56"/><path d="M23,3.17L20.17,6L23,8.83L25.83,6L23,3.17z M23,7.41L21.59,6L23,4.59L24.41,6L23,7.41z"/><path d="M6,20.17L3.17,23L6,25.83L8.83,23L6,20.17z M6,24.41L4.59,23L6,21.59L7.41,23L6,24.41z"/>';
    private static readonly HORZ_SVG: string = '<rect x="4" y="14" width="9" height="1"/><rect x="16" y="14" width="9" height="1"/><path d="M11.67,14.5l2.83,2.83l2.83-2.83l-2.83-2.83L11.67,14.5z M15.91,14.5l-1.41,1.41l-1.41-1.41l1.41-1.41L15.91,14.5z"/>';
    private static readonly RAY_SVG: string = '<rect x="8" y="14" width="17" height="1"/><path d="M3.67,14.5l2.83,2.83l2.83-2.83L6.5,11.67L3.67,14.5z M7.91,14.5L6.5,15.91L5.09,14.5l1.41-1.41L7.91,14.5z"/>';
    private static readonly BOX_SVG: string = '<rect x="8" y="6" width="12" height="1"/><rect x="9" y="22" width="11" height="1"/><path d="M3.67,6.5L6.5,9.33L9.33,6.5L6.5,3.67L3.67,6.5z M7.91,6.5L6.5,7.91L5.09,6.5L6.5,5.09L7.91,6.5z"/><path d="M19.67,6.5l2.83,2.83l2.83-2.83L22.5,3.67L19.67,6.5z M23.91,6.5L22.5,7.91L21.09,6.5l1.41-1.41L23.91,6.5z"/><path d="M19.67,22.5l2.83,2.83l2.83-2.83l-2.83-2.83L19.67,22.5z M23.91,22.5l-1.41,1.41l-1.41-1.41l1.41-1.41L23.91,22.5z"/><path d="M3.67,22.5l2.83,2.83l2.83-2.83L6.5,19.67L3.67,22.5z M7.91,22.5L6.5,23.91L5.09,22.5l1.41-1.41L7.91,22.5z"/><rect x="22" y="9" width="1" height="11"/><rect x="6" y="9" width="1" height="11"/>';
    private static readonly VERT_SVG: string = ToolBox.RAY_SVG;
    private static readonly MEASURE_SVG: string = '<path fill="#fff" d="M2 9.75a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h24a1.5 1.5 0 0 0 1.5-1.5v-5.5a1.5 1.5 0 0 0-1.5-1.5zm0 1h3v2.5h1v-2.5h3.25v3.9h1v-3.9h3.25v2.5h1v-2.5h3.25v3.9h1v-3.9H22v2.5h1v-2.5h3a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-5.5a.5.5 0 0 1 .5-.5z" transform="rotate(-45 14 14)"></path>';

    div: HTMLDivElement;
    private activeIcon: Icon | null = null;

    private buttons: HTMLDivElement[] = [];

    private _commandFunctions: Function[];
    private _handlerID: string;

    private _drawingTool: DrawingTool;
    private _enableDeleteHotkey: boolean;

    constructor(handlerID: string, chart: IChartApi, series: ISeriesApi<SeriesType>, commandFunctions: Function[], enableDeleteHotkey: boolean = true) {
        this._handlerID = handlerID;
        this._commandFunctions = commandFunctions;
        this._drawingTool = new DrawingTool(chart, series, () => this.removeActiveAndSave());
        this.div = this._makeToolBox()
        new ContextMenu(this.saveDrawings, this._drawingTool);
        this._enableDeleteHotkey = enableDeleteHotkey;

        commandFunctions.push((event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') {
                const drawingToDelete = this._drawingTool.drawings.pop();
                if (drawingToDelete) this._drawingTool.delete(drawingToDelete)
                return true;
            }
            if (this._enableDeleteHotkey && event.code === 'Delete') {
                const hovered = (window as any).Drawing?.hoveredObject;
                const lastHovered = (window as any).Drawing?.lastHoveredObject;
                console.log('Delete pressed! hoveredObject:', hovered, 'lastHoveredObject:', lastHovered, 'drawings:', this._drawingTool.drawings);
                if (hovered) {
                    this._drawingTool.delete(hovered);
                    this.saveDrawings();
                    return true;
                }
                if (lastHovered) {
                    this._drawingTool.delete(lastHovered);
                    this.saveDrawings();
                    return true;
                }
            }
            return false;
        });
    }

    toJSON() {
        // Exclude the chart attribute from serialization
        const { ...serialized} = this;
        return serialized;
    }

    private _makeToolBox() {
        let div = document.createElement('div')
        div.classList.add('toolbox');
        this.buttons.push(this._makeToolBoxElement(TrendLine, 'KeyT', ToolBox.TREND_SVG))
        this.buttons.push(this._makeToolBoxElement(HorizontalLine, 'KeyH', ToolBox.HORZ_SVG));
        this.buttons.push(this._makeToolBoxElement(RayLine, 'KeyR', ToolBox.RAY_SVG));
        this.buttons.push(this._makeToolBoxElement(Box, 'KeyB', ToolBox.BOX_SVG));
        this.buttons.push(this._makeToolBoxElement(VerticalLine, 'KeyV', ToolBox.VERT_SVG, true));
        this.buttons.push(this._makeToolBoxElement(MeasureWithCallback as unknown as new (...args: any[]) => Drawing, 'KeyM', ToolBox.MEASURE_SVG));
        for (const button of this.buttons) {
            div.appendChild(button);
        }
        return div
    }

    private _makeToolBoxElement(DrawingType: new (...args: any[]) => Drawing, keyCmd: string, paths: string, rotate=false) {
        const elem = document.createElement('div')
        elem.classList.add("toolbox-button");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "29");
        svg.setAttribute("height", "29");

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.innerHTML = paths
        group.setAttribute("fill", window.pane.color)

        svg.appendChild(group)
        elem.appendChild(svg);

        const icon: Icon = {div: elem, group: group, type: DrawingType}

        elem.addEventListener('click', () => this._onIconClick(icon));

        this._commandFunctions.push((event: KeyboardEvent) => {
            if (this._handlerID !== window.handlerInFocus) return false;

            if (event.altKey && event.code === keyCmd) {
                event.preventDefault()
                this._onIconClick(icon);
                return true
            }
            return false;
        })

        if (rotate == true) {
            svg.style.transform = 'rotate(90deg)';
            svg.style.transformBox = 'fill-box';
            svg.style.transformOrigin = 'center';
        }

        return elem
    }

    private _onIconClick(icon: Icon) {
        if (this.activeIcon) {

            this.activeIcon.div.classList.remove('active-toolbox-button');
            window.setCursor('crosshair');
            this._drawingTool?.stopDrawing()
            if (this.activeIcon === icon) {
                this.activeIcon = null
                return 
            }
        }
        this.activeIcon = icon
        this.activeIcon.div.classList.add('active-toolbox-button')
        window.setCursor('crosshair');
        this._drawingTool?.beginDrawing(this.activeIcon.type);
    }

    removeActiveAndSave = () => {
        window.setCursor('default');
        if (this.activeIcon) this.activeIcon.div.classList.remove('active-toolbox-button')
        this.activeIcon = null
        this.saveDrawings()
    }

    addNewDrawing(d: Drawing) {
        this._drawingTool.addNewDrawing(d);
    }

    clearDrawings() {
        this._drawingTool.clearDrawings();
    }

    saveDrawings = () => {
        const drawingMeta = []
        for (const d of this._drawingTool.drawings) {
            drawingMeta.push({
                type: d._type,
                points: d.points,
                options: d._options
            });
        }
        const string = JSON.stringify(drawingMeta);
        window.callbackFunction(`save_drawings${this._handlerID}_~_${string}`)
    }

    loadDrawings(drawings: any[]) { // TODO any
        drawings.forEach((d) => {
            switch (d.type) {
                case "Box":
                    this._drawingTool.addNewDrawing(new Box(d.points[0], d.points[1], d.options));
                    break;
                case "TrendLine":
                    this._drawingTool.addNewDrawing(new TrendLine(d.points[0], d.points[1], d.options));
                    break;
                case "VerticalSpan":
                    this._drawingTool.addNewDrawing(new VerticalSpan(d.points[0], d.points[1], d.options));
                    break;
                case "HorizontalLine":
                    this._drawingTool.addNewDrawing(new HorizontalLine(d.points[0], d.options));
                    break;
                case "RayLine":
                    this._drawingTool.addNewDrawing(new RayLine(d.points[0], d.options));
                    break;
                case "VerticalLine":
                    this._drawingTool.addNewDrawing(new VerticalLine(d.points[0], d.options));
                    break;
                case "Measure":
                    this._drawingTool.addNewDrawing(new Measure(d.points[0], d.points[1], d.options));
                    break;
            }
        })
    }
}

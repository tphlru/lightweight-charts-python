import asyncio
import pandas as pd

from typing import Union, Optional

# from lightweight_charts.util import js_json

from .util import NUM, Pane, as_enum, LINE_STYLE, TIME


def make_js_point(chart, time, price):
    formatted_time = chart._single_datetime_format(time)
    return f"""{{
        "time": {formatted_time},
        "logical": {chart.id}.chart.timeScale()
                    .coordinateToLogical(
                        {chart.id}.chart.timeScale()
                        .timeToCoordinate({formatted_time})
                    ),
        "price": {price}
    }}"""


class Drawing(Pane):
    def __init__(self, chart, func=None):
        super().__init__(chart.win)
        self.chart = chart

    def update(self, *points):
        formatted_points = []
        formatted_points.extend(
            make_js_point(self.chart, points[i], points[i + 1])
            for i in range(0, len(points), 2)
        )
        self.run_script(f"{self.id}.updatePoints({', '.join(formatted_points)})")
        print(f"{self.id}.updatePoints({', '.join(formatted_points)})")

    def delete(self):
        """
        Irreversibly deletes the drawing.
        """
        self.run_script(f"{self.id}.detach()")

    def options(self, color="#1E80F0", style="solid", width=4):
        self.run_script(f"""{self.id}.applyOptions({{
            lineColor: '{color}',
            lineStyle: {as_enum(style, LINE_STYLE)},
            width: {width},
        }})""")


class TwoPointDrawing(Drawing):
    def __init__(
        self,
        drawing_type,
        chart,
        start_time: TIME,
        start_value: NUM,
        end_time: TIME,
        end_value: NUM,
        round: bool,
        options: dict,
        func=None,
    ):
        super().__init__(chart, func)

        options_string = "\n".join(f"{key}: {val}," for key, val in options.items())

        self.run_script(f"""
        {self.id} = new Lib.{drawing_type}(
            {make_js_point(self.chart, start_time, start_value)},
            {make_js_point(self.chart, end_time, end_value)},
            {{
                {options_string}
            }}
        );
        {chart.id}.series.attachPrimitive({self.id})
        console.log('[DEBUG] Created Lib.{drawing_type} for {self.id} on chart {chart.id}');
        """)


class HorizontalLine(Drawing):
    def __init__(
        self, chart, price, color, width, style, text, axis_label_visible, func
    ):
        super().__init__(chart, func)
        self.price = price
        self.run_script(f"""

        {self.id} = new Lib.HorizontalLine(
            {{price: {price}}},
            {{
                lineColor: '{color}',
                lineStyle: {as_enum(style, LINE_STYLE)},
                width: {width},
                text: `{text}`,
            }},
            callbackName={f"'{self.id}'" if func else "null"}
        );
        {chart.id}.series.attachPrimitive({self.id});
        console.log('[DEBUG] Created Lib.HorizontalLine for {self.id} on chart {chart.id}');
        """)
        if not func:
            return

        def wrapper(p):
            self.price = float(p)
            func(chart, self)

        async def wrapper_async(p):
            self.price = float(p)
            await func(chart, self)

        self.win.handlers[self.id] = (
            wrapper_async if asyncio.iscoroutinefunction(func) else wrapper
        )
        self.run_script(f"{chart.id}.toolBox?.addNewDrawing({self.id})")

    def update(self, price: float):
        """
        Moves the horizontal line to the given price.
        """
        self.run_script(f"{self.id}.updatePoints({{price: {price}}})")
        # self.run_script(f'{self.id}.updatePrice({price})')
        self.price = price

    def options(self, color="#1E80F0", style="solid", width=4, text=""):
        super().options(color, style, width)
        self.run_script(f"{self.id}.applyOptions({{text: `{text}`}})")


class VerticalLine(Drawing):
    def __init__(self, chart, time, color, width, style, text, func=None):
        super().__init__(chart, func)
        self.time = time
        self.run_script(f"""

        {self.id} = new Lib.VerticalLine(
            {{time: {self.chart._single_datetime_format(time)}}},
            {{
                lineColor: '{color}',
                lineStyle: {as_enum(style, LINE_STYLE)},
                width: {width},
                text: `{text}`,
            }},
            callbackName={f"'{self.id}'" if func else "null"}
        );
        {chart.id}.series.attachPrimitive({self.id});
        console.log('[DEBUG] Created Lib.VerticalLine for {self.id} on chart {chart.id}');
        """)

    def update(self, time: TIME):
        self.run_script(f"{self.id}.updatePoints({{time: {time}}})")
        # self.run_script(f'{self.id}.updatePrice({price})')
        # self.price = price
        self.time = time  # FIXME: is it fixed correctly?

    def options(self, color="#1E80F0", style="solid", width=4, text=""):
        super().options(color, style, width)
        self.run_script(f"{self.id}.applyOptions({{text: `{text}`}})")


class RayLine(Drawing):
    def __init__(
        self,
        chart,
        start_time: TIME,
        value: NUM,
        round: bool = False,
        color: str = "#1E80F0",
        width: int = 2,
        style: LINE_STYLE = "solid",
        text: str = "",
        func=None,
    ):
        super().__init__(chart, func)
        self.run_script(f"""
        {self.id} = new Lib.RayLine(
            {{time: {self.chart._single_datetime_format(start_time)}, price: {value}}},
            {{
                lineColor: '{color}',
                lineStyle: {as_enum(style, LINE_STYLE)},
                width: {width},
                text: `{text}`,
            }},
            callbackName={f"'{self.id}'" if func else "null"}
        );
        {chart.id}.series.attachPrimitive({self.id});
        console.log('[DEBUG] Created Lib.RayLine for {self.id} on chart {chart.id}');
        """)


class Box(TwoPointDrawing):
    def __init__(
        self,
        chart,
        start_time: TIME,
        start_value: NUM,
        end_time: TIME,
        end_value: NUM,
        round: bool,
        line_color: str,
        fill_color: str,
        width: int,
        style: LINE_STYLE,
        func=None,
    ):
        super().__init__(
            "Box",
            chart,
            start_time,
            start_value,
            end_time,
            end_value,
            round,
            {
                "lineColor": f'"{line_color}"',
                "fillColor": f'"{fill_color}"',
                "width": width,
                "lineStyle": as_enum(style, LINE_STYLE),
            },
            func,
        )


class TrendLine(TwoPointDrawing):
    def __init__(
        self,
        chart,
        start_time: TIME,
        start_value: NUM,
        end_time: TIME,
        end_value: NUM,
        round: bool,
        line_color: str,
        width: int,
        style: LINE_STYLE,
        func=None,
    ):
        super().__init__(
            "TrendLine",
            chart,
            start_time,
            start_value,
            end_time,
            end_value,
            round,
            {
                "lineColor": f'"{line_color}"',
                "width": width,
                "lineStyle": as_enum(style, LINE_STYLE),
            },
            func,
        )


class VerticalSpan(TwoPointDrawing):
    def __init__(
        self,
        chart,
        start_time: TIME,
        end_time: TIME,
        color: str = "rgba(252, 219, 3, 0.2)",
        width: int = 0,
        style: str = "solid",
        func=None,
    ):
        super().__init__(
            "VerticalSpan",
            chart,
            start_time,
            0,  # price is not used
            end_time,
            0,  # price is not used
            False,
            {
                "lineColor": f'"{color}"',
                "width": width,
                "lineStyle": as_enum(style, LINE_STYLE),
            },
            func,
        )


import json
import os
from typing import Callable, Literal, Optional


class ToolBox:
    def __init__(self, chart):
        self.chart = chart
        self.run_script = chart.run_script
        self.id = chart.id
        self._save_under = None
        self.drawings = {}
        chart.win.handlers[f"save_drawings{self.id}"] = self._save_drawings
        self.run_script(f"{self.id}.createToolBox()")

    def save_drawings_under(self, widget: "Widget"):
        """
        Drawings made on charts will be saved under the widget given. eg `chart.toolbox.save_drawings_under(chart.topbar['symbol'])`.
        """
        self._save_under = widget

    def load_drawings(self, tag: str):
        """
        Loads and displays the drawings on the chart stored under the tag given.
        """
        if not self.drawings.get(tag):
            return
        self.run_script(
            f"if ({self.id}.toolBox) {self.id}.toolBox.loadDrawings({json.dumps(self.drawings[tag])})"
        )

    def import_drawings(self, file_path):
        """
        Imports a list of drawings stored at the given file path.
        """
        if not os.path.exists(file_path):
            return False
        with open(file_path, "r") as f:
            json_data = json.load(f)
            self.drawings = json_data

    def export_drawings(self, file_path):
        """
        Exports the current list of drawings to the given file path.
        """
        with open(file_path, "w+") as f:
            json.dump(self.drawings, f, indent=4)

    def _save_drawings(self, drawings):
        if not self._save_under:
            return
        self.drawings[self._save_under.value] = json.loads(drawings)

    def measure(self, func: Optional[Callable[["ToolBox", str, list], None]] = None) -> None:
        """
        Registers a callback for measure tool events (created, updated, deleted).
        :param func: Callable with signature (toolbox, event_type, points)
        """
        if not func:
            return
        handler_id = f"measure_{id(func)}"
        def wrapper(event):
            if not isinstance(event, str):
                return
            try:
                event_type, points_json = event.split('_~_', 1)
                import json
                points = json.loads(points_json)
            except Exception:
                event_type = event
                points = None
            func(self, event_type, points)
        self.run_script(f"window.measureCallbackName = '{handler_id}'")
        self.run_script(
            f"window.handlers = window.handlers || {{}}; "
            f"window.handlers['{handler_id}'] = (event) => window.pywebview.api.handle_event('{handler_id}', event);"
        )
        self.chart.win.handlers[handler_id] = wrapper

    def set_measure_length_display(self, mode: Literal['time', 'bars', 'both']) -> None:
        """
        Set how the measure tool displays length: 'time', 'bars', or 'both'.
        :param mode: One of 'time', 'bars', or 'both'.
        """
        assert mode in ('time', 'bars', 'both'), "mode must be 'time', 'bars', or 'both'"
        self.run_script(f"window.measureLengthDisplay = '{mode}'")

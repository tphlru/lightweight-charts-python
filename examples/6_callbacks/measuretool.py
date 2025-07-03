import pandas as pd
from lightweight_charts import Chart
import os

def get_bar_data(symbol, timeframe):
    if symbol not in ('AAPL', 'GOOGL', 'TSLA'):
        print(f'No data for "{symbol}"')
        return pd.DataFrame()
    return pd.read_csv(os.path.join(os.path.dirname(__file__), f'bar_data/{symbol}_{timeframe}.csv'))

def on_measure_event(toolbox, event_type, points):
    print(f"Measure event: {event_type}, points: {points}")

if __name__ == '__main__':
    # Пример: отключить удаление выделенного рисунка по клавише Delete
    # chart = Chart(toolbox=False)
    # chart.toolbox = chart.ToolBox(chart, enable_delete_hotkey=False)

    # По умолчанию Delete работает:
    chart = Chart(toolbox=True, debug=True)  # или chart.ToolBox(chart, enable_delete_hotkey=True)
    # chart.toolbox.set_measure_length_display('time')
    chart.legend(True)

    chart.topbar.textbox('symbol', 'TSLA')
    chart.topbar.switcher('timeframe', ('1min', '5min', '30min'), default='5min')

    df = get_bar_data('TSLA', '5min')
    chart.set(df)

    chart.toolbox.measure(func=on_measure_event)

    print("Use the toolbox to select the Measure tool (rectangle icon) and draw on the chart to measure price and time differences.")
    print("Выделите рисунок и нажмите Delete для удаления (если включено).")

    chart.show(block=True)

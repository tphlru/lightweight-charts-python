import pandas as pd
from lightweight_charts import Chart
import os

if __name__ == '__main__':
    chart = Chart(debug=True)
    chart.legend(visible=True)

    df = pd.read_csv(os.path.join(os.path.dirname(__file__), 'ohlcv.csv'))
    chart.set(df)

    # Добавим вертикальный span между двумя датами
    start_time = df['date'].iloc[20]  # например, 21-я дата
    end_time = df['date'].iloc[200]    # например, 41-я дата
    chart.vertical_line(df['date'].iloc[20], color='rgba(252, 100, 3, 0.8)')
    chart.vertical_span(start_time, end_time, color='rgba(252, 100, 3, 0.5)')
    chart.vertical_span(df['date'].iloc[555], df['date'].iloc[600] , color='rgba(252, 100, 3, 0.5)')

    # Также можно добавить одиночную вертикальную линию:
    # chart.vertical_span(df['date'].iloc[10], color='rgba(3, 100, 252, 0.5)')

    chart.show(block=True) 
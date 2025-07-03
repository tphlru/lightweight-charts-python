import pandas as pd
from lightweight_charts import Chart
import os

if __name__ == '__main__':
    chart = Chart(debug=True)
    chart.legend(visible=True)

    df = pd.read_csv(os.path.join(os.path.dirname(__file__), '../4_line_indicators/ohlcv.csv'))
    print(df)
    chart.set(df)

    # === Пример 1: профиль по видимому диапазону (дефолт) ===
    chart.volume_profile(
        show=True,
        bins=25,
        color='rgba(231,156,250,0.5)',
        width_percentage=10,
        text_color='white',
        adaptive_vertical_bounds=True,
        volume_label_position='inside',
        volume_label_format='percent',
        volume_label_visible=True,
        min_bar_width_for_inside_label=32,
        volume_profile_range_mode='visible',
    )

    # === Пример 2: профиль по последним N видимым барам (от правого края видимого диапазона) ===
    # chart.volume_profile(
    #     show=True,
    #     bins=25,
    #     color='rgba(0,156,250,0.5)',
    #     width_percentage=10,
    #     text_color='white',
    #     adaptive_vertical_bounds=True,
    #     volume_label_position='inside',
    #     volume_label_format='value',
    #     volume_label_visible=True,
    #     min_bar_width_for_inside_label=32,
    #     volume_profile_range_mode='last_n_visible',
    #     volume_profile_last_n=50,  # последние 50 видимых баров
    # )

    # === Пример 3: профиль по последним N барам всего датасета ===
    # chart.volume_profile(
    #     show=True,
    #     bins=25,
    #     color='rgba(250,156,50,0.5)',
    #     width_percentage=10,
    #     text_color='white',
    #     adaptive_vertical_bounds=True,
    #     volume_label_position='inside',
    #     volume_label_format='value',
    #     volume_label_visible=True,
    #     min_bar_width_for_inside_label=32,
    #     volume_profile_range_mode='last_n_total',
    #     volume_profile_last_n=50,  # последние 50 баров всего датасета
    # )

    chart.show(block=True) 
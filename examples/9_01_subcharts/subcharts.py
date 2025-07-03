import pandas as pd
from lightweight_charts import Chart
import os

def calculate_sma(df, period: int = 50):
    return pd.DataFrame(
        {"time": df["date"], f"SMA {period}": df["close"].rolling(window=period).mean()}
    ).dropna()


def calculate_macd(df, short_period=12, long_period=26, signal_period=9):
    short_ema = df["close"].ewm(span=short_period, adjust=False).mean()
    long_ema = df["close"].ewm(span=long_period, adjust=False).mean()
    macd = short_ema - long_ema
    signal = macd.ewm(span=signal_period, adjust=False).mean()
    histogram = macd - signal
    return pd.DataFrame(
        {
            "time": df["date"],
            "MACD": macd,
            "Signal": signal,
            "Histogram": histogram,
        }
    ).dropna()

def calculate_cci(df, period=20):
    tp = (df["high"] + df["low"] + df["close"]) / 3
    sma = tp.rolling(window=period).mean()
    mad = tp.rolling(window=period).apply(lambda x: (abs(x - x.mean())).mean(), raw=True)
    cci = (tp - sma) / (0.015 * mad)
    return pd.DataFrame({
        "time": df["date"],
        f"CCI {period}": cci
    }).dropna()

if __name__ == "__main__":
    chart = Chart(inner_height=0.5)
    chart.legend(visible=True)

    chart2 = chart.create_subchart(position="left", width=1, height=0.3, sync=True)

    # Add a third subchart for CCI
    chart3 = chart.create_subchart(position="left", width=1, height=0.2, sync=True)

    chart.watermark("Main")
    chart2.watermark("Sub")

    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "ohlcv.csv"))
    chart.set(df)

    # Get the full time index
    full_time = df['date']

    line = chart.create_line("SMA 50")
    sma_data = calculate_sma(df, period=50)
    line.set(sma_data, align_to=full_time)

    # Subchart with MACD
    # chart2.set(df)

    macd_data = calculate_macd(df)
    histogram = chart2.create_histogram("MACD")
    histogram.set(macd_data[["time", "MACD", "Signal", "Histogram"]], align_to=full_time)

    line2 = chart2.create_line("SMA 50")
    line2.set(sma_data, align_to=full_time)

    # Subchart with CCI
    cci_data = calculate_cci(df, period=20)
    cci_line = chart3.create_line("CCI 20")
    cci_line.set(cci_data, align_to=full_time)
    print(cci_data)

    chart.show(block=True)

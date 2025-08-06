<div class="methodology-container">
	<h1>Methodology Summary: Block Bootstrap Portfolio Return Forecasting</h1>

	<div class="alert-warning">
		<span class="icon">⚠️</span> This forecast is for illustration and education only. It is not financial
		advice.
	</div>

	<section class="info-block">
		<p>
			This model uses a <em>block bootstrap</em> method to forecast portfolio returns. In simple terms,
			we take actual historical returns, cut them into 10-year blocks, and shuffle those blocks to create
			thousands of possible future return paths.
		</p>
	</section>

	<section class="info-block">
		<img
			src="BlockBootstrapTimeframeVisualization.png"
			alt="Block Bootstrap Timeframe Visualization"
		/>
		<p>
			For example, one block might be 1983–1992; another might be 1975–1984. This approach is like
			shuffling a deck of cards — but each “card” is a decade of market history.
		</p>
		<p>
			The benefit is that it keeps real-world patterns intact, such as bull markets, bear markets,
			and periods of high inflation or high interest rates. It’s often more realistic than simply
			mixing individual years, which can miss the natural “ups and downs” investors experience.
		</p>
	</section>

	<section class="info-block">
		<h2>How It Differs From Monte Carlo Simulations</h2>
		<p>
			Monte Carlo simulations build thousands of potential futures by assuming a mathematical
			pattern (e.g., “stocks grow 6% per year with X% volatility”) and rolling the dice many times.
			This lets us test scenarios that have never happened in history, but it depends on how
			accurate our assumptions are.
		</p>
		<p>
			Block bootstrap, by contrast, stays grounded in actual historical data. It captures the
			sequencing of returns — prolonged growth, deep drawdowns, and shifts between asset classes —
			as they really happened.
		</p>
	</section>

	<section class="info-block">
		<h2>Data Sets</h2>
		<ul class="styled-list">
			<li>S&P 500 (with dividends) – NYSE Stern School, 1970–present</li>
			<li>US Small Cap (bottom decile) – NYSE Stern School, 1970–present</li>
			<li>3-Month Treasury Bill – NYSE Stern School, 1970–present</li>
			<li>10-Year Treasury Bond – NYSE Stern School & Federal Reserve, 1970–present</li>
			<li>Baa Corporate Bonds – NYSE Stern School & Federal Reserve, 1970–present</li>
			<li>Real Estate – NYSE Stern School, 1970–present</li>
			<li>Gold – NYSE Stern School, 1970–present</li>
			<li>Inflation (CPI) – NYSE Stern School, 1970–present</li>
			<li>International Stocks (ex-US) – MSCI, 1970–present</li>
			<li>Emerging Markets – MSCI, 1988–present</li>
			<li>NASDAQ 100 – NASDAQ, 1986–present</li>
			<li>Bitcoin – various sources, 2010–present</li>
		</ul>
	</section>

	<section class="info-block">
		<h2>Assumptions and Limitations</h2>
		<p>
			When including Emerging Markets and NASDAQ 100 we cut out the earlier block with no data. This
			reduces the number of blocks, while keeping the historical data.
		</p>
		<p>
			When certain data is missing (e.g., Bitcoin before 2010), the return is treated as flat —
			similar to holding cash. This means earlier periods show no impact from these assets until
			they existed historically.
		</p>
		<p>
			Taxes are simplified estimates using current tax rates and schedules; historical tax changes
			are not modeled. Results will vary by individual situation.
		</p>
	</section>
</div>

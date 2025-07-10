<h1>Methodology Summary: Block Bootstrap Portfolio Return Forecasting</h1>
<p><strong>Any forecasts presented are intended purely for illustrative or entertainment purposes and should not be construed as financial advice.</strong></p>
<p>This model forecasts portfolio returns using a block bootstrap approach applied to 
    historical return data published by NYU Stern. Rather than randomly sampling individual 
    years—which can break the sequence of returns and distort variability—the 
    constructs sequential blocks to preserve historical patterns.</p>
<p>
<strong>Specifically:</strong>
</p>
<ul>
    <li>The model begins in 1970 and identifies rolling 10-year blocks of annual returns.</li>
    <li>Each block advances the start year by one.</li>
    <ul>
        <li>Block 1 spans 1970–1979</li>
        <li>Block 2 spans 1971–1980</li>
    </ul>
    <li>…and so on, progressing year by year.</li>
</ul>
<p>
The advantage of this method is that it 
retains the authentic sequencing of returns, capturing periods of sustained growth, prolonged drawdowns, and volatility clustering. In contrast to simulations that shuffle or randomly resample years—often underestimating both downside and upside risk—this approach more accurately reflects the path-dependent nature of real-world market returns.
</p>
<p>
This process continues through 50 overlapping 10-year periods, 
ending with the block that begins in 2019 and runs through 2028 
(or the last available data year). For future years—2025, 2026, 2027, 
and 2028—returns are not available and are assumed to have no year-over-year change.
</p>
<p>
Gold is commonly included in portfolio modeling. The return data begins in 1970, 
when the United States exited the gold standard and currencies became free-floating, 
establishing a modern market-driven price for gold.
</p>
<p>
The methodology used to forecast Bitcoin prices should not be relied upon for investment decisions. 
Bitcoin is an exceptionally volatile asset with dramatic price swings and a relatively short history of market data compared to traditional asset classes. This limited historical record makes any attempt to model or predict future prices highly speculative. 
</p>
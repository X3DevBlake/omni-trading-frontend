export const FALLBACK_COINS = [
  { id:"bitcoin", symbol:"btc", name:"Bitcoin",
    image:"https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
    current_price:77360, market_cap:1548000000000, total_volume:59000000000,
    market_cap_rank:1, price_change_percentage_24h:3.53,
    price_change_percentage_1h_in_currency:0.18, price_change_percentage_7d_in_currency:7.2,
    circulating_supply:20017000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>72000+Math.sin(i*0.3)*1500+i*32)}},
  { id:"ethereum", symbol:"eth", name:"Ethereum",
    image:"https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
    current_price:2355, market_cap:283000000000, total_volume:18000000000,
    market_cap_rank:2, price_change_percentage_24h:1.42,
    price_change_percentage_1h_in_currency:0.08, price_change_percentage_7d_in_currency:4.1,
    circulating_supply:120400000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>2280+Math.sin(i*0.25)*60+i*0.5)}},
  { id:"tether", symbol:"usdt", name:"Tether",
    image:"https://coin-images.coingecko.com/coins/images/325/large/Tether.png?1696501661",
    current_price:1.0, market_cap:138000000000, total_volume:62000000000,
    market_cap_rank:3, price_change_percentage_24h:0.02,
    price_change_percentage_1h_in_currency:0.0, price_change_percentage_7d_in_currency:0.03,
    circulating_supply:138000000000, sparkline_in_7d:{price:Array.from({length:168},()=>1+Math.random()*0.002-0.001)}},
  { id:"ripple", symbol:"xrp", name:"XRP",
    image:"https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1696501442",
    current_price:2.18, market_cap:125000000000, total_volume:4200000000,
    market_cap_rank:4, price_change_percentage_24h:2.84,
    price_change_percentage_1h_in_currency:0.21, price_change_percentage_7d_in_currency:8.9,
    circulating_supply:57300000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>2.05+Math.sin(i*0.2)*0.07+i*0.0008)}},
  { id:"binancecoin", symbol:"bnb", name:"BNB",
    image:"https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970",
    current_price:595, market_cap:86500000000, total_volume:1650000000,
    market_cap_rank:5, price_change_percentage_24h:1.82,
    price_change_percentage_1h_in_currency:0.15, price_change_percentage_7d_in_currency:4.1,
    circulating_supply:145400000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>575+Math.sin(i*0.2)*12+i*0.12)}},
  { id:"solana", symbol:"sol", name:"Solana",
    image:"https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756",
    current_price:138, market_cap:66000000000, total_volume:3400000000,
    market_cap_rank:6, price_change_percentage_24h:-0.68,
    price_change_percentage_1h_in_currency:-0.12, price_change_percentage_7d_in_currency:5.8,
    circulating_supply:478000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>131+Math.sin(i*0.28)*5+i*0.04)}},
  { id:"usd-coin", symbol:"usdc", name:"USDC",
    image:"https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
    current_price:1.0, market_cap:58000000000, total_volume:9200000000,
    market_cap_rank:7, price_change_percentage_24h:0.0,
    price_change_percentage_1h_in_currency:0.0, price_change_percentage_7d_in_currency:0.01,
    circulating_supply:58000000000, sparkline_in_7d:{price:Array.from({length:168},()=>1+Math.random()*0.001-0.0005)}},
  { id:"dogecoin", symbol:"doge", name:"Dogecoin",
    image:"https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png?1696501409",
    current_price:0.196, market_cap:29000000000, total_volume:1820000000,
    market_cap_rank:8, price_change_percentage_24h:4.82,
    price_change_percentage_1h_in_currency:0.62, price_change_percentage_7d_in_currency:13.4,
    circulating_supply:148200000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>0.175+Math.sin(i*0.3)*0.012+i*0.00015)}},
  { id:"cardano", symbol:"ada", name:"Cardano",
    image:"https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090",
    current_price:0.68, market_cap:24000000000, total_volume:580000000,
    market_cap_rank:9, price_change_percentage_24h:0.48,
    price_change_percentage_1h_in_currency:0.04, price_change_percentage_7d_in_currency:2.8,
    circulating_supply:35300000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>0.66+Math.sin(i*0.22)*0.02)}},
  { id:"tron", symbol:"trx", name:"TRON",
    image:"https://coin-images.coingecko.com/coins/images/1094/large/tron-logo.png?1696502193",
    current_price:0.263, market_cap:22500000000, total_volume:720000000,
    market_cap_rank:10, price_change_percentage_24h:1.24,
    price_change_percentage_1h_in_currency:0.09, price_change_percentage_7d_in_currency:3.6,
    circulating_supply:85500000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>0.255+Math.sin(i*0.24)*0.005)}},
  { id:"avalanche-2", symbol:"avax", name:"Avalanche",
    image:"https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369",
    current_price:22.4, market_cap:9400000000, total_volume:280000000,
    market_cap_rank:11, price_change_percentage_24h:2.18,
    price_change_percentage_1h_in_currency:0.22, price_change_percentage_7d_in_currency:5.2,
    circulating_supply:419000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>21+Math.sin(i*0.26)*0.8+i*0.008)}},
  { id:"chainlink", symbol:"link", name:"Chainlink",
    image:"https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696502009",
    current_price:13.8, market_cap:8700000000, total_volume:320000000,
    market_cap_rank:12, price_change_percentage_24h:1.92,
    price_change_percentage_1h_in_currency:0.18, price_change_percentage_7d_in_currency:6.4,
    circulating_supply:628000000, sparkline_in_7d:{price:Array.from({length:168},(_,i)=>13.2+Math.sin(i*0.25)*0.4+i*0.005)}},
].map(c => {
  // Auto-derive high_24h / low_24h from the last 24 sparkline points so stats always display
  const sp = c.sparkline_in_7d?.price || [];
  const last24 = sp.slice(-24);
  if (last24.length > 0) {
    c.high_24h = Math.max(...last24, c.current_price);
    c.low_24h  = Math.min(...last24, c.current_price);
  } else {
    // Conservative approximation if no sparkline
    const pct = Math.abs(c.price_change_percentage_24h || 2) / 100;
    c.high_24h = c.current_price * (1 + pct * 0.6);
    c.low_24h  = c.current_price * (1 - pct * 0.6);
  }
  c.ath = c.high_24h * 1.8;
  c.atl = c.low_24h * 0.3;
  return c;
});

// Sleep util for backoff

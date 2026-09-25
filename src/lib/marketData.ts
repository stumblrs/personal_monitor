import { Cryptocurrency, Currency, MarketPrice } from '@/types/domain';

export interface MarketDataProvider {
  searchCoins(query: string): Promise<Cryptocurrency[]>;
  getCurrentPrices(coinIds: string[], currency: Currency): Promise<Record<string, MarketPrice>>;
}

// In-memory cache for market prices to minimize rate-limiting and external API load
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache

// Standard curated coins list for instant search and fallback
const POPULAR_COINS: Cryptocurrency[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', status: 'ACTIVE' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', status: 'ACTIVE' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', status: 'ACTIVE' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', logoUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', status: 'ACTIVE' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', logoUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', status: 'ACTIVE' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', logoUrl: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', status: 'ACTIVE' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', status: 'ACTIVE' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', logoUrl: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', status: 'ACTIVE' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', logoUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png', status: 'ACTIVE' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', logoUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', status: 'ACTIVE' },
];

export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async searchCoins(query: string): Promise<Cryptocurrency[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return POPULAR_COINS;
    }

    // First check local popular list for quick response
    const localMatches = POPULAR_COINS.filter(
      (c) =>
        c.symbol.toLowerCase().includes(trimmed) ||
        c.name.toLowerCase().includes(trimmed) ||
        c.id.toLowerCase().includes(trimmed)
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return localMatches;
      }

      const data = await res.json();
      const remoteCoins: Cryptocurrency[] = (data.coins || []).slice(0, 15).map((item: any) => ({
        id: item.id,
        symbol: item.symbol.toUpperCase(),
        name: item.name,
        logoUrl: item.thumb,
        status: 'ACTIVE',
      }));

      // Merge and deduplicate by id
      const combined = [...localMatches];
      for (const remote of remoteCoins) {
        if (!combined.some((c) => c.id === remote.id)) {
          combined.push(remote);
        }
      }
      return combined;
    } catch {
      return localMatches;
    }
  }

  async getCurrentPrices(coinIds: string[], currency: Currency): Promise<Record<string, MarketPrice>> {
    if (coinIds.length === 0) return {};

    const targetCurrency = currency.toLowerCase();
    const now = Date.now();
    const result: Record<string, MarketPrice> = {};
    const missingCoinIds: string[] = [];

    // Check cache
    for (const id of coinIds) {
      const cacheKey = `${id}:${targetCurrency}`;
      const cached = priceCache[cacheKey];
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        result[id] = {
          cryptocurrencyId: id,
          currency,
          price: cached.price,
          source: 'CoinGecko (cached)',
          timestamp: new Date(cached.timestamp).toISOString(),
          freshness: now - cached.timestamp < 30000 ? 'LIVE' : 'RECENT',
        };
      } else {
        missingCoinIds.push(id);
      }
    }

    if (missingCoinIds.length === 0) {
      return result;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const url = `${this.baseUrl}/simple/price?ids=${missingCoinIds.join(',')}&vs_currencies=${targetCurrency}&include_last_updated_at=true`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        for (const id of missingCoinIds) {
          if (data[id] && typeof data[id][targetCurrency] === 'number') {
            const price = data[id][targetCurrency];
            const ts = data[id].last_updated_at ? data[id].last_updated_at * 1000 : now;

            priceCache[`${id}:${targetCurrency}`] = { price, timestamp: ts };
            result[id] = {
              cryptocurrencyId: id,
              currency,
              price,
              source: 'CoinGecko',
              timestamp: new Date(ts).toISOString(),
              freshness: 'LIVE',
            };
          }
        }
      }
    } catch (err) {
      console.warn('Price fetch error, falling back to cached or estimated price:', err);
    }

    // Fill any still missing with fallback estimates or last known cached
    for (const id of missingCoinIds) {
      if (!result[id]) {
        const cacheKey = `${id}:${targetCurrency}`;
        const cached = priceCache[cacheKey];
        if (cached) {
          result[id] = {
            cryptocurrencyId: id,
            currency,
            price: cached.price,
            source: 'CoinGecko (stale)',
            timestamp: new Date(cached.timestamp).toISOString(),
            freshness: 'STALE',
          };
        } else {
          // Currency multipliers relative to EUR for fallback quotes
          const multipliers: Record<string, number> = {
            eur: 1,
            usd: 1.08,
            gbp: 0.85,
            ngn: 1750, // Nigerian Naira (~1750 NGN per EUR)
            ghs: 16.5, // Ghanaian Cedis (~16.5 GHS per EUR)
          };
          const multiplier = multipliers[targetCurrency] || 1;

          // Base EUR fallback quotes
          const fallbackPricesEUR: Record<string, number> = {
            bitcoin: 96500,
            ethereum: 3050,
            solana: 165,
            chainlink: 19.2,
            cardano: 0.65,
            ripple: 2.15,
          };
          const baseQuote = fallbackPricesEUR[id] || 100;
          const fallback = baseQuote * multiplier;

          result[id] = {
            cryptocurrencyId: id,
            currency,
            price: fallback,
            source: 'Simulated Quote',
            timestamp: new Date().toISOString(),
            freshness: 'RECENT',
          };
        }
      }
    }

    return result;
  }
}

export const marketDataProvider = new CoinGeckoMarketDataProvider();

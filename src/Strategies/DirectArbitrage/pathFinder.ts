import { Exchange, Pair } from '../../Types'
import { getPairNativeToken, getPairNonNativeToken, mixAllExchangePairs } from '../../Utils/Pair'
import { Route, RouteSwap } from '../../Route'
import { Config } from '../../Config'
import { isBlackListed } from '../../DataService'

export const directPathFinder = async (exchanges: Exchange[]): Promise<Route[]> => {
  const exchangePairs = mixAllExchangePairs(exchanges)

  const pairsByTokensHash = exchangePairs.reduce((map, pair) => {
    if (!map[pair.hash]) {
      map[pair.hash] = []
    }
    map[pair.hash].push(pair)
    return map
  }, {} as Record<string, Pair[]>)

  const routes: Route[] = []

  Object.values(pairsByTokensHash).forEach((equivalentPairs) => {
    for (const pair of equivalentPairs) {
      if (!pair.contains(Config.nativeToken)) {
        continue
      }
      for (const eqPair of equivalentPairs) {
        if (eqPair === pair) {
          continue
        }
        const route = new Route([
          new RouteSwap(pair, [getPairNativeToken(pair), getPairNonNativeToken(pair)]),
          new RouteSwap(eqPair, [getPairNonNativeToken(pair), getPairNativeToken(pair)])
        ])
        routes.push(route)
        routes.push(route.reverse())
      }
    }
  })

  return routes.filter((r) => {
    const hasBlackListed = r.route.find((p) => isBlackListed(p.pair.address))
    return !hasBlackListed
  })
}

import { Exchange, Pair, Token } from '../../Types'
import { Config } from '../../Config'
import { getPairNativeToken, getPairNonNativeToken } from '../../Utils/Pair'
import { Route, RouteSwap } from '../../Route'
import { isBlackListed } from '../../DataService'

export function pivotPathFinder(exchanges: Exchange[]): Route[] {
  const allPairs = exchanges.reduce((pairs, ex) => [...pairs, ...ex.pairs], [] as Pair[])

  // A = always native
  // A > B > C > A
  const routes: Route[] = []

  for (const pair0 of allPairs) {
    // start routes with native token
    if (!hasNativeToken(pair0)) {
      continue
    }
    const firstSwap = new RouteSwap(pair0, [
      getPairNativeToken(pair0),
      getPairNonNativeToken(pair0)
    ])

    for (const pair1 of allPairs) {
      if (repeated([firstSwap], pair1) || !connected([firstSwap], pair1)) {
        continue
      }
      const pivotSwap = new RouteSwap(pair1, [
        tokenConnectingPair(firstSwap.path, pair1),
        tokenNotConnectingPair(firstSwap.path, pair1)
      ])

      for (const pair2 of allPairs) {
        // finish route with the native token
        if (
          repeated([firstSwap, pivotSwap], pair2) ||
          !connected([firstSwap, pivotSwap], pair2) ||
          !hasNativeToken(pair2)
        ) {
          continue
        }

        routes.push(
          new Route([
            firstSwap,
            pivotSwap,
            new RouteSwap(pair2, [getPairNonNativeToken(pair2), getPairNativeToken(pair2)])
          ])
        )
      }
    }
  }

  return routes.filter((r) => {
    const hasBlackListed = r.route.find((p) => isBlackListed(p.pair.address))
    return !hasBlackListed
  })
}

function connected(route: RouteSwap[], pairY: Pair) {
  const lastRouteSwap = route[route.length - 1]
  const nonNativeToken = getPairNonNativeToken(pairY)

  return lastRouteSwap.path[1].equals(nonNativeToken)
}

function repeated(route: RouteSwap[], pair: Pair) {
  return route.map((rs) => rs.pair).includes(pair)
}

function hasNativeToken(pair: Pair) {
  return pair.contains(Config.nativeToken)
}

function tokenConnectingPair(previous: [Token, Token], pair2: Pair): Token {
  if (pair2.token0.equals(previous[1])) {
    return pair2.token0
  }
  if (pair2.token1.equals(previous[1])) {
    return pair2.token1
  }

  throw new Error(
    `Pairs ${previous.map((t) => t.symbol).join('-')} and ${pair2.name} not connected`
  )
}

function tokenNotConnectingPair(previous: [Token, Token], pair2: Pair): Token {
  const connectingToken = tokenConnectingPair(previous, pair2)
  return connectingToken.equals(pair2.token0) ? pair2.token1 : pair2.token0
}

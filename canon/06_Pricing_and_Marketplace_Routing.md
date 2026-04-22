# Pricing and Marketplace Routing

## Purpose
Define how ORACLE V5 chooses the right sale path and price logic for each object.

## Rule
No fake universal price.
Price is always route-specific.

## Core marketplaces / routes
- eBay
- Vinted
- Depop
- Facebook Marketplace
- Etsy
- Grailed
- Vestiaire
- Shopify / direct storefront
- private sale
- consignment
- gallery
- collector-direct
- commission-only
- edition / licensing route

## Oracle scoring factors
- realistic top price
- realistic clearing price
- speed to sale
- fees
- shipping burden
- effort to prepare
- audience fit
- prestige fit
- condition
- demand signal
- local vs global value
- hold vs sell logic

## Output must never be just a number
Oracle must return:
- recommended route
- target price
- floor price
- reasoning
- preparation needed
- whether to sell now, hold, enrich, bundle, relist, consign, or convert into a larger project

## Route examples
- fast liquidity -> Vinted / Facebook Marketplace
- style premium -> Depop / Grailed / Vestiaire
- broad market truth -> eBay
- crafted / niche object -> Etsy
- controlled brand margin -> Shopify / direct sale
- high-touch work -> private collector / gallery / commission path

## Constraint
Highest price is not always best outcome.
Oracle optimizes for real return, not fantasy value.
# Commercial Splits and Revenue

## Purpose
Define how ORACLE V5 tracks money, percentages, fees, and payouts.

## Rule
Every commercial action must be traceable.
No vague split logic.
No hidden fee logic.

## Core split structure
- artist percentage
- operator percentage
- service / platform percentage
- collaborator percentage
- project-specific override
- royalty / edition logic where relevant

## What every commercial object should store
- linked work or project
- route source
- gross price
- fees
- net amount
- split ratios
- payout amounts
- payout status
- payment received status
- date
- notes

## Core sale types
- direct sale
- assisted sale
- managed sale
- commission work
- consignment
- edition / royalty sale
- project packaging fee

## Example logic
- self-managed utility flow -> low service fee
- assisted sale -> medium service fee
- full-service packaging and sales support -> higher service fee
- project-specific deals can override defaults

## Oracle output
For every sale or deal, Oracle should return:
- recommended split structure
- expected payout per party
- fee impact
- status of payment and payout
- linked commercial history

## Constraint
Commercial logic must be simple, explicit, and auditable.
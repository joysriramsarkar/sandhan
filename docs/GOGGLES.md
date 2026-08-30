# Goggles Specification (সন্ধান গগলস)

## 1. Overview
Goggles allow users and communities to define custom reranking instructions on top of default search results.

## 2. Rule Syntax
- `$boost=N,site=domain.com`: Multiplies the score of matching domains by `N`.
- `$demote=N,site=domain.com`: Reduces the score of matching domains by `N`.
- `$discard,site=spam.com`: Completely filters out matching results.
- `$boost=N,lang=bn`: Boosts results written in Bengali.
- `$boost=N,site=edu`: Prioritizes academic websites.

## 3. Example Preset
```goggles
! name: Bengali Web & Academic Boost
! description: Boosts Bengali language blogs and educational institutions
$boost=3,lang=bn
$boost=2,site=edu
$boost=2,site=org
$demote=4,site=pinterest.com
$discard,site=contentfarm.xyz
```

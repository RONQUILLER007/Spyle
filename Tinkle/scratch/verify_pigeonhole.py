# -*- coding: utf-8 -*-
"""
Let's see: We have 105 items across 5 dossiers:
21 pel
21 dep
21 geo
21 mus
21 pal

15 days (Day 5 to Day 19).
15 * 7 = 105 items!
Each of the 5 dossiers has 21 items.
21 = 15 + 6.
So each dossier has 15 items (one for each day) PLUS 6 extra items!
Across the 5 dossiers, there are 6 * 5 = 30 extra items.
30 extra items / 15 days = exactly 2 extra items per day!
So EVERY DAY in Days 5 to 19 will have:
- Exactly 1 item from each of the 5 dossiers (pel, dep, geo, mus, pal) -> 5 items!
- Exactly 2 extra items from two of the dossiers!
For example:
A day might have: 1 pel, 1 dep, 1 geo, 1 mus, 1 pal + 1 pal + 1 pel (so 2 pal, 2 pel, 1 dep, 1 geo, 1 mus).
Wait, can any day have at most 1 of (pel, dep, geo, mus)?
If a day has AT MOST 1 of pel, dep, geo, mus:
Then in that day, pel <= 1, dep <= 1, geo <= 1, mus <= 1!
Then the sum of (pel + dep + geo + mus) <= 4!
Then the remaining 3 items in that day MUST BE pal!
Because there are only 5 dossiers!
If 4 of them have at most 1 item, then to reach 7 items, the 5th dossier (pal) MUST have 7 - 4 = 3 items!
If pal had 3 items in all 15 days, we would need 15 * 3 = 45 pal!
But we ONLY have 21 pal!
Therefore, mathematically:
If there are 21 pel, 21 dep, 21 geo, 21 mus, and only 15 days,
the average number of pel per day is 21 / 15 = 1.4!
By the Pigeonhole Principle:
It is MATHEMATICALLY IMPOSSIBLE to place 21 pel in 15 days without at least 6 days having 2 pel!
The same applies to dep (at least 6 days with 2 dep), geo (at least 6 days with 2 geo), and mus (at least 6 days with 2 mus)!
"""
print("Pigeonhole principle verified.")
